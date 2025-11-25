import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { getPvpConfig } from "../services/store";

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

  let status: string;
  let deltaMs: number;
  if (now < start) {
    status = "PvP is not active.";
    deltaMs = start - now;
  } else if (now > end) {
    status = "PvP window has ended.";
    deltaMs = 0;
  } else {
    status = "PvP is active.";
    deltaMs = end - now;
  }

  const hours = Math.floor(deltaMs / (1000 * 60 * 60));
  const mins = Math.floor((deltaMs % (1000 * 60 * 60)) / (1000 * 60));

  const systemsList =
    cfg.allowedSystems.length > 0
      ? cfg.allowedSystems.join(", ")
      : "None configured";

  const msgLines: string[] = [];
  msgLines.push(status);
  if (deltaMs > 0) {
    const label = now < start ? "Starts in" : "Ends in";
    msgLines.push(`${label}: ${hours}h ${mins}m`);
  }
  msgLines.push("");
  msgLines.push("Allowed systems:");
  msgLines.push(systemsList);

  await interaction.reply({
    content: msgLines.join("\n"),
    ephemeral: true,
  });
}
