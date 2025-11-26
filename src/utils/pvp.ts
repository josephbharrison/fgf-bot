// utils/pvp.ts

export function prettyList(items: string[]): string {
  const list = items.filter((s) => s.trim().length > 0);
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  const head = list.slice(0, -1).join(", ");
  const tail = list[list.length - 1];
  return `${head}, and ${tail}`;
}

export function dedupe(list: string[]): string[] {
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

export function humanizeDelta(ms: number): string {
  if (ms <= 0) return "0m";

  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  const days = Math.floor(ms / DAY);
  ms %= DAY;
  const hours = Math.floor(ms / HOUR);
  ms %= HOUR;
  const mins = Math.floor(ms / MIN);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);

  return parts.join(" ");
}

export function applyRuleTemplates(
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

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getPvpConfig } from "../services/store";
import { buildPvpActiveMessage } from "../utils/pvpActive";
import { buildPvpInactiveMessage } from "../utils/pvpInactive";

export const pvpCommand = new SlashCommandBuilder()
  .setName("pvp")
  .setDescription("Show current or next PvP engagement rules");

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

  const inWindow = now >= start && now <= end;

  const content = inWindow
    ? buildPvpActiveMessage(cfg, now, {
      title: "NAP-PvP is active.",
      includeWindowTimes: false,
    })
    : buildPvpInactiveMessage(cfg, now);

  await interaction.reply({
    content,
    ephemeral: true,
  });
}
