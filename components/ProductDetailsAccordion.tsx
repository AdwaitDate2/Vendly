'use client';

import { useState } from 'react';
import { Fragment } from 'react';
import { composeCare, composeShipping, parseBlocks } from '@/lib/product-info';

// Renders store-written text: **bold**, and {email} as a link to the contact email.
function Rich({ text, email }) {
  return String(text || '').split(/(\*\*[^*\n]+\*\*|\*[^*\n]+\*|\{email\})/g).map((part, index) => {
    if (part === '{email}') return email ? <a key={index} href={`mailto:${email}`} className="text-link">{email}</a> : null;
    if (part.length > 4 && part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.length > 2 && part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    return <Fragment key={index}>{part}</Fragment>;
  });
}

const lines = (text) => String(text || '').split('\n').map((line) => line.trim()).filter(Boolean);

export default function ProductDetailsAccordion({ product, selectedMetal, info, email }) {
  const [openSections, setOpenSections] = useState({
    details: true,
    care: false,
    shipping: false,
  });

  const toggleSection = (key) => {
    setOpenSections((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const hidden = product.hiddenSections || [];
  const metalText = selectedMetal || product.metal || '14kt & 18kt Solid Gold';

  return (
    <div className="pdp-accordions">
      {/* 1. Product Details */}
      {hidden.includes('details') ? null : <div className={`pdp-accordion ${openSections.details ? 'is-open' : ''}`}>
        <button
          type="button"
          className="pdp-accordion__trigger"
          onClick={() => toggleSection('details')}
          aria-expanded={openSections.details}
        >
          <span className="pdp-accordion__title">Product Details</span>
          <span className="pdp-accordion__icon" aria-hidden="true">
            {openSections.details ? '−' : '+'}
          </span>
        </button>
        {openSections.details && (
          <div className="pdp-accordion__content">
            <ul className="pdp-details-list">
              <li>
                <strong>Metal:</strong> {metalText}
              </li>
              <li>
                <strong>Natural Diamonds:</strong>{' '}
                {product.caratWeight ? `Approx. ${product.caratWeight}ct total ` : ''}{info.diamondNote}
              </li>
              {lines(product.detailsExtra).map((line) => {
                const [label, ...rest] = line.split(':');
                return rest.length ? <li key={line}><strong>{label.trim()}:</strong> {rest.join(':').trim()}</li> : <li key={line}>{line}</li>;
              })}
            </ul>
          </div>
        )}
      </div>}

      {/* 2. Care Instructions */}
      {hidden.includes('care') ? null : <div className={`pdp-accordion ${openSections.care ? 'is-open' : ''}`}>
        <button
          type="button"
          className="pdp-accordion__trigger"
          onClick={() => toggleSection('care')}
          aria-expanded={openSections.care}
        >
          <span className="pdp-accordion__title">Care Instructions</span>
          <span className="pdp-accordion__icon" aria-hidden="true">
            {openSections.care ? '−' : '+'}
          </span>
        </button>
        {openSections.care && (
          <div className="pdp-accordion__content">
            {(() => {
              let seenList = false;
              return parseBlocks(product.careText || composeCare(info)).map((block, index) => {
                if (block.type === 'list') {
                  seenList = true;
                  return <ul className="pdp-care-bullets" key={index}>{block.items.map((item) => <li key={item}><Rich text={item} email={email} /></li>)}</ul>;
                }
                if (block.type === 'heading') return <strong className="pdp-shipping-heading" key={index}>{block.text}</strong>;
                return <p className={seenList ? 'pdp-care-signoff' : 'pdp-care-intro'} key={index}><Rich text={block.text} email={email} /></p>;
              });
            })()}
          </div>
        )}
      </div>}

      {/* 3. Shipping & Returns */}
      {hidden.includes('shipping') ? null : <div className={`pdp-accordion ${openSections.shipping ? 'is-open' : ''}`}>
        <button
          type="button"
          className="pdp-accordion__trigger"
          onClick={() => toggleSection('shipping')}
          aria-expanded={openSections.shipping}
        >
          <span className="pdp-accordion__title">Shipping &amp; Returns</span>
          <span className="pdp-accordion__icon" aria-hidden="true">
            {openSections.shipping ? '−' : '+'}
          </span>
        </button>
        {openSections.shipping && (
          <div className="pdp-accordion__content">
            <div className="pdp-shipping-block">
              {parseBlocks(product.shippingText || composeShipping(info)).map((block, index) => {
                if (block.type === 'heading') return <div className="pdp-shipping-headline" key={index}><strong className="pdp-shipping-heading">{block.text}</strong>{block.tag ? <span className="pdp-shipping-tag">{block.tag}</span> : null}</div>;
                if (block.type === 'list') return <ul className="pdp-care-bullets" key={index}>{block.items.map((item) => <li key={item}><Rich text={item} email={email} /></li>)}</ul>;
                const note = block.text.startsWith('*') && !block.text.startsWith('**') && block.text.endsWith('*');
                return <p className={note ? 'pdp-shipping-note' : undefined} key={index}><Rich text={block.text} email={email} /></p>;
              })}
            </div>
          </div>
        )}
      </div>}
    </div>
  );
}
