import type { MaintenanceRecord } from "./types";

export interface MonthlyTotal {
  month: string;
  total: number;
}

export function getMonthlyTotals(records: MaintenanceRecord[], months: number = 12): MonthlyTotal[] {
  const now = new Date();
  const result: MonthlyTotal[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" });
    const total = records
      .filter((r) => r.date.startsWith(key))
      .reduce((sum, r) => sum + r.totalCost, 0);
    result.push({ month: label, total });
  }

  return result;
}

export function getAvgPerMonth(records: MaintenanceRecord[]): number {
  if (records.length === 0) return 0;
  const dates = records.map((r) => new Date(r.date).getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  const diffMonths =
    (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
    (maxDate.getMonth() - minDate.getMonth()) +
    1;
  const total = records.reduce((sum, r) => sum + r.totalCost, 0);
  return Math.round(total / Math.max(diffMonths, 1));
}

export function getAvgPerYear(records: MaintenanceRecord[]): number {
  if (records.length === 0) return 0;
  const avg = getAvgPerMonth(records);
  return avg * 12;
}

export function getPlannedTotal(records: MaintenanceRecord[]): number {
  return records.filter((r) => r.eventType === "planned").reduce((s, r) => s + r.totalCost, 0);
}

export function getUnplannedTotal(records: MaintenanceRecord[]): number {
  return records.filter((r) => r.eventType === "unplanned").reduce((s, r) => s + r.totalCost, 0);
}
