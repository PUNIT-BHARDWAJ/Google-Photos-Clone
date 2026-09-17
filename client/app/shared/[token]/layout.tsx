import type { Metadata } from "next";

// The page is a client component, so its tab title is set from this segment
// layout (the root layout's title template adds " — Google Photos Clone").
export const metadata: Metadata = {
  title: "Shared Photo",
};

// Public links always render dark, regardless of the visitor's theme: photos
// read best on a dark canvas. The wrapper scopes the dark tokens to this page
// (html:has([data-fixed-theme]) in globals.css paints the canvas around it).
export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-fixed-theme="dark" className="dark bg-background text-foreground [color-scheme:dark]">
      {children}
    </div>
  );
}
