import * as path from 'path';
require('dotenv').config({ path: path.join(__dirname, '../.env') });
import { PrismaClient } from '@prisma/client';
import { Redis } from 'ioredis';
import * as bcrypt from 'bcrypt';

import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

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

  const queueIds: string[] = [];

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
