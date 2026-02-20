import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Colors from "@/constants/colors";
import { useData } from "@/lib/DataContext";
import { getMonthlyTotals, getAvgPerMonth, getAvgPerYear, getPlannedTotal, getUnplannedTotal } from "@/lib/stats";

function formatCost(value: number, currency: string): string {
  return `${value.toLocaleString("ru-RU")} ${currency}`;
}

function BarChart({ data, currency }: { data: { month: string; total: number }[]; currency: string }) {
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

export default function StatsScreen() {
  const insets = useSafeAreaInsets();
  const { records, car } = useData();

  const monthlyData = getMonthlyTotals(records, 6);
  const avgMonth = getAvgPerMonth(records);
  const avgYear = getAvgPerYear(records);
  const plannedTotal = getPlannedTotal(records);
  const unplannedTotal = getUnplannedTotal(records);
  const grandTotal = plannedTotal + unplannedTotal;
  const plannedPct = grandTotal > 0 ? Math.round((plannedTotal / grandTotal) * 100) : 0;
  const unplannedPct = grandTotal > 0 ? 100 - plannedPct : 0;

  const hasData = records.length > 0;

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
      <Text style={styles.title}>Statistics</Text>

      {!hasData ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="bar-chart-outline" size={48} color={Colors.light.tabIconDefault} />
          <Text style={styles.emptyTitle}>No data yet</Text>
          <Text style={styles.emptySubtitle}>Add records to see your spending stats</Text>
        </View>
      ) : (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Spending (last 6 months)</Text>
            <BarChart data={monthlyData} currency={car.currency} />
          </View>

          <View style={styles.kpiRow}>
            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: Colors.light.tintLight }]}>
                <Ionicons name="calendar-outline" size={20} color={Colors.light.tint} />
              </View>
              <Text style={styles.kpiLabel}>Avg / month</Text>
              <Text style={styles.kpiValue}>{formatCost(avgMonth, car.currency)}</Text>
            </View>
            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: Colors.light.accentLight }]}>
                <Ionicons name="trending-up-outline" size={20} color={Colors.light.accent} />
              </View>
              <Text style={styles.kpiLabel}>Avg / year</Text>
              <Text style={styles.kpiValue}>{formatCost(avgYear, car.currency)}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Planned vs Unplanned</Text>
            <View style={styles.splitBar}>
              {plannedPct > 0 && (
                <View
                  style={[
                    styles.splitSegment,
                    {
                      flex: plannedPct,
                      backgroundColor: Colors.light.tint,
                      borderTopLeftRadius: 6,
                      borderBottomLeftRadius: 6,
                      borderTopRightRadius: unplannedPct === 0 ? 6 : 0,
                      borderBottomRightRadius: unplannedPct === 0 ? 6 : 0,
                    },
                  ]}
                />
              )}
              {unplannedPct > 0 && (
                <View
                  style={[
                    styles.splitSegment,
                    {
                      flex: unplannedPct,
                      backgroundColor: Colors.light.accent,
                      borderTopRightRadius: 6,
                      borderBottomRightRadius: 6,
                      borderTopLeftRadius: plannedPct === 0 ? 6 : 0,
                      borderBottomLeftRadius: plannedPct === 0 ? 6 : 0,
                    },
                  ]}
                />
              )}
            </View>
            <View style={styles.splitLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.light.tint }]} />
                <Text style={styles.legendLabel}>Planned {plannedPct}%</Text>
                <Text style={styles.legendValue}>{formatCost(plannedTotal, car.currency)}</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.light.accent }]} />
                <Text style={styles.legendLabel}>Unplanned {unplannedPct}%</Text>
                <Text style={styles.legendValue}>{formatCost(unplannedTotal, car.currency)}</Text>
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
  title: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.light.text, marginBottom: 20 },
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
