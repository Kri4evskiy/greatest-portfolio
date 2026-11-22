import { Controller, Get, Inject } from '@nestjs/common'
import { type SystemCapabilities, SystemCapabilitiesSchema } from '@repo/shared-schemas'
import { appConfig } from './config/app.config.js'
import { TelemetryService } from './modules/telemetry/telemetry.service.js'
import { PrismaService } from './prisma/prisma.service.js'

@Controller()
export class AppController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(TelemetryService) private readonly telemetry: TelemetryService,
  ) {}

  @Get('health')
  check() {
    return {
      status: 'ok',
      databaseConnected: this.prisma.isDatabaseConnected(),
      timestamp: new Date().toISOString(),
    }
  }

  @Get('capabilities')
  async getCapabilities(): Promise<SystemCapabilities> {
    const telemetryTcpConnected = await this.telemetry.checkMicroserviceConnected()
    const mode = appConfig.isDemoMode ? 'demo' : appConfig.isProduction ? 'production' : 'development'

    return SystemCapabilitiesSchema.parse({
      status: 'ok',
      mode,
      persistence: this.prisma.isDatabaseConnected() ? 'postgresql' : 'in-memory-fallback',
      rateLimiter: 'in-memory',
      telemetryTcpConnected,
      integrations: appConfig.integrations,
      timestamp: new Date().toISOString(),
    })
  }
}
