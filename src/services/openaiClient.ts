// services/openaiClient.ts
import OpenAI from "openai";
import { Agent, run } from "@openai/agents";
import { config } from "../config";
import { BattleReportRaw } from "../types";
import { pvpStatusTool } from "../gpt/pvp";
import { pvpPreviewTool } from "../gpt/pvpPreview";
import { pvpPreviewCommand } from "../commands/pvpPreview";

const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

export async function extractBattleReportFromImage(
  imageUrl: string,
): Promise<BattleReportRaw> {
  const systemPrompt =
    "You parse battle report screenshots from the game Foundation: Galactic Frontier. " +
    "Return a strict JSON object. If a field is unknown, use null or empty string. " +
    "Return ONLY the JSON object with no extra text.";

  const schemaDescription =
    "Expected JSON keys: attackerName (string), attackerGuild (string|null), defenderName (string), defenderGuild (string|null), " +
    "systemName (string), systemCoordinates ({x:number|null,y:number|null}|null), battleTimeText (string), battleTimeUtc (string), " +
    "battleType (fleet_vs_fleet|fleet_vs_base|trade_escort|other), isTradeOrEscort (boolean), winner (string|null), loser (string|null), " +
    "attackerPower (number|null), defenderPower (number|null).";

  const response = await openai.responses.create({
    model: config.ocrModel,
    input: [
      {
        role: "system",
        content: systemPrompt + " " + schemaDescription,
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "Parse this battle report screenshot. Time shown is already in UTC. " +
              "Return ONLY the JSON object, no extra text.",
          },
          {
            type: "input_image",
            image_url: imageUrl,
            detail: "high",
          },
        ],
      },
    ],
    max_output_tokens: 512,
  });

  const jsonText = response.output_text;
  if (!jsonText || typeof jsonText !== "string") {
    throw new Error("No text output returned from OCR");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new Error(
      "Failed to parse JSON from OCR response: " + (err as Error).message,
    );
  }

  return parsed as BattleReportRaw;
}

const napPvpAgent = new Agent({
  name: "NAP-PvP Assistant",
  instructions:
    "You are a helpful assistant for a NAP/PvP coordination bot on Discord. " +
    "Use the pvp_status tool whenever you need to know what is allowed or forbidden RIGHT NOW (current NAP-PvP status). " +
    "Use the pvp_preview tool whenever the user asks about the upcoming or configured NAP-PvP window and its rules. " +
    "Always base your answers strictly on the JSON returned by these tools.",
  model: config.ocrModel,
  tools: [pvpStatusTool, pvpPreviewTool],
});

export async function askAi(prompt: string): Promise<string> {
  const result = await run(napPvpAgent, prompt);

  if (!result.finalOutput) {
    throw new Error("No final output returned from AI");
  }

  return result.finalOutput;
}
