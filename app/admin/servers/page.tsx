import { prisma } from "@/lib/prisma";
import { ServerManagement } from "@/components/admin/server-management";

export const metadata = { title: "Admin — Server Management" };

export default async function ServersPage() {
  // Ensure server configs exist
  const configs = await prisma.serverConfig.findMany({ orderBy: { server: "asc" } });

  if (configs.length === 0) {
    await prisma.serverConfig.createMany({
      data: [
        { server: "SERVER1", name: "Server 1 — USA Numbers", isEnabled: true },
        { server: "SERVER2", name: "Server 2 — Global Numbers", isEnabled: true },
      ],
    });
  }

  const finalConfigs = configs.length > 0 ? configs : await prisma.serverConfig.findMany();

  const [server1Count, server2Count, server1Assigned, server2Assigned] = await Promise.all([
    prisma.virtualNumber.count({ where: { server: "SERVER1" } }),
    prisma.virtualNumber.count({ where: { server: "SERVER2" } }),
    prisma.virtualNumber.count({ where: { server: "SERVER1", status: "ASSIGNED" } }),
    prisma.virtualNumber.count({ where: { server: "SERVER2", status: "ASSIGNED" } }),
  ]);

  const stats = {
    SERVER1: { total: server1Count, assigned: server1Assigned },
    SERVER2: { total: server2Count, assigned: server2Assigned },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Server Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Control which servers are online and available for purchases
        </p>
      </div>
      <ServerManagement configs={finalConfigs} stats={stats} />
    </div>
  );
}
