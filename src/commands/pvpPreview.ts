import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getPvpConfig } from "../services/store";
import { buildPvpActiveMessage } from "../utils/pvpActive";

export const pvpPreviewCommand = new SlashCommandBuilder()
  .setName("pvp-preview")
  .setDescription("Show the configured NAP/PvP window and rules");

export async function handlePvpPreviewCommand(
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

  const title = inWindow
    ? "Current NAP-PvP window"
    : "Next configured NAP-PvP window";

  const content = buildPvpActiveMessage(cfg, now, {
    isActive: inWindow,
    title,
    includeWindowTimes: true,
  });

  await interaction.reply({
    content,
    ephemeral: true,
  });
}
