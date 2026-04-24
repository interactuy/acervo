import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "mnav.gub.uy",
        port: "",
        pathname: "/img.php",
      },
    ],
  },
};

export default nextConfig;
