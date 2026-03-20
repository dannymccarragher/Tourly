import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "127.0.0.1",
    '10.0.0.130'
  ],
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