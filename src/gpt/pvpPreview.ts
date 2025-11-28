// gpt/pvpPreview.ts
import { tool } from "@openai/agents";
import { z } from "zod";
import { getPvpConfig } from "../services/store";
import { computePvpActive } from "../tools/pvpActive";

export const pvpPreviewTool = tool({
  name: "pvp_preview",
  description:
    "Get the configured NAP-PvP window and rules. If NAP-PvP is currently active, this returns the current window and rules. If NAP-PvP is not active, this returns the next configured window and its rules.",
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

    const active = computePvpActive(cfg, now, {
      isActive: inWindow,
      includeWindowTimes: true,
    });

    if (!active.ok) {
      return JSON.stringify({
        ok: false,
        error: active.error ?? "Failed to compute NAP-PvP preview.",
      });
    }

    const payload = {
      ok: true,
      error: null as string | null,
      inWindow,
      preview: {
        deltaMs: active.deltaMs,
        deltaLabel: active.deltaLabel,
        startUtc: active.startUtc,
        endUtc: active.endUtc,
        allowedSystems: active.allowedSystems,
        allowedNapMembers: active.allowedNapMembers,
        notes: active.notes,
        rules: active.rules,
      },
    };

    return JSON.stringify(payload);
  },
});
