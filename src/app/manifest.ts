import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "算了 · Suanle",
    short_name: "算了",
    description: "算一算，然后，算了。",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#faf9f6",
    theme_color: "#faf9f6",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
