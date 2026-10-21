import Image from 'next/image';

const STAGES = [
  '/icons/process-vision.svg',
  '/icons/process-source.svg',
  '/icons/process-review.svg',
  '/icons/process-craft.svg',
  '/icons/lotus-mulberry.svg',
];

export default function BotanicalLogoAnimation() {
  return (
    <div className="botanical-grow" aria-hidden="true">
      {STAGES.map((src, index) => (
        <Image key={src} src={src} alt="" width={128} height={128} unoptimized className={`botanical-grow__stage botanical-grow__stage--${index + 1}`} />
      ))}
    </div>
  );
}
