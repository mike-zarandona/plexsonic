/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.plex.direct",
        pathname: "/**",
      },
    ],
  },
};

module.exports = nextConfig;
