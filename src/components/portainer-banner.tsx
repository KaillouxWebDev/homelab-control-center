"use client";

import { AlertCircle } from "lucide-react";

type BannerError = {
  status?: number;
  message?: string;
};

export function PortainerBanner({ error }: { error?: BannerError }) {
  const status = error?.status;
  const msg = error?.message || "";

  let text =
    "Portainer est injoignable. Vérifiez l’URL et les identifiants dans .env.";

  if (status === 401 || status === 403) {
    text = "Auth Portainer invalide (API key/JWT). Vérifiez PORTAINER_API_KEY ou PORTAINER_USERNAME/PASSWORD dans .env.";
  } else if (status === 502 && /cert|certificate|self signed|unable to verify/i.test(msg)) {
    text = "Certificat TLS non accepté. Activez PORTAINER_INSECURE_TLS=true uniquement dans un environnement de confiance.";
  }

  return (
    <div
      role="alert"
      className="flex items-center gap-3 w-full px-6 py-4 bg-destructive/15 border-b border-destructive/30 text-destructive"
    >
      <AlertCircle className="h-5 w-5 shrink-0" />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

