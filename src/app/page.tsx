"use client";

import useSWR from "swr";
import { ContainerCard, type MinecraftStatus } from "@/components/container-card";
import { PortainerBanner } from "@/components/portainer-banner";
import type { ContainerItem } from "@/types/container";
import type { ServicesMap } from "@/config/services";

type ApiError = Error & { status?: number };

const fetcher = async (url: string) => {
  const res = await fetch(url);

  if (!res.ok) {
    let message = "Portainer unreachable";
    try {
      const data = (await res.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      // ignore JSON parse errors
    }

    const err = new Error(message) as ApiError;
    err.status = res.status;
    throw err;
  }

  return res.json();
};

const minecraftStatusFetcher = (url: string) =>
  fetch(url).then((r) => r.json()) as Promise<MinecraftStatus>;

export default function HomePage() {
  const { data: containers, error, isLoading } = useSWR<ContainerItem[]>("/api/containers", fetcher, {
    refreshInterval: 5000,
    revalidateOnFocus: true,
  });
  const { data: servicesMap } = useSWR<ServicesMap>("/api/services", fetcher, { revalidateOnFocus: false });
  const { data: minecraftStatus } = useSWR<MinecraftStatus>(
    "/api/minecraft/status",
    minecraftStatusFetcher,
    { refreshInterval: 5000, revalidateOnFocus: false }
  );

  return (
    <main className="min-h-screen flex flex-col">
      {error && <PortainerBanner error={error as ApiError} />}
      <div className="flex-1 p-6 md:p-8 lg:p-10">
        <div className="mb-8 md:mb-10">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight text-foreground">
            Containers Docker via Portainer
          </h1>
        </div>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-border bg-card/80 backdrop-blur-xl h-40 animate-pulse"
              />
            ))}
          </div>
        )}

        {!isLoading && containers && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {containers.map((c) => (
              <ContainerCard
                key={c.Id}
                container={c}
                servicesMap={servicesMap}
                minecraftStatus={minecraftStatus}
              />
            ))}
          </div>
        )}

        {!isLoading && !error && !containers?.length && (
          <p className="text-muted-foreground">Aucun container.</p>
        )}
      </div>
    </main>
  );
}
