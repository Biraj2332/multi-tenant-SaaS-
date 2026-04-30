import {
  Controller,
  Post,
  Req,
  HttpCode,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/enums/audit-action.enum';
import { AuditTargetType } from '../audit/enums/audit-target.enum';

@Controller('webhooks')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly auditService: AuditService,
  ) {}

  @Post('clerk')
  @HttpCode(200)
  async handleClerkWebhook(@Req() req: Request): Promise<{ received: boolean }> {
    const payload = (req as Request & { rawBody?: Buffer }).rawBody?.toString() ?? '';
    const headers: Record<string, string> = {
      'svix-id': (req.headers['svix-id'] as string) ?? '',
      'svix-timestamp': (req.headers['svix-timestamp'] as string) ?? '',
      'svix-signature': (req.headers['svix-signature'] as string) ?? '',
    };
    const ip = req.ip ?? null;
    const ua = req.headers['user-agent'] ?? null;

    const verified = this.authService.verifyWebhook(payload, headers);

    if (verified.isErr()) {
      this.logger.warn(`Webhook verification failed: ${verified.error.message}`);
      return { received: true };
    }

    const event = verified.value;

    await this.auditService.log({
      tenantId: null,
      actorId: null,
      action: AuditAction.WEBHOOK_RECEIVED,
      targetType: AuditTargetType.WEBHOOK,
      targetId: null,
      metadata: { type: event.type },
      ipAddress: ip,
      userAgent: ua,
    });

    const result = await this.authService.dispatchWebhookEvent(event, ip, ua);

    if (result.isErr()) {
      this.logger.error(`Webhook dispatch error: ${result.error.message}`);
    } else {
      this.logger.log(`Webhook processed: ${result.value.action}`);
    }

    return { received: true };
  }
}
