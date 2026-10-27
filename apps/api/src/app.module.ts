import { Controller, Get, Module } from '@nestjs/common';
import { APP_VERSION } from '@repo/shared-schemas';
import { AuthModule } from './modules/auth/auth.module';
import { KnowledgeModule } from './modules/knowledge/knowledge.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { PrismaModule } from './prisma/prisma.module';

@Controller('health')
export class HealthController {
  @Get()
  check(): { status: string; version: string; timestamp: string } {
    return {
      status: 'ok',
      version: APP_VERSION,
      timestamp: new Date().toISOString(),
    };
  }
}

@Module({
  imports: [PrismaModule, TelemetryModule, AuthModule, KnowledgeModule],
  controllers: [HealthController],
})
export class AppModule {}
