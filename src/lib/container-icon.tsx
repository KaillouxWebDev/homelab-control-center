"use client";

import {
  Container,
  Film,
  Gamepad2,
  Shield,
  Server,
  FolderOpen,
  Activity,
  Box,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Array<{ pattern: string | RegExp; Icon: LucideIcon }> = [
  { pattern: /jellyfin/i, Icon: Film },
  { pattern: /mc|minecraft/i, Icon: Gamepad2 },
  { pattern: /pihole/i, Icon: Shield },
  { pattern: /caddy/i, Icon: Server },
  { pattern: /portainer/i, Icon: Container },
  { pattern: /filebrowser/i, Icon: FolderOpen },
  { pattern: /netdata/i, Icon: Activity },
];

export function getContainerIcon(name: string): LucideIcon {
  const normalized = name.replace(/^\//, "");
  for (const { pattern, Icon } of ICON_MAP) {
    if (typeof pattern === "string" ? normalized.includes(pattern) : pattern.test(normalized)) {
      return Icon;
    }
  }
  return Box;
}
