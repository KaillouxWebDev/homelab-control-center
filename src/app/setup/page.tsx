"use client";

import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, XCircle, AlertCircle, Loader2, FlaskConical } from "lucide-react";

interface SetupStatus {
  demoMode: boolean;
  missingEnv: string[];
  authConfigured: boolean;
  portainerReachable: boolean;
  endpointValid: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json()) as Promise<SetupStatus>;

export default function SetupPage() {
  const { data, error, isLoading, mutate } = useSWR<SetupStatus>("/api/setup-status", fetcher, {
    refreshInterval: 0,
  });

  if (isLoading || error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4">
          {error ? (
            <p className="text-muted-foreground">Could not load setup status.</p>
          ) : (
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          )}
          <Button variant="outline" asChild>
            <Link href="/">Back</Link>
          </Button>
        </div>
      </main>
    );
  }

  const s = data!;
  const allOk = s.demoMode || (s.missingEnv.length === 0 && s.authConfigured && s.portainerReachable && s.endpointValid);

  return (
    <main className="min-h-screen p-6 md:p-8 flex flex-col">
      <div className="max-w-xl mx-auto w-full space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Setup status</h1>
          <Button variant="ghost" asChild>
            <Link href="/">Home</Link>
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {s.demoMode ? (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                <FlaskConical className="h-5 w-5" />
                <span className="font-medium">Demo mode is on. Portainer is not required.</span>
              </div>
            ) : (
              <>
                <Row
                  label="Required env (PORTAINER_URL, PORTAINER_ENDPOINT_ID)"
                  ok={s.missingEnv.length === 0}
                  bad={s.missingEnv.length > 0}
                  badLabel={s.missingEnv.length ? `Missing: ${s.missingEnv.join(", ")}` : undefined}
                />
                <Row
                  label="Portainer auth (API key or username + password)"
                  ok={s.authConfigured}
                />
                <Row
                  label="Portainer reachable"
                  ok={s.portainerReachable}
                />
                <Row
                  label="Endpoint valid"
                  ok={s.endpointValid}
                />
              </>
            )}
          </CardContent>
        </Card>

        {allOk && (
          <div className="flex items-center gap-2 text-success">
            <CheckCircle2 className="h-5 w-5" />
            <span>All checks passed. You can use the control center.</span>
          </div>
        )}

        <Button onClick={() => mutate()} variant="outline" className="w-full">
          Recheck
        </Button>
      </div>
    </main>
  );
}

function Row({
  label,
  ok,
  bad,
  badLabel,
}: {
  label: string;
  ok?: boolean;
  bad?: boolean;
  badLabel?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      {ok && <CheckCircle2 className="h-5 w-5 text-success shrink-0 mt-0.5" />}
      {(bad || (!ok && !bad)) && <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />}
      {!ok && !bad && <AlertCircle className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />}
      <div>
        <p className="text-sm font-medium">{label}</p>
        {badLabel && <p className="text-xs text-muted-foreground mt-0.5">{badLabel}</p>}
      </div>
    </div>
  );
}

