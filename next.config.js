const nextConfig = {
  serverExternalPackages: ['better-sqlite3', 'playwright'],
  typescript: { ignoreBuildErrors: true },
};

module.exports = nextConfig;