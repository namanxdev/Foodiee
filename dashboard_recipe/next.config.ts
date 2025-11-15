import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "cdn.coverr.co",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "oldowan-recipe-images-2025.s3.ap-south-1.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "ec2-3-110-140-242.ap-south-1.compute.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
