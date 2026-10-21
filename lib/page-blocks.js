// Default block layouts for builder pages. These reproduce the original hand-built pages and
// are used as the fallback whenever a page has no saved blocks.

export const BLOCK_PAGES = {
  home: { route: '/', mainClass: '' },
  about: { route: '/our-story', mainClass: 'about-page' },
  bespoke: { route: '/custom', mainClass: 'custom-page' },
  materialsSourcing: { route: '/craftsmanship', mainClass: 'about-page' },
  appointments: { route: '/book-appointment', mainClass: 'lead-page' },
  bridal: { route: '/bridal', mainClass: 'bridal-page' },
  shop: { route: '/shop', mainClass: 'listing-page' },
};

export const DEFAULT_PAGE_BLOCKS = {
  bridal: [
    { id: 'hero', type: 'heroImage', eyebrow: 'Bridal', heading: 'For the beginning of forever.', body: 'Engagement rings, wedding bands, and bridal jewelry designed with intention — and made to last far beyond the wedding day.', image: '/images/selection-2/bridal-hero.webp', imageAlt: 'Bridal jewelry by byShreen', imagePosition: 'center 20%' },
    { id: 'guidance', type: 'guidanceSplit', eyebrow: 'A considered beginning', heading: 'Not sure where to begin?', body: 'Choosing an engagement ring can feel overwhelming. There are shapes, cuts, carat weights, colors, clarities, settings — and a lot of opinions.', note: 'That’s where we come in.', accent: 'With more than 30 years of family experience in the diamond trade, we’ll help you understand your options and find a diamond that feels right for you, your design, and your budget.', linkLabel: 'BOOK AN APPOINTMENT TODAY →', linkHref: '/book-appointment', image: '/images/selection-2/product-diamond-solitaire-engagement-ring-2.webp', imageAlt: 'Natural diamond solitaire engagement ring worn on the hand', imagePosition: 'center 40%' },
    { id: 'proposals', type: 'proposalsGallery', tone: 'mulberry', eyebrow: 'byShreen Proposals', heading: 'Stories that started here.', linkLabel: 'SEE MORE BYSHREEN PROPOSALS →', linkHref: '/proposals' },
    { id: 'traditional', type: 'editorialFeature', eyebrow: 'Bridal Jewelry', heading: 'Traditional Reimagined', body: 'Jewelry inspired by generations of Indian craftsmanship, designed the way you celebrate today. From timeless polki to modern interpretations of traditional bridal jewelry, discover pieces that honor where you come from while feeling entirely your own.', linkLabel: 'EXPLORE THE COLLECTION →', linkHref: '/collections/traditional-reimagined', secondaryLinkLabel: 'CUSTOM BRIDAL INQUIRY →', secondaryLinkHref: '/custom', image: '/images/selection-2/category-bridal.webp', imageAlt: 'Traditional Reimagined bridal jewelry — Polki choker and handcrafted diamond earrings', imagePosition: 'center 20%' },
  ],

  shop: [
    { id: 'hero', type: 'listingHeader', eyebrow: 'Shop', heading: 'The byShreen Collection', body: 'Natural diamond jewelry designed to become part of your everyday — from understated pieces to modern statements and traditional jewels reimagined.' },
    { id: 'products', type: 'productGrid', eyebrow: 'SHOP BY CATEGORY' },
    { id: 'custom', type: 'customBand', eyebrow: 'Custom Jewelry', heading: 'Your story.\n*Made into jewelry.*', body: 'Some pieces are found. The most meaningful ones are imagined. Whether you’re starting with a Pinterest board, an heirloom, a diamond, or simply an idea in your head, we’ll work together to create something uniquely yours.', linkLabel: 'DESIGN SOMETHING CUSTOM →', linkHref: '/custom', secondaryLinkLabel: 'Book a Consultation →', secondaryLinkHref: '/book-appointment', image: '/images/journey/step-03-design.jpg', imageAlt: 'Custom jewelry design with sketches, 3D CAD modeling, and natural diamonds' },
    { id: 'testimonials', type: 'testimonials', layout: 'collection', eyebrow: 'Every piece starts with a story.', heading: 'Real people. Real moments.', body: 'A few words from the people who wear byShreen.' },
  ],

  home: [
    { id: 'hero', type: 'heroVideo', eyebrow: 'BYSHREEN', heading: 'Jewelry designed\nto be passed down.', body: 'Fine jewelry crafted with natural diamonds — designed to celebrate the moments that matter.', linkLabel: 'SHOP THE COLLECTION →', linkHref: '/shop', secondaryLinkLabel: 'DESIGN SOMETHING CUSTOM', secondaryLinkHref: '/custom', video: '/videos/journey/hero-video.mp4', image: '/images/hero-poster.png' },
    { id: 'intro', type: 'centeredText', eyebrow: 'Welcome to byShreen', heading: 'Fine jewelry with a personal touch.', body: 'At byShreen, jewelry is personal from the very beginning.\n\nBorn from a family deeply rooted in the diamond trade and shaped by Shreen’s background in design, byShreen brings generations of expertise to a new generation of jewelry.\n\nEvery piece is thoughtfully designed, carefully sourced, and made to become part of your story.', linkLabel: 'OUR STORY →', linkHref: '/our-story' },
    {
      id: 'collections', type: 'imageCards', eyebrow: 'The Collections', heading: 'byShreen Collections',
      cards: [
        { id: 'everyday', eyebrow: '01', heading: 'Everyday', body: 'Diamond jewelry designed to become part of your everyday.', linkLabel: 'SHOP EVERYDAY', linkHref: '/shop', image: '/images/selection-2/product-diamond-solitaire-engagement-ring-1.webp', imagePosition: 'center 24%' },
        { id: 'bridal', eyebrow: '02', heading: 'Bridal', body: 'Engagement rings, wedding bands, and personal bridal jewelry.', linkLabel: 'EXPLORE BRIDAL', linkHref: '/bridal', image: '/images/proposals/riya-satyajit.webp', imagePosition: 'center 55%' },
        { id: 'traditional', eyebrow: '03', heading: 'Traditional Reimagined', body: 'Timeless heritage jewelry through a modern lens.', linkLabel: 'EXPLORE TRADITIONAL', linkHref: '/collections/traditional-reimagined', image: '/images/selection-2/category-traditional.webp', imagePosition: 'center 22%' },
        { id: 'custom', eyebrow: '04', heading: 'Custom', body: 'Have something specific in mind? Let’s create it together.', linkLabel: 'START YOUR CUSTOM DESIGN', linkHref: '/custom', image: '/images/selection-2/product-diamond-layered-station-necklace-3.webp', imagePosition: 'center 35%' },
      ],
    },
    {
      id: 'journey', type: 'processVideos', eyebrow: 'The Custom Journey', heading: 'Your story.\n*Made into jewelry.*', body: 'Some pieces are found.\n\nThe most meaningful ones are imagined.\n\nWhether you’re starting with a Pinterest board, an heirloom, a diamond, or simply an idea in your head, we’ll work together to create something uniquely yours.',
      cards: [
        { id: 'story', heading: 'Tell us your story', body: 'Share your inspiration, your style, your budget, and what you’re looking for.', icon: 'M4 6h16M4 12h10M4 18h13', video: '/videos/journey/tell-us-your-story.mp4', image: '/images/journey/tell-us-your-story.png' },
        { id: 'source', heading: 'We source & design', body: 'We help you select the right diamond and develop a design that feels uniquely yours.', icon: 'M4 9h16l-8 12z|M4 9l4-6h8l4 6', video: '/videos/journey/we-source-design.mp4', image: '/images/journey/we-source-design.png' },
        { id: 'life', heading: 'Bring it to life', body: 'Your piece is crafted with care by our trusted artisans.', icon: 'M12 3v4M12 17v4M3 12h4M17 12h4M6.5 6.5l2 2M15.5 15.5l2 2M6.5 17.5l2-2M15.5 8.5l2-2', video: '/videos/journey/bring-it-to-life.mp4', image: '/images/journey/bring-it-to-life.png' },
        { id: 'yours', heading: 'Make it yours', body: 'The finished piece is yours to wear, love, and eventually pass down.', icon: 'circle', video: '/videos/journey/make-it-yours.mp4', image: '/images/journey/make-it-yours.png' },
      ],
      cta: { eyebrow: 'BEGIN TODAY', heading: 'Ready to tell your story?', body: 'Tell us what’s on your mind. We’ll take it from there.', linkLabel: 'DESIGN SOMETHING CUSTOM →', linkHref: '/custom' },
    },
    { id: 'founder', type: 'letter', eyebrow: 'A NOTE FROM SHREEN', body: 'During COVID-19, my family and I began designing jewelry for my sister’s and my future weddings — dreaming up pieces we would one day wear and pass down.\n\nBefore we knew it, I was designing jewelry for our friends and family, too.\n\nWhat began at home, surrounded by the people I love, eventually became byShreen.\n\nI’ve always believed jewelry is so much more than something beautiful. It holds memories, celebrates milestones, and becomes part of your story.\n\nWhether you’re looking for an everyday diamond, celebrating a milestone, or creating something you hope to pass down, I want your jewelry to feel personal, meaningful, and completely yours.', note: 'With love,', heading: 'Shreen', linkLabel: 'MEET SHREEN →', linkHref: '/our-story', image: '/images/selection-2/founder-portrait.webp', imageAlt: 'Shreen, founder of byShreen' },
    { id: 'testimonials', type: 'testimonials', eyebrow: 'Every piece starts with a story.', heading: 'Real people. Real moments.', body: 'A few words from the people who wear byShreen.' },
    { id: 'featured', type: 'featuredProducts', eyebrow: 'The Current Edit', heading: 'Jewelry to live in.', body: 'Explore natural diamond jewelry designed for everyday moments, celebrations, and everything in between.', count: 8, linkLabel: 'SHOP ALL', linkHref: '/shop' },
    {
      id: 'values', type: 'valuesBand', eyebrow: 'What makes byShreen different', heading: 'Three things we never compromise on.', linkLabel: 'WHAT MAKES BYSHREEN DIFFERENT →', linkHref: '/craftsmanship',
      cards: [
        { id: 'natural', eyebrow: '01', heading: 'Natural Diamonds', body: 'We work exclusively with natural diamonds, thoughtfully selected for beauty, brilliance, and quality.' },
        { id: 'expertise', eyebrow: '02', heading: 'Generations of Expertise', body: 'Our family has spent more than 30 years in the diamond trade — expertise that informs every stone we source and every piece we create.' },
        { id: 'you', eyebrow: '03', heading: 'Made for You', body: 'Whether you’re choosing from the collection or creating something custom, every piece is designed with the person wearing it in mind.' },
      ],
    },
    { id: 'finalCta', type: 'cta', heading: 'Let’s create something meaningful.', body: 'Whether you know exactly what you want or you’re starting with an idea, we’re here to help.', linkLabel: 'Book an Appointment', linkHref: '/book-appointment' },
    { id: 'instagram', type: 'instagram' },
  ],

  about: [
    { id: 'hero', type: 'pageHeader', layout: 'story', eyebrow: 'Our Story', heading: 'Decades of diamond expertise. A new generation of jewelry design.', body: 'A fine jewelry house born from thirty years of loose diamond mastery and a deeply personal approach to modern heirlooms.' },
    {
      id: 'chapter1', type: 'storyChapter', tone: 'paper', layout: 'image-right', eyebrow: '01 · The Heritage', heading: 'The Family Legacy', note: 'A family built around diamonds.',
      body: 'For over 30 years, Shreen’s father has built a career in the loose diamond trade, growing a family business rooted in diamond expertise, trusted relationships, and a deep appreciation for quality. Today, the family business supplies loose diamonds to some of the leading retail jewelry stores.\n\nShreen grew up surrounded by diamonds. From an early age, she was fascinated not only by the stones themselves, but by what happens when a diamond becomes jewelry — the design, the craftsmanship, and the thought that goes into creating something that can hold meaning for generations.\n\nAs a second-generation jeweler, she wanted to bring that family knowledge into something of her own.',
      cards: [
        { id: 'photo1998', image: '/images/story/IMG_9995.jpg', imageAlt: 'Young Shreen with her father in 1998 during early diamond trade years', imagePosition: 'center 20%', shape: 'landscape' },
        { id: 'photoDance', image: '/images/story/family-roots.jpg', imageAlt: 'Shreen dancing with her father at family celebration', imagePosition: 'center 25%', shape: 'landscape' },
      ],
    },
    { id: 'quote', type: 'quoteBand', body: '“Every diamond carries a heritage. For byShreen, it is thirty years of family knowledge crafted into pieces you never have to take off.”', note: 'byShreen Fine Jewelry · Natural Diamonds' },
    {
      id: 'chapter2', type: 'storyChapter', tone: 'olive', layout: 'image-left', eyebrow: '02 · Creative Perspective', heading: 'From a family tradition to something of her own.',
      body: 'Shreen’s background has always been rooted in creativity. She studied at Parsons School of Design and spent the past 10 years working in the creative industry.\n\nJewelry began as a creative outlet. She started designing pieces for herself, imagining something and then bringing it to life. Before long, she began creating pieces for friends and family, too.\n\nWhat started as something she loved doing for the people closest to her slowly became something more.\n\nShe saw an opportunity to bring together two parts of her world: her family’s decades of diamond expertise and her own perspective as a designer.',
      accent: 'That became byShreen.',
      cards: [
        { id: 'photoFamily', image: '/images/story/IMG_1640.jpg', imageAlt: 'Shreen celebrating milestone with father, mother, and sister', imagePosition: 'center 25%', shape: 'landscape' },
        { id: 'photoShreen', image: '/images/selection-2/founder-portrait.webp', imageAlt: 'Shreen, founder and designer of byShreen', imagePosition: 'center 20%', shape: 'portrait' },
      ],
    },
    {
      id: 'chapter3', type: 'storyChapter', tone: 'paper', layout: 'image-right', eyebrow: '03 · A Personal Approach', heading: 'A family business, made personal.',
      body: 'At byShreen, jewelry is personal from the very beginning.\n\nAs a small, family-owned business, the brand believes the best jewelry experiences start with a conversation. Understanding a client’s story, getting to know their style, and helping them create something that feels entirely their own is at the heart of what Shreen does.\n\nEvery client is treated as part of the byShreen family. The goal is to be more than a jeweler for one special occasion; byShreen wants to be the jeweler clients return to for every chapter of their lives.',
      cards: [
        { id: 'photoTogether', image: '/images/story/IMG_8345.jpg', imageAlt: 'The Shreen family: father, mother, sister, and Shreen together wearing jewelry', imagePosition: 'center 20%', shape: 'landscape' },
      ],
    },
    { id: 'finalCta', type: 'cta', heading: 'A personal jeweler for every chapter.', body: 'From your first natural diamond to the pieces you pass down, Shreen is here to create with you.', linkLabel: 'Book an Appointment', linkHref: '/book-appointment', secondaryLinkLabel: 'Custom Inquiries', secondaryLinkHref: '/custom' },
  ],

  bespoke: [
    { id: 'hero', type: 'heroImage', eyebrow: 'Custom Jewelry', heading: 'Made for your story.', body: 'Some pieces are found. The most meaningful ones are imagined.', image: '/images/custom/custom-hero-zoom.jpg', imageAlt: 'Bespoke natural diamond engagement ring and jewelry close-up', imagePosition: 'center 45%' },
    {
      id: 'process', type: 'processTimeline', eyebrow: 'THE CUSTOM PROCESS', heading: 'A journey, not a form.', body: 'Every custom piece begins as a story of inspiration and blossoms through our signature five-stage diamond journey.',
      accent: 'Every custom piece is different, so the process is tailored to you and your design.', linkLabel: 'BOOK A CUSTOM CONSULTATION', linkHref: '/book-appointment',
      cards: [
        { id: 'idea', eyebrow: 'STAGE I', heading: 'The Idea', body: 'Maybe it’s a sketch. A Pinterest board. An heirloom. Or simply something you’ve been imagining.', icon: '/icons/process-vision.svg' },
        { id: 'sourcing', eyebrow: 'STAGE II', heading: 'Diamond Sourcing', body: 'We source natural diamonds through our family’s trusted network, ensuring exceptional quality and value.', icon: '/icons/process-source.svg' },
        { id: 'design', eyebrow: 'STAGE III', heading: 'Design', body: 'Your ideas become sketches, details, proportions, and eventually a piece you can see before it’s made.', icon: '/icons/process-review.svg' },
        { id: 'craft', eyebrow: 'STAGE IV', heading: 'Craft', body: 'Our artisans bring the design to life with generations of jewelry-making expertise.', icon: '/icons/process-craft.svg' },
        { id: 'reveal', eyebrow: 'STAGE V', heading: 'The Reveal', body: 'The moment your idea becomes something you can finally hold — and wear.', icon: '/icons/lotus-mulberry.svg' },
      ],
    },
    { id: 'why', type: 'splitText', eyebrow: 'WHY BYSHREEN', heading: 'A jeweler who knows both sides of the diamond.', body: 'Shreen brings together two worlds: a family built around diamonds and a career rooted in design.\n\nHer family’s decades of experience give her a deep understanding of the stone. Her design background brings a fresh perspective to what it can become.', linkLabel: 'FULL STORY →', linkHref: '/our-story' },
    { id: 'proposals', type: 'proposalsGallery', tone: 'olive', eyebrow: 'Real Stories', heading: 'Custom pieces. Real stories.', linkLabel: 'SEE MORE BYSHREEN PROPOSALS →', linkHref: '/proposals' },
    { id: 'form', type: 'inquiryForm', eyebrow: 'BEGIN TODAY', heading: 'Ready to make something yours?', body: 'Tell us what’s on your mind. We’ll take it from there.' },
  ],

  materialsSourcing: [
    { id: 'hero', type: 'pageHeader', layout: 'centered', eyebrow: 'Craftsmanship', heading: 'Quality you can see. Craftsmanship you can feel.' },
    {
      id: 'journey', type: 'stepsList', eyebrow: 'From stone to story', heading: 'Generations of Craftsmanship', body: 'A byShreen piece brings together generations of diamond expertise, skilled craftsmanship, and thoughtful design.',
      cards: [
        { id: 'diamond', eyebrow: '01', heading: 'Natural Diamond', body: 'We believe in the beauty, rarity, and legacy of natural diamonds. Our journey begins with diamonds sourced through our family’s diamond business. Our family has 30+ years of industry expertise.', image: '/images/journey/step-02-sourcing.jpg', imageAlt: 'Natural diamonds sorted with precision Swiss tweezers over jewelers gem bench' },
        { id: 'surat', eyebrow: '02', heading: 'Surat, India', body: 'Our diamonds are cut and polished in Surat, India, through our family’s manufacturing facility. This connection gives us a close understanding of the stones from sourcing through production.', image: '/images/craftsmanship/step-02-surat.jpg', imageAlt: 'Master diamond cutter faceting diamonds on scaife polishing wheel in Surat manufacturing facility' },
        { id: 'craft', eyebrow: '03', heading: 'Generations of Craft', body: 'Our jewelry is brought to life by skilled artisans in India whose knowledge and craftsmanship have been passed down through generations.', image: '/images/journey/step-04-craft.jpg', imageAlt: 'Master jeweler hands setting stones and polishing gold at the traditional workshop bench' },
        { id: 'perspective', eyebrow: '04', heading: 'The byShreen Perspective', body: 'Shreen brings together her family’s diamond expertise with her background in design to create jewelry that feels modern, personal, and made to last.', image: '/images/craftsmanship/step-04-perspective.jpg', imageAlt: 'Shreen in her jewelry design studio inspecting diamond brilliance with hand-drawn ring sketches' },
        { id: 'story', eyebrow: '05', heading: 'Made for Your Story', body: 'The result is a piece designed to be worn, loved, and carried forward for years to come.', image: '/images/craftsmanship/step-05-story.jpg', imageAlt: 'Elegant hand wearing finished custom natural diamond ring and bracelet on ivory silk' },
      ],
    },
    {
      id: 'standards', type: 'standardsBand', eyebrow: 'thoughtfully selected', heading: 'Our Natural Diamond Standards', body: 'Every diamond has its own character. We look beyond a checklist to select stones that balance beauty, brilliance, and overall quality.',
      accent: 'For custom jewelry, diamonds are selected in collaboration with the client based on design, preferences, and budget.',
      cards: [
        { id: 'color', heading: 'E/F Color', body: 'Among the whitest, rarest grades on the color scale.' },
        { id: 'clarity', heading: 'VS/VVS Clarity', body: 'Eye-clean stones, free of visible inclusions.' },
        { id: 'cut', heading: 'Excellent Cut', body: 'Cut for maximum brilliance and fire.' },
      ],
    },
    { id: 'gold', type: 'splitImage', eyebrow: 'Precious Metals', heading: '14kt & 18kt Gold', body: 'We create our jewelry in 14kt and 18kt gold, carefully selected for both beauty and durability. Our pieces are designed to be worn, enjoyed, and lived in — whether they’re part of your everyday routine or saved for life’s most meaningful moments.', image: '/images/selection-2/diamond-detail.webp', imageAlt: 'Three women wearing byShreen 14kt and 18kt gold diamond jewelry' },
    { id: 'madeToLast', type: 'closingBand', eyebrow: 'Made to Last', body: 'We don’t believe in creating jewelry for a moment. We believe in creating jewelry for a lifetime. Every byShreen piece is handled with care and made with longevity in mind. And because we are a small family business, our relationship with you doesn’t end when your jewelry leaves our hands. If your piece ever needs an adjustment, repair, or a little extra care, we’re here to help.', accent: 'Your jewelry becomes part of your story — and taking care of it is part of ours.' },
  ],

  appointments: [
    { id: 'hero', type: 'pageHeader', layout: 'left', eyebrow: 'Appointments', heading: 'Let’s talk jewelry.', body: 'Whether you’re searching for an engagement ring, dreaming up a custom piece, or simply want to see the collection in person, I’d love to meet you.' },
    { id: 'booking', type: 'appointmentForm', body: 'All appointments take place at the byShreen NYC office or virtually via video consultation.' },
    { id: 'testimonials', type: 'testimonials', tone: 'mulberry', eyebrow: 'Stories that started here', heading: 'Client stories. Real moments.', body: 'From the first conversation to the piece they take home.' },
    { id: 'proposals', type: 'proposalsGallery', tone: 'olive', eyebrow: 'byShreen Proposals', heading: 'Stories that started here.', body: 'From the first consultation to the moment you say yes.', linkLabel: 'SEE MORE BYSHREEN PROPOSALS →', linkHref: '/proposals' },
  ],
};
