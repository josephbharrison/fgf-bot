// commands/pvp.ts
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getPvpConfig } from "../services/store";

export const pvpCommand = new SlashCommandBuilder()
  .setName("pvp")
  .setDescription("Show current or next PvP engagement rules");

function prettyList(items: string[]): string {
  const list = items.filter((s) => s.trim().length > 0);
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  const head = list.slice(0, -1).join(", ");
  const tail = list[list.length - 1];
  return `${head}, and ${tail}`;
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of list) {
    const key = item.trim();
    if (!key) continue;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  return result;
}

function applyRuleTemplates(
  rule: string,
  warZones: string[],
  napMembers: string[],
  seedGuilds: string[],
): string {
  return rule
    .replace("{WAR_ZONES}", warZones.join(", "))
    .replace("{NAP_MEMBERS}", napMembers.join(", "))
    .replace("{SEED_GUILDS}", seedGuilds.join(", "));
}

// NEW: format time as d/h/m
function formatDelta(ms: number): string {
  const d = Math.floor(ms / (1000 * 60 * 60 * 24));
  const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`;
}

export async function handlePvpCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const cfg = getPvpConfig();

  if (!cfg || !cfg.startUtc || !cfg.endUtc) {
    await interaction.reply({
      content: "PvP window is not configured.",
      ephemeral: true,
    });
    return;
  }

  const now = Date.now();
  const start = Date.parse(cfg.startUtc);
  const end = Date.parse(cfg.endUtc);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    await interaction.reply({
      content: "PvP configuration has invalid dates.",
      ephemeral: true,
    });
    return;
  }

  let status: string;
  let deltaMs: number;

  const inWindow = now >= start && now <= end;

  if (!inWindow && now < start) {
    status = "NAP-PvP is NOT active.";
    deltaMs = start - now;
  } else if (!inWindow && now > end) {
    status = "NAP-PvP window has ended.";
    deltaMs = 0;
  } else {
    status = "NAP-PvP is active.";
    deltaMs = end - now;
  }

  const systemsList =
    cfg.allowedSystems && cfg.allowedSystems.length > 0
      ? cfg.allowedSystems.join(", ")
      : "None configured";

  const napMembers = cfg.napMembers ?? [];
  const seedGuilds = cfg.seedGuilds ?? [];
  const allProtectedNapMembers = dedupe([...napMembers, ...seedGuilds]);
  const napRules = cfg.napRules ?? [];

  const msgLines: string[] = [];

  msgLines.push(status);

  if (deltaMs > 0) {
    const label = !inWindow && now < start ? "Starts in" : "Ends in";
    msgLines.push(`${label}: ${formatDelta(deltaMs)}`);
  }

  if (!inWindow) {
    if (allProtectedNapMembers.length > 0) {
      msgLines.push("");
      msgLines.push(
        `Protected NAP Members: ${prettyList(allProtectedNapMembers)}`,
      );
    }
  } else {
    msgLines.push("");
    msgLines.push(`Allowed systems: ${systemsList}`);

    const noteLines: string[] = [];

    if (napRules.length > 0) {
      const warZones = cfg.allowedSystems ?? [];
      for (const rule of napRules) {
        const rendered = applyRuleTemplates(
          rule,
          warZones,
          allProtectedNapMembers,
          seedGuilds,
        );
        noteLines.push(`- ${rendered}`);
      }
    }

    if (noteLines.length > 0) {
      msgLines.push("");
      msgLines.push("Note:");
      msgLines.push(...noteLines);
    }
  }

  await interaction.reply({
    content: msgLines.join("\n"),
    ephemeral: true,
  });
}
