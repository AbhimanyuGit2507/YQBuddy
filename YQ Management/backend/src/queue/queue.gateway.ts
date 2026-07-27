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
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: (origin, callback) => {
      const allowed = [
        process.env.FRONTEND_URL,
        'http://localhost:3001',
        'http://localhost:3000',
        'https://qmover.vercel.app',
      ].filter(Boolean);

      if (!origin || allowed.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
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
    @MessageBody() workspaceId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(`workspace_${workspaceId}`);
    this.logger.log(`Client ${client.id} joined room workspace_${workspaceId}`);
    return { event: 'joinedRoom', data: `workspace_${workspaceId}` };
  }

  broadcastQueueUpdate(
    queueId: string,
    workspaceId: string,
    event: string,
    payload: any,
  ) {
    this.server.to(`queue_${queueId}`).emit(event, payload);
    this.server.to(`workspace_${workspaceId}`).emit(event, payload);
  }

  broadcastTenantUpdate(workspaceId: string, event: string, payload: any) {
    this.server.to(`workspace_${workspaceId}`).emit(event, payload);
  }
}
