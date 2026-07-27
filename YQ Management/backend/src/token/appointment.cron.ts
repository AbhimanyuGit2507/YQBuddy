import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';

@Injectable()
export class AppointmentCron {
  private readonly logger = new Logger(AppointmentCron.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleAutoCheckIn() {
    // Find appointments that are <= 15 mins from now, not checked in, and belong to a queue that DOES NOT require manual check in
    const fifteenMinsFromNow = new Date(Date.now() + 15 * 60000);

    const appointmentsToAutoCheckIn = await this.prisma.token.findMany({
      where: {
        isAppointment: true,
        checkedIn: false,
        status: 'WAITING',
        scheduledFor: { lte: fifteenMinsFromNow },
        queue: {
          requireManualCheckIn: false
        }
      }
    });

    for (const token of appointmentsToAutoCheckIn) {
      try {
        await this.tokenService.checkIn(token.id);
        this.logger.log(`Auto-checked in appointment token: ${token.id}`);
      } catch (e) {
        this.logger.error(`Failed to auto-check in token: ${token.id}`, e);
      }
    }
  }
}
