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

  const dates = records.map((r) => new Date(r.date).getTime());
  const minDate = new Date(Math.min(...dates));
  const maxDate = new Date(Math.max(...dates));
  const totalMonths =
    (maxDate.getFullYear() - minDate.getFullYear()) * 12 +
    (maxDate.getMonth() - minDate.getMonth()) +
    1;

  if (totalMonths <= 12) {
    const total = records.reduce((sum, r) => sum + r.totalCost, 0);
    return Math.round(total);
  }

  const fullYears = Math.floor(totalMonths / 12);
  const yearTotals: number[] = [];

  for (let y = 0; y < fullYears; y++) {
    const periodStart = new Date(minDate);
    periodStart.setMonth(periodStart.getMonth() + y * 12);
    const periodEnd = new Date(periodStart);
    periodEnd.setMonth(periodEnd.getMonth() + 12);

    const periodTotal = records
      .filter((r) => {
        const d = new Date(r.date).getTime();
        return d >= periodStart.getTime() && d < periodEnd.getTime();
      })
      .reduce((sum, r) => sum + r.totalCost, 0);
    yearTotals.push(periodTotal);
  }

  if (yearTotals.length === 0) return 0;
  const avg = yearTotals.reduce((s, v) => s + v, 0) / yearTotals.length;
  return Math.round(avg);
}

export function getPlannedTotal(records: MaintenanceRecord[]): number {
  return records.filter((r) => r.eventType === "planned").reduce((s, r) => s + r.totalCost, 0);
}

export function getUnplannedTotal(records: MaintenanceRecord[]): number {
  return records.filter((r) => r.eventType === "unplanned").reduce((s, r) => s + r.totalCost, 0);
}

export function getRefuelingTotal(records: MaintenanceRecord[]): number {
  return records.filter((r) => r.eventType === "refueling").reduce((s, r) => s + r.totalCost, 0);
}

export function getTotalSpent(records: MaintenanceRecord[]): number {
  return records.reduce((s, r) => s + r.totalCost, 0);
}

export function getCostPerKm(records: MaintenanceRecord[]): number | null {
  if (records.length < 2) return null;
  const sorted = [...records].sort((a, b) => a.mileageKm - b.mileageKm);
  const minKm = sorted[0].mileageKm;
  const maxKm = sorted[sorted.length - 1].mileageKm;
  const diff = maxKm - minKm;
  if (diff <= 0) return null;
  const total = records.reduce((s, r) => s + r.totalCost, 0);
  return Math.round((total / diff) * 100) / 100;
}

export function getRecordCount(records: MaintenanceRecord[]): number {
  return records.length;
}

export function getMonthlyTotalsByType(
  records: MaintenanceRecord[],
  months: number = 12
): { month: string; planned: number; unplanned: number; refueling: number }[] {
  const now = new Date();
  const result: { month: string; planned: number; unplanned: number; refueling: number }[] = [];

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" });
    const monthRecords = records.filter((r) => r.date.startsWith(key));
    result.push({
      month: label,
      planned: monthRecords.filter((r) => r.eventType === "planned").reduce((s, r) => s + r.totalCost, 0),
      unplanned: monthRecords.filter((r) => r.eventType === "unplanned").reduce((s, r) => s + r.totalCost, 0),
      refueling: monthRecords.filter((r) => r.eventType === "refueling").reduce((s, r) => s + r.totalCost, 0),
    });
  }

  return result;
}

export function getYearlyTotals(records: MaintenanceRecord[]): { year: string; total: number }[] {
  const byYear = new Map<string, number>();
  for (const r of records) {
    if (!r.date) continue;
    const year = r.date.slice(0, 4);
    byYear.set(year, (byYear.get(year) || 0) + r.totalCost);
  }
  return Array.from(byYear.entries())
    .map(([year, total]) => ({ year, total }))
    .sort((a, b) => a.year.localeCompare(b.year));
}
