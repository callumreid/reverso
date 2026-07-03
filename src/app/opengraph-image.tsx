import { ImageResponse } from "next/og";

export const alt = "Reverso — the backwards talking party game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const BAR_HEIGHTS = [
  28, 52, 90, 140, 96, 170, 210, 150, 240, 190, 130, 220, 160, 100, 180, 120,
  70, 110, 60, 36,
];

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at 30% 20%, #2a0a4f 0%, #0b0120 55%, #04010b 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            height: 240,
            marginBottom: 40,
          }}
        >
          {BAR_HEIGHTS.map((height, index) => (
            <div
              key={index}
              style={{
                width: 18,
                height,
                borderRadius: 9,
                background: index % 2 === 0 ? "#ff4fcb" : "#5cf2ff",
                opacity: 0.55 + (height / 240) * 0.45,
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 128,
            fontWeight: 700,
            letterSpacing: 6,
            color: "#f9f6ff",
          }}
        >
          reverso
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 18,
            fontSize: 38,
            color: "#b0a6d9",
            letterSpacing: 4,
          }}
        >
          the backwards talking party game
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 34,
            fontSize: 30,
            color: "#5cf2ff",
            letterSpacing: 8,
          }}
        >
          reverso.lol
        </div>
      </div>
    ),
    size,
  );
}
