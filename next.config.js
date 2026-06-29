/** @type {import('next').NextConfig} */
const nextConfig = {
  // Faster JS minification with SWC
  swcMinify: true,

  // Optimize images — serve WebP/AVIF, lazy-load, right-size
  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 604800, // Cache optimised images for 7 days
    deviceSizes: [320, 480, 640, 750, 828, 1080, 1200],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
  },

  // Compress responses with gzip / brotli
  compress: true,

  // Power cache revalidation
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // Keep pages in memory for 1 hour
    pagesBufferLength: 10,
  },

  experimental: {
    optimizeCss: true, // Inline critical CSS — eliminates render-blocking CSS
    scrollRestoration: true,
    serverComponentsExternalPackages: ['mongoose', 'mongodb'],
    optimisticClientCache: true,
    // Turbopack for faster local dev builds
  },

  // Aggressive HTTP caching headers for static assets
  async headers() {
    return [
      {
        // Long-lived cache for all static assets (images, fonts, JS, CSS)
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache icons and logos at the root level aggressively
        source: '/:file(fliptrip_favicon.png|fliptrip_logo.png|favicon.ico|favicon.png|manifest.json)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/thumbnails/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/media/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
      {
        source: '/api/menus',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=600' },
        ],
      },
      {
        source: '/api/games',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=30, stale-while-revalidate=300' },
        ],
      },
      {
        source: '/api/games/:slug',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=600' },
        ],
      },
    ];
  },

  webpack: (config, { isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'phaser3spectorjs': require.resolve('./lib/stubs/phaser3spectorjs.js'),
    };

    // Split vendor chunks for better caching
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          ...config.optimization?.splitChunks,
          cacheGroups: {
            ...config.optimization?.splitChunks?.cacheGroups,
            phaser: {
              test: /[\/]node_modules[\/]phaser[\/]/,
              name: 'phaser-vendor',
              chunks: 'async',
              priority: 30,
            },
            mongoose: {
              test: /[\/]node_modules[\/](mongoose|mongodb)[\/]/,
              name: 'db-vendor',
              chunks: 'all',
              priority: 20,
            },
          },
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;
