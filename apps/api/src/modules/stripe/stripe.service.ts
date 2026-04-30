import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Result, ok, err, ResultAsync } from 'neverthrow';
import Stripe from 'stripe';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { Plan } from '../tenants/enums/plan.enum';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { AuditTargetType } from '../audit/enums/audit-target.enum';
import { DatabaseError, ValidationError } from '../../common/errors/app.errors';

// Stripe v22 webhook event shape
interface StripeWebhookEvent {
  id: string;
  type: string;
  data: { object: Record<string, unknown> };
}

interface StripeCheckoutSession {
  id: string;
  url: string | null;
  customer: string | null;
  subscription: string | null;
  metadata: Record<string, string> | null;
}

interface StripeSubscriptionObject {
  id: string;
  metadata: Record<string, string>;
}

export class StripeError {
  readonly _tag = 'StripeError' as const;
  constructor(
    public readonly message: string,
    public readonly cause?: unknown,
  ) {}
}

interface CheckoutSessionResult {
  sessionId: string;
  url: string;
}

const PLAN_PRICE_MAP: Record<string, { priceAmount: number; plan: Plan }> = {
  pro: { priceAmount: 2900, plan: Plan.PRO },
  enterprise: { priceAmount: 9900, plan: Plan.ENTERPRISE },
};

@Injectable()
export class StripeService {
  private readonly stripe: InstanceType<typeof Stripe>;
  private readonly webhookSecret: string;
  private readonly logger = new Logger(StripeService.name);

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(TenantEntity)
    private readonly tenantRepo: Repository<TenantEntity>,
    private readonly auditService: AuditService,
  ) {
    this.stripe = new Stripe(
      this.config.get<string>('stripe.secretKey', ''),
      { apiVersion: '2026-04-22.dahlia' },
    );
    this.webhookSecret = this.config.get<string>('stripe.webhookSecret', '');
  }

  async createCheckoutSession(
    planKey: string,
    tenantId: string | null,
    customerEmail: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<Result<CheckoutSessionResult, StripeError | ValidationError>> {
    const planInfo = PLAN_PRICE_MAP[planKey];
    if (!planInfo) {
      return err(new ValidationError(`Invalid plan: ${planKey}`));
    }

    const sessionResult = await ResultAsync.fromPromise(
      this.stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        customer_email: customerEmail,
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `TenantOps ${planKey.charAt(0).toUpperCase() + planKey.slice(1)}`,
                description: `TenantOps ${planKey} plan — monthly subscription`,
              },
              unit_amount: planInfo.priceAmount,
              recurring: { interval: 'month' },
            },
            quantity: 1,
          },
        ],
        metadata: {
          tenantId: tenantId ?? '',
          plan: planKey,
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
      }),
      (e) => new StripeError('Failed to create checkout session', e),
    );

    if (sessionResult.isErr()) return err(sessionResult.error);
    const session = sessionResult.value;

    return ok({
      sessionId: session.id,
      url: session.url ?? '',
    });
  }

  verifyWebhook(
    payload: string | Buffer,
    signature: string,
  ): Result<StripeWebhookEvent, StripeError> {
    return Result.fromThrowable(
      () => this.stripe.webhooks.constructEvent(payload, signature, this.webhookSecret) as unknown as StripeWebhookEvent,
      (e) => new StripeError('Stripe webhook verification failed', e),
    )();
  }

  async handleWebhookEvent(
    event: StripeWebhookEvent,
    ip: string | null,
    ua: string | null,
  ): Promise<Result<{ handled: boolean }, StripeError | DatabaseError>> {
    switch (event.type) {
      case 'checkout.session.completed':
        return this.handleCheckoutCompleted(
          event.data.object as unknown as StripeCheckoutSession,
          ip,
          ua,
        );
      case 'customer.subscription.updated':
        this.logger.log(`Subscription updated: ${(event.data.object as unknown as StripeSubscriptionObject).id}`);
        return ok({ handled: true });
      case 'customer.subscription.deleted':
        return this.handleSubscriptionCanceled(
          event.data.object as unknown as StripeSubscriptionObject,
          ip,
          ua,
        );
      default:
        this.logger.log(`Unhandled Stripe event: ${event.type}`);
        return ok({ handled: false });
    }
  }

  private async handleCheckoutCompleted(
    session: StripeCheckoutSession,
    ip: string | null,
    ua: string | null,
  ): Promise<Result<{ handled: boolean }, DatabaseError>> {
    const tenantId = session.metadata?.['tenantId'];
    const planKey = session.metadata?.['plan'];

    if (!tenantId || !planKey) {
      this.logger.warn('Checkout session missing tenantId or plan in metadata');
      return ok({ handled: false });
    }

    const planInfo = PLAN_PRICE_MAP[planKey];
    if (!planInfo) return ok({ handled: false });

    const updateResult = await ResultAsync.fromPromise(
      this.tenantRepo.update(tenantId, {
        plan: planInfo.plan,
      }),
      (e) => new DatabaseError('Failed to update tenant plan', e),
    );

    if (updateResult.isErr()) return err(updateResult.error);

    await this.auditService.log({
      tenantId,
      actorId: null,
      action: AuditAction.TENANT_PLAN_CHANGED,
      targetType: AuditTargetType.TENANT,
      targetId: tenantId,
      metadata: {
        plan: planKey,
        stripeSessionId: session.id,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
      },
      ipAddress: ip,
      userAgent: ua,
    });

    this.logger.log(`Tenant ${tenantId} upgraded to ${planKey}`);
    return ok({ handled: true });
  }

  private async handleSubscriptionCanceled(
    subscription: StripeSubscriptionObject,
    ip: string | null,
    ua: string | null,
  ): Promise<Result<{ handled: boolean }, DatabaseError>> {
    const tenantId = subscription.metadata?.['tenantId'];
    if (!tenantId) return ok({ handled: false });

    const updateResult = await ResultAsync.fromPromise(
      this.tenantRepo.update(tenantId, { plan: Plan.STARTER }),
      (e) => new DatabaseError('Failed to downgrade tenant plan', e),
    );

    if (updateResult.isErr()) return err(updateResult.error);

    await this.auditService.log({
      tenantId,
      actorId: null,
      action: AuditAction.TENANT_PLAN_CHANGED,
      targetType: AuditTargetType.TENANT,
      targetId: tenantId,
      metadata: {
        plan: 'starter',
        reason: 'subscription_canceled',
        stripeSubscriptionId: subscription.id,
      },
      ipAddress: ip,
      userAgent: ua,
    });

    this.logger.log(`Tenant ${tenantId} downgraded to starter (subscription canceled)`);
    return ok({ handled: true });
  }
}
