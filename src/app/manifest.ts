import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Reverso — the backwards talking party game",
    short_name: "Reverso",
    description:
      "Record a phrase, hear it backwards, and dare a friend to mimic the gibberish. Flip their attempt forward and score how close they got.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#04010b",
    theme_color: "#04010b",
    categories: ["games", "entertainment"],
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/apple-icon",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}
