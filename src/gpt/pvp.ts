// gpt/pvp.ts
import { tool } from "@openai/agents";
import { z } from "zod";
import { getPvpConfig } from "../services/store";
import { computePvpActive } from "../tools/pvpActive";
import { computePvpInactive } from "../tools/pvpInactive";

export const pvpStatusTool = tool({
  name: "pvp_status",
  description:
    "Get the current NAP-PvP status. NAP is always active. This tool tells you whether the special NAP-PvP window is active right now, which systems and NAP members are allowed if it is, or which NAP members are fully protected and when NAP-PvP will start if it is not.",
  parameters: z.object({}),
  async execute() {
    const cfg = getPvpConfig();
    if (!cfg || !cfg.startUtc || !cfg.endUtc) {
      return JSON.stringify({
        ok: false,
        error: "NAP-PvP window is not configured.",
      });
    }

    const start = Date.parse(cfg.startUtc);
    const end = Date.parse(cfg.endUtc);

    if (Number.isNaN(start) || Number.isNaN(end)) {
      return JSON.stringify({
        ok: false,
        error: "NAP-PvP configuration has invalid start or end time.",
      });
    }

    const now = Date.now();
    const inWindow = now >= start && now <= end;

    if (inWindow) {
      const active = computePvpActive(cfg, now, {
        isActive: true,
        includeWindowTimes: true,
      });

      if (!active.ok) {
        return JSON.stringify({
          ok: false,
          error: active.error ?? "Failed to compute active NAP-PvP status.",
        });
      }

      const payload = {
        ok: true,
        error: null as string | null,
        inWindow: true,
        active: {
          deltaMs: active.deltaMs,
          deltaLabel: active.deltaLabel,
          startUtc: active.startUtc,
          endUtc: active.endUtc,
          allowedSystems: active.allowedSystems,
          allowedNapMembers: active.allowedNapMembers,
          notes: active.notes,
          rules: active.rules,
        },
        inactive: null as null,
      };

      return JSON.stringify(payload);
    }

    const inactive = computePvpInactive(cfg, now);

    if (!inactive.ok) {
      return JSON.stringify({
        ok: false,
        error: inactive.error ?? "Failed to compute inactive NAP-PvP status.",
      });
    }

    const payload = {
      ok: true,
      error: null as string | null,
      inWindow: false,
      active: null as null,
      inactive: {
        state: inactive.state,
        deltaMsToStart: inactive.deltaMsToStart,
        startUtc: inactive.startUtc,
        endUtc: inactive.endUtc,
        protectedNapMembers: inactive.protectedNapMembers,
      },
    };

    return JSON.stringify(payload);
  },
});
