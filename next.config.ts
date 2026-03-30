import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "caryvn.com" }],
        destination: "https://www.caryvn.com/:path*",
        permanent: true, // 301 redirect
      },
    ];
  },
};

export default nextConfig;
