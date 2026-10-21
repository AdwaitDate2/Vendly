import Image from 'next/image';
import Link from 'next/link';
import Reveal from './Reveal';

export default function ProductCard({ product, index = 0 }) {
  const primaryPos = product.imagePositions?.[0] || 'center center';
  const hoverPos = product.imagePositions?.[1] || 'center center';

  return (
    <Reveal as="article" className="product-card" delay={Math.min(index, 6) * 70}>
      <Link className="product-card__image" href={`/shop/${product.slug}`}>
        <Image
          className="product-card__image-primary"
          src={product.images[0]}
          alt={product.shortTitle}
          fill
          sizes="(max-width: 700px) 100vw, 25vw"
          style={{ objectPosition: primaryPos }}
        />
        {product.images[1] && (
          <Image
            className="product-card__image-hover"
            src={product.images[1]}
            alt={`${product.shortTitle} alternate view`}
            fill
            sizes="(max-width: 700px) 100vw, 25vw"
            style={{ objectPosition: hoverPos }}
          />
        )}
        <span>View piece</span>
      </Link>
      <div className="product-card__meta">
        <div><p>{product.shortTitle}</p><span>{product.metal}</span></div>
        <strong>{product.saleMode === 'enquire' ? 'Enquire' : `$${product.price.toLocaleString()}`}</strong>
      </div>
    </Reveal>
  );
}
