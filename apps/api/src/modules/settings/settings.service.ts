import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Result, ok, err, ResultAsync } from 'neverthrow';
import { SettingsError, NotFoundError, DatabaseError } from '../../common/errors/app.errors';
import { TenantEntity } from '../tenants/entities/tenant.entity';
import { RedisService } from '../redis/redis.service';
import { CacheKey } from '../redis/redis.types';

export interface GeneralSettings {
  name: string;
  slug: string;
  timezone?: string;
}

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(TenantEntity) private readonly tenantRepo: Repository<TenantEntity>,
    private readonly redis: RedisService,
  ) {}

  async getGeneral(tenantId: string): Promise<Result<GeneralSettings, NotFoundError | DatabaseError>> {
    const r = await ResultAsync.fromPromise(
      this.tenantRepo.findOne({ where: { id: tenantId } }),
      (e) => new DatabaseError('Failed to load tenant', e),
    );
    if (r.isErr()) return err(r.error);
    if (!r.value) return err(new NotFoundError('Tenant not found'));
    return ok({ name: r.value.name, slug: r.value.slug });
  }

  async updateGeneral(
    tenantId: string,
    clerkOrgId: string,
    patch: Partial<GeneralSettings>,
  ): Promise<Result<GeneralSettings, SettingsError | NotFoundError | DatabaseError>> {
    const loaded = await ResultAsync.fromPromise(
      this.tenantRepo.findOne({ where: { id: tenantId } }),
      (e) => new DatabaseError('Failed to load tenant', e),
    );
    if (loaded.isErr()) return err(loaded.error);
    if (!loaded.value) return err(new NotFoundError('Tenant not found'));
    const tenant = loaded.value;
    if (patch.name !== undefined) tenant.name = patch.name;
    if (patch.slug !== undefined) {
      if (!/^[a-z0-9-]+$/.test(patch.slug)) {
        return err(new SettingsError('Invalid slug format'));
      }
      tenant.slug = patch.slug;
    }
    const saved = await ResultAsync.fromPromise(
      this.tenantRepo.save(tenant),
      (e) => new DatabaseError('Failed to save tenant', e),
    );
    if (saved.isErr()) return err(saved.error);
    // Invalidate tenant cache
    await this.redis.del(CacheKey.tenantResolve(clerkOrgId));
    return ok({ name: saved.value.name, slug: saved.value.slug });
  }
}
