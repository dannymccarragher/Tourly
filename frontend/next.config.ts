import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["http://172.20.240.1:3000", "http://localhost:3000"],
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