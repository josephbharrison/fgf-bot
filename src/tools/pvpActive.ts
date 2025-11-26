// tools/pvpActive.ts
import { PvpConfig } from "../types";
import { dedupe, applyRuleTemplates } from "./pvp";

export interface PvpActiveResult {
  ok: boolean;
  error?: string;

  title: string | null;
  deltaMs: number;
  deltaLabel: "Starts in" | "Ends in" | null;

  startUtc: string | null;
  endUtc: string | null;

  allowedSystems: string[];
  allowedNapMembers: string[];

  notes: string[];
  rules: string[];
}

interface ActiveOptions {
  title?: string;
  includeWindowTimes?: boolean;
  isActive?: boolean;
}

export function computePvpActive(
  cfg: PvpConfig,
  now: number,
  options: ActiveOptions = {},
): PvpActiveResult {
  const { title = null, includeWindowTimes = false, isActive = true } = options;

  if (!cfg.startUtc || !cfg.endUtc) {
    return {
      ok: false,
      error: "PvP configuration has invalid start or end time.",
      title,
      deltaMs: 0,
      deltaLabel: null,
      startUtc: cfg.startUtc,
      endUtc: cfg.endUtc,
      allowedSystems: [],
      allowedNapMembers: [],
      notes: [],
      rules: [],
    };
  }

  const start = Date.parse(cfg.startUtc);
  const end = Date.parse(cfg.endUtc);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return {
      ok: false,
      error: "PvP configuration has invalid start or end time.",
      title,
      deltaMs: 0,
      deltaLabel: null,
      startUtc: cfg.startUtc,
      endUtc: cfg.endUtc,
      allowedSystems: [],
      allowedNapMembers: [],
      notes: [],
      rules: [],
    };
  }

  let deltaMs = 0;
  let deltaLabel: "Starts in" | "Ends in" | null = null;

  if (isActive) {
    deltaLabel = "Ends in";
    if (end > now) {
      deltaMs = end - now;
    }
  } else {
    deltaLabel = "Starts in";
    if (start > now) {
      deltaMs = start - now;
    }
  }

  const allowedSystems = cfg.allowedSystems ?? [];

  const napMembers = cfg.napMembers ?? [];
  const seedGuilds = cfg.seedGuilds ?? [];
  const allowedNapMembers = dedupe(
    napMembers.filter((m) => !seedGuilds.includes(m)),
  );

  const renderedNotes: string[] = [];
  const napRules = cfg.napRules ?? [];

  if (napRules.length > 0) {
    const warZones = allowedSystems;
    for (const rule of napRules) {
      const r = applyRuleTemplates(
        rule,
        warZones,
        allowedNapMembers,
        seedGuilds,
      );
      renderedNotes.push(r);
    }
  }

  const rules: string[] = [];

  rules.push(
    "PvP against NAP-PvP Members outside of NAP-PvP Systems is **strictly prohibited**.",
  );

  for (const note of renderedNotes) {
    rules.push(note);
  }

  rules.push("All other PvP is allowed.");

  return {
    ok: true,
    title,
    deltaMs,
    deltaLabel,
    startUtc: includeWindowTimes ? cfg.startUtc : null,
    endUtc: includeWindowTimes ? cfg.endUtc : null,
    allowedSystems,
    allowedNapMembers,
    notes: renderedNotes,
    rules,
  };
}
