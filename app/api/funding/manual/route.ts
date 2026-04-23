import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function uploadProofToCloudinary(file: File): Promise<string> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset) {
    throw new Error("Cloudinary is not configured");
  }

  const uploadForm = new FormData();
  uploadForm.append("file", file);
  uploadForm.append("upload_preset", uploadPreset);
  uploadForm.append("folder", "abati/manual-funding");

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body: uploadForm,
  });

  if (!response.ok) {
    throw new Error("Proof upload failed");
  }

  const data = (await response.json()) as { secure_url?: string };
  if (!data.secure_url) {
    throw new Error("Upload URL missing");
  }
  return data.secure_url;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.manualFundingRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      amount: true,
      currency: true,
      status: true,
      proofUrl: true,
      note: true,
      createdAt: true,
      reviewedAt: true,
    },
  });

  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const amountRaw = formData.get("amount");
  const currencyRaw = formData.get("currency");
  const noteRaw = formData.get("note");
  const proofFile = formData.get("proof");
  const proofUrlRaw = formData.get("proofUrl");

  const amount = Number(amountRaw);
  const currency = currencyRaw === "USD" ? "USD" : "NGN";
  const note = typeof noteRaw === "string" ? noteRaw.trim() : "";
  const proofUrlInput = typeof proofUrlRaw === "string" ? proofUrlRaw.trim() : "";

  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
  }

  try {
    let proofUrl = "";
    if (proofFile instanceof File && proofFile.size > 0) {
      if (proofFile.size > 6 * 1024 * 1024) {
        return NextResponse.json({ error: "Image must be 6MB or less" }, { status: 400 });
      }
      proofUrl = await uploadProofToCloudinary(proofFile);
    } else if (proofUrlInput) {
      try {
        const parsed = new URL(proofUrlInput);
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return NextResponse.json({ error: "Invalid proof URL" }, { status: 400 });
        }
        proofUrl = parsed.toString();
      } catch {
        return NextResponse.json({ error: "Invalid proof URL" }, { status: 400 });
      }
    } else {
      return NextResponse.json(
        { error: "Upload payment proof image or provide proof URL" },
        { status: 400 }
      );
    }

    const created = await prisma.manualFundingRequest.create({
      data: {
        userId: session.user.id,
        amount,
        currency,
        proofUrl,
        note: note || null,
        status: "PENDING",
      },
      select: { id: true },
    });

    return NextResponse.json({ success: true, id: created.id });
  } catch (error) {
    console.error("Manual funding request failed:", error);
    return NextResponse.json(
      { error: "Could not submit funding request." },
      { status: 500 }
    );
  }
}
