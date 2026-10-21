import type { NextConfig } from "next";

// 정적 사이트로 내보내서(out/) 서버 없이 무료 호스팅(GitHub Pages, Cloudflare Pages 등)에 올린다.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
