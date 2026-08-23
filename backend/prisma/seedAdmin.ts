import { PrismaClient } from '@prisma/client';
import { PasswordUtils } from '../src/utils/password';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin@orientation.edu';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin-2026';
  const name = process.env.DEFAULT_ADMIN_NAME || 'Orientation Admin';

  const passwordHash = PasswordUtils.hashPassword(password);

  const admin = await prisma.user.upsert({
    where: { username: username.toLowerCase() },
    update: {
      passwordHash,
      name,
      role: 'ADMIN',
    },
    create: {
      username: username.toLowerCase(),
      passwordHash,
      name,
      role: 'ADMIN',
    },
  });

  console.log('---------------------------------------------------');
  console.log(`[Seed Admin] Initial Administrator Account Created/Updated:`);
  console.log(` Username: ${admin.username}`);
  console.log(` Name:     ${admin.name}`);
  console.log(` Role:     ${admin.role}`);
  console.log('---------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('Error seeding admin account:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
