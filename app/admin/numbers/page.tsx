import { prisma } from "@/lib/prisma";
import { NumbersManager } from "@/components/admin/numbers-manager";

export const metadata = { title: "Admin — Numbers" };

export default async function AdminNumbersPage() {
  const numbers = await prisma.virtualNumber.findMany({
    orderBy: [{ server: "asc" }, { status: "asc" }, { number: "asc" }],
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Number Pool</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage virtual numbers across both servers — add, view, and remove inventory
        </p>
      </div>
      <NumbersManager numbers={numbers} />
    </div>
  );
}
