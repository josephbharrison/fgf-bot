// commands/ai.ts
import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { askAi } from "../services/openaiClient";

export const aiCommand = new SlashCommandBuilder()
  .setName("ai")
  .setDescription("Ask the NAP-PvP assistant a question")
  .addStringOption((opt) =>
    opt
      .setName("prompt")
      .setDescription("Your question or prompt")
      .setRequired(true),
  );

export async function handleAiCommand(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  const prompt = interaction.options.getString("prompt", true);

  await interaction.deferReply({ ephemeral: true });

  try {
    const answer = await askAi(prompt);

    await interaction.editReply({
      content: answer,
    });
  } catch (err) {
    console.error("Error in /ai:", err);
    await interaction.editReply({
      content: "Failed to get a response from the AI. Please try again later.",
    });
  }
}
