import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class QueueGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger(QueueGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinQueueRoom')
  handleJoinQueueRoom(
    @MessageBody() queueId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`queue_${queueId}`);
    this.logger.log(`Client ${client.id} joined room queue_${queueId}`);
    return { event: 'joinedRoom', data: `queue_${queueId}` };
  }

  @SubscribeMessage('joinTenantRoom')
  handleJoinTenantRoom(
    @MessageBody() tenantId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`tenant_${tenantId}`);
    this.logger.log(`Client ${client.id} joined room tenant_${tenantId}`);
    return { event: 'joinedRoom', data: `tenant_${tenantId}` };
  }

  broadcastQueueUpdate(queueId: string, event: string, payload: any) {
    this.server.to(`queue_${queueId}`).emit(event, payload);
    // Also broadcast to the tenant admin room
    // For MVP, we might not have tenantId here, but assume it's sent in payload or separate call
  }

  broadcastTenantUpdate(tenantId: string, event: string, payload: any) {
    this.server.to(`tenant_${tenantId}`).emit(event, payload);
  }
}
