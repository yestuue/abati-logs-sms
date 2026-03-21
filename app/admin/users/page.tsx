import { prisma } from "@/lib/prisma";
import { UserAudit } from "@/components/admin/user-audit";

export const metadata = { title: "Admin — Users" };

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      walletBalance: true,
      walletCurrency: true,
      isVerified: true,
      createdAt: true,
      _count: {
        select: { numbers: true, transactions: true, smsMessages: true },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          View user details, purchase history, and manually top up wallets
        </p>
      </div>
      <UserAudit users={users} />
    </div>
  );
}
