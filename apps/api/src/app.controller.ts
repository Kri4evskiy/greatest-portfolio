import { Controller, Get, Inject } from '@nestjs/common'
import { PrismaService } from './prisma/prisma.service.js'

@Controller('health')
export class AppController {
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
