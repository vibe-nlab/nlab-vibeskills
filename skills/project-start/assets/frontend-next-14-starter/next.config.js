/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async rewrites() {
    return [
      {
        source: "/:filename(\\d+)\\.mp4",
        destination: "/videos/:filename.mp4",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/videos/:path*",
        headers: [
          {
            key: "Content-Type",
            value: "video/mp4",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  // ВНИМАНИЕ: всё, что попадает в `env`, Next.js инлайнит в браузерный
  // бандл. Секретам (паролям SMTP, ключам API) здесь не место — читай их
  // на сервере через process.env напрямую, в getServerSideProps или в
  // route handler. В бандл выносим только заведомо публичное, и только
  // из окружения — без захардкоженных адресов.
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
};

module.exports = nextConfig;
