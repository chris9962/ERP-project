import type { NextConfig } from "next";

const brandId = process.env.NEXT_PUBLIC_BRAND || "legifood";
const faviconMap: Record<string, string> = {
  legifood: "/brands/legifood/logo.jpeg",
  lienhung: "/brands/lienhung/logo.svg",
};

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/favicon.ico",
        destination: faviconMap[brandId] || faviconMap.legifood,
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
