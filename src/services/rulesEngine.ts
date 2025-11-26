// services/rulesEngine.ts
import { getPvpConfig } from "./store";
import { BattleReportRaw, ViolationReason, ViolationResult } from "../types";

export function evaluateViolation(raw: BattleReportRaw): ViolationResult {
  const reasons: ViolationReason[] = [];
  const config = getPvpConfig();

  if (!config || !config.active || !config.startUtc || !config.endUtc) {
    reasons.push("outside_window");
    return { isViolation: true, reasons };
  }

  if (raw.isTradeOrEscort) {
    reasons.push("trade_or_escort");
  }

  const t = Date.parse(raw.battleTimeUtc);
  if (Number.isNaN(t)) {
    reasons.push("outside_window");
  } else {
    const start = Date.parse(config.startUtc);
    const end = Date.parse(config.endUtc);
    if (t < start || t > end) {
      reasons.push("outside_window");
    }
  }

  const systemNameNormalized = raw.systemName.trim().toLowerCase();
  const allowed = config.allowedSystems.map((s) => s.trim().toLowerCase());
  if (
    systemNameNormalized.length === 0 ||
    !allowed.includes(systemNameNormalized)
  ) {
    reasons.push("system_not_allowed");
  }

  if (reasons.length === 0) {
    return { isViolation: false, reasons: ["none"] };
  }
  return { isViolation: true, reasons };
}
