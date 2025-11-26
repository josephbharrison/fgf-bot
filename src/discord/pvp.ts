// discord/pvp.ts

export { dedupe, humanizeDelta, applyRuleTemplates } from "../tools/pvp";

import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getPvpConfig } from "../services/store";
import { buildPvpActiveMessage } from "./pvpActive";
import { buildPvpInactiveMessage } from "./pvpInactive";

export function prettyList(items: string[]): string {
  const list = items.filter((s) => s.trim().length > 0);
  if (list.length === 0) return "";
  if (list.length === 1) return list[0];
  if (list.length === 2) return `${list[0]} and ${list[1]}`;
  const head = list.slice(0, -1).join(", ");
  const tail = list[list.length - 1];
  return `${head}, and ${tail}`;
}
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
