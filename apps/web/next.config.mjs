/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@cadence/tokens", "@cadence/types", "@cadence/db"],
};
export default nextConfig;
