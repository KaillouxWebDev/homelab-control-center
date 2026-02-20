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

function MinecraftBadge({
  children,
  variant = "muted",
}: {
  children: React.ReactNode;
  variant?: "success" | "muted" | "destructive";
}) {
  const classes =
    variant === "success"
      ? "bg-success/15 text-success"
      : variant === "destructive"
        ? "bg-destructive/15 text-destructive"
        : "bg-muted/60 text-muted-foreground";
  return (
    <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${classes}`}>
      {children}
    </span>
  );
}

function MinecraftBadges({ status }: { status: MinecraftStatus }) {
  const up = status.ok && status.up;
  const checkedLabel = formatCheckedAt(status.checkedAt);
  const wrapper = (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <MinecraftBadge variant={up ? "success" : "destructive"}>{up ? "UP" : "DOWN"}</MinecraftBadge>
      <span className="text-muted-foreground text-xs">
        Players: {up && typeof status.online === "number" && typeof status.max === "number" ? `${status.online}/${status.max}` : "—"}
      </span>
      <span className="text-muted-foreground text-xs">
        Ping: {up && typeof status.latencyMs === "number" ? `${status.latencyMs} ms` : "—"}
      </span>
      <span className="text-muted-foreground text-xs">
        {up && status.version ? status.version : "Version: —"}
      </span>
    </span>
  );
  if (!up && status.checkedAt) {
    return (
      <span title={`Dernier check: ${checkedLabel}`} className="cursor-default">
        {wrapper}
      </span>
    );
  }
  return wrapper;
}

export interface MinecraftStatus {
  ok: boolean;
  up: boolean;
  online?: number;
  max?: number;
  version?: string;
  latencyMs?: number;
  checkedAt: string;
  error?: string;
}

interface ContainerCardProps {
  container: ContainerItem;
  servicesMap?: ServicesMap | null;
  minecraftStatus?: MinecraftStatus | null;
}

function isMcContainer(container: ContainerItem): boolean {
  const labels = (container as ContainerItem & { Labels?: Record<string, string> }).Labels;
  if (labels?.["hcc.kind"] === "minecraft") return true;
  const n = getDisplayName(container.Names).toLowerCase();
  return (
    n === "mc" ||
    n === "minecraft" ||
    n.startsWith("mc-") ||
    n.endsWith("-mc")
  );
}

function formatCheckedAt(iso?: string): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "—";
  }
}

export function ContainerCard({ container, servicesMap, minecraftStatus }: ContainerCardProps) {
  const id = container.Id;
  const name = getDisplayName(container.Names);
  const Icon = getContainerIcon(name);
  const state = container.State;
  const ports = container.Ports?.filter((p) => p.PublicPort) ?? [];
  const maxVisible = 8;
  const displayedPorts = ports.length <= maxVisible ? ports : ports.slice(-maxVisible);
  const moreCount = ports.length > maxVisible ? ports.length - maxVisible : 0;
  const showMinecraft = isMcContainer(container) && minecraftStatus;
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
                  {showMinecraft && (
                    <MinecraftBadges status={minecraftStatus!} />
                  )}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pb-2">
          {ports.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              {displayedPorts.map((p) => (
                <span
                  key={`${p.PrivatePort}-${p.PublicPort}`}
                  className="text-xs text-muted-foreground bg-muted/50 rounded-md px-2 py-1"
                >
                  {p.PublicPort}:{p.PrivatePort}/{p.Type}
                </span>
              ))}
              {moreCount > 0 && (
                <span
                  className="text-xs text-muted-foreground opacity-60 shrink-0"
                  title={ports.map((p) => `${p.PublicPort}:${p.PrivatePort}/${p.Type}`).join(", ")}
                >
                  +{moreCount} more
                </span>
              )}
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
