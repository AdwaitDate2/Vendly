import { resolveAssetPath, resolveAssetPaths } from '../lib/asset-paths.js';

const rawProducts = [
  // --- RINGS (5 pieces) ---
  {
    slug: '1-1-4ct-tdw-lab-grown-diamond-solitaire-engagement-ring',
    title: '1 1/4ct TDW Natural Diamond Solitaire Engagement Ring',
    shortTitle: 'Solitaire Engagement Ring',
    price: 1029,
    category: 'rings',
    metal: '14kt & 18kt Gold',
    metalOptions: ['14kt Gold', '18kt Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-diamond-solitaire-engagement-ring-1.webp',
      '/images/selection-2/product-diamond-solitaire-engagement-ring-2.webp',
      '/images/selection-2/product-diamond-solitaire-engagement-ring-3.webp',
    ],
    imagePositions: ['center 48%', 'center 35%'],
    description:
      'A refined solitaire with a contemporary profile, designed to let the natural diamond carry the entire composition. Handcrafted in 14kt or 18kt gold, elegant from every angle and made for everyday significance.',
  },
  {
    slug: '1-10ct-tdw-lab-grown-diamond-bypass-ring-in-14k-yellow-gold',
    title: '1/10ct TDW Natural Diamond Bypass Ring',
    shortTitle: 'Diamond Bypass Ring',
    price: 380,
    category: 'rings',
    metal: '14kt & 18kt Yellow Gold',
    metalOptions: ['14kt Yellow Gold', '18kt Yellow Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-diamond-bypass-ring-yellow-1.webp',
      '/images/selection-2/product-diamond-bypass-ring-yellow-2.webp',
      '/images/selection-2/product-diamond-bypass-ring-yellow-3.webp',
    ],
    imagePositions: ['center 40%', 'center 35%'],
    description:
      'A minimal bypass ring with a light, sculptural profile. Designed in 14kt or 18kt gold to stack naturally or stand alone as an understated natural diamond accent.',
  },
  {
    slug: 'pave-diamond-eternity-band-14k-yellow-gold',
    title: 'Pavé Natural Diamond Eternity Band',
    shortTitle: 'Pavé Eternity Band',
    price: 890,
    category: 'rings',
    metal: '14kt & 18kt Yellow Gold',
    metalOptions: ['14kt Yellow Gold', '18kt Yellow Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-pave-diamond-eternity-band-1.webp',
      '/images/selection-2/product-pave-diamond-eternity-band-2.webp',
      '/images/selection-2/product-pave-diamond-eternity-band-3.webp',
    ],
    imagePositions: ['center 45%', 'center 40%'],
    description:
      'A continuous circle of brilliant pavé-set natural diamonds set in warm 14kt or 18kt yellow gold. Crafted with micro-prongs for maximum light return and effortless stacking.',
  },
  {
    slug: 'sculptural-duo-diamond-ring-14k-gold',
    title: 'Sculptural Duo Natural Diamond Ring',
    shortTitle: 'Sculptural Duo Ring',
    price: 1150,
    category: 'rings',
    metal: '14kt & 18kt Gold',
    metalOptions: ['14kt Gold', '18kt Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-sculptural-duo-diamond-ring-1.webp',
      '/images/selection-2/product-sculptural-duo-diamond-ring-2.webp',
    ],
    imagePositions: ['center 42%', 'center 38%'],
    description:
      'Two complementary natural diamonds perched atop an architectural open band in 14kt or 18kt gold. Modern, bold, and distinctly personal.',
  },
  {
    slug: 'marquise-halo-diamond-ring-14k-gold',
    title: 'Marquise Halo Natural Diamond Ring',
    shortTitle: 'Marquise Halo Ring',
    price: 1420,
    category: 'rings',
    metal: '14kt & 18kt Gold',
    metalOptions: ['14kt Gold', '18kt Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-marquise-halo-diamond-ring-1.webp',
      '/images/selection-2/product-marquise-halo-diamond-ring-2.webp',
      '/images/selection-2/product-marquise-halo-diamond-ring-3.webp',
    ],
    imagePositions: ['center 42%', 'center 38%'],
    description:
      'An elongated marquise-cut natural diamond wrapped in a feather-light pavé halo of 14kt or 18kt gold, designed to lengthen the silhouette of the finger.',
  },

  // --- NECKLACES (5 pieces) ---
  {
    slug: '1-3-4ct-tdw-lab-grown-diamond-layered-station-necklace-in-14k-white-gold',
    title: '1 3/4ct TDW Natural Diamond Layered Station Necklace',
    shortTitle: 'Layered Station Necklace',
    price: 2129,
    category: 'necklaces',
    metal: '14kt & 18kt White Gold',
    metalOptions: ['14kt White Gold', '18kt White Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-diamond-layered-station-necklace-1.webp',
      '/images/selection-2/product-diamond-layered-station-necklace-2.webp',
      '/images/selection-2/product-diamond-layered-station-necklace-3.webp',
    ],
    imagePositions: ['center 38%', 'center 35%'],
    description:
      'This elegant piece features a two-chain layered design in polished 14kt or 18kt gold, beautifully accented with sparkling bezel-set natural diamond stations. The upper chain highlights a round diamond cluster while the lower pendant adds a floral-inspired finish.',
  },
  {
    slug: 'cascade-diamond-pendant-necklace-14k-gold',
    title: 'Cascade Natural Diamond Pendant Necklace',
    shortTitle: 'Cascade Diamond Pendant',
    price: 1480,
    category: 'necklaces',
    metal: '14kt & 18kt Gold',
    metalOptions: ['14kt Gold', '18kt Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-cascade-diamond-pendant-necklace-1.webp',
      '/images/selection-2/custom-hero.webp',
      '/images/selection-2/product-cascade-diamond-pendant-necklace-3.webp',
    ],
    imagePositions: ['center 35%', 'center 30%'],
    description:
      'A graduated cascade of brilliant round natural diamonds suspended along a delicate diamond-cut cable chain in 14kt or 18kt gold. Designed to catch light with every gesture.',
  },
  {
    slug: 'luminous-diamond-tennis-choker-14k-white-gold',
    title: 'Luminous Natural Diamond Tennis Choker',
    shortTitle: 'Luminous Tennis Choker',
    price: 3450,
    category: 'necklaces',
    metal: '14kt & 18kt White Gold',
    metalOptions: ['14kt White Gold', '18kt White Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-luminous-diamond-tennis-choker-1.webp',
      '/images/selection-2/product-luminous-diamond-tennis-choker-2.webp',
      '/images/selection-2/product-luminous-diamond-tennis-choker-3.webp',
    ],
    imagePositions: ['center 40%', 'center 35%'],
    description:
      'A continuous line of hand-matched natural diamonds resting flat against the collarbone. Timeless luxury re-engineered with refined modern flexibility in 14kt or 18kt white gold.',
  },
  {
    slug: 'celestial-solitaire-pendant-14k-yellow-gold',
    title: 'Celestial Solitaire Natural Diamond Pendant',
    shortTitle: 'Celestial Solitaire Pendant',
    price: 760,
    category: 'necklaces',
    metal: '14kt & 18kt Yellow Gold',
    metalOptions: ['14kt Yellow Gold', '18kt Yellow Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-celestial-solitaire-pendant-yellow-1.webp',
      '/images/selection-2/product-celestial-solitaire-pendant-yellow-2.webp',
    ],
    imagePositions: ['center 36%', 'center 32%'],
    description:
      'A solitary brilliant natural diamond held in a minimal 4-prong floating basket in 14kt or 18kt yellow gold. An essential foundational piece for everyday elegance.',
  },
  {
    slug: 'heritage-emerald-cut-diamond-y-necklace-14k-gold',
    title: 'Heritage Emerald-Cut Natural Diamond Y-Necklace',
    shortTitle: 'Heritage Y-Necklace',
    price: 2780,
    category: 'necklaces',
    metal: '14kt & 18kt Gold',
    metalOptions: ['14kt Gold', '18kt Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-heritage-emerald-cut-diamond-1.webp',
      '/images/selection-2/generational-craftsmanship.webp',
      '/images/selection-2/product-heritage-emerald-cut-diamond-3.webp',
    ],
    imagePositions: ['center 35%', 'center 30%'],
    description:
      'A striking lariat silhouette in 14kt or 18kt gold accented by a step-cut emerald natural diamond drop, perfect for plunging necklines or evening layering.',
  },

  // --- EARRINGS (5 pieces) ---
  {
    slug: '1-7-8ct-tdw-lab-grown-diamond-geometric-drop-earrings-in-14k-yellow-gold',
    title: '1 7/8ct TDW Natural Diamond Geometric Drop Earrings',
    shortTitle: 'Geometric Drop Earrings',
    price: 1269,
    category: 'earrings',
    metal: '14kt & 18kt Yellow Gold',
    metalOptions: ['14kt Yellow Gold', '18kt Yellow Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-diamond-geometric-drop-earrings-1.webp',
      '/images/selection-2/product-diamond-geometric-drop-earrings-2.webp',
      '/images/selection-2/product-diamond-geometric-drop-earrings-3.webp',
    ],
    imagePositions: ['45% 20%', 'center 20%'],
    description:
      'Modern drop earrings that balance brilliant round natural diamonds with a graphic yellow-gold silhouette in 14kt or 18kt gold. A statement piece with enough restraint for repeat wear.',
  },
  {
    slug: 'pave-diamond-huggie-hoops-14k-gold',
    title: 'Pavé Natural Diamond Huggie Hoops',
    shortTitle: 'Pavé Huggie Hoops',
    price: 640,
    category: 'earrings',
    metal: '14kt & 18kt Gold',
    metalOptions: ['14kt Gold', '18kt Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-pave-diamond-huggie-hoops-1.webp',
      '/images/selection-2/product-pave-diamond-huggie-hoops-2.webp',
      '/images/selection-2/product-pave-diamond-huggie-hoops-3.webp',
    ],
    imagePositions: ['center 30%', 'center 25%'],
    description:
      'Close-fitting huggie hoops lined with twinkling natural diamonds in 14kt or 18kt gold. Comfortable enough to sleep in, luminous enough to elevate any ensemble.',
  },
  {
    slug: 'pear-cut-diamond-drop-earrings-14k-white-gold',
    title: 'Pear-Cut Natural Diamond Drop Earrings',
    shortTitle: 'Pear-Cut Diamond Drops',
    price: 1590,
    category: 'earrings',
    metal: '14kt & 18kt White Gold',
    metalOptions: ['14kt White Gold', '18kt White Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/bridal-hero.webp',
      '/images/selection-2/product-pear-cut-diamond-drop-2.webp',
      '/images/selection-2/product-pear-cut-diamond-drop-3.webp',
    ],
    imagePositions: ['center 25%', 'center 20%'],
    description:
      'Graceful pear-cut natural diamonds suspended from delicate round diamond studs in 14kt or 18kt white gold. Seamless articulation delivers subtle kinetic sparkle with every turn of the head.',
  },
  {
    slug: 'classic-solitaire-diamond-studs-14k-gold',
    title: 'Classic Solitaire Natural Diamond Studs',
    shortTitle: 'Classic Solitaire Studs',
    price: 520,
    category: 'earrings',
    metal: '14kt & 18kt Gold',
    metalOptions: ['14kt Gold', '18kt Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-classic-solitaire-diamond-studs-1.webp',
      '/images/selection-2/product-classic-solitaire-diamond-studs-2.webp',
    ],
    imagePositions: ['center 35%', 'center 30%'],
    description:
      'Flawlessly matched brilliant natural diamonds set low in protective 3-prong martini settings in 14kt or 18kt gold. The definitive staple of fine jewelry.',
  },
  {
    slug: 'cascading-diamond-threader-earrings-14k-yellow-gold',
    title: 'Cascading Natural Diamond Threader Earrings',
    shortTitle: 'Diamond Threader Earrings',
    price: 980,
    category: 'earrings',
    metal: '14kt & 18kt Yellow Gold',
    metalOptions: ['14kt Yellow Gold', '18kt Yellow Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-cascading-diamond-threader-earrings-1.webp',
      '/images/selection-2/product-cascading-diamond-threader-earrings-2.webp',
      '/images/selection-2/product-cascading-diamond-threader-earrings-3.webp',
    ],
    imagePositions: ['center 30%', 'center 25%'],
    description:
      'Feather-light gold box chains in 14kt or 18kt yellow gold with sparkling bezel natural diamonds that drape gracefully behind the lobe.',
  },

  // --- BRACELETS (5 pieces) ---
  {
    slug: 'bezel-diamond-line-bracelet-14k-gold',
    title: 'Bezel Natural Diamond Line Bracelet',
    shortTitle: 'Bezel Diamond Line Bracelet',
    price: 2450,
    category: 'bracelets',
    metal: '14kt & 18kt Gold',
    metalOptions: ['14kt Gold', '18kt Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-bezel-diamond-line-bracelet-1.webp',
      '/images/selection-2/product-bezel-diamond-line-bracelet-2.webp',
      '/images/selection-2/product-bezel-diamond-line-bracelet-3.webp',
    ],
    imagePositions: ['center 45%', 'center 40%'],
    description:
      'Polished bezels frame individual natural diamonds along a fluid, flexible bracelet in 14kt or 18kt gold. Secure double-latch clasp for worry-free daily luxury.',
  },
  {
    slug: 'art-deco-diamond-bangle-14k-yellow-gold',
    title: 'Art Deco Natural Diamond Bangle',
    shortTitle: 'Art Deco Diamond Bangle',
    price: 1890,
    category: 'bracelets',
    metal: '14kt & 18kt Yellow Gold',
    metalOptions: ['14kt Yellow Gold', '18kt Yellow Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-art-deco-diamond-bangle-1.webp',
      '/images/selection-2/product-art-deco-diamond-bangle-2.webp',
      '/images/selection-2/product-art-deco-diamond-bangle-3.webp',
    ],
    imagePositions: ['center 40%', 'center 35%'],
    description:
      'Geometric milgrain details and channel-set natural diamonds combine in a sturdy yet delicate oval hinged bangle in 14kt or 18kt yellow gold.',
  },
  {
    slug: 'petite-diamond-chain-bracelet-14k-white-gold',
    title: 'Petite Natural Diamond Chain Bracelet',
    shortTitle: 'Petite Diamond Chain Bracelet',
    price: 720,
    category: 'bracelets',
    metal: '14kt & 18kt White Gold',
    metalOptions: ['14kt White Gold', '18kt White Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-petite-diamond-chain-bracelet-1.webp',
      '/images/selection-2/product-petite-diamond-chain-bracelet-2.webp',
    ],
    imagePositions: ['center 42%', 'center 38%'],
    description:
      'Subtle natural diamond bezels scattered along an airy cable chain in 14kt or 18kt white gold. Perfect for stacking alongside a timepiece or worn as a single whisper of light.',
  },
  {
    slug: 'marquise-accent-tennis-bracelet-14k-gold',
    title: 'Marquise Accent Natural Diamond Tennis Bracelet',
    shortTitle: 'Marquise Tennis Bracelet',
    price: 2980,
    category: 'bracelets',
    metal: '14kt & 18kt Gold',
    metalOptions: ['14kt Gold', '18kt Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-marquise-accent-tennis-bracelet-1.webp',
      '/images/selection-2/product-marquise-accent-tennis-bracelet-2.webp',
    ],
    imagePositions: ['center 45%', 'center 40%'],
    description:
      'Alternating round and marquise natural diamonds create an organic botanical rhythm across the wrist in 14kt or 18kt gold. Finished with handcrafted safety hinge.',
  },
  {
    slug: 'bezel-station-diamond-cuff-14k-yellow-gold',
    title: 'Bezel Station Natural Diamond Cuff',
    shortTitle: 'Diamond Station Cuff',
    price: 1650,
    category: 'bracelets',
    metal: '14kt & 18kt Yellow Gold',
    metalOptions: ['14kt Yellow Gold', '18kt Yellow Gold'],
    stone: 'Natural Diamond',
    images: [
      '/images/selection-2/product-bezel-station-diamond-cuff-1.webp',
      '/images/selection-2/product-bezel-station-diamond-cuff-2.webp',
      '/images/selection-2/product-bezel-station-diamond-cuff-3.webp',
    ],
    imagePositions: ['center 40%', 'center 35%'],
    description:
      'A structured open cuff finished with five brilliant bezel-set natural diamonds in 14kt or 18kt yellow gold for effortless slip-on sophistication.',
  },
];

const rawCategories = [
  {
    slug: 'rings',
    name: 'Rings',
    image: '/images/selection-2/DSC00662.webp',
    heroPosition: 'center 40%',
    note: 'Solitaire, stack & sculptural forms handcrafted in 14kt & 18kt solid gold',
    description: 'Solitaire engagement rings, pavé eternity bands, and sculptural accents set with hand-selected natural diamonds in solid 14kt & 18kt gold.',
  },
  {
    slug: 'earrings',
    name: 'Earrings',
    image: '/images/selection-2/DSC01441.webp',
    heroPosition: 'center 20%',
    note: 'Everyday studs, threaders & drops handcrafted in 14kt & 18kt solid gold',
    description: 'From minimal solitaire diamond studs to cascading threaders, designed for effortless elegance and all-day wear in solid 14kt & 18kt gold.',
  },
  {
    slug: 'necklaces',
    name: 'Necklaces',
    image: '/images/selection-2/DSC00499.webp',
    heroPosition: 'center 22%',
    note: 'Fine chains, stations & chokers handcrafted in 14kt & 18kt solid gold',
    description: 'Natural diamond pendants, stations, and chokers designed to layer seamlessly or make an understated statement in solid 14kt & 18kt gold.',
  },
  {
    slug: 'bracelets',
    name: 'Bracelets',
    image: '/images/selection-2/DSC00826.webp',
    heroPosition: 'center 35%',
    note: 'Natural diamond tennis lines & cuffs handcrafted in 14kt & 18kt solid gold',
    description: 'Classic tennis bracelets, open cuffs, and delicate diamond chains crafted in solid 14kt & 18kt gold to live permanently on your wrist.',
  },
  {
    slug: 'traditional-reimagined',
    name: 'Traditional Reimagined',
    image: '/images/selection-2/DSC00246.webp',
    heroPosition: 'center 20%',
    note: 'Heritage motifs through a modern lens in solid 14kt & 18kt gold',
    description: 'Jewelry inspired by generations of Indian craftsmanship, reimagined with natural diamonds in solid 14kt & 18kt gold for the way you celebrate today.',
  },
  {
    slug: 'everyday-diamonds',
    name: 'Everyday Diamonds',
    image: '/images/selection-2/DSC00681.webp',
    heroPosition: 'center 25%',
    note: 'Fine jewelry to live in, handcrafted in solid 14kt & 18kt gold',
    description: 'Natural diamond pieces designed to become part of your everyday rhythm, crafted with intention in solid 14kt & 18kt gold.',
  },
];

export const products = rawProducts.map((product) => ({
  ...product,
  images: resolveAssetPaths(product.images),
}));

export const categories = rawCategories.map((category) => ({
  ...category,
  image: resolveAssetPath(category.image),
}));

export function getProduct(slug) {
  return products.find((product) => product.slug === slug);
}
