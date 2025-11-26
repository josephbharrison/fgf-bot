// commands/pvpSetup.ts
import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { upsertPvpConfig } from "../services/store";
import { PvpConfig } from "../types";
import { config } from "../config";

function getNextWeekendUtc() {
  const now = new Date();
  const day = now.getUTCDay();

  const daysToSaturday = (6 - day + 7) % 7 || 7;
  const saturday = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysToSaturday,
      0,
      0,
      0,
      0,
    ),
  );

  const sundayEnd = new Date(
    Date.UTC(
      saturday.getUTCFullYear(),
      saturday.getUTCMonth(),
      saturday.getUTCDate() + 1,
      23,
      59,
      59,
      0,
    ),
  );

  return {
    startUtc: saturday.toISOString(),
    endUtc: sundayEnd.toISOString(),
  };
}

function parseCsv(input: string | null | undefined): string[] {
  if (!input) return [];
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of list) {
    if (!seen.has(item)) {
      seen.add(item);
      result.push(item);
    }
  }
  return result;
}

export const pvpSetupCommand = new SlashCommandBuilder()
  .setName("pvp-setup")
  .setDescription("Configure the PvP window and allowed systems")
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
  .addStringOption((opt) =>
    opt
      .setName("systems")
      .setDescription("Comma-separated list of allowed systems")
      .setRequired(true),
  )
  .addStringOption((opt) =>
    opt
      .setName("start_utc")
      .setDescription("Start UTC (ISO). Optional")
      .setRequired(false),
  )
  .addStringOption((opt) =>
    opt
      .setName("end_utc")
      .setDescription("End UTC (ISO). Optional")
      .setRequired(false),
  )
  .addStringOption((opt) =>
    opt
      .setName("nap_members")
      .setDescription("Protected NAP members (comma-separated)")
      .setRequired(false),
  )
  .addStringOption((opt) =>
    opt
      .setName("nap_rules")
      .setDescription("NAP rules or notes (comma-separated)")
      .setRequired(false),
  )
  .addStringOption((opt) =>
    opt
      .setName("seed_guilds")
      .setDescription("Our seed guilds (comma-separated)")
      .setRequired(false),
  );

export async function handlePvpSetupCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!userHasOfficerRole(interaction)) {
    await interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true,
    });
    return;
  }

  const suppliedStartUtc = interaction.options.getString("start_utc", false);
  const suppliedEndUtc = interaction.options.getString("end_utc", false);
  const systemsRaw = interaction.options.getString("systems", true);
  const napMembersRaw = interaction.options.getString("nap_members", false);
  const napRulesRaw = interaction.options.getString("nap_rules", false);
  const seedGuildsRaw = interaction.options.getString("seed_guilds", false);

  const { startUtc: defaultStartUtc, endUtc: defaultEndUtc } =
    getNextWeekendUtc();

  const startUtc = suppliedStartUtc || defaultStartUtc;
  const endUtc = suppliedEndUtc || defaultEndUtc;

  const start = Date.parse(startUtc);
  const end = Date.parse(endUtc);
  if (Number.isNaN(start) || Number.isNaN(end) || start >= end) {
    await interaction.reply({
      content: "Invalid start or end time.",
      ephemeral: true,
    });
    return;
  }

  const baseSystems = parseCsv(systemsRaw);

  const systemsWithWarZones = config.includeWarZones
    ? dedupe([...baseSystems, ...config.warZonesDefault])
    : dedupe(baseSystems);

  const baseNapMembers =
    napMembersRaw !== null && napMembersRaw !== undefined
      ? parseCsv(napMembersRaw)
      : config.napMembersDefault;

  const baseNapRules =
    napRulesRaw !== null && napRulesRaw !== undefined
      ? parseCsv(napRulesRaw)
      : config.napRulesDefault;

  const baseSeedGuilds =
    seedGuildsRaw !== null && seedGuildsRaw !== undefined
      ? parseCsv(seedGuildsRaw)
      : config.seedGuildsDefault;

  const seedGuilds = dedupe(baseSeedGuilds);

  const napMembers = dedupe([...baseNapMembers, ...seedGuilds]);

  const napRules = dedupe(baseNapRules);

  const cfg: PvpConfig = {
    active: true,
    startUtc,
    endUtc,
    allowedSystems: systemsWithWarZones,
    napMembers,
    napRules,
    seedGuilds,
  };

  upsertPvpConfig(cfg);

  const lines: string[] = [];
  lines.push("PvP configuration updated.");
  lines.push(`Start: ${startUtc}`);
  lines.push(`End: ${endUtc}`);
  lines.push(
    `Systems: ${systemsWithWarZones.length > 0 ? systemsWithWarZones.join(", ") : "None"}`,
  );
  if (napMembers.length > 0) {
    lines.push(`Protected NAP Members: ${napMembers.join(", ")}`);
  }
  if (seedGuilds.length > 0) {
    lines.push(`Seed Guilds: ${seedGuilds.join(", ")}`);
  }
  if (napRules.length > 0) {
    lines.push(`NAP Rules: ${napRules.join("; ")}`);
  }

  await interaction.reply({
    content: lines.join("\n"),
    ephemeral: true,
  });
}

function userHasOfficerRole(interaction: ChatInputCommandInteraction): boolean {
  const member = interaction.member;
  if (!member) return false;

  const officerRoleIds = config.officerRoleIds;
  if (officerRoleIds.length === 0) return false;

  const isGuildOwner = interaction.guild?.ownerId === interaction.user.id;
  const hasManageGuild = !!interaction.memberPermissions?.has(
    PermissionFlagsBits.ManageGuild,
  );

  let memberRoleIds: string[] = [];
  const anyMember: any = member;

  if (Array.isArray(anyMember.roles)) {
    memberRoleIds = anyMember.roles as string[];
  } else if (anyMember.roles && anyMember.roles.cache) {
    memberRoleIds = Array.from(anyMember.roles.cache.keys());
  }

  const hasOfficerRole = memberRoleIds.some((id) =>
    officerRoleIds.includes(id),
  );

  return isGuildOwner || hasManageGuild || hasOfficerRole;
}
