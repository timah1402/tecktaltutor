/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    position: "bottom-right",
  },
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
