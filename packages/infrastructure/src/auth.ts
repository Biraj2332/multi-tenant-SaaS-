// JWT / Clerk auth adapter interface
// Implement with jsonwebtoken / @clerk/clerk-sdk-node when ready

export interface JwtPayload {
  sub: string;
  tenantId: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthAdapter {
  sign(payload: Omit<JwtPayload, 'iat' | 'exp'>, expiresIn?: string): string;
  verify(token: string): JwtPayload;
  decode(token: string): JwtPayload | null;
}
