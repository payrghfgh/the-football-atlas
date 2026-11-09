/**
 * The site is a fully static export: `next build` writes `out/`, which is what
 * GitHub Pages serves. `NEXT_PUBLIC_BASE_PATH` is set to "/<repo-name>" when
 * deploying to a project page (https://<user>.github.io/<repo>/).
 *
 * @type {import('next').NextConfig}
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  reactStrictMode: true,
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
