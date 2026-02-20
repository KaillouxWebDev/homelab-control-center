"use client";

import Link from "next/link";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getContainerIcon } from "@/lib/container-icon";
import { getServiceOpenUrlFromMap, type ServicesMap } from "@/config/services";
import type { ContainerItem } from "@/types/container";
import { ExternalLink } from "lucide-react";

function getDisplayName(names: string[]): string {
  const name = names?.[0] ?? "";
  return name.replace(/^\//, "");
}

function StatusBadge({ state }: { state: string }) {
  const running = state === "running";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        running ? "bg-success/20 text-success" : "bg-muted text-muted-foreground"
      }`}
    >
      {running ? "Running" : "Exited"}
    </span>
  );
}

function HealthBadge({ health }: { health?: string | null }) {
  if (!health || health === "none") return <span className="text-muted-foreground text-xs">—</span>;
  const healthy = health === "healthy";
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
        healthy ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
      }`}
    >
      {health === "healthy" ? "Healthy" : "Unhealthy"}
    </span>
  );
}

interface ContainerCardProps {
  container: ContainerItem;
  servicesMap?: ServicesMap | null;
}

export function ContainerCard({ container, servicesMap }: ContainerCardProps) {
  const id = container.Id;
  const name = getDisplayName(container.Names);
  const Icon = getContainerIcon(name);
  const state = container.State;
  const ports = container.Ports?.filter((p) => p.PublicPort) ?? [];
  const openConfig = getServiceOpenUrlFromMap(
    name,
    servicesMap,
    ports[0]?.PublicPort,
    typeof window !== "undefined" ? window.location.origin : undefined
  );

  return (
    <Link href={`/container/${id}`} className="block touch-manipulation">
      <Card className="h-full transition-opacity hover:opacity-95 active:opacity-90 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
                <Icon className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold truncate">{name}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <StatusBadge state={state} />
                  <HealthBadge health={(container as ContainerItem & { Health?: string }).Health} />
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          {ports.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {ports.slice(0, 4).map((p) => (
                <span
                  key={`${p.PrivatePort}-${p.PublicPort}`}
                  className="text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1"
                >
                  {p.PublicPort}:{p.PrivatePort}/{p.Type}
                </span>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter className="flex-wrap gap-2 pt-4">
          {openConfig && (
            <Button
              variant="outline"
              size="sm"
              className="min-w-[44px] min-h-[44px]"
              asChild
            >
              <a href={openConfig.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                <ExternalLink className="h-4 w-4" />
                {openConfig.label ?? "Open"}
              </a>
            </Button>
          )}
        </CardFooter>
      </Card>
    </Link>
  );
}
