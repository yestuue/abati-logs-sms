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
      // Force HTTPS on canonical host (uses proxy header in production).
      {
        source: "/:path*",
        has: [
          { type: "host", value: "abatidigital.com" },
          { type: "header", key: "x-forwarded-proto", value: "http" },
        ],
        destination: "https://abatidigital.com/:path*",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
