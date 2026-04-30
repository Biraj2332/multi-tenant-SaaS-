import {
  Controller,
  Post,
  Body,
  Req,
  Res,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { StripeService } from './stripe.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { AuditTargetType } from '../audit/enums/audit-target.enum';

interface CreateCheckoutDto {
  plan: string;
  tenantId?: string;
  email: string;
}

@Controller('stripe')
export class StripeController {
  private readonly logger = new Logger(StripeController.name);

  constructor(
    private readonly stripeService: StripeService,
    private readonly auditService: AuditService,
  ) {}

  @Post('create-checkout-session')
  async createCheckout(
    @Body() body: CreateCheckoutDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const origin = req.headers.origin ?? 'http://localhost:5173';
    const successUrl = `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/checkout/cancel`;

    const result = await this.stripeService.createCheckoutSession(
      body.plan,
      body.tenantId ?? null,
      body.email,
      successUrl,
      cancelUrl,
    );

    if (result.isErr()) {
      this.logger.error(`Checkout error: ${result.error.message}`);
      res.status(400).json({ error: result.error.message });
      return;
    }

    res.json({ sessionId: result.value.sessionId, url: result.value.url });
  }

  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(@Req() req: Request): Promise<{ received: boolean }> {
    const signature = req.headers['stripe-signature'] as string;
    const rawBody = (req as Request & { rawBody?: Buffer }).rawBody;

    if (!rawBody || !signature) {
      this.logger.warn('Stripe webhook missing body or signature');
      return { received: true };
    }

    const verified = this.stripeService.verifyWebhook(rawBody, signature);

    if (verified.isErr()) {
      this.logger.warn(`Stripe webhook verification failed: ${verified.error.message}`);
      return { received: true };
    }

    const event = verified.value;
    const ip = req.ip ?? null;
    const ua = req.headers['user-agent'] ?? null;

    await this.auditService.log({
      tenantId: null,
      actorId: null,
      action: AuditAction.WEBHOOK_RECEIVED,
      targetType: AuditTargetType.SYSTEM,
      targetId: event.id,
      metadata: { source: 'stripe', type: event.type },
      ipAddress: ip,
      userAgent: ua,
    });

    const result = await this.stripeService.handleWebhookEvent(event, ip, ua);

    if (result.isErr()) {
      this.logger.error(`Stripe webhook handler error: ${result.error.message}`);
    } else {
      this.logger.log(`Stripe webhook handled: ${event.type} (handled=${result.value.handled})`);
    }

    return { received: true };
  }
}
