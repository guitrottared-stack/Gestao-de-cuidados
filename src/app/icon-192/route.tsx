import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f766e",
        }}
      >
        <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
          <path d="M3 12h4l2 7 4-14 2 7h6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
