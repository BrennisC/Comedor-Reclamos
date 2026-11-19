import type { NextConfig } from 'next';
import { initOpenNextCloudflareForDev } from '@opennextjs/cloudflare';

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  cacheComponents: true,
  serverExternalPackages: ['@prisma/client', 'prisma'],
  allowedDevOrigins: [
    '*.run.app',
    'ais-dev-wwabmd7lgvompa5ef7ftml-423124329931.us-east1.run.app',
    'ais-pre-wwabmd7lgvompa5ef7ftml-423124329931.us-east1.run.app',
  ],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
