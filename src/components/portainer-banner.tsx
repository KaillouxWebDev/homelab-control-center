"use client";

import { AlertCircle } from "lucide-react";

export function PortainerBanner() {
  return (
    <div
      role="alert"
      className="flex items-center gap-3 w-full px-6 py-4 bg-destructive/15 border-b border-destructive/30 text-destructive"
    >
      <AlertCircle className="h-5 w-5 shrink-0" />
      <p className="text-sm font-medium">
        Portainer est injoignable. Vérifiez l’URL et les identifiants dans <code className="px-1.5 py-0.5 rounded bg-black/20 text-xs">.env</code>.
      </p>
    </div>
  );
}
