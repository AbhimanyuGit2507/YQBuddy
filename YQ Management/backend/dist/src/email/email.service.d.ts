import { CommunicationService } from '../communication/communication.service';
export declare class EmailService {
    private readonly communicationService;
    private readonly logger;
    constructor(communicationService: CommunicationService);
    sendOTP(email: string, otpCode: string, purpose: 'signup' | 'login' | 'welcome'): Promise<void>;
    sendLoginNotification(email: string): Promise<void>;
    addContactToMarketingList(email: string): Promise<void>;
}
