// utils/pvpActive.ts
import { PvpConfig } from "../types";
import { prettyList, dedupe, humanizeDelta, applyRuleTemplates } from "./pvp";

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
  const { title, includeWindowTimes, isActive = true } = options;

  if (!cfg.startUtc || !cfg.endUtc) {
    return "PvP configuration has invalid start or end time.";
  }

  const end = Date.parse(cfg.endUtc);
  const start = Date.parse(cfg.startUtc);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return "PvP configuration has invalid start or end time.";
  }

  let deltaMs = 0;
  let label: string;

  if (isActive) {
    label = "Ends in";
    if (end > now) {
      deltaMs = end - now;
    }
  } else {
    label = "Starts in";
    if (start > now) {
      deltaMs = start - now;
    }
  }

  const systemsList =
    cfg.allowedSystems && cfg.allowedSystems.length > 0
      ? cfg.allowedSystems.join(", ")
      : "None configured";

  const napMembers = cfg.napMembers ?? [];
  const seedGuilds = cfg.seedGuilds ?? [];

  const allowedNapMembers = dedupe(
    napMembers.filter((m) => !seedGuilds.includes(m)),
  );

  const napRules = cfg.napRules ?? [];

  const lines: string[] = [];

  if (title) {
    lines.push(title);
  }

  if (deltaMs > 0) {
    lines.push(`${label}: ${humanizeDelta(deltaMs)}`);
  }

  if (includeWindowTimes) {
    lines.push("");
    lines.push(`Start: ${cfg.startUtc}`);
    lines.push(`End:   ${cfg.endUtc}`);
  }

  lines.push("");
  lines.push(`Allowed systems: ${systemsList}`);

  if (allowedNapMembers.length > 0) {
    lines.push(`Allowed NAP Members: ${prettyList(allowedNapMembers)}`);
  }

  const noteLines: string[] = [];

  if (napRules.length > 0) {
    const warZones = cfg.allowedSystems ?? [];
    for (const rule of napRules) {
      const rendered = applyRuleTemplates(
        rule,
        warZones,
        allowedNapMembers,
        seedGuilds,
      );
      noteLines.push(`- ${rendered}`);
    }
  }

  if (noteLines.length > 0) {
    lines.push("");
    lines.push("Note:");
    lines.push(...noteLines);
  }

  return lines.join("\n");
}
