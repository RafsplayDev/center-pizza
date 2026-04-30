import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'feamwyzizrmftmtiztca.supabase.co',
      },
    ],
  },
};

export default nextConfig;
