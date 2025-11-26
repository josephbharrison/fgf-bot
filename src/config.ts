// config.ts
import dotenv from "dotenv";

dotenv.config();

export interface BotConfig {
  discordToken: string;
  discordClientId: string;
  guildId?: string;
  officerRoleIds: string[];
  pvpChannelId: string;
  dataFilePath: string;
  openaiApiKey: string;
  ocrModel: string;
  napMembersDefault: string[];
  napRulesDefault: string[];
  seedGuildsDefault: string[];
  warZonesDefault: string[];
  includeWarZones: boolean;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var ${name}`);
  }
  return value;
}

function parseCsvEnv(name: string): string[] {
  const raw = process.env[name] || "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config: BotConfig = {
  discordToken: requireEnv("DISCORD_TOKEN"),
  discordClientId: requireEnv("DISCORD_CLIENT_ID"),
  guildId: process.env.DISCORD_GUILD_ID,
  officerRoleIds: (process.env.OFFICER_ROLE_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  pvpChannelId: requireEnv("PVP_CHANNEL_ID"),
  dataFilePath: process.env.DATA_FILE_PATH || "data.json",
  openaiApiKey: requireEnv("OPENAI_API_KEY"),
  ocrModel: process.env.OCR_MODEL || "gpt-4o-mini",
  napMembersDefault: parseCsvEnv("NAP_MEMBERS"),
  napRulesDefault: parseCsvEnv("NAP_RULES"),
  seedGuildsDefault: parseCsvEnv("SEED_GUILDS"),
  warZonesDefault: parseCsvEnv("WAR_ZONES"),
  includeWarZones:
    process.env.INCLUDE_WAR_ZONES === undefined
      ? true
      : ["true", "1", "yes"].includes(
        process.env.INCLUDE_WAR_ZONES.toLowerCase(),
      ),
};
