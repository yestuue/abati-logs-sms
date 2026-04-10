import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface LogEntry {
  username: string;
  password: string;
  email?: string;
  emailPass?: string;
  twoFA?: string;
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { sessionName, category, logs } = await req.json() as {
      sessionName: string;
      category: string;
      logs: LogEntry[];
    };

    if (!category?.trim() || !Array.isArray(logs) || logs.length === 0) {
      return NextResponse.json(
        { error: "category and logs array are required" },
        { status: 400 }
      );
    }

    const validLogs = logs.filter((l) => l.username?.trim() && l.password?.trim());

    if (validLogs.length === 0) {
      return NextResponse.json(
        { error: "No valid log entries found" },
        { status: 400 }
      );
    }

    const categoryName = category.trim();
    const categoryRow = await prisma.logCategory.findUnique({ where: { name: categoryName } });
    const unitPrice = categoryRow?.price ?? 0;

    await prisma.log.createMany({
      data: validLogs.map((l) => ({
        category: categoryName,
        categoryId: categoryRow?.id ?? null,
        username: l.username.trim(),
        password: l.password.trim(),
        email: l.email || null,
        emailPass: l.emailPass || null,
        twoFA: l.twoFA || null,
        price: unitPrice,
      })),
    });

    const skipped = logs.length - validLogs.length;

    return NextResponse.json({
      message: `${validLogs.length} log${validLogs.length !== 1 ? "s" : ""} uploaded${sessionName ? ` to "${sessionName}"` : ""}.`,
      uploaded: validLogs.length,
      skipped,
    });
  } catch (err) {
    console.error("[logs/bulk-upload] Error:", err);
    return NextResponse.json({ error: "Failed to upload logs" }, { status: 500 });
  }
}
