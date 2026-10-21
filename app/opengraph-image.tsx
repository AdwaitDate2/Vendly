import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'byShreen — fine diamond jewelry';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Link preview shown when the site is shared (Instagram, WhatsApp, iMessage, ...).
export default async function OpenGraphImage() {
  const lotus = await readFile(path.join(process.cwd(), 'public/icons/lotus-olive.svg'), 'utf8');
  const src = `data:image/svg+xml;base64,${Buffer.from(lotus).toString('base64')}`;
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#fff6df', color: '#6a6b44' }}>
        { }
        <img src={src} width={110} height={122} alt="" />
        <div style={{ display: 'flex', marginTop: 36, fontSize: 108, fontStyle: 'italic', letterSpacing: -3 }}>
          by<span style={{ fontStyle: 'normal' }}>Shreen</span>
        </div>
        <div style={{ marginTop: 18, fontSize: 26, letterSpacing: 8, color: '#a84d5f' }}>FINE DIAMOND JEWELRY</div>
      </div>
    ),
    size,
  );
}
