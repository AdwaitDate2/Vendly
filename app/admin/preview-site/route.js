import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin-auth';

export const PREVIEW_COOKIE = 'byshreen_preview_site';
const PREVIEW_PATHS = new Set(['/', '/shop', '/bridal', '/custom', '/our-story', '/faq', '/privacy']);

// Lets a signed-in admin look at the real website while the coming soon page is on. Lasts one hour.
export async function GET(request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.redirect(new URL('/admin/login', request.url));
  const stop = request.nextUrl.searchParams.get('stop') === '1';
  const requestedPath = request.nextUrl.searchParams.get('path') || '/';
  const destination = stop ? '/admin/coming-soon' : (PREVIEW_PATHS.has(requestedPath) ? requestedPath : '/');
  const response = NextResponse.redirect(new URL(destination, request.url));
  if (stop) response.cookies.delete(PREVIEW_COOKIE);
  else response.cookies.set(PREVIEW_COOKIE, '1', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 3600 });
  return response;
}
