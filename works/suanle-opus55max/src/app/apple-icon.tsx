import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#FAF9F6" }}>
        <svg width="180" height="180" viewBox="0 0 1024 1024">
          <rect x="248" y="248" width="216" height="74" rx="8" fill="#2B2B2B" />
          <rect x="248" y="356" width="216" height="74" rx="8" fill="#2B2B2B" />
          <rect x="248" y="464" width="216" height="74" rx="8" fill="#2B2B2B" />
          <rect x="560" y="248" width="216" height="74" rx="8" fill="#2B2B2B" />
          <rect x="560" y="356" width="216" height="74" rx="8" fill="#2B2B2B" />
          <rect x="560" y="464" width="216" height="74" rx="8" fill="#2B2B2B" />
          <path d="M 264 600 C 264 776, 760 776, 760 600" fill="none" stroke="#2B2B2B" strokeWidth="64" strokeLinecap="round" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
