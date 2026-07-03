import type { NextConfig } from "next";

// Supabase Storageのホストのみ next/image の最適化対象として許可する。
// OGP由来の任意外部ドメイン画像は unoptimized のまま配信する
// （remotePatternsに未知ドメインを無制限に許可するのはSSRF類似のリスクがあるため）。
const supabaseHostname = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return undefined;
  }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
};

export default nextConfig;
