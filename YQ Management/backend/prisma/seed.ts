import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5455/yq_queue?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const workspace = await prisma.workspace.upsert({
    where: { subdomain: 'hq' },
    update: {},
    create: {
      name: 'YQ Queue HQ',
      subdomain: 'hq',
    },
  });

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const existingAdmin = await prisma.user.findFirst({
    where: { email: 'admin@yqqueue.com', workspaceId: workspace.id },
  });

  if (existingAdmin) {
    await prisma.user.update({
      where: { id: existingAdmin.id },
      data: { password: hashedPassword },
    });
  } else {
    await prisma.user.create({
      data: {
        email: 'admin@yqqueue.com',
        password: hashedPassword,
        role: 'ADMIN',
        workspaceId: workspace.id,
      },
    });
  }

  const newAdminPassword = await bcrypt.hash('Admin@123', 10);

  const existingAdmin2 = await prisma.user.findFirst({
    where: { email: 'yqbuddysa@gmail.com', workspaceId: workspace.id },
  });

  if (existingAdmin2) {
    await prisma.user.update({
      where: { id: existingAdmin2.id },
      data: { password: newAdminPassword, role: 'ADMIN' },
    });
  } else {
    await prisma.user.create({
      data: {
        email: 'yqbuddysa@gmail.com',
        password: newAdminPassword,
        role: 'ADMIN',
        workspaceId: workspace.id,
      },
    });
  }

  await prisma.paymentProvider.upsert({
    where: { name: 'OZOW' },
    update: {},
    create: {
      name: 'OZOW',
      sandboxEnabled: true,
      siteCode: process.env.OZOW_SITE_CODE || 'MOCK_SITE_CODE',
      privateKey: process.env.OZOW_PRIVATE_KEY || '',
      apiKey: process.env.OZOW_API_KEY || '',
      baseUrl: process.env.OZOW_BASE_URL || 'https://pay.ozow.com',
      webhookSecret: process.env.OZOW_WEBHOOK_SECRET || '',
      isActive: true,
      config: { sandbox: true, countryCode: 'ZA' },
    },
  });

  const defaultPlan = await prisma.plan.upsert({
    where: { id: 'standard-monthly' },
    update: {},
    create: {
      id: 'standard-monthly',
      name: 'Standard Monthly',
      description: 'Standard monthly subscription plan',
      type: 'STANDARD',
      status: 'ACTIVE',
      billingInterval: 'MONTHLY',
      price: 299.0,
      currency: 'ZAR',
      trialDays: 14,
      features: {
        queues: 5,
        operators: 10,
        locations: 3,
        whatsappCredits: 1000,
        aiCredits: 500,
        storageGb: 5,
      },
      limits: {
        maxQueues: 5,
        maxOperators: 10,
        maxLocations: 3,
        maxWhatsappCredits: 1000,
        maxAiCredits: 500,
        maxStorageGb: 5,
      },
    },
  });

  console.log('✅ Seed completed successfully');
  console.log('Default Plan:', defaultPlan.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
