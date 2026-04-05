/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  async redirects() {
    return [
      {
        source: "/user/login",
        destination: "/sign-in",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
