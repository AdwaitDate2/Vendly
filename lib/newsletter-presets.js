import { EMPTY_DOC } from './rich-text';

/**
 * Curated preset email templates for byShreen Fine Jewellery.
 * These provide luxury-crafted starting points for new releases, private salons,
 * bespoke spotlights, craftsmanship stories, holiday edits, and announcements.
 */
export const NEWSLETTER_PRESETS = [
  {
    id: 'new-collection',
    name: 'New Collection Debut',
    badge: 'Collection Launch',
    category: 'Showcase',
    description: 'Announce a new high jewellery capsule, highlighting inspirations, rare gemstones, and atelier craftsmanship.',
    subject: 'Introducing The High Jewellery 2026 Collection — byShreen',
    preheader: 'A celebration of bespoke artistry, rare gemstones, and modern heirloom design.',
    heading: 'The 2026 High Jewellery Collection is Here',
    buttonLabel: 'Explore The Collection',
    buttonUrl: '/shop',
    doc: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'We are delighted to unveil our newest capsule of fine jewellery — an ode to architectural silhouette, ethical diamond curation, and meticulous hand craftsmanship.' },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Crafted in Limited Numbers' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Each piece in this collection is handcrafted in our atelier in 18kt recycled solid gold and platinum, featuring hand-selected diamonds chosen for their exceptional brilliance and fire.' },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Signature Solitaire & Bezel-set rings with hand-finished edges' }] }],
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Sculptural pavé bands designed for seamless stacking' }] }],
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bespoke collar necklaces and drop earrings with natural luster' }] }],
            },
          ],
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '“Jewellery that speaks with quiet confidence — made to be worn effortlessly and cherished for generations.”' },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'As our pieces are crafted in limited batches, we invite you to view the collection early before selections become reserved.' },
          ],
        },
      ],
    },
  },
  {
    id: 'private-viewing',
    name: 'Private Salon Invitation',
    badge: 'VIP Concierge',
    category: 'Event & Booking',
    description: 'Invite subscribers to an exclusive private viewing salon, whether in-person or via virtual concierge consultation.',
    subject: 'Private Salon Invitation: An Exclusive Fine Jewellery Preview',
    preheader: 'Reserve your personal consultation with our master concierge.',
    heading: 'You Are Cordially Invited: Private Viewing Salon',
    buttonLabel: 'Reserve Your Consultation',
    buttonUrl: '/book-appointment',
    doc: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'We would love to welcome you to a private, one-on-one consultation with our jewellery concierge.' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Whether you are seeking the perfect engagement diamond, an anniversary heirloom, or curating a personal fine jewellery suite, our private salon provides a quiet, dedicated space to experience our creations.' },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'What to Expect' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Personal diamond & gemstone curation tailored to your exact specifications' }] }],
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hands-on viewing of rare vault pieces and upcoming designs' }] }],
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Complimentary ring sizing, bespoke design sketching, and champagne service' }] }],
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Both in-person appointments at our New York salon and worldwide virtual consultations are available.' },
          ],
        },
      ],
    },
  },
  {
    id: 'bespoke-spotlight',
    name: 'Bespoke Design Spotlight',
    badge: 'Custom Jewellery',
    category: 'Storytelling',
    description: 'Share the journey of a one-of-a-kind bespoke commission, inspiring clients to create their own custom heirloom.',
    subject: 'From Concept to Creation: A One-of-a-Kind Bespoke Heirloom',
    preheader: 'Discover how we bring personal stories to life in 18kt gold and rare diamonds.',
    heading: 'Inside The Bespoke Journey',
    buttonLabel: 'Begin Your Custom Commission',
    buttonUrl: '/custom',
    doc: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Every heirloom begins with a story. In our bespoke atelier, we translate meaningful milestones into one-of-a-kind fine jewellery that will be treasured across generations.' },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'The Three-Step Creation Process' }],
        },
        {
          type: 'orderedList',
          attrs: { start: 1 },
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Discovery & Sketching — We collaborate on initial silhouettes, stone dimensions, and aesthetic nuances.' }] }],
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Gemstone Selection — Handpicking conflict-free, rare stones with superior optical brilliance.' }] }],
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Atelier Crafting — Master jewellers sculpt, cast, and hand-set your piece with precision.' }] }],
            },
          ],
        },
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: '“The beauty of custom jewellery lies in knowing no other piece on earth will ever be quite like yours.”' },
              ],
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'If you have an idea in mind — whether a fresh vision or reimagining an antique family heirloom — our concierge is ready to begin the conversation.' },
          ],
        },
      ],
    },
  },
  {
    id: 'craft-story',
    name: 'Behind The Atelier: Craftsmanship',
    badge: 'Artistry',
    category: 'Storytelling',
    description: 'Take subscribers behind the scenes to appreciate hand-finishing, metal casting, and stone setting techniques.',
    subject: 'Behind the Bench: The Art of Hand-Finished Fine Jewellery',
    preheader: 'An intimate look into how our master jewellers shape solid gold and platinum.',
    heading: 'The Art of Slow Craftsmanship',
    buttonLabel: 'Read Our Craftsmanship Story',
    buttonUrl: '/craftsmanship',
    doc: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'In an era of mass production, byShreen remains devoted to the unhurried tradition of fine bench craftsmanship.' },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Precision in Every Micro-Prong' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Every diamond is microscope-set by hand to ensure structural balance and maximum light refraction. Our metals are alloyed to exacting standards, offering a rich, warm tone in 18kt yellow gold and a luminous finish in platinum.' },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'We believe fine jewellery should feel substantial yet weightless against the skin — comfortable enough for daily wear, resilient enough to endure forever.' },
          ],
        },
        {
          type: 'horizontalRule',
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Discover our complete commitment to ethical sourcing and sustainable precious metals.' },
          ],
        },
      ],
    },
  },
  {
    id: 'gift-guide',
    name: 'Curated Gift Guide',
    badge: 'Seasonal Edit',
    category: 'Gifting & Lifestyle',
    description: 'Showcase curated gift selections for milestones, anniversaries, bridal, and celebrations.',
    subject: 'The Curated Gift Guide: Timeless Elegance for Unforgettable Moments',
    preheader: 'Hand-selected fine jewellery gifts wrapped in signature byShreen packaging.',
    heading: 'Gifts to Commemorate Every Milestone',
    buttonLabel: 'Browse The Gift Guide',
    buttonUrl: '/shop',
    doc: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Celebrate love, achievements, and personal milestones with gifts of timeless fine jewellery. Each piece arrives in our signature keepsake box, complete with insured courier delivery.' },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Curated Highlights' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Understated Diamond Studs & Huggies — Everyday luxury designed for timeless versatility.' }] }],
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Bespoke Initial & Talisman Pendants — Intimate personalized pieces in 18kt gold.' }] }],
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Eternity & Stacking Rings — Celebrating anniversaries, new arrivals, and milestones.' }] }],
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Need assistance selecting the right sizing or gemstone cut? Our concierge team is available to offer personalized recommendations.' },
          ],
        },
      ],
    },
  },
  {
    id: 'care-guide',
    name: 'Heirloom Care & Maintenance',
    badge: 'Client Care',
    category: 'Care & Service',
    description: 'Share professional jewellery care tips, ultrasonic cleaning advice, and complimentary inspection services.',
    subject: 'Caring for Your Heirlooms: A Guide from Our Master Jewellers',
    preheader: 'Simple rituals to keep your fine jewellery radiant for decades to come.',
    heading: 'Preserving The Radiance of Your Jewellery',
    buttonLabel: 'Explore Care & Repairs',
    buttonUrl: '/repairs-care',
    doc: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Fine jewellery is made to be worn and loved. With simple daily rituals, your pieces will retain their original fire and luster for a lifetime.' },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Key Care Recommendations' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Put jewellery on last — after lotions, perfumes, and hair products have set.' }] }],
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Store pieces individually in their soft pouches to avoid surface micro-scratches.' }] }],
            },
            {
              type: 'listItem',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Clean gently using warm water, mild soap, and our ultra-soft lint-free polishing cloth.' }] }],
            },
          ],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'We offer complimentary annual prong inspections and professional deep cleaning for all byShreen pieces.' },
          ],
        },
      ],
    },
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    badge: 'Custom',
    category: 'Custom',
    description: 'A clean starting document ready for your custom message, announcements, or newsletter.',
    subject: 'A Note from byShreen',
    preheader: 'Latest updates and announcements from our atelier.',
    heading: 'A Note from byShreen',
    buttonLabel: 'Visit byShreen',
    buttonUrl: '/',
    doc: {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'Write your newsletter message here using the rich text editor above. Format headings, add bullet points, quotes, or custom links with ease.' },
          ],
        },
      ],
    },
  },
];

export function getPresetById(id) {
  return NEWSLETTER_PRESETS.find((p) => p.id === id) || NEWSLETTER_PRESETS[0];
}
