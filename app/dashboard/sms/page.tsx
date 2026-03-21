import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SmsInbox } from "@/components/dashboard/sms-inbox";

export const metadata = { title: "SMS Inbox" };

export default async function SmsPage() {
  const session = await auth();
  const userId = session!.user.id;

  const messages = await prisma.sMS.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { number: { select: { number: true } } },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">SMS Inbox</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          All incoming messages for your active numbers
        </p>
      </div>
      <SmsInbox messages={messages} />
    </div>
  );
}
