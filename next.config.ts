import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Common external image hosts used in the app (Firebase / Google user photos, cloud storage, CDNs)
    domains: [
      "firebasestorage.googleapis.com",
      "storage.googleapis.com",
      "lh3.googleusercontent.com",
      "yt3.ggpht.com",
      "images.unsplash.com",
      "res.cloudinary.com",
    ],
  },
  reactStrictMode: true,
};

export default nextConfig;
