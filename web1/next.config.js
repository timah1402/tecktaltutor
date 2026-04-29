/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  devIndicators: {
    position: "bottom-right",
  },
  turbopack: {
    root: __dirname,
  },
};

module.exports = nextConfig;
