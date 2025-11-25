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
  const day = now.getUTCDay(); // 0 = Sun, 6 = Sat

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
      .setDescription(
        "Start UTC (ISO). Optional — defaults to next Saturday 00:00 UTC",
      )
      .setRequired(false),
  )
  .addStringOption((opt) =>
    opt
      .setName("end_utc")
      .setDescription(
        "End UTC (ISO). Optional — defaults to end of next Sunday",
      )
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

  const systems = systemsRaw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const cfg: PvpConfig = {
    active: true,
    startUtc,
    endUtc,
    allowedSystems: systems,
  };

  upsertPvpConfig(cfg);

  await interaction.reply({
    content:
      "PvP configuration updated.\n" +
      `Start: ${startUtc}\nEnd: ${endUtc}\nSystems: ${systems.join(", ")}`,
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
