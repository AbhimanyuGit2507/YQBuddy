import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '';

export async function middleware(req: NextRequest) {
  const token = req.cookies.get('access_token')?.value || req.cookies.get('token')?.value;

  if (!token) {
    const isPublicPath = req.nextUrl.pathname.startsWith('/login') || 
                         req.nextUrl.pathname.startsWith('/register') ||
                         req.nextUrl.pathname.startsWith('/public') ||
                         req.nextUrl.pathname.startsWith('/_next') ||
                         req.nextUrl.pathname.includes('.'); // Match static files like manifest.json, favicon.ico

    if (!isPublicPath) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    return NextResponse.next();
  }

  if (req.nextUrl.pathname.startsWith('/super-admin')) {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000';
      const res = await fetch(`${backendUrl}/auth/me`, {
        headers: {
          cookie: `token=${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.email !== SUPER_ADMIN_EMAIL) {
          return NextResponse.redirect(new URL('/dashboard', req.url));
        }
      } else if (res.status === 401) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    } catch {
      console.error('Middleware: Unable to verify auth with backend');
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/super-admin/:path*'],
};
