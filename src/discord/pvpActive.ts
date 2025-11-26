// discord/pvpActive.ts
import { PvpConfig } from "../types";
import { prettyList, humanizeDelta } from "./pvp";
import { computePvpActive } from "../tools/pvpActive";

interface ActiveMessageOptions {
  title?: string;
  includeWindowTimes?: boolean;
  isActive?: boolean;
}

export function buildPvpActiveMessage(
  cfg: PvpConfig,
  now: number,
  options: ActiveMessageOptions = {},
): string {
  const result = computePvpActive(cfg, now, options);

  if (!result.ok) {
    return result.error || "An unknown error occurred.";
  }

  const lines: string[] = [];

  if (result.title) {
    lines.push(result.title);
  }

  if (result.deltaMs > 0 && result.deltaLabel) {
    lines.push(`${result.deltaLabel}: ${humanizeDelta(result.deltaMs)}`);
  }

  if (result.startUtc || result.endUtc) {
    lines.push("");
    lines.push(`Start: ${result.startUtc}`);
    lines.push(`End:   ${result.endUtc}`);
  }

  lines.push("");
  lines.push(
    `NAP-PvP Systems: ${result.allowedSystems.length > 0
      ? result.allowedSystems.join(", ")
      : "None configured"
    }`,
  );

  if (result.allowedNapMembers.length > 0) {
    lines.push(`NAP-PvP Members: ${prettyList(result.allowedNapMembers)}`);
  }

  if (result.rules.length > 0) {
    lines.push("");
    lines.push("Rules:");
    for (const rule of result.rules) {
      lines.push(`- ${rule}`);
    }
  }

  return lines.join("\n");
}
