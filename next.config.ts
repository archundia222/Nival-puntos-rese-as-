const nextConfig = {
  experimental: {
    // Use the TypeScript compiler API for build checks. The CLI path returns
    // empty output in the current Node runtime when Next requests --showConfig.
    useTypeScriptCli: false,
  },
};

export default nextConfig;
