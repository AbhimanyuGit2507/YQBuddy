import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private logger;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleJoinQueueRoom(queueId: string, client: Socket): {
        event: string;
        data: string;
    };
    handleJoinTenantRoom(tenantId: string, client: Socket): {
        event: string;
        data: string;
    };
    broadcastQueueUpdate(queueId: string, event: string, payload: any): void;
    broadcastTenantUpdate(tenantId: string, event: string, payload: any): void;
}
