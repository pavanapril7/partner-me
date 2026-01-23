import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Simple allow-list by host
    domains: ['www.theshopindia.com', 'content.jdmagicbox.com'],
    // Add remote patterns for S3 and other cloud storage
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.amazonaws.com', // for S3
      },
    ],
    // Image optimization settings for better caching
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year for immutable images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Increase body size limit for image uploads
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },
};

export default nextConfig;
