"use client";

import useSWR from "swr";
import { FlaskConical } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json()).then((d) => d.demoMode === true);

export function DemoBanner() {
  const { data: demoMode } = useSWR<boolean>("/api/demo", fetcher, { revalidateOnFocus: false });

  if (!demoMode) return null;

  return (
    <div
      role="status"
      className="flex items-center gap-3 w-full px-6 py-3 bg-amber-500/15 border-b border-amber-500/30 text-amber-600 dark:text-amber-400"
    >
      <FlaskConical className="h-5 w-5 shrink-0" />
      <p className="text-sm font-medium">DEMO MODE ACTIVE — No Portainer connection. Using mock data.</p>
    </div>
  );
}
