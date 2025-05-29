/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
  webpack: (config) => {
    config.resolve.fallback = { fs: false, path: false };
    return config;
  },
  allowedDevOrigins: [
    'http://localhost:3000',
    'http://0.0.0.0:3000',
    'http://100.103.118.96:3000'
  ],
}

module.exports = nextConfig 