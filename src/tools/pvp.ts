// tools/pvp.ts

export function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of list) {
    const key = item.trim();
    if (!key) continue;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(key);
    }
  }
  return result;
}

export function humanizeDelta(ms: number): string {
  if (ms <= 0) return "0m";

  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  const days = Math.floor(ms / DAY);
  ms %= DAY;
  const hours = Math.floor(ms / HOUR);
  ms %= HOUR;
  const mins = Math.floor(ms / MIN);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (mins > 0 || parts.length === 0) parts.push(`${mins}m`);

  return parts.join(" ");
}

export function applyRuleTemplates(
  rule: string,
  warZones: string[],
  napMembers: string[],
  seedGuilds: string[],
): string {
  return rule
    .replace("{WAR_ZONES}", warZones.join(", "))
    .replace("{NAP_MEMBERS}", napMembers.join(", "))
    .replace("{SEED_GUILDS}", seedGuilds.join(", "));
}
