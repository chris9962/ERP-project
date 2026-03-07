import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: "/logo/logo.jpeg",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
