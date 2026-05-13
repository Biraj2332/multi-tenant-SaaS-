import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppConfigModule } from './config/config.module';
import { DatabaseModule } from './modules/database/database.module';
import { RedisModule } from './modules/redis/redis.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { StripeModule } from './modules/stripe/stripe.module';
import { TenantModule } from './modules/tenants/tenant.module';
import { TenantMiddleware } from './modules/tenants/tenant.middleware';
import { ProjectsModule } from './modules/projects/projects.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { ActivityModule } from './modules/activity/activity.module';
import { CommentsModule } from './modules/comments/comments.module';
import { SprintsModule } from './modules/sprints/sprints.module';
import { IssuesModule } from './modules/issues/issues.module';
import { MembersModule } from './modules/members/members.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SettingsModule } from './modules/settings/settings.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { HealthModule } from './modules/health/health.module';
import { RateLimiterMiddleware } from './common/middleware/rate-limiter.middleware';

@Module({
  imports: [
    AppConfigModule,
    DatabaseModule,
    RedisModule,
    AuditModule,
    AuthModule,
    OnboardingModule,
    StripeModule,
    TenantModule,
    ActivityModule,
    CommentsModule,
    ProjectsModule,
    TasksModule,
    SprintsModule,
    IssuesModule,
    MembersModule,
    NotificationsModule,
    SettingsModule,
    AnalyticsModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantMiddleware)
      .exclude('webhooks/(.*)', 'stripe/(.*)', 'orgs/mine', 'health', 'health/(.*)', 'docs')
      .forRoutes('*');

    consumer
      .apply(RateLimiterMiddleware)
      .exclude('webhooks/(.*)', 'stripe/(.*)', 'health', 'health/(.*)')
      .forRoutes('*');
  }
}
