/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "raw.githubusercontent.com",
        pathname: "/tusharmalpani20/demo-composer/main/docs/assets/alpha/**",
      },
    ],
  },
};

export default nextConfig;
