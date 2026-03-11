/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || "https://sales-insight-automator-lz9k.onrender.com",
  },
};

module.exports = nextConfig;
