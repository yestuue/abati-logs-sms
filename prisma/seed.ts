/**
 * Full database seed (numbers, admin user, SMS services, Server 2 countries).
 *
 * Apply schema first, then seed:
 *   npx prisma db push
 *   npm run db:seed
 *
 * Services and countries are upserted so you can re-run safely; existing Service.basePrice
 * values are not overwritten on update (only `name` is refreshed).
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { seedAdminLists } from "./seed-admin-data";

const prisma = new PrismaClient();

const usaNumbers = [
  { number: "+12025550147", country: "United States", countryCode: "US", dialCode: "+1" },
  { number: "+13105550192", country: "United States", countryCode: "US", dialCode: "+1" },
  { number: "+16465550183", country: "United States", countryCode: "US", dialCode: "+1" },
  { number: "+17185550201", country: "United States", countryCode: "US", dialCode: "+1" },
  { number: "+14155550216", country: "United States", countryCode: "US", dialCode: "+1" },
];

const globalNumbers = [
  { number: "+447911123456", country: "United Kingdom", countryCode: "GB", dialCode: "+44" },
  { number: "+4930123456",   country: "Germany",        countryCode: "DE", dialCode: "+49" },
  { number: "+33123456789",  country: "France",         countryCode: "FR", dialCode: "+33" },
  { number: "+34123456789",  country: "Spain",          countryCode: "ES", dialCode: "+34" },
  { number: "+39123456789",  country: "Italy",          countryCode: "IT", dialCode: "+39" },
];

async function main() {
  console.log("🌱 Seeding database...");

  await seedAdminLists(prisma);
  const [svcN, ctyN] = await Promise.all([prisma.service.count(), prisma.country.count()]);
  console.log(`✅ Admin lists: ${svcN} services, ${ctyN} countries (upserted)`);

  // Server configs
  for (const cfg of [
    { server: "SERVER1", name: "Server 1 — USA Numbers" },
    { server: "SERVER2", name: "Server 2 — Global Numbers" },
  ]) {
    await prisma.serverConfig.upsert({
      where:  { server: cfg.server },
      update: {},
      create: { server: cfg.server, name: cfg.name, isEnabled: true },
    });
  }

  // USA numbers (Server 1)
  for (const n of usaNumbers) {
    await prisma.virtualNumber.upsert({
      where:  { number: n.number },
      update: {},
      create: { ...n, server: "SERVER1", priceNGN: 500, priceUSD: 0.5 },
    });
  }

  // Global numbers (Server 2)
  for (const n of globalNumbers) {
    await prisma.virtualNumber.upsert({
      where:  { number: n.number },
      update: {},
      create: { ...n, server: "SERVER2", priceNGN: 700, priceUSD: 0.7 },
    });
  }

  // Admin user
  const adminEmail = "growthprofesors@gmail.com";
  await prisma.user.upsert({
    where:  { email: adminEmail },
    update: { role: "ADMIN" },
    create: {
      username:      "admin",
      name:          "Abati Admin",
      email:         adminEmail,
      password:      await bcrypt.hash("AbatiLogs2026", 12),
      role:          "ADMIN",
      isVerified:    true,
      walletBalance: 0,
    },
  });
  console.log("✅ Admin user ready: admin@abatilogs.com / admin123456");

  console.log("✅ Seed complete!");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
