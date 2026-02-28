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
import Colors from "@/constants/colors";
import { useData } from "@/lib/DataContext";
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

  const costRecords = useMemo(() => {
    const nonFuture = carRecords.filter((r) => r.eventType !== "future");
    return filterByPeriod(nonFuture, period) as typeof nonFuture;
  }, [carRecords, period]);

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
  const monthlyData = getMonthlyTotals(costRecords, chartMonths);
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
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.summaryCardPrimary]}>
              <Text style={styles.summaryLabel}>Всего потрачено</Text>
              <Text style={styles.summaryValueLarge}>{formatCost(totalSpent, car.currency)}</Text>
              <Text style={styles.summaryNote}>{recordCount} записей</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              Расходы ({period === "all" ? "всё время" : `последние ${chartMonths} мес.`})
            </Text>
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
            <View style={styles.splitLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.light.tint }]} />
                <Text style={styles.legendLabel}>Плановое {plannedPct}%</Text>
                <Text style={styles.legendValue}>{formatCost(plannedTotal, car.currency)}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.light.accent }]} />
                <Text style={styles.legendLabel}>Внеплановое {unplannedPct}%</Text>
                <Text style={styles.legendValue}>{formatCost(unplannedTotal, car.currency)}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.light.refueling }]} />
                <Text style={styles.legendLabel}>Заправка {refuelingPct}%</Text>
                <Text style={styles.legendValue}>{formatCost(refuelingTotal, car.currency)}</Text>
              </View>
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
  splitBar: { flexDirection: "row", height: 12, borderRadius: 6, overflow: "hidden", marginTop: 16, marginBottom: 16 },
  splitSegment: { height: 12 },
  splitLegend: { gap: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.light.textSecondary, flex: 1 },
  legendValue: { fontFamily: "Inter_600SemiBold", fontSize: 13, color: Colors.light.text },
  emptyWrap: { alignItems: "center", paddingTop: 100 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.light.text, marginTop: 16 },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.light.textSecondary, marginTop: 4 },
});
