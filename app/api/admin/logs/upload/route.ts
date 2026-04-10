import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { category, fileContent } = await req.json();

    if (!category?.trim() || !fileContent?.trim()) {
      return NextResponse.json(
        { error: "category and fileContent are required" },
        { status: 400 }
      );
    }

    const lines = (fileContent as string)
      .trim()
      .split("\n")
      .filter((l: string) => l.trim().length > 0);

    if (lines.length === 0) {
      return NextResponse.json({ error: "File is empty" }, { status: 400 });
    }

    const logsData = lines.map((line: string) => {
      const [username, password, email, emailPass, twoFA] = line
        .split("|")
        .map((item) => item?.trim());

      return {
        category: category.trim(),
        username: username ?? "",
        password: password ?? "",
        email: email || null,
        emailPass: emailPass || null,
        twoFA: twoFA || null,
      };
    });

    // Filter out rows that are missing required fields
    const valid = logsData.filter((r) => r.username && r.password);
    const skipped = logsData.length - valid.length;
    const categoryName = category.trim();
    const categoryRow = await prisma.logCategory.findUnique({ where: { name: categoryName } });
    const unitPrice = categoryRow?.price ?? 0;
    await prisma.log.createMany({
      data: valid.map((r) => ({
        ...r,
        category: categoryName,
        categoryId: categoryRow?.id ?? null,
        price: unitPrice,
      })),
    });

    return NextResponse.json({
      message: `${valid.length} log${valid.length !== 1 ? "s" : ""} uploaded successfully.`,
      uploaded: valid.length,
      skipped,
    });
  } catch (err) {
    console.error("[logs/upload] Error:", err);
    return NextResponse.json({ error: "Failed to process file" }, { status: 500 });
  }
}
