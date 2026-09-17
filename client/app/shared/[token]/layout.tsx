import type { Metadata } from "next";

// The page is a client component, so its tab title is set from this segment
// layout (the root layout's title template adds " — Google Photos Clone").
export const metadata: Metadata = {
  title: "Shared Photo",
};

export default function SharedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
