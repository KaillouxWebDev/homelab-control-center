"use client";

import { use, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { getContainerIcon } from "@/lib/container-icon";
import { getServiceOpenUrlFromMap, type ServicesMap } from "@/config/services";
import type { ContainerInspectResponse } from "@/types/container";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Copy,
  Power,
  PowerOff,
  RotateCw,
  ExternalLink,
  X,
  FileText,
  Cpu,
  HardDrive,
  Network,
  Activity,
  Ship,
  Plug,
} from "lucide-react";
import { toast } from "sonner";

interface ContainerStatsSnapshot {
  cpuPercent: number | null;
  memoryUsageBytes: number | null;
  memoryLimitBytes: number | null;
  memoryPercent: number | null;
  networkRxBytes: number;
  networkTxBytes: number;
  pidsCount: number | null;
  readAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(1)} GiB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MiB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KiB`;
  return `${bytes} B`;
}

const TAIL = 200;
const LOGS_REFRESH_MS = 2000;

function getDisplayName(name: string): string {
  return name.replace(/^\//, "");
}

const fetcher = (url: string) => fetch(url).then((r) => (r.ok ? r.json() : Promise.reject(new Error("Fetch failed"))));

type PageProps = { params: Promise<{ id: string }> };

export default function ContainerDetailPage({ params }: PageProps) {
  const { id } = use(params);
  const [liveLogs, setLiveLogs] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<"start" | "stop" | "restart" | null>(null);
  const [logsDialogOpen, setLogsDialogOpen] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const { data: inspect, error: inspectError, mutate: mutateInspect } = useSWR<ContainerInspectResponse>(
    id ? `/api/containers/${id}` : null,
    fetcher,
    { refreshInterval: 5000 }
  );

  const { data: logsData, mutate: mutateLogs } = useSWR<{ logs: string }>(
    id && liveLogs ? `/api/containers/${id}/logs?tail=${TAIL}` : null,
    fetcher,
    { refreshInterval: LOGS_REFRESH_MS }
  );
  const { data: servicesMap } = useSWR<ServicesMap>("/api/services", fetcher, { revalidateOnFocus: false });

  const { data: stats } = useSWR<ContainerStatsSnapshot>(
    id && inspect?.State?.Running ? `/api/containers/${id}/stats` : null,
    fetcher,
    { refreshInterval: 4000 }
  );

  const scrollToBottom = useCallback(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (liveLogs && logsData?.logs) scrollToBottom();
  }, [logsData?.logs, liveLogs, scrollToBottom]);

  const runAction = useCallback(
    async (action: "start" | "stop" | "restart") => {
      if (!id) return;
      setActionLoading(action);
      try {
        const res = await fetch(`/api/containers/${id}/${action}`, { method: "POST" });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || res.statusText);
        }
        toast.success(`${action === "restart" ? "Redémarrage" : action === "start" ? "Démarrage" : "Arrêt"} effectué`);
        mutateInspect();
        mutateLogs();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Erreur");
      } finally {
        setActionLoading(null);
        setConfirmAction(null);
      }
    },
    [id, mutateInspect, mutateLogs]
  );

  const copyLogs = useCallback(() => {
    if (!logsData?.logs) return;
    navigator.clipboard.writeText(logsData.logs);
    toast.success("Logs copiés");
  }, [logsData?.logs]);

  if (inspectError || (!inspect && !inspectError)) {
    return (
      <main className="min-h-screen p-6 flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Container introuvable ou erreur.</p>
        <Button asChild variant="outline">
          <Link href="/">Retour</Link>
        </Button>
      </main>
    );
  }

  const name = inspect ? getDisplayName(inspect.Name) : "";
  const running = inspect?.State?.Running ?? false;
  const health = inspect?.State?.Health?.Status;
  const Icon = getContainerIcon(name);
  const openConfig = getServiceOpenUrlFromMap(
    name,
    servicesMap,
    undefined,
    typeof window !== "undefined" ? window.location.origin : undefined
  );

  const ports: Array<{ host: string; container: string }> = [];
  if (inspect?.NetworkSettings?.Ports) {
    for (const [containerPort, arr] of Object.entries(inspect.NetworkSettings.Ports)) {
      const hostPort = arr?.[0]?.HostPort;
      if (hostPort) ports.push({ container: containerPort, host: hostPort });
    }
  }

  return (
    <main className="min-h-screen flex flex-col">
      <div className="p-6 md:p-8 flex-shrink-0 border-b border-border">
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="ghost" size="icon" className="min-w-[48px] min-h-[48px]" asChild>
            <Link href="/">
              <ArrowLeft className="h-7 w-7" />
            </Link>
          </Button>
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-muted/50 text-muted-foreground">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-semibold">{name}</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className={`text-xs font-medium ${running ? "text-success" : "text-muted-foreground"}`}>
                  {running ? "Running" : "Exited"}
                </span>
                {health && health !== "none" && (
                  <span className={`text-xs font-medium ${health === "healthy" ? "text-success" : "text-destructive"}`}>
                    {health}
                  </span>
                )}
              </div>
            </div>
          </div>
          {openConfig && (
            <Button variant="outline" size="lg" className="min-h-[48px]" asChild>
              <a href={openConfig.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                {openConfig.label ?? "Open"}
              </a>
            </Button>
          )}
          <div className="flex flex-wrap gap-2 ml-auto">
            <Button
              variant="outline"
              size="lg"
              className="min-h-[48px]"
              onClick={() => setLogsDialogOpen(true)}
            >
              <FileText className="h-4 w-4" />
              Logs
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="min-h-[48px]"
              onClick={() => setConfirmAction("restart")}
              disabled={!!actionLoading}
            >
              <RotateCw className="h-4 w-4" />
              Restart
            </Button>
            {running ? (
              <Button
                variant="destructive"
                size="lg"
                className="min-h-[48px]"
                onClick={() => setConfirmAction("stop")}
                disabled={!!actionLoading}
              >
                <PowerOff className="h-4 w-4" />
                Stop
              </Button>
            ) : (
              <Button
                size="lg"
                className="min-h-[48px]"
                onClick={() => setConfirmAction("start")}
                disabled={!!actionLoading}
              >
                <Power className="h-4 w-4" />
                Start
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 md:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Stats (only when running) */}
          {running && (
            <section>
              <h2 className="text-sm font-medium text-muted-foreground mb-3">Utilisation système</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      CPU
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.cpuPercent != null ? (
                      <>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, stats.cpuPercent)}%` }}
                          />
                        </div>
                        <p className="text-lg font-semibold mt-1">{stats.cpuPercent.toFixed(1)} %</p>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-sm">—</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      Mémoire
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.memoryUsageBytes != null ? (
                      <>
                        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary rounded-full transition-all duration-300"
                            style={{
                              width: `${stats.memoryPercent != null ? Math.min(100, stats.memoryPercent) : 0}%`,
                            }}
                          />
                        </div>
                        <p className="text-sm font-medium mt-1">
                          {formatBytes(stats.memoryUsageBytes)}
                          {stats.memoryLimitBytes != null && (
                            <span className="text-muted-foreground"> / {formatBytes(stats.memoryLimitBytes)}</span>
                          )}
                        </p>
                        {stats.memoryPercent != null && (
                          <p className="text-xs text-muted-foreground">{stats.memoryPercent.toFixed(1)} %</p>
                        )}
                      </>
                    ) : (
                      <p className="text-muted-foreground text-sm">—</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Network className="h-4 w-4 text-muted-foreground" />
                      Réseau
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats ? (
                      <div className="space-y-1 text-sm">
                        <p className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">↓ RX</span>
                          <span className="font-medium">{formatBytes(stats.networkRxBytes)}</span>
                        </p>
                        <p className="flex items-center gap-1.5">
                          <span className="text-muted-foreground">↑ TX</span>
                          <span className="font-medium">{formatBytes(stats.networkTxBytes)}</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-sm">—</p>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      Processus
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.pidsCount != null ? (
                      <p className="text-lg font-semibold">{stats.pidsCount}</p>
                    ) : (
                      <p className="text-muted-foreground text-sm">—</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </section>
          )}

          <div className="grid md:grid-cols-2 gap-6">
            {/* Ports */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Plug className="h-4 w-4" />
                  Ports utilisés
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Mappage host → conteneur
                </p>
              </CardHeader>
              <CardContent>
                {ports.length > 0 ? (
                  <div className="rounded-lg border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-muted/30">
                          <th className="text-left py-2 px-3 font-medium">Host</th>
                          <th className="text-left py-2 px-3 font-medium">Conteneur</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ports.map((p) => (
                          <tr key={`${p.host}-${p.container}`} className="border-b border-border last:border-0">
                            <td className="py-2 px-3 font-mono">{p.host}</td>
                            <td className="py-2 px-3 font-mono text-muted-foreground">{p.container}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Aucun port mappé.</p>
                )}
              </CardContent>
            </Card>

            {/* Infos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Ship className="h-4 w-4" />
                  Infos conteneur
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">Image</p>
                  <p className="font-mono text-sm break-all">{inspect?.Config?.Image ?? "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">État</p>
                  <p className="text-sm">{inspect?.State?.Status ?? "—"}</p>
                </div>
                {health && health !== "none" && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Santé</p>
                    <p className="text-sm capitalize">{health}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">ID</p>
                  <p className="font-mono text-xs text-muted-foreground break-all">{inspect?.Id?.slice(0, 12) ?? "—"}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={logsDialogOpen} onOpenChange={setLogsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="flex flex-row items-center justify-between space-y-0 px-6 pt-6 pb-2">
            <DialogTitle className="text-lg">Logs (tail={TAIL})</DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px]"
                onClick={() => setLiveLogs((v) => !v)}
              >
                {liveLogs ? "Live ON" : "Live OFF"}
              </Button>
              <Button variant="outline" size="sm" className="min-h-[44px]" onClick={copyLogs}>
                <Copy className="h-4 w-4" />
                Copy
              </Button>
              <DialogClose asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="min-h-[44px] min-w-[44px]"
                  aria-label="Fermer"
                >
                  <X className="h-5 w-5" />
                </Button>
              </DialogClose>
            </div>
          </DialogHeader>
          <pre className="logs-panel flex-1 min-h-0 overflow-auto p-4 text-xs font-mono bg-muted/30 rounded-b-xl whitespace-pre-wrap break-all border-t border-border">
            {logsData?.logs ?? (liveLogs ? "Chargement…" : "Activer Live pour afficher les logs.")}
            <div ref={logsEndRef} />
          </pre>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmAction === "restart"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Redémarrer le container ?"
        description="Le container sera redémarré. Les connexions en cours seront interrompues."
        confirmLabel="Redémarrer"
        onConfirm={() => runAction("restart")}
        loading={actionLoading === "restart"}
      />
      <ConfirmDialog
        open={confirmAction === "stop"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Arrêter le container ?"
        description="Le container sera arrêté."
        confirmLabel="Arrêter"
        variant="destructive"
        onConfirm={() => runAction("stop")}
        loading={actionLoading === "stop"}
      />
      <ConfirmDialog
        open={confirmAction === "start"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
        title="Démarrer le container ?"
        description="Le container sera démarré."
        confirmLabel="Démarrer"
        onConfirm={() => runAction("start")}
        loading={actionLoading === "start"}
      />
    </main>
  );
}
