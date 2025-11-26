// bot.ts
import { Client, GatewayIntentBits, Interaction, Partials } from "discord.js";
import { config } from "./config";
import { handleReportButton, handleReportCommand } from "./commands/report";
import { handleReportSummaryCommand } from "./commands/reportSummary";
import { handlePvpCommand } from "./commands/pvp";
import { handlePvpPreviewCommand } from "./commands/pvpPreview";
import { handlePvpSetupCommand } from "./commands/pvpSetup";
import { handleAiCommand } from "./commands/ai";

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  partials: [Partials.Channel],
});

client.once("clientReady", () => {
  console.log(`Logged in as ${client.user?.tag}`);
});

client.on("interactionCreate", async (interaction: Interaction) => {
  try {
    if (interaction.isChatInputCommand()) {
      switch (interaction.commandName) {
        case "report":
          await handleReportCommand(interaction, config.pvpChannelId);
          break;
        case "report-summary":
          await handleReportSummaryCommand(interaction);
          break;
        case "pvp":
          await handlePvpCommand(interaction);
          break;
        case "pvp-preview":
          await handlePvpPreviewCommand(interaction);
          break;
        case "pvp-setup":
          await handlePvpSetupCommand(interaction);
          break;
        case "ai":
          await handleAiCommand(interaction);
          break;
        default:
          break;
      }
    } else if (interaction.isButton()) {
      await handleReportButton(interaction);
    }
  } catch (err) {
    console.error(err);
    if (interaction.isRepliable()) {
      try {
        await interaction.reply({
          content: "An error occurred while processing this interaction.",
          ephemeral: true,
        });
      } catch { }
    }
  }
});

client.login(config.discordToken);
