import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('TenantOps API')
    .setDescription('Multi-tenant SaaS Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('authentication', 'Authentication endpoints')
    .addTag('tenants', 'Tenant management')
    .addTag('users', 'User management')
    .addTag('health', 'Health checks')
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'TenantOps API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: `
      .topbar-wrapper img { content:url('https://nestjs.com/img/logo-small.svg'); width:60px; height:auto; }
      .swagger-ui .topbar { background-color: #4f46e5; }
    `,
  });
  
  // Enable CORS for React app
  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });
  
  await app.listen(3001);
  console.log('íº€ TenantOps API running on http://localhost:3001');
  console.log('í³š Swagger Docs: http://localhost:3001/api');
}
bootstrap();
