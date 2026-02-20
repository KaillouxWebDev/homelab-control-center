"use client";

import { useTheme } from "next-themes";
import { Toaster } from "sonner";

export function ToasterWithTheme() {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  return (
    <Toaster
      theme={theme}
      toastOptions={{
        classNames: {
          toast: "bg-card border border-border backdrop-blur-xl",
          success: "border-success/30",
          error: "border-destructive/30",
        },
      }}
    />
  );
}
