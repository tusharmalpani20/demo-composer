/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/tusharmalpani20/ossie/main/docs/assets/alpha/**",
      },
    ],
  },
};

export default nextConfig;
