"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const communication_service_1 = require("../communication/communication.service");
const communication_events_enum_1 = require("../communication/events/communication-events.enum");
let EmailService = EmailService_1 = class EmailService {
    communicationService;
    logger = new common_1.Logger(EmailService_1.name);
    constructor(communicationService) {
        this.communicationService = communicationService;
    }
    async sendOTP(email, otpCode, purpose) {
        try {
            if (purpose === 'signup') {
                await this.communicationService.publish(communication_events_enum_1.CommunicationEvent.SIGNUP_OTP_REQUESTED, {
                    email,
                    otp: otpCode,
                });
            }
            else if (purpose === 'login') {
                await this.communicationService.publish(communication_events_enum_1.CommunicationEvent.LOGIN_OTP_REQUESTED, {
                    email,
                    otp: otpCode,
                });
            }
            else if (purpose === 'welcome') {
                await this.communicationService.publish(communication_events_enum_1.CommunicationEvent.MARKETING_WELCOME, {
                    email,
                    name: email.split('@')[0],
                });
            }
        }
        catch (error) {
            this.logger.error(`Failed to send ${purpose} OTP to ${email}`, error);
        }
    }
    async sendLoginNotification(email) {
        try {
            await this.communicationService.publish(communication_events_enum_1.CommunicationEvent.USER_REGISTERED, {
                email,
                name: email.split('@')[0],
            });
        }
        catch (error) {
            this.logger.error(`Failed to send login notification to ${email}`, error);
        }
    }
    async addContactToMarketingList(email) {
        this.logger.log(`Adding ${email} to marketing list (Brevo contact sync)`);
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [communication_service_1.CommunicationService])
], EmailService);
//# sourceMappingURL=email.service.js.map