import { NotificationsService } from './notifications.service';
import type { Request, Response } from 'express';
export declare class NotificationsController {
    private readonly notificationsService;
    private readonly logger;
    constructor(notificationsService: NotificationsService);
    handleIncomingWhatsApp(req: Request, res: Response): Promise<void>;
}
