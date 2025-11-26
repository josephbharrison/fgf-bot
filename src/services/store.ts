// services/store.ts
import fs from "fs";
import { config } from "../config";
import { DataFile, PvpConfig, ReportCase, ReportStatus } from "../types";

function loadDataFile(): DataFile {
  if (!fs.existsSync(config.dataFilePath)) {
    return {
      reports: [],
      pvpConfig: null,
    };
  }
  const raw = fs.readFileSync(config.dataFilePath, "utf8");
  return JSON.parse(raw) as DataFile;
}

function saveDataFile(data: DataFile): void {
  fs.writeFileSync(config.dataFilePath, JSON.stringify(data, null, 2), "utf8");
}

let cache: DataFile | null = null;

function getData(): DataFile {
  if (!cache) {
    cache = loadDataFile();
  }
  return cache;
}

export function saveData(): void {
  if (cache) {
    saveDataFile(cache);
  }
}

export function upsertPvpConfig(pvp: PvpConfig): void {
  const data = getData();
  data.pvpConfig = pvp;
  saveData();
}

export function getPvpConfig(): PvpConfig | null {
  const data = getData();
  return data.pvpConfig;
}

export function addReport(report: ReportCase): void {
  const data = getData();
  data.reports.push(report);
  saveData();
}

export function updateReportStatus(id: string, status: ReportStatus): void {
  const data = getData();
  const r = data.reports.find((x) => x.id === id);
  if (r) {
    r.status = status;
    saveData();
  }
}

export function updateReportViolation(
  id: string,
  violation: ReportCase["violation"],
): void {
  const data = getData();
  const r = data.reports.find((x) => x.id === id);
  if (r) {
    r.violation = violation;
    saveData();
  }
}

export function getReportById(id: string): ReportCase | undefined {
  const data = getData();
  return data.reports.find((x) => x.id === id);
}

export function getReportsForCurrentWindow(): ReportCase[] {
  const data = getData();
  const pvp = data.pvpConfig;
  if (!pvp || !pvp.active || !pvp.startUtc || !pvp.endUtc) {
    return [];
  }
  const start = Date.parse(pvp.startUtc);
  const end = Date.parse(pvp.endUtc);
  return data.reports.filter((r) => {
    const t = Date.parse(r.raw.battleTimeUtc);
    if (Number.isNaN(t)) return false;
    return t >= start && t <= end;
  });
}
