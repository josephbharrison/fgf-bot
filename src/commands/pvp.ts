import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getPvpConfig } from "../services/store";
import { buildPvpActiveMessage } from "../discord/pvpActive";
import { buildPvpInactiveMessage } from "../discord/pvpInactive";

export const pvpCommand = new SlashCommandBuilder()
  .setName("pvp")
  .setDescription("Show current PvP status and engagement rules");

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
      isActive: true,
      title: "NAP-PvP is active.",
      includeWindowTimes: false,
    })
    : buildPvpInactiveMessage(cfg, now);

  await interaction.reply({
    content,
    ephemeral: true,
  });
}
