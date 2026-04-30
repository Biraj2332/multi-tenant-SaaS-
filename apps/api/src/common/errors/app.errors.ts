export abstract class AppError {
  abstract readonly _tag: string;
  constructor(
    public readonly message: string,
    public readonly cause?: unknown,
  ) {}
}

export class AuthError extends AppError {
  readonly _tag = 'AuthError' as const;
}
export class TokenError extends AppError {
  readonly _tag = 'TokenError' as const;
}
export class SyncError extends AppError {
  readonly _tag = 'SyncError' as const;
}
export class WebhookError extends AppError {
  readonly _tag = 'WebhookError' as const;
}
export class DatabaseError extends AppError {
  readonly _tag = 'DatabaseError' as const;
}
export class RedisError extends AppError {
  readonly _tag = 'RedisError' as const;
}
export class NotFoundError extends AppError {
  readonly _tag = 'NotFoundError' as const;
}
export class OnboardingError extends AppError {
  readonly _tag = 'OnboardingError' as const;
}
export class ValidationError extends AppError {
  readonly _tag = 'ValidationError' as const;
}
export class ConflictError extends AppError {
  readonly _tag = 'ConflictError' as const;
}

export type TenantOpsError =
  | AuthError
  | TokenError
  | SyncError
  | WebhookError
  | DatabaseError
  | RedisError
  | NotFoundError
  | OnboardingError
  | ValidationError
  | ConflictError;

export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}

export function toUnknownError(err: unknown, ErrorClass: new (msg: string, cause?: unknown) => AppError): AppError {
  if (err instanceof AppError) return err;
  const message = err instanceof Error ? err.message : 'Unknown error';
  return new ErrorClass(message, err);
}
