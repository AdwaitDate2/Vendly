/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  devIndicators: false,
  allowedDevOrigins: ['127.0.0.1'],
  transpilePackages: ['@kenmark/storage', '@kenmark/storage-contracts'],
  turbopack: {
    root: process.cwd(),
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 2678400,
  },
  async redirects() {
    return [
      { source: '/about', destination: '/our-story', permanent: true },
      { source: '/appointments', destination: '/book-appointment', permanent: true },
      { source: '/contact', destination: '/book-appointment', permanent: true },
      // Shipping and returns, and repairs and care, are now one page each.
      { source: '/shipping', destination: '/shipping-returns', permanent: true },
      { source: '/returns', destination: '/shipping-returns', permanent: true },
      { source: '/repairs-and-warranty', destination: '/repairs-care', permanent: true },
      { source: '/care', destination: '/repairs-care', permanent: true },
      { source: '/faqs', destination: '/faq', permanent: true },
    ];
  },
};

export default nextConfig;
