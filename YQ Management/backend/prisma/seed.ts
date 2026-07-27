import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5455/yq_queue?schema=public' });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Create default tenant
  const tenant = await prisma.tenant.upsert({
    where: { subdomain: 'hq' },
    update: {},
    create: {
      name: 'YQ Queue HQ',
      subdomain: 'hq',
    },
  });

  // Create default Super Admin
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@yqqueue.com' },
    update: {
      password: hashedPassword,
    },
    create: {
      email: 'admin@yqqueue.com',
      password: hashedPassword,
      role: 'SUPER_ADMIN',
      tenantId: tenant.id,
    },
  });

  // Create requested Super Admin
  const newAdminPassword = await bcrypt.hash('Admin@123', 10);
  
  await prisma.user.upsert({
    where: { email: 'yqbuddysa@gmail.com' },
    update: {
      password: newAdminPassword,
      role: 'SUPER_ADMIN',
    },
    create: {
      email: 'yqbuddysa@gmail.com',
      password: newAdminPassword,
      role: 'SUPER_ADMIN',
      tenantId: tenant.id,
    },
  });

  console.log('✅ Seed completed successfully');
  console.log('Admin Credentials:');
  console.log('Email: admin@yqqueue.com (admin123)');
  console.log('Email: yqbuddysa@gmail.com (Admin@123)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
