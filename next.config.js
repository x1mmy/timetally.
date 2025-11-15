/** @type {import("next").NextConfig} */
const config = {
  eslint: {
    // Only run ESLint on these directories during production builds
    dirs: ['src'],
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },
};

export default config;
