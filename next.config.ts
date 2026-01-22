import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Simple allow-list by host
    domains: ['www.theshopindia.com', 'content.jdmagicbox.com'],
  },
};

export default nextConfig;
