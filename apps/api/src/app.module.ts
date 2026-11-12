import { Controller, Get, Inject, Module } from '@nestjs/common'
import { AuthModule } from './modules/auth/auth.module.js'
import { KnowledgeModule } from './modules/knowledge/knowledge.module.js'
import { TelemetryModule } from './modules/telemetry/telemetry.module.js'
import { PrismaModule } from './prisma/prisma.module.js'
import { PrismaService } from './prisma/prisma.service.js'

@Controller('health')
export class HealthController {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  @Get()
  check() {
    return {
      status: 'ok',
      databaseConnected: this.prisma.isDatabaseConnected(),
      timestamp: new Date().toISOString(),
    }
  }
}

@Module({
  imports: [PrismaModule, TelemetryModule, AuthModule, KnowledgeModule],
  controllers: [HealthController],
})
export class AppModule {}
