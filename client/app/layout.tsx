import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Raleway } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/components/provider/theme-provider";
import QueryProvider from "@/components/provider/query-provider";
import { Toaster } from "@/components/ui/sonner";
const raleway = Raleway({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Google Photos Clone",
    // Route segments set just their own name ("Photos", "Trash", ...).
    template: "%s — Google Photos Clone",
  },
  description: "Store, organize, and edit your memories - upload, favorite, share, and AI-edit your photos.",
  applicationName: "Google Photos Clone",
  appleWebApp: {
    capable: true,
    title: "Photos",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={cn("h-full", "antialiased", geistSans.variable, geistMono.variable, "font-sans", raleway.variable)}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
      <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              {children}
            </QueryProvider>
            {/* Lifted 96px off the bottom so toasts clear the 56px upload FAB
                (bottom-6), plus the upload manager panel's height while it's
                open (it sits right there at bottom-24) - the panel publishes
                that as --upload-panel-offset. */}
            <Toaster
              position="bottom-right"
              richColors
              offset={{ bottom: "calc(96px + var(--upload-panel-offset, 0px))", right: 24 }}
              mobileOffset={{ bottom: "calc(96px + var(--upload-panel-offset, 0px))" }}
            />
          </ThemeProvider>
          </body>
    </html>
  );
}
