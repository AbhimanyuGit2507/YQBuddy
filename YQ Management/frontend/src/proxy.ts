import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

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

export function proxy(req: NextRequest) {
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
    // Assumes base domain is qmova.vercel.app
    const baseDomain = 'qmova.vercel.app';
    if (hostname.endsWith(`.${baseDomain}`)) {
      subdomain = hostname.replace(`.${baseDomain}`, '');
    }
  }

  // If there's no subdomain or it's 'www', let it pass through to main app
  if (!subdomain || subdomain === 'www') {
    return NextResponse.next();
  }

  // If the request is already trying to access _tenant internally, block it or rewrite
  if (url.pathname.startsWith('/_tenant')) {
    return NextResponse.next();
  }

  // Rewrite to the _tenant dynamic route
  // e.g. tenant1.qmova.vercel.app/join/xyz -> /_tenant/tenant1/join/xyz
  url.pathname = `/_tenant/${subdomain}${url.pathname}`;
  
  return NextResponse.rewrite(url);
}
