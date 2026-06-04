const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  distDir: process.env.NEXT_DIST_DIR || '.next',
  output: process.env.NEXT_OUTPUT_MODE,
  productionBrowserSourceMaps: false,
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../'),
    // Habilita instrumentation.ts (worker de flush do buffer do wizard/WhatsApp).
    instrumentationHook: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: { unoptimized: true },
  async redirects() {
    return [
      {
        source: '/bitdefender-gravityzone-business-security',
        destination: '/p/bitdefender-business-security',
        permanent: true,
      },
      {
        source: '/bitdefender-gravityzone-business-security-premium',
        destination: '/p/bitdefender-business-security-premium',
        permanent: true,
      },
      {
        source: '/bitdefender-gravityzone-business-security-enterprise',
        destination: '/p/bitdefender-business-security-enterprise',
        permanent: true,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.filename = 'static/chunks/[name]-[contenthash:8].js';
      config.output.chunkFilename = 'static/chunks/[contenthash:16].js';
    }
    return config;
  },
};

module.exports = nextConfig;
