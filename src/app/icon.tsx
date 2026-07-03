import { ImageResponse } from "next/og";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 20%, #2a0a4f 0%, #0b0120 60%, #04010b 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 300,
              fontWeight: 700,
              color: "#5cf2ff",
              transform: "scaleX(-1)",
              marginRight: -30,
              opacity: 0.85,
            }}
          >
            r
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 300,
              fontWeight: 700,
              color: "#ff4fcb",
              marginLeft: -30,
            }}
          >
            r
          </div>
        </div>
      </div>
    ),
    size,
  );
}
