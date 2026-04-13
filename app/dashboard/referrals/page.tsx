import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Logo } from "@/components/layout/logo";
import { ensureUserReferralCode } from "@/lib/referral-code";
import { getPublicSiteUrl } from "@/lib/site-url";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReferralCopyActions } from "./referral-copy-actions";
import { formatDate } from "@/lib/utils";

export const metadata = { title: "Referrals | Abati Digital" };

export default async function ReferralsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const userId = session.user.id;
  const code = await ensureUserReferralCode(prisma, userId);
  const base = getPublicSiteUrl();
  const referralLink = `${base}/register?ref=${encodeURIComponent(code)}`;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      referralEarnings: true,
      referrals: {
        select: {
          id: true,
          username: true,
          name: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const earned = user?.referralEarnings ?? 0;
  const list = user?.referrals ?? [];
  const pct = process.env.REFERRAL_REWARD_PERCENT?.trim();
  const flat = process.env.REFERRAL_REWARD_NGN ?? "500";
  const rewardHint =
    pct && !Number.isNaN(Number(pct))
      ? `${pct}% of your friend’s first wallet top-up (min. ₦1)`
      : `₦${flat} per qualifying referral`;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Logo size="md" />
        <div>
          <h1
            className="text-2xl font-extrabold text-foreground"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            Referrals
          </h1>
          <p className="text-sm text-muted-foreground">
            Share your link. When someone you refer completes their first wallet top-up, you earn {rewardHint}.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Your referral link</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground break-all font-mono bg-muted/50 rounded-lg px-3 py-2 border border-border">
            {referralLink}
          </p>
          <ReferralCopyActions link={referralLink} code={code} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Total earned</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--primary)" }}>
            ₦{Math.round(earned).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Credited to your wallet when referrals fund their wallet the first time.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">People you referred</CardTitle>
        </CardHeader>
        <CardContent>
          {list.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No sign-ups yet. Share your link to start earning.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
              {list.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-3 py-2.5 text-sm"
                >
                  <span className="font-medium">
                    {r.name ?? r.username}
                    <span className="text-muted-foreground font-normal ml-2">@{r.username}</span>
                  </span>
                  <span className="text-xs text-muted-foreground">{formatDate(r.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
