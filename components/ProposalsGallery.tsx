import Image from 'next/image';
import { resolveAssetPath } from '@/lib/asset-paths';
import { PROPOSALS_DATA } from '@/data/proposals';

export default function ProposalsGallery({
  proposals,
  eyebrow = 'byShreen Proposals',
  title = 'Stories that started here.',
  subtitle = '',
  tone = 'paper',
}) {
  const items = proposals || PROPOSALS_DATA;

  return (
    <section className={`proposals proposals--${tone}`}>
      <div className="proposals__head">
        <span className={`eyebrow${tone === 'paper' ? '' : ' eyebrow--light'}`}>{eyebrow}</span>
        <h2>{title}</h2>
        {subtitle ? <p className="proposals__sub">{subtitle}</p> : null}
      </div>
      <div className="proposals-grid--three">
        {items.map((item) => {
          const src = item.image || resolveAssetPath(`/images/proposals/${item.slug}.webp`);
          return (
            <div className="proposal-tile" key={item.id || item.slug}>
              <div className="proposal-tile__image">
                <Image
                  src={src}
                  alt={`${item.name} proposal`}
                  fill
                  sizes="(max-width: 760px) 100vw, 33vw"
                  style={item.imagePosition || item.focus ? { objectPosition: item.imagePosition || item.focus } : undefined}
                />
              </div>
              <h3>{item.name}</h3>
              <span>{item.date}</span>
              {item.story ? <p className="proposal-tile__story">{item.story}</p> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
