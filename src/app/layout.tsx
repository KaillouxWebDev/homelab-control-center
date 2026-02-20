import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { ToasterWithTheme } from "@/components/toaster-with-theme";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Homelab Control Center",
  description: "Docker containers via Portainer",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ]  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png" />
        <link rel="icon" href="/favicon-16x16.png" sizes="16x16" type="image/png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180" type="image/png" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-background kiosk-mode">
        <ThemeProvider>
          <AppShell>
            {children}
          </AppShell>
          <ToasterWithTheme />
        </ThemeProvider>
      </body>
    </html>
  );
}
