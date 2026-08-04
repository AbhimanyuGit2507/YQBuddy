import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const SUPER_ADMIN_EMAIL = process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || '';

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images, svg, icons (public files)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|svg|icons).*)',
  ],
};

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  
  // Get hostname (e.g. tenant1.qmova.vercel.app or localhost:3000)
  const hostname = req.headers.get('host') || '';
  const isLocal = hostname.includes('localhost') || hostname.includes('127.0.0.1');
  
  let subdomain = '';

  if (isLocal) {
    const parts = hostname.split('.');
    if (parts.length > 1 && parts[0] !== 'localhost' && parts[0] !== '127') {
      subdomain = parts[0];
    }
  } else {
    // Production domain matching
    // Assumes base domain is qmova.vercel.app or yq-qmova.vercel.app
    let baseDomain = '';
    if (hostname.includes('yq-qmova.vercel.app')) baseDomain = 'yq-qmova.vercel.app';
    else if (hostname.includes('qmova.vercel.app')) baseDomain = 'qmova.vercel.app';
    else if (hostname.includes('qmova-app.vercel.app')) baseDomain = 'qmova-app.vercel.app';
    
    if (baseDomain && hostname.endsWith(`.${baseDomain}`)) {
      subdomain = hostname.replace(`.${baseDomain}`, '');
    }
  }

  // Rewrite to the _tenant dynamic route for subdomains
  if (subdomain && subdomain !== 'www' && !url.pathname.startsWith('/_tenant')) {
    url.pathname = `/_tenant/${subdomain}${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  // Authenticate super-admin routes
  if (req.nextUrl.pathname.startsWith('/super-admin')) {
    const token = req.cookies.get('access_token')?.value || req.cookies.get('token')?.value;
    
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }
    
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
