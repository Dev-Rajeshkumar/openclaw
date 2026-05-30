import { NextRequest, NextResponse } from "next/server";
/** Handle OAuth callback — exchange code for session */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/auth/login", req.url));
  // In production, exchange code with backend OAuth endpoint
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
