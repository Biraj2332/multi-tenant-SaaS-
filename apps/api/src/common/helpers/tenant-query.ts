import { DataSource, QueryRunner } from 'typeorm';
import { ResultAsync } from 'neverthrow';
import { DatabaseError } from '../errors/app.errors';

/**
 * Executes a callback within the context of a tenant schema.
 * Sets search_path to the tenant schema, runs the callback, then resets.
 */
export async function withTenantSchema<T>(
  dataSource: DataSource,
  schemaName: string,
  fn: (qr: QueryRunner) => Promise<T>,
): Promise<T> {
  const qr = dataSource.createQueryRunner();
  await qr.connect();
  await qr.query(`SET search_path TO "${schemaName}", public`);
  const result = await fn(qr);
  await qr.query(`SET search_path TO public`);
  await qr.release();
  return result;
}

/**
 * Safe version returning Result — wraps withTenantSchema in ResultAsync.
 */
export function withTenantSchemaResult<T>(
  dataSource: DataSource,
  schemaName: string,
  fn: (qr: QueryRunner) => Promise<T>,
) {
  return ResultAsync.fromPromise(
    withTenantSchema(dataSource, schemaName, fn),
    (e) => new DatabaseError('Tenant schema query failed', e),
  );
}
