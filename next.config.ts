import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // تفعيل React Compiler - ميزة جديدة في Next.js 16 للأداء الأفضل
  reactCompiler: true,

  // تحسينات الأداء الجديدة في Next.js 16
  experimental: {
    // تحسينات في البناء والأداء
    optimizePackageImports: ['lucide-react'],
  },
};

export default nextConfig;
