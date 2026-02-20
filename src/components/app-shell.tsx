"use client";

import Link from "next/link";
import Image from "next/image";
import { DemoBanner } from "@/components/demo-banner";
import { ThemeToggle } from "@/components/theme-toggle";
import { APP_VERSION } from "@/lib/version";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DemoBanner />
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 font-semibold text-foreground tracking-tight hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
        >
          <Image
            src="/brand/logo.png"
            width={32}
            height={32}
            alt="Homelab Control Center"
            className="shrink-0 size-8 object-contain dark:opacity-95"
            priority={true}
            unoptimized
          />
          <span>Homelab Control Center</span>
        </Link>
        <ThemeToggle />
      </header>
      <div className="min-h-screen flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="py-4 px-6 border-t border-border text-center text-sm text-muted-foreground">
          <Link href="/setup" className="hover:text-foreground underline-offset-4 hover:underline">
            Setup
          </Link>
          {" · "}
          {"Homelab Control Center v" + APP_VERSION}
        </footer>
      </div>
    </>
  );
}
