import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // sharp 带原生二进制，交给 Node 直接 require，不要打进 bundle
  serverExternalPackages: ["sharp"],
};

export default nextConfig;
