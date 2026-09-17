import type { MetadataRoute } from "next";

// Makes the app installable. A manifest carries a single theme_color, so this
// is the light one; the per-scheme browser UI colour (light #ffffff / dark
// #0a0a0a) comes from the root layout's `viewport.themeColor`.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Google Photos Clone",
    short_name: "Photos",
    description: "Store, organize, and edit your memories",
    start_url: "/photos",
    scope: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#ffffff",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
