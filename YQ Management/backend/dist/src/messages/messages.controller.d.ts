import { MessagesService } from './messages.service';
export declare class MessagesController {
    private readonly messagesService;
    constructor(messagesService: MessagesService);
    getMessages(tokenId: string): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        tokenId: string;
        sender: string;
    }[]>;
    sendMessage(tokenId: string, body: {
        text: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        body: string;
        tokenId: string;
        sender: string;
    }>;
}
