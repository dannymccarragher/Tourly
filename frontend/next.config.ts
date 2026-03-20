import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["*"],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://chartify-786g.onrender.com/:path*'
      }
    ];
  }
};

export default nextConfig;