import { PrismaService } from '../prisma/prisma.service';
import { TokenService } from './token.service';
export declare class AppointmentCron {
    private readonly prisma;
    private readonly tokenService;
    private readonly logger;
    constructor(prisma: PrismaService, tokenService: TokenService);
    handleAutoCheckIn(): Promise<void>;
}
