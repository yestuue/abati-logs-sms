import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type FlutterwaveWebhookEvent = {
  event?: string;
  data?: {
    id?: number | string;
    tx_ref?: string;
    flw_ref?: string;
    amount?: number | string;
    currency?: string;
    status?: string;
    payment_type?: string;
  };
};

function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function resolveUserIdFromTxRef(txRef: string): Promise<string | null> {
  const candidates = new Set<string>();
  const trimmed = txRef.trim();
  if (trimmed) candidates.add(trimmed);

  const cuidMatch = trimmed.match(/c[a-z0-9]{24}/i)?.[0];
  if (cuidMatch) candidates.add(cuidMatch);

  const colonTail = trimmed.split(":").at(-1)?.trim();
  if (colonTail) candidates.add(colonTail);

  const pipeTail = trimmed.split("|").at(-1)?.trim();
  if (pipeTail) candidates.add(pipeTail);

  for (const candidate of candidates) {
    const user = await prisma.user.findUnique({
      where: { id: candidate },
      select: { id: true },
    });
    if (user?.id) return user.id;
  }

  return null;
}

export async function POST(req: Request) {
  const expectedHash = process.env.FLUTTERWAVE_SECRET_HASH;
  const incomingHash = req.headers.get("verif-hash");

  if (!expectedHash || incomingHash !== expectedHash) {
    return NextResponse.json({ error: "Unauthorized webhook" }, { status: 401 });
  }

  let payload: FlutterwaveWebhookEvent;
  try {
    payload = (await req.json()) as FlutterwaveWebhookEvent;
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (payload.event !== "charge.completed") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const data = payload.data ?? {};
  const txRef = (data.tx_ref ?? "").trim();
  const amount = toNumber(data.amount);
  const currency = (data.currency ?? "NGN").toUpperCase() === "USD" ? "USD" : "NGN";
  const eventStatus = (data.status ?? "").toLowerCase();

  if (!txRef || amount <= 0 || (eventStatus && eventStatus !== "successful")) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const existingByTxRef = await prisma.transaction.findUnique({
    where: { reference: txRef },
    select: { id: true, userId: true, status: true, metadata: true },
  });

  const webhookReference =
    data.id != null
      ? `FLW-${String(data.id)}`
      : data.flw_ref
        ? `FLW-${data.flw_ref}`
        : `FLW-${txRef}`;

  if (existingByTxRef) {
    if (existingByTxRef.status === "SUCCESS") {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    await prisma.$transaction(async (dbtx) => {
      await dbtx.user.update({
        where: { id: existingByTxRef.userId },
        data: { walletBalance: { increment: amount } },
      });

      await dbtx.transaction.update({
        where: { id: existingByTxRef.id },
        data: {
          amount,
          currency,
          status: "SUCCESS",
          metadata: {
            ...(typeof existingByTxRef.metadata === "object" && existingByTxRef.metadata !== null
              ? existingByTxRef.metadata
              : {}),
            provider: "Flutterwave",
            gatewayStatus: data.status ?? null,
            flutterwaveRef: data.flw_ref ?? null,
            paymentType: data.payment_type ?? null,
            webhookReference,
          },
        },
      });
    });

    return NextResponse.json({ received: true }, { status: 200 });
  }

  const userId = await resolveUserIdFromTxRef(txRef);
  if (!userId) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const existingWebhookTx = await prisma.transaction.findUnique({
    where: { reference: webhookReference },
    select: { id: true },
  });
  if (existingWebhookTx) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  await prisma.$transaction(async (dbtx) => {
    await dbtx.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: amount } },
    });

    await dbtx.transaction.create({
      data: {
        userId,
        amount,
        currency,
        reference: webhookReference,
        status: "SUCCESS",
        type: "WALLET_TOPUP",
        metadata: {
          provider: "Flutterwave",
          txRef,
          gatewayStatus: data.status ?? null,
          flutterwaveRef: data.flw_ref ?? null,
          paymentType: data.payment_type ?? null,
        },
      },
    });
  });

  return NextResponse.json({ received: true }, { status: 200 });
}
