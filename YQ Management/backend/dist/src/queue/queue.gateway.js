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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var QueueGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
let QueueGateway = QueueGateway_1 = class QueueGateway {
    server;
    logger = new common_1.Logger(QueueGateway_1.name);
    handleConnection(client) {
        this.logger.log(`Client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`Client disconnected: ${client.id}`);
    }
    handleJoinQueueRoom(queueId, client) {
        client.join(`queue_${queueId}`);
        this.logger.log(`Client ${client.id} joined room queue_${queueId}`);
        return { event: 'joinedRoom', data: `queue_${queueId}` };
    }
    handleJoinTenantRoom(workspaceId, client) {
        client.join(`workspace_${workspaceId}`);
        this.logger.log(`Client ${client.id} joined room workspace_${workspaceId}`);
        return { event: 'joinedRoom', data: `workspace_${workspaceId}` };
    }
    broadcastQueueUpdate(queueId, workspaceId, event, payload) {
        this.server.to(`queue_${queueId}`).emit(event, payload);
        this.server.to(`workspace_${workspaceId}`).emit(event, payload);
    }
    broadcastTenantUpdate(workspaceId, event, payload) {
        this.server.to(`workspace_${workspaceId}`).emit(event, payload);
    }
};
exports.QueueGateway = QueueGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], QueueGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinQueueRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], QueueGateway.prototype, "handleJoinQueueRoom", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('joinTenantRoom'),
    __param(0, (0, websockets_1.MessageBody)()),
    __param(1, (0, websockets_1.ConnectedSocket)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, socket_io_1.Socket]),
    __metadata("design:returntype", void 0)
], QueueGateway.prototype, "handleJoinTenantRoom", null);
exports.QueueGateway = QueueGateway = QueueGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: process.env.FRONTEND_URL || 'http://localhost:3001',
            credentials: true,
        },
    })
], QueueGateway);
//# sourceMappingURL=queue.gateway.js.map