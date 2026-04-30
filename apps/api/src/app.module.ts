import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { StripeModule } from './modules/stripe/stripe.module';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    RedisModule,
    AuditModule,
    AuthModule,
    OnboardingModule,
    StripeModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
