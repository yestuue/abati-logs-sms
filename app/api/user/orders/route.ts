import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const logs = await prisma.log.findMany({
      where: {
        userId: session.user.id,
        status: "SOLD",
      },
      orderBy: {
        purchasedAt: "desc",
      },
      select: {
        id: true,
        category: true,
        username: true,
        password: true,
        email: true,
        emailPass: true,
        twoFA: true,
        price: true,
        purchasedAt: true,
        status: true,
      },
    });

    // Map to frontend format if needed, but we'll try to match the existing Order interface
    const formattedLogs = logs.map((log) => ({
      id: log.id,
      product: log.category, // Using category as product name for now
      category: log.category,
      username: log.username,
      password: log.password,
      recoveryEmail: log.email,
      twoFAKey: log.twoFA,
      price: log.price,
      date: log.purchasedAt ? new Date(log.purchasedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }) : "N/A",
      status: log.status.toLowerCase(),
    }));

    return NextResponse.json(formattedLogs);
  } catch (error) {
    console.error("Error fetching user logs:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
