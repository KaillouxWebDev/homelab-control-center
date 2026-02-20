"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sun, Moon, Laptop, Check } from "lucide-react";

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Icône selon le mode actif (resolvedTheme = mode réel affiché)
  const themeIcon =
    !mounted || resolvedTheme === "dark" ? (
      <Moon className="h-4 w-4 shrink-0" aria-hidden />
    ) : (
      <Sun className="h-4 w-4 shrink-0" aria-hidden />
    );

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 min-w-[44px] min-h-[44px] rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm"
        aria-label="Theme (loading)"
      >
        <Sun className="h-4 w-4 shrink-0 opacity-50" aria-hidden />
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 min-w-[44px] min-h-[44px] rounded-lg border border-border/50 bg-background/50 backdrop-blur-sm hover:bg-muted/80 hover:border-border focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          aria-label="Choose theme (system, light, dark)"
        >
          {themeIcon}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuItem onClick={() => setTheme("system")} className="gap-2">
          {theme === "system" ? <Check className="h-4 w-4" /> : <span className="w-4" />}
          <Laptop className="h-4 w-4" />
          System
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("light")} className="gap-2">
          {theme === "light" ? <Check className="h-4 w-4" /> : <span className="w-4" />}
          <Sun className="h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="gap-2">
          {theme === "dark" ? <Check className="h-4 w-4" /> : <span className="w-4" />}
          <Moon className="h-4 w-4" />
          Dark
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
