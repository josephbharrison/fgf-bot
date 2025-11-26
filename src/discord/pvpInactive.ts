// discord/pvpInactive.ts
import { PvpConfig } from "../types";
import { prettyList, humanizeDelta } from "./pvp";
import { computePvpInactive } from "../tools/pvpInactive";

export function buildPvpInactiveMessage(cfg: PvpConfig, now: number): string {
  const result = computePvpInactive(cfg, now);

  if (!result.ok) {
    return result.error || "An unknown error occurred.";
  }

  const lines: string[] = [];

  if (result.state === "before") {
    lines.push("NAP-PvP is NOT active.");
    if (result.deltaMsToStart > 0) {
      lines.push(`Starts in: ${humanizeDelta(result.deltaMsToStart)}`);
    }
  } else if (result.state === "after") {
    lines.push("NAP-PvP window has ended.");
  } else {
    lines.push("NAP-PvP is NOT active.");
  }

  if (result.protectedNapMembers.length > 0) {
    lines.push("");
    lines.push(
      `Protected NAP Members: ${prettyList(result.protectedNapMembers)}`,
    );
  }

  return lines.join("\n");
}
