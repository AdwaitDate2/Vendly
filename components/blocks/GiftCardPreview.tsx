'use client';

import Link from 'next/link';
import { useState } from 'react';

const SAMPLE_CODE = 'A1B2 3C4D 5E6F 7G8H';
const SAMPLE_QR_SIZE = 25;

function isFinderModule(row, column, startRow, startColumn) {
  const relativeRow = row - startRow;
  const relativeColumn = column - startColumn;
  if (relativeRow < 0 || relativeRow > 6 || relativeColumn < 0 || relativeColumn > 6) return null;
  return relativeRow === 0 || relativeRow === 6 || relativeColumn === 0 || relativeColumn === 6
    || (relativeRow >= 2 && relativeRow <= 4 && relativeColumn >= 2 && relativeColumn <= 4);
}

function sampleMatrixModule(row, column) {
  const finderOrigins = [[0, 0], [0, SAMPLE_QR_SIZE - 7], [SAMPLE_QR_SIZE - 7, 0]];
  for (const [startRow, startColumn] of finderOrigins) {
    const finderModule = isFinderModule(row, column, startRow, startColumn);
    if (finderModule !== null) return finderModule;
  }
  return ((row * 13 + column * 7 + row * column * 3) % 11) < 5;
}

function SampleQrGraphic() {
  const modules = [];
  for (let row = 0; row < SAMPLE_QR_SIZE; row += 1) {
    for (let column = 0; column < SAMPLE_QR_SIZE; column += 1) {
      if (sampleMatrixModule(row, column)) modules.push(<rect key={`${row}-${column}`} x={column} y={row} width="1" height="1" />);
    }
  }

  return <svg className="gift-card-preview__qr" viewBox={`-1 -1 ${SAMPLE_QR_SIZE + 2} ${SAMPLE_QR_SIZE + 2}`} role="img" aria-label="Decorative sample QR pattern; it cannot be used to redeem a gift card" shapeRendering="crispEdges"><rect x="-1" y="-1" width={SAMPLE_QR_SIZE + 2} height={SAMPLE_QR_SIZE + 2} fill="white" />{modules}</svg>;
}

/** Non-redeemable sample UI matching the Gift card theme editor destination. */
export default function GiftCardPreview({ resource }) {
  const [copied, setCopied] = useState(false);
  const giftCardAmount = Number(resource?.amount) || 100;
  const formattedAmount = `₹ ${giftCardAmount.toLocaleString('en-IN')}`;

  const copySampleCode = async () => {
    try {
      await navigator.clipboard.writeText(SAMPLE_CODE);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return <section className="gift-card-preview" aria-label="Gift card sample preview">
    <span className="gift-card-preview__brand">byShreen</span>
    <div className="gift-card-preview__art" aria-label="Sample gift card artwork">
      <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M50 8 59 36 88 29 69 50 91 67 62 64 52 93 43 65 13 73 32 51 10 34 39 37Z" /></svg>
    </div>
    <h1 className="gift-card-preview__amount">{formattedAmount}</h1>
    <p className="gift-card-preview__instructions">use the gift card code online or qr code in-store</p>
    <code className="gift-card-preview__code">{SAMPLE_CODE}</code>
    <SampleQrGraphic />
    <p className="gift-card-preview__sample-note">Sample code only · QR pattern is not redeemable</p>
    <button className="gift-card-preview__copy" type="button" onClick={copySampleCode}>{copied ? 'code copied' : 'copy gift card code'}</button>
    <Link className="gift-card-preview__visit" href="/">visit online store</Link>
  </section>;
}
