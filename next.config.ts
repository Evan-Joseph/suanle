import type { NextConfig } from "next";

const isStaticExport = process.env.NEXT_STATIC_EXPORT === "1";

const nextConfig: NextConfig = isStaticExport
  ? {
      output: "export",
      images: { unoptimized: true },
      poweredByHeader: false,
    }
  : {
      output: "standalone",
      poweredByHeader: false,
      async headers() {
        return [
          {
            source: "/:path*",
            headers: [
              { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
              { key: "X-Content-Type-Options", value: "nosniff" },
              { key: "X-Frame-Options", value: "SAMEORIGIN" },
              { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
              { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
            ],
          },
        ];
      },
    };

export default nextConfig;
