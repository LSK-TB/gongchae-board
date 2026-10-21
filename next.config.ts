import type { NextConfig } from "next";

// GitHub Pages는 https://<계정>.github.io/<저장소>/ 아래에서 열리므로 그 경로를 basePath로 준다.
// 로컬 개발이나 자체 도메인에서는 비워 둔다.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

// 정적 사이트로 내보내서(out/) 서버 없이 무료 호스팅(GitHub Pages 등)에 올린다.
const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
