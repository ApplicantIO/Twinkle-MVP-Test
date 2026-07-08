import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Common external image hosts used in the app (Firebase / Google user photos, cloud storage, CDNs)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'yt3.ggpht.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/fan-zone',
        destination: '/fanzone',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
