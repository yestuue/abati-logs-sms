import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { proxy, config } from "./proxy";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  if (token?.role === "ADMIN") {
    return NextResponse.next();
  }
  return proxy(request);
}

export { config };
