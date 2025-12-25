import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cdn.prod.website-files.com',
      },
      {
        protocol: 'https',
        hostname: 'assets.itsoffbrand.io',
      },
      {
        protocol: 'https',
        hostname: 'lando.itsoffbrand.io',
      },
    ],
  },
};

export default nextConfig;
