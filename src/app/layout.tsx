import type { Metadata } from "next";
import { ThemeProvider } from "@/components/theme-provider";
import { ToasterWithTheme } from "@/components/toaster-with-theme";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Homelab Control Center",
  description: "Docker containers via Portainer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
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
