export interface ClerkWebhookEvent {
  type: string;
  data: Record<string, unknown>;
}

export interface TokenPayload {
  sub: string;
  email: string;
  orgId: string | null;
  orgRole: string | null;
}
