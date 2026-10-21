import { NextResponse } from 'next/server';

// Passes the request path to server components, so the root layout can decide whether to show the coming soon page.
export function proxy(request) {
  const headers = new Headers(request.headers);
  const pathname = request.nextUrl.pathname;
  const publicSiteMatch = pathname.match(/^\/store\/([a-z0-9-]{1,80})(?:\/|$)/i);
  if (publicSiteMatch) {
    headers.set('x-pathname', pathname);
    const response = NextResponse.next({ request: { headers } });
    response.cookies.set('shopify_clone_public_site', publicSiteMatch[1].toLowerCase(), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  }

  const publicSiteSlug = request.cookies.get('shopify_clone_public_site')?.value;
  const excludedPath = /^\/(?:admin|api|preview|_next|store)(?:\/|$)/.test(pathname);
  const isStaticFile = /\.[a-z0-9]{2,8}$/i.test(pathname);
  if (publicSiteSlug && /^[a-z0-9-]{1,80}$/i.test(publicSiteSlug) && !excludedPath && !isStaticFile) {
    const storePath = `/store/${publicSiteSlug.toLowerCase()}${pathname === '/' ? '' : pathname}`;
    headers.set('x-pathname', storePath);
    return NextResponse.rewrite(new URL(storePath, request.url), { request: { headers } });
  }

  headers.set('x-pathname', pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
