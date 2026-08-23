import app from './app';
import { PrismaClient } from '@prisma/client';
import { PasswordUtils } from './utils/password';

const prisma = new PrismaClient();

async function bootstrapAdmin() {
  try {
    const adminUser = (process.env.DEFAULT_ADMIN_USERNAME || 'admin@graduation.edu').trim().toLowerCase();
    const adminPass = process.env.DEFAULT_ADMIN_PASSWORD || 'admin@2026';
    const passwordHash = PasswordUtils.hashPassword(adminPass);

    await prisma.user.upsert({
      where: { username: adminUser },
      update: {
        passwordHash,
        role: 'ADMIN',
        name: 'Orientation Admin',
      },
      create: {
        username: adminUser,
        passwordHash,
        role: 'ADMIN',
        name: 'Orientation Admin',
      },
    });
    console.log(`[Bootstrap] Admin account verified: ${adminUser}`);
  } catch (err: any) {
    console.warn('[Bootstrap] Notice during admin initialization:', err.message);
  }
}

const PORT = Number(process.env.PORT) || 5000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, async () => {
  console.log(`===================================================`);
  console.log(` Orientation Day - 2026 Batch Backend Running on port ${PORT}`);
  console.log(`===================================================`);
  await bootstrapAdmin();
});

export default app;
