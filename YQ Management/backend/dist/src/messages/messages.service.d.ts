import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { RedisService } from '../redis/redis.service';
export declare class MessagesService {
    private prisma;
    private notificationsService;
    private redisService;
    constructor(prisma: PrismaService, notificationsService: NotificationsService, redisService: RedisService);
    getMessages(tokenId: string): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        tokenId: string;
        sender: string;
    }[]>;
    sendMessageFromOperator(tokenId: string, text: string): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        tokenId: string;
        sender: string;
    }>;
}
