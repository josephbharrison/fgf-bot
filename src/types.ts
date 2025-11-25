export type BattleType =
  | "fleet_vs_fleet"
  | "fleet_vs_base"
  | "trade_escort"
  | "other";

export interface BattleReportRaw {
  attackerName: string;
  attackerGuild: string | null;
  defenderName: string;
  defenderGuild: string | null;
  systemName: string;
  systemCoordinates: { x: number | null; y: number | null } | null;
  battleTimeText: string;
  battleTimeUtc: string;
  battleType: BattleType;
  isTradeOrEscort: boolean;
  winner: string | null;
  loser: string | null;
  attackerPower: number | null;
  defenderPower: number | null;
}

export type ViolationReason =
  | "outside_window"
  | "system_not_allowed"
  | "trade_or_escort"
  | "none";

export interface ViolationResult {
  isViolation: boolean;
  reasons: ViolationReason[];
}

export type ReportStatus = "pending" | "confirmed" | "dismissed";

export interface ReportCase {
  id: string;
  reporterDiscordId: string;
  screenshotUrl: string;
  raw: BattleReportRaw;
  violation: ViolationResult | null;
  createdAtUtc: string;
  status: ReportStatus;
}

export interface PvpConfig {
  active: boolean;
  startUtc: string | null;
  endUtc: string | null;
  allowedSystems: string[];
}

export interface DataFile {
  reports: ReportCase[];
  pvpConfig: PvpConfig | null;
}
