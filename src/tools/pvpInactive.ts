// tools/pvpInactive.ts
import { PvpConfig } from "../types";
import { dedupe } from "./pvp";

export type PvpInactiveState = "before" | "after" | "inside";

export interface PvpInactiveResult {
  ok: boolean;
  error?: string;

  state: PvpInactiveState;
  deltaMsToStart: number;

  startUtc: string | null;
  endUtc: string | null;

  protectedNapMembers: string[];
}

export function computePvpInactive(
  cfg: PvpConfig,
  now: number,
): PvpInactiveResult {
  if (!cfg.startUtc || !cfg.endUtc) {
    return {
      ok: false,
      error: "PvP configuration has invalid start or end time.",
      state: "inside",
      deltaMsToStart: 0,
      startUtc: cfg.startUtc,
      endUtc: cfg.endUtc,
      protectedNapMembers: [],
    };
  }

  const start = Date.parse(cfg.startUtc);
  const end = Date.parse(cfg.endUtc);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    return {
      ok: false,
      error: "PvP configuration has invalid start or end time.",
      state: "inside",
      deltaMsToStart: 0,
      startUtc: cfg.startUtc,
      endUtc: cfg.endUtc,
      protectedNapMembers: [],
    };
  }

  let state: PvpInactiveState = "inside";
  let deltaMsToStart = 0;

  if (now < start) {
    state = "before";
    deltaMsToStart = start - now;
  } else if (now > end) {
    state = "after";
  } else {
    state = "inside";
  }

  const napMembers = cfg.napMembers ?? [];
  const seedGuilds = cfg.seedGuilds ?? [];
  const protectedNapMembers = dedupe([...napMembers, ...seedGuilds]);

  return {
    ok: true,
    state,
    deltaMsToStart,
    startUtc: cfg.startUtc,
    endUtc: cfg.endUtc,
    protectedNapMembers,
  };
}
