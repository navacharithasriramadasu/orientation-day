const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

try {
  process.loadEnvFile('.env');
} catch (e) {
  // process.env loaded or fallback
}

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

async function main() {
  const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin@orientation.edu';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'admin-2026';
  const name = process.env.DEFAULT_ADMIN_NAME || 'Orientation Admin';

  const passwordHash = hashPassword(password);

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
