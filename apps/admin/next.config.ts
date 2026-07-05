const nextConfig = {
  transpilePackages: ["@manzil/shared"],
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: false }
};

export default nextConfig;
