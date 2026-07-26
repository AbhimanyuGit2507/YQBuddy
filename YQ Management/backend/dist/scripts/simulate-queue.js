"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const ioredis_1 = require("ioredis");
const prisma = new client_1.PrismaClient();
const redis = new ioredis_1.Redis(process.env.REDIS_URL || 'redis://localhost:6379');
async function main() {
    const queueId = process.argv[2];
    const count = parseInt(process.argv[3] || '19', 10);
    if (!queueId) {
        console.error('Please provide a Queue ID as the first argument.');
        console.error('Usage: npx ts-node scripts/simulate-queue.ts <queueId> [count]');
        process.exit(1);
    }
    const queue = await prisma.queue.findUnique({ where: { id: queueId } });
    if (!queue) {
        console.error('Queue not found!');
        process.exit(1);
    }
    console.log(`Simulating ${count} customers joining queue: ${queue.name}...`);
    for (let i = 1; i <= count; i++) {
        const fakePhone = `+1000555${String(i).padStart(4, '0')}`;
        const token = await prisma.token.create({
            data: {
                queueId,
                customerName: `Simulated Customer ${i}`,
                phone: fakePhone,
                status: 'WAITING',
            }
        });
        await redis.zadd(`queue:${queueId}:waiting`, Date.now(), token.id);
        console.log(`Added: ${token.customerName} (Token: ${token.id.substring(0, 6)})`);
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    console.log('✅ Simulation complete!');
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
//# sourceMappingURL=simulate-queue.js.map