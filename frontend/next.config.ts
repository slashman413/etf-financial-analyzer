import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  rewrites: async () => [
    { source: "/api/:path*", destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*` },
  ],
};

export default nextConfig;
