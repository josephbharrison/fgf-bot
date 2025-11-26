// services/openaiClient.ts
import OpenAI from "openai";
import { config } from "../config";
import { BattleReportRaw } from "../types";

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

export async function askAi(prompt: string): Promise<string> {
  const response = await openai.responses.create({
    model: config.ocrModel,
    input: [
      {
        role: "system",
        content:
          "You are a helpful assistant for a NAP/PvP coordination bot on Discord. " +
          "Answer clearly and concisely.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_output_tokens: 512,
  });

  const text = response.output_text;
  if (!text || typeof text !== "string") {
    throw new Error("No text output returned from model");
  }

  return text.trim();
}
