import { NextResponse, type NextRequest } from "next/server";

const PROTECTED = ["/moj-racun", "/objavi", "/admin"];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  if (!needsAuth) return NextResponse.next();

  const token = req.cookies.get("auti_session")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/prijava";
    url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/moj-racun/:path*", "/objavi", "/admin/:path*"],
};
