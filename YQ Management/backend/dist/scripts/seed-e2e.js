"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const client_1 = require("@prisma/client");
const ioredis_1 = require("ioredis");
const bcrypt = __importStar(require("bcrypt"));
const pg_1 = require("pg");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new adapter_pg_1.PrismaPg(pool);
const prisma = new client_1.PrismaClient({ adapter });
const redis = new ioredis_1.Redis(process.env.REDIS_URL || 'redis://localhost:6379');
async function main() {
    const email = `admin-${Date.now()}@example.com`;
    const password = await bcrypt.hash('password123', 10);
    const workspace = await prisma.workspace.create({
        data: {
            name: 'E2E Test Workspace',
            subdomain: `e2e-${Date.now()}`,
            whatsappInstanceId: 'mock_instance_id',
            whatsappConnected: true,
            chatbotEnabled: true,
        }
    });
    const user = await prisma.user.create({
        data: {
            email,
            password,
            role: 'ADMIN',
            workspaceId: workspace.id
        }
    });
    const queueIds = [];
    for (let i = 1; i <= 4; i++) {
        const queue = await prisma.queue.create({
            data: {
                workspaceId: workspace.id,
                name: `Load Test Queue ${i}`,
                status: 'ACTIVE'
            }
        });
        queueIds.push(queue.id);
        for (let j = 1; j <= 20; j++) {
            const token = await prisma.token.create({
                data: {
                    queueId: queue.id,
                    customerName: `Customer ${j} Q${i}`,
                    phone: `+1000555${i}${String(j).padStart(3, '0')}`,
                    status: 'WAITING',
                }
            });
            await redis.zadd(`queue:${queue.id}:waiting`, Date.now(), token.id);
        }
    }
    console.log(JSON.stringify({ email, password: 'password123', queueIds }));
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
    redis.quit();
});
//# sourceMappingURL=seed-e2e.js.map