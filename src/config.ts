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
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env var ${name}`);
  }
  return value;
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
};

const defaultNapMembers = ["SP", "SP2", "BA", "HKA", "IFR2"];

export const NAP_MEMBERS: string[] = (process.env.NAP_MEMBERS ||
  defaultNapMembers.join(","))!
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const defaultNapRules = [
  "Attacking trade ships is prohibited.",
  "Attacking IFR2 is prohibited.",
];

export const NAP_RULES: string[] = process.env.NAP_RULES
  ? process.env.NAP_RULES.split("|")
    .map((s) => s.trim())
    .filter(Boolean)
  : defaultNapRules;
