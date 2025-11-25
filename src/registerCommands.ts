import { REST, Routes } from "discord.js";
import { config } from "./config";
import { reportCommand } from "./commands/report";
import { reportSummaryCommand } from "./commands/reportSummary";
import { pvpCommand } from "./commands/pvp";
import { pvpSetupCommand } from "./commands/pvpSetup";

async function main() {
  const rest = new REST({ version: "10" }).setToken(config.discordToken);

  const commands = [
    reportCommand,
    reportSummaryCommand,
    pvpCommand,
    pvpSetupCommand,
  ].map((c) => c.toJSON());

  if (config.guildId) {
    await rest.put(
      Routes.applicationGuildCommands(config.discordClientId, config.guildId),
      { body: commands },
    );
  } else {
    await rest.put(Routes.applicationCommands(config.discordClientId), {
      body: commands,
    });
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
