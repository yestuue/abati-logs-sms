/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Canonical host: redirect www -> non-www.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.abatidigital.com" }],
        destination: "https://abatidigital.com/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
