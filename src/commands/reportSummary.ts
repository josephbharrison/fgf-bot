import {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  AttachmentBuilder,
  PermissionFlagsBits,
} from "discord.js";
import JSZip from "jszip";
import fetch from "node-fetch";
import { getReportsForCurrentWindow } from "../services/store";
import { config } from "../config";

export const reportSummaryCommand = new SlashCommandBuilder()
  .setName("report-summary")
  .setDescription("Show NAP/PvP violation summary for current window")
  .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog);

export async function handleReportSummaryCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  if (!userHasOfficerRole(interaction)) {
    await interaction.reply({
      content: "You do not have permission to use this command.",
      ephemeral: true,
    });
    return;
  }

  const reports = getReportsForCurrentWindow().filter(
    (r) => r.status === "confirmed" && r.violation && r.violation.isViolation,
  );

  if (reports.length === 0) {
    await interaction.reply({
      content: "No confirmed violations in the current PvP window.",
      ephemeral: true,
    });
    return;
  }

  const byOffender = new Map<string, number>();
  for (const r of reports) {
    const offender = r.raw.winner || r.raw.attackerName;
    const key = offender || "unknown";
    byOffender.set(key, (byOffender.get(key) || 0) + 1);
  }

  const sorted = Array.from(byOffender.entries()).sort((a, b) => b[1] - a[1]);

  const lines = sorted.map(
    ([name, count], idx) => `${idx + 1}. ${name} — ${count} violations`,
  );

  await interaction.reply({
    content:
      "Confirmed violations in current PvP window:\n\n" + lines.join("\n"),
    ephemeral: true,
  });

  try {
    const zip = new JSZip();
    for (const r of reports) {
      if (!r.screenshotUrl) continue;
      const res = await fetch(r.screenshotUrl);
      if (!res.ok) continue;
      const buffer = Buffer.from(await res.arrayBuffer());
      const filename = `report-${r.id}.png`;
      zip.file(filename, buffer);
    }
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const attachment = new AttachmentBuilder(zipBuffer, {
      name: "violations.zip",
    });
    await interaction.followUp({
      content: "Attached screenshots for all confirmed violations.",
      files: [attachment],
      ephemeral: true,
    });
  } catch { }
}

function userHasOfficerRole(interaction: ChatInputCommandInteraction): boolean {
  const member = interaction.member;
  if (!member || !("roles" in member)) return false;
  const roles = member.roles as any;
  return config.officerRoleIds.some((roleId: string) =>
    roles.cache.has(roleId),
  );
}
