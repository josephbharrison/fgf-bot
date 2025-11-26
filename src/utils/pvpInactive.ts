import { PvpConfig } from "../types";
import { prettyList, dedupe, humanizeDelta } from "./pvp";

export function buildPvpInactiveMessage(cfg: PvpConfig, now: number): string {
  if (!cfg.startUtc || !cfg.endUtc) {
    return "PvP configuration has invalid start or end time.";
  }

  const start = Date.parse(cfg.startUtc);
  const end = Date.parse(cfg.endUtc);

  const napMembers = cfg.napMembers ?? [];
  const seedGuilds = cfg.seedGuilds ?? [];

  const protectedNapMembers = dedupe([...napMembers, ...seedGuilds]);

  const lines: string[] = [];

  if (now < start) {
    lines.push("NAP-PvP is NOT active.");
    const deltaMs = start - now;
    if (deltaMs > 0) {
      lines.push(`Starts in: ${humanizeDelta(deltaMs)}`);
    }
  } else if (now > end) {
    lines.push("NAP-PvP window has ended.");
  } else {
    lines.push("NAP-PvP is NOT active.");
  }

  if (protectedNapMembers.length > 0) {
    lines.push("");
    lines.push(`Protected NAP Members: ${prettyList(protectedNapMembers)}`);
  }

  return lines.join("\n");
}
