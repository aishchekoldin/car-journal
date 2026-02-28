import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { useData } from "@/lib/DataContext";
import type { MaintenanceRecord, EventType } from "@/lib/types";
import {
  getMonthlyTotals,
  getAvgPerMonth,
  getAvgPerYear,
  getPlannedTotal,
  getUnplannedTotal,
  getRefuelingTotal,
  getTotalSpent,
  getCostPerKm,
  getRecordCount,
} from "@/lib/stats";

type Period = "3m" | "6m" | "12m" | "all";

function formatCost(value: number, currency: string): string {
  return `${value.toLocaleString("ru-RU")} ${currency}`;
}

function filterByPeriod(records: { date: string; eventType: string }[], period: Period) {
  if (period === "all") return records;
  const now = new Date();
  const months = period === "3m" ? 3 : period === "6m" ? 6 : 12;
  const cutoff = new Date(now.getFullYear(), now.getMonth() - months, now.getDate());
  return records.filter((r) => r.date && new Date(r.date) >= cutoff);
}

function BarChart({ data }: { data: { month: string; total: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.total), 1);
  return (
    <View style={chartStyles.container}>
      <View style={chartStyles.barsRow}>
        {data.map((item, i) => {
          const height = Math.max((item.total / maxVal) * 120, 4);
          return (
            <View key={i} style={chartStyles.barCol}>
              <Text style={chartStyles.barValue}>
                {item.total > 0 ? `${Math.round(item.total / 1000)}k` : ""}
              </Text>
              <View
                style={[
                  chartStyles.bar,
                  {
                    height,
                    backgroundColor: item.total > 0 ? Colors.light.tint : Colors.light.border,
                  },
                ]}
              />
              <Text style={chartStyles.barLabel}>{item.month}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

interface CategoryInfo {
  key: EventType;
  label: string;
  color: string;
  bgColor: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const CATEGORIES: CategoryInfo[] = [
  { key: "planned", label: "Плановое", color: Colors.light.tint, bgColor: Colors.light.tintLight, icon: "build-outline" },
  { key: "unplanned", label: "Внеплановое", color: Colors.light.accent, bgColor: Colors.light.accentLight, icon: "warning-outline" },
  { key: "refueling", label: "Заправка", color: Colors.light.refueling, bgColor: Colors.light.refuelingBg, icon: "flame-outline" },
];

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "3m", label: "3 мес." },
  { key: "6m", label: "6 мес." },
  { key: "12m", label: "12 мес." },
  { key: "all", label: "Всё время" },
];

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { carRecords, car } = useData();
  const [period, setPeriod] = useState<Period>("6m");
  const [expandedCategory, setExpandedCategory] = useState<EventType | null>(null);
  const [chartCategory, setChartCategory] = useState<"all" | EventType>("all");

  const costRecords = useMemo(() => {
    const nonFuture = carRecords.filter((r) => r.eventType !== "future");
    return filterByPeriod(nonFuture, period) as typeof nonFuture;
  }, [carRecords, period]);

  const chartRecords = useMemo(() => {
    if (chartCategory === "all") return costRecords;
    return costRecords.filter((r) => r.eventType === chartCategory);
  }, [costRecords, chartCategory]);

  const chartMonths = useMemo(() => {
    if (period === "3m") return 3;
    if (period === "6m") return 6;
    if (period !== "all") return 12;
    if (costRecords.length === 0) return 12;
    const dates = costRecords.filter((r) => r.date).map((r) => new Date(r.date).getTime());
    if (dates.length === 0) return 12;
    const oldest = new Date(Math.min(...dates));
    const now = new Date();
    const span = (now.getFullYear() - oldest.getFullYear()) * 12 + (now.getMonth() - oldest.getMonth()) + 1;
    return Math.max(span, 3);
  }, [period, costRecords]);
  const monthlyData = getMonthlyTotals(chartRecords, chartMonths);
  const avgMonth = getAvgPerMonth(costRecords);
  const avgYear = getAvgPerYear(costRecords);
  const plannedTotal = getPlannedTotal(costRecords);
  const unplannedTotal = getUnplannedTotal(costRecords);
  const refuelingTotal = getRefuelingTotal(costRecords);
  const totalSpent = getTotalSpent(costRecords);
  const costPerKm = getCostPerKm(costRecords);
  const recordCount = getRecordCount(costRecords);

  const grandTotal = plannedTotal + unplannedTotal + refuelingTotal;
  const plannedPct = grandTotal > 0 ? Math.round((plannedTotal / grandTotal) * 100) : 0;
  const unplannedPct = grandTotal > 0 ? Math.round((unplannedTotal / grandTotal) * 100) : 0;
  const refuelingPct = grandTotal > 0 ? 100 - plannedPct - unplannedPct : 0;

  const hasData = costRecords.length > 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{
        paddingTop: Platform.OS === "web" ? 67 + 16 : insets.top + 16,
        paddingBottom: Platform.OS === "web" ? 34 + 90 : 100,
        paddingHorizontal: 20,
      }}
      contentInsetAdjustmentBehavior="automatic"
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Статистика</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.periodScroll} contentContainerStyle={styles.periodRow}>
        {PERIODS.map((p) => (
          <Pressable
            key={p.key}
            style={[styles.periodChip, period === p.key && styles.periodChipActive]}
            onPress={() => setPeriod(p.key)}
          >
            <Text style={[styles.periodChipText, period === p.key && styles.periodChipTextActive]}>
              {p.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {!hasData ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="bar-chart-outline" size={48} color={Colors.light.tabIconDefault} />
          <Text style={styles.emptyTitle}>Данных пока нет</Text>
          <Text style={styles.emptySubtitle}>Добавьте записи, чтобы увидеть статистику расходов</Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Расходы ({period === "all" ? "всё время" : `последние ${chartMonths} мес.`})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chartFilterScroll} contentContainerStyle={styles.chartFilterRow}>
              {[{ key: "all" as const, label: "Все" }, ...CATEGORIES].map((cat) => {
                const isActive = chartCategory === cat.key;
                const chipColor = cat.key === "all" ? Colors.light.tint : (cat as CategoryInfo).color;
                return (
                  <Pressable
                    key={cat.key}
                    style={[styles.chartFilterChip, isActive && { backgroundColor: chipColor, borderColor: chipColor }]}
                    onPress={() => setChartCategory(cat.key)}
                  >
                    <Text style={[styles.chartFilterChipText, isActive && { color: "#fff" }]}>
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
            <BarChart data={monthlyData} />
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: Colors.light.tintLight }]}>
                <Ionicons name="calendar-outline" size={20} color={Colors.light.tint} />
              </View>
              <Text style={styles.kpiLabel}>Среднее / мес.</Text>
              <Text style={styles.kpiValue}>{formatCost(avgMonth, car.currency)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: Colors.light.accentLight }]}>
                <Ionicons name="trending-up-outline" size={20} color={Colors.light.accent} />
              </View>
              <Text style={styles.kpiLabel}>Среднее / год</Text>
              <Text style={styles.kpiValue}>{formatCost(avgYear, car.currency)}</Text>
            </View>
          </View>

          {costPerKm !== null && (
            <View style={styles.kpiRow}>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIcon, { backgroundColor: Colors.light.refuelingBg }]}>
                  <Ionicons name="speedometer-outline" size={20} color={Colors.light.refueling} />
                </View>
                <Text style={styles.kpiLabel}>Стоимость / км</Text>
                <Text style={styles.kpiValue}>{costPerKm.toFixed(2)} {car.currency}</Text>
              </View>
              <View style={styles.kpiCard}>
                <View style={[styles.kpiIcon, { backgroundColor: Colors.light.futureBg }]}>
                  <Ionicons name="document-text-outline" size={20} color={Colors.light.future} />
                </View>
                <Text style={styles.kpiLabel}>Записей</Text>
                <Text style={styles.kpiValue}>{recordCount}</Text>
              </View>
            </View>
          )}

          <View style={styles.card}>
            <Text style={styles.cardTitle}>По категориям</Text>
            <View style={styles.splitBar}>
              {plannedPct > 0 && (
                <View style={[styles.splitSegment, { flex: plannedPct, backgroundColor: Colors.light.tint, borderTopLeftRadius: 6, borderBottomLeftRadius: 6 }]} />
              )}
              {unplannedPct > 0 && (
                <View style={[styles.splitSegment, { flex: unplannedPct, backgroundColor: Colors.light.accent }]} />
              )}
              {refuelingPct > 0 && (
                <View style={[styles.splitSegment, { flex: refuelingPct, backgroundColor: Colors.light.refueling, borderTopRightRadius: 6, borderBottomRightRadius: 6 }]} />
              )}
            </View>

            {CATEGORIES.map((cat) => {
              const catTotal = cat.key === "planned" ? plannedTotal : cat.key === "unplanned" ? unplannedTotal : refuelingTotal;
              const catPct = cat.key === "planned" ? plannedPct : cat.key === "unplanned" ? unplannedPct : refuelingPct;
              const catRecords = costRecords
                .filter((r) => r.eventType === cat.key)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
              const isExpanded = expandedCategory === cat.key;

              return (
                <View key={cat.key}>
                  <Pressable
                    style={({ pressed }) => [styles.categoryRow, pressed && { opacity: 0.85 }]}
                    onPress={() => setExpandedCategory(isExpanded ? null : cat.key)}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: cat.bgColor }]}>
                      <Ionicons name={cat.icon} size={16} color={cat.color} />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryLabel}>{cat.label}</Text>
                      <Text style={styles.categoryPct}>{catPct}%</Text>
                    </View>
                    <Text style={styles.categoryTotal}>{formatCost(catTotal, car.currency)}</Text>
                    <Ionicons
                      name={isExpanded ? "chevron-up" : "chevron-down"}
                      size={16}
                      color={Colors.light.tabIconDefault}
                    />
                  </Pressable>

                  {isExpanded && (
                    <View style={styles.categoryRecords}>
                      {catRecords.length === 0 ? (
                        <Text style={styles.categoryEmpty}>Нет записей в этой категории</Text>
                      ) : (
                        catRecords.map((rec) => (
                          <Pressable
                            key={rec.id}
                            style={({ pressed }) => [styles.categoryRecordRow, pressed && { opacity: 0.85 }]}
                            onPress={() => router.push({ pathname: "/record-detail", params: { id: rec.id } })}
                          >
                            <View style={styles.categoryRecordInfo}>
                              <Text style={styles.categoryRecordTitle} numberOfLines={1}>{rec.title}</Text>
                              <Text style={styles.categoryRecordDate}>{formatDate(rec.date)}</Text>
                            </View>
                            <Text style={[styles.categoryRecordCost, { color: cat.color }]}>
                              {formatCost(rec.totalCost, rec.currency)}
                            </Text>
                          </Pressable>
                        ))
                      )}
                      {catRecords.length > 0 && (
                        <View style={styles.categorySubtotal}>
                          <Text style={styles.categorySubtotalLabel}>Итого {cat.label.toLowerCase()}</Text>
                          <Text style={[styles.categorySubtotalValue, { color: cat.color }]}>
                            {formatCost(catTotal, car.currency)}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
              <Text style={styles.summaryLabel}>Всего потрачено</Text>
              <Text style={styles.summaryValueLarge}>{formatCost(totalSpent, car.currency)}</Text>
              <Text style={styles.summaryNote}>{recordCount} записей</Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const chartStyles = StyleSheet.create({
  container: { marginTop: 12 },
  barsRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", height: 160, paddingTop: 16 },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: { width: 28, borderRadius: 6, minHeight: 4 },
  barValue: { fontFamily: "Inter_500Medium", fontSize: 10, color: Colors.light.textSecondary, marginBottom: 4 },
  barLabel: { fontFamily: "Inter_400Regular", fontSize: 10, color: Colors.light.textSecondary, marginTop: 6 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.light.text, marginBottom: 12 },
  periodScroll: { flexGrow: 0, marginBottom: 16 },
  periodRow: { gap: 8 },
  periodChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  periodChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  periodChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.light.textSecondary },
  periodChipTextActive: { color: "#fff" },
  summaryRow: { marginBottom: 16 },
  summaryCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryCardPrimary: {
    backgroundColor: Colors.light.tint,
  },
  summaryLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: "rgba(255,255,255,0.8)" },
  summaryValueLarge: { fontFamily: "Inter_700Bold", fontSize: 28, color: "#fff", marginTop: 4 },
  summaryNote: { fontFamily: "Inter_400Regular", fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.light.text },
  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center", marginBottom: 8 },
  kpiLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.light.textSecondary },
  kpiValue: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.light.text, marginTop: 4 },
  chartFilterScroll: { marginTop: 12, marginBottom: 4 },
  chartFilterRow: { gap: 6 },
  chartFilterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  chartFilterChipText: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.light.textSecondary },
  splitBar: { flexDirection: "row", height: 12, borderRadius: 6, overflow: "hidden", marginTop: 16, marginBottom: 16 },
  splitSegment: { height: 12 },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    gap: 10,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryInfo: { flex: 1 },
  categoryLabel: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.light.text },
  categoryPct: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.light.textSecondary, marginTop: 1 },
  categoryTotal: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.light.text, marginRight: 4 },
  categoryRecords: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    marginBottom: 8,
    marginTop: 4,
    padding: 10,
  },
  categoryEmpty: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.light.textSecondary, textAlign: "center" as const, paddingVertical: 12 },
  categoryRecordRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  categoryRecordInfo: { flex: 1, marginRight: 8 },
  categoryRecordTitle: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.light.text },
  categoryRecordDate: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.light.textSecondary, marginTop: 1 },
  categoryRecordCost: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  categorySubtotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 10,
    paddingHorizontal: 6,
    marginTop: 2,
  },
  categorySubtotalLabel: { fontFamily: "Inter_500Medium", fontSize: 12, color: Colors.light.textSecondary },
  categorySubtotalValue: { fontFamily: "Inter_700Bold", fontSize: 14 },
  emptyWrap: { alignItems: "center", paddingTop: 100 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.light.text, marginTop: 16 },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.light.textSecondary, marginTop: 4 },
});
