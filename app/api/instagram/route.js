import { NextResponse } from 'next/server';

// ─── Meta Instagram Graph API ──────────────────────────────────────────────────
// This route fetches the latest posts directly from Instagram's official API.
// No third-party service. Just Meta's own Graph API.
//
// Setup (one-time, ~10 minutes):
//   1. Go to https://developers.facebook.com → My Apps → Create App → "Other" → "Consumer"
//   2. Add the "Instagram" product to your app
//   3. Under Instagram → API Setup with Instagram Login → Connect @byshreen account
//      (@byshreen must be a Business or Creator account — free to switch in Instagram settings)
//   4. Generate a short-lived token → exchange for a long-lived token (60-day expiry)
//   5. Add to .env:  INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
//   6. (Optional) Set up a cron to auto-refresh the token every 50 days
//
// Token refresh URL (run every ~50 days or automate):
//   https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=YOUR_TOKEN
// ─────────────────────────────────────────────────────────────────────────────

const INSTAGRAM_API_URL = 'https://graph.instagram.com/me/media';
const FIELDS = 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp';
const LIMIT = 6;

// Cache posts in memory for 1 hour so we don't hammer the API
let cache = { data: null, fetchedAt: 0 };
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

export async function GET() {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;

  if (!token) {
    return NextResponse.json(
      { error: 'INSTAGRAM_ACCESS_TOKEN not configured in .env' },
      { status: 503 }
    );
  }

  // Return cached data if fresh
  if (cache.data && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return NextResponse.json(cache.data, {
      headers: { 'X-Cache': 'HIT', 'Cache-Control': 'public, max-age=3600' },
    });
  }

  try {
    const url = `${INSTAGRAM_API_URL}?fields=${FIELDS}&limit=${LIMIT}&access_token=${token}`;
    const res = await fetch(url, { next: { revalidate: 3600 } });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('[Instagram API] Error:', err);
      return NextResponse.json(
        { error: err?.error?.message || 'Instagram API error', code: err?.error?.code },
        { status: res.status }
      );
    }

    const json = await res.json();
    const posts = (json.data || []).map((item) => ({
      id: item.id,
      mediaType: item.media_type,              // IMAGE | VIDEO | CAROUSEL_ALBUM
      mediaUrl: item.media_url,                // direct image/video URL
      thumbnailUrl: item.thumbnail_url || null, // video cover image
      permalink: item.permalink,               // link to actual IG post
      caption: item.caption || '',
      timestamp: item.timestamp,
    }));

    // Update cache
    cache = { data: posts, fetchedAt: Date.now() };

    return NextResponse.json(posts, {
      headers: { 'X-Cache': 'MISS', 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err) {
    console.error('[Instagram API] Fetch failed:', err);
    return NextResponse.json({ error: 'Failed to fetch Instagram posts' }, { status: 500 });
  }
}
