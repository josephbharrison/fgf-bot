// commands/report.ts
import {
  ActionRowBuilder,
  Attachment,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  SlashCommandBuilder,
} from "discord.js";
import { extractBattleReportFromImage } from "../services/openaiClient";
import {
  addReport,
  updateReportStatus,
  updateReportViolation,
} from "../services/store";
import { evaluateViolation } from "../services/rulesEngine";
import { BattleReportRaw, ReportCase } from "../types";

function buildSummary(raw: BattleReportRaw): string {
  const lines: string[] = [];
  lines.push(`System: ${raw.systemName || "unknown"}`);
  lines.push(`Time (UTC): ${raw.battleTimeUtc || raw.battleTimeText}`);
  lines.push(
    `Attacker: ${raw.attackerGuild ? `[${raw.attackerGuild}]` : ""}${raw.attackerName
    }`,
  );
  lines.push(
    `Defender: ${raw.defenderGuild ? `[${raw.defenderGuild}]` : ""}${raw.defenderName
    }`,
  );
  lines.push(`Trade/Escort: ${raw.isTradeOrEscort ? "yes" : "no"}`);
  lines.push(`Battle type: ${raw.battleType}`);
  lines.push(`Winner: ${raw.winner || "unknown"}`);
  return lines.join("\n");
}

export const reportCommand = new SlashCommandBuilder()
  .setName("report")
  .setDescription("Report a battle for NAP/PvP review")
  .addAttachmentOption((opt) =>
    opt
      .setName("screenshot")
      .setDescription("Battle report screenshot")
      .setRequired(true),
  );

export async function handleReportCommand(
  interaction: ChatInputCommandInteraction,
  pvpChannelId: string,
): Promise<void> {
  if (interaction.channelId !== pvpChannelId) {
    await interaction.reply({
      content: "Please use this command in the designated NAP-PvP channel.",
      ephemeral: true,
    });
    return;
  }

  const attachment = interaction.options.getAttachment("screenshot");
  if (!attachment) {
    await interaction.reply({
      content: "Screenshot is required.",
      ephemeral: true,
    });
    return;
  }

  if (!isImageAttachment(attachment)) {
    await interaction.reply({
      content: "Attachment must be an image.",
      ephemeral: true,
    });
    return;
  }

  await interaction.reply({
    content: "Processing screenshot, please wait.",
    ephemeral: true,
  });

  let raw: BattleReportRaw;
  try {
    raw = await extractBattleReportFromImage(attachment.url);
  } catch (err) {
    await interaction.editReply({
      content: "Failed to parse screenshot. Please try again.",
    });
    return;
  }

  const id = `${Date.now()}-${interaction.user.id}`;
  const nowUtc = new Date().toISOString();

  const report: ReportCase = {
    id,
    reporterDiscordId: interaction.user.id,
    screenshotUrl: attachment.url,
    raw,
    violation: null,
    createdAtUtc: nowUtc,
    status: "pending",
  };

  addReport(report);

  const summary = buildSummary(raw);

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`report_approve_${id}`)
      .setLabel("Approve")
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId(`report_dismiss_${id}`)
      .setLabel("Dismiss")
      .setStyle(ButtonStyle.Secondary),
  );

  await interaction.editReply({
    content: "Review parsed report below:\n\n" + summary,
    components: [row],
  });
}

function isImageAttachment(a: Attachment): boolean {
  const ct = a.contentType || "";
  return ct.startsWith("image/");
}

export async function handleReportButton(
  interaction: ButtonInteraction,
): Promise<void> {
  const customId = interaction.customId;
  if (!customId.startsWith("report_")) return;

  const parts = customId.split("_");
  const action = parts[1];
  const id = parts.slice(2).join("_");

  if (action === "approve") {
    await handleApprove(interaction, id);
  } else if (action === "dismiss") {
    await handleDismiss(interaction, id);
  }
}

async function handleApprove(
  interaction: ButtonInteraction,
  id: string,
): Promise<void> {
  const report = await import("../services/store.js").then((m) =>
    m.getReportById(id),
  );
  if (!report) {
    await interaction.reply({
      content: "Report not found.",
      ephemeral: true,
    });
    return;
  }

  if (report.reporterDiscordId !== interaction.user.id) {
    await interaction.reply({
      content: "Only the original reporter can approve or dismiss this report.",
      ephemeral: true,
    });
    return;
  }

  const violation = evaluateViolation(report.raw);
  updateReportViolation(id, violation);
  updateReportStatus(id, "confirmed");

  const verdict = violation.isViolation ? "Violation" : "No violation";
  const reasons = violation.reasons.join(", ");

  await interaction.update({
    content:
      interaction.message.content +
      `\n\nFinalized by ${interaction.user.tag}.\nVerdict: ${verdict}\nReasons: ${reasons}`,
    components: [],
  });
}

async function handleDismiss(
  interaction: ButtonInteraction,
  id: string,
): Promise<void> {
  const report = await import("../services/store.js").then((m) =>
    m.getReportById(id),
  );
  if (!report) {
    await interaction.reply({
      content: "Report not found.",
      ephemeral: true,
    });
    return;
  }

  if (report.reporterDiscordId !== interaction.user.id) {
    await interaction.reply({
      content: "Only the original reporter can approve or dismiss this report.",
      ephemeral: true,
    });
    return;
  }

  updateReportStatus(id, "dismissed");

  await interaction.update({
    content:
      interaction.message.content +
      `\n\nReport dismissed by ${interaction.user.tag}.`,
    components: [],
  });
}
