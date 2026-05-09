/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // PWA Support
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  },
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: '*.openstreetmap.org',
      },
    ],
  },
  // Environment variables exposed to client
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
    NEXT_PUBLIC_MAP_TILES_URL: process.env.NEXT_PUBLIC_MAP_TILES_URL || 'https://tile.openstreetmap.org',
  },
};

module.exports = nextConfig;