import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import Colors from "@/constants/colors";
import { useData } from "@/lib/DataContext";
import { getAvgPerMonth, getAvgPerYear } from "@/lib/stats";
import { calcNextService, getServiceInterval } from "@/lib/service-intervals";

function formatCost(value: number, currency: string): string {
  return `${value.toLocaleString("ru-RU")} ${currency}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

function formatDateLong(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function getBadgeStyle(eventType: string) {
  if (eventType === "planned") return { bg: Colors.light.plannedBg, text: Colors.light.planned, label: "Плановое" };
  if (eventType === "refueling") return { bg: Colors.light.refuelingBg, text: Colors.light.refueling, label: "Заправка" };
  if (eventType === "future") return { bg: Colors.light.futureBg, text: Colors.light.future, label: "На будущее" };
  return { bg: Colors.light.unplannedBg, text: Colors.light.unplanned, label: "Внеплановое" };
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { records, car, isLoading } = useData();

  const nonFutureRecords = records.filter((r) => r.eventType !== "future");
  const sorted = [...nonFutureRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const lastRecord = sorted.length > 0 ? sorted[0] : null;
  const lastMileage = lastRecord ? lastRecord.mileageKm : null;
  const avgMonth = getAvgPerMonth(nonFutureRecords);
  const avgYear = getAvgPerYear(nonFutureRecords);
  const nextService = calcNextService(records, car);
  const { intervalKm, isCustom } = getServiceInterval(car);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

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
      <Text style={styles.greeting}>Журнал авто</Text>

      <View style={styles.heroCard}>
        {car.photoUri ? (
          <Image source={{ uri: car.photoUri }} style={styles.heroImage} contentFit="cover" />
        ) : (
          <View style={styles.heroPlaceholder}>
            <Ionicons name="car-sport" size={64} color={Colors.light.tint} />
          </View>
        )}
        <View style={styles.heroOverlay}>
          <Text style={styles.carName}>{car.make} {car.model}</Text>
          {car.year ? <Text style={styles.carYear}>{car.year}</Text> : null}
        </View>
      </View>

      <View style={styles.infoCard}>
        <View style={styles.infoRow}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="speedometer-outline" size={20} color={Colors.light.tint} />
          </View>
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoLabel}>Текущий пробег</Text>
            <Text style={styles.infoValue}>
              {lastMileage ? `${lastMileage.toLocaleString("ru-RU")} км` : "Нет данных"}
            </Text>
          </View>
        </View>
        {car.vin ? (
          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Ionicons name="barcode-outline" size={20} color={Colors.light.tint} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>VIN</Text>
              <Text style={styles.infoValue}>{car.vin}</Text>
            </View>
          </View>
        ) : null}
      </View>

      <Text style={styles.sectionTitle}>Следующее ТО</Text>
      {nextService ? (
        <View style={[styles.serviceCard, nextService.overdue && styles.serviceCardOverdue]}>
          <View style={styles.serviceRow}>
            <View style={[styles.serviceIconWrap, nextService.overdue && styles.serviceIconOverdue]}>
              <Ionicons
                name={nextService.overdue ? "warning-outline" : "build-outline"}
                size={22}
                color={nextService.overdue ? Colors.light.danger : Colors.light.tint}
              />
            </View>
            <View style={styles.serviceInfo}>
              <Text style={[styles.serviceLabel, nextService.overdue && { color: Colors.light.danger }]}>
                {nextService.overdue ? "ТО просрочено!" : "Предстоящее ТО"}
              </Text>
              <Text style={styles.serviceDate}>
                {formatDateLong(nextService.byDate)}
                {nextService.daysLeft !== null && !nextService.overdue
                  ? ` (${nextService.daysLeft} дн.)`
                  : ""}
              </Text>
            </View>
          </View>
          <View style={styles.serviceMeta}>
            <View style={styles.serviceMetaItem}>
              <Text style={styles.serviceMetaLabel}>При пробеге</Text>
              <Text style={styles.serviceMetaValue}>{nextService.byMileageKm.toLocaleString("ru-RU")} км</Text>
            </View>
            {nextService.kmLeft !== null && (
              <View style={styles.serviceMetaItem}>
                <Text style={styles.serviceMetaLabel}>Осталось</Text>
                <Text style={[styles.serviceMetaValue, nextService.kmLeft < 0 && { color: Colors.light.danger }]}>
                  {nextService.kmLeft > 0 ? `${nextService.kmLeft.toLocaleString("ru-RU")} км` : "Просрочено"}
                </Text>
              </View>
            )}
          </View>
          <Text style={styles.serviceNote}>
            Интервал: каждые {intervalKm.toLocaleString("ru-RU")} км {isCustom ? "(свой)" : `(${car.make})`}
          </Text>
        </View>
      ) : (
        <View style={styles.emptyServiceCard}>
          <Ionicons name="build-outline" size={28} color={Colors.light.tabIconDefault} />
          <Text style={styles.emptyServiceText}>
            Добавьте запись планового ТО, чтобы увидеть дату следующего обслуживания
          </Text>
        </View>
      )}

      <Text style={styles.sectionTitle}>Последний расход</Text>
      {lastRecord ? (
        <Pressable
          style={({ pressed }) => [styles.lastExpenseCard, pressed && styles.cardPressed]}
          onPress={() => router.push({ pathname: "/record-detail", params: { id: lastRecord.id } })}
        >
          <View style={styles.lastExpenseTop}>
            <Text style={styles.lastExpenseDate}>{formatDate(lastRecord.date)}</Text>
            <View style={[styles.badge, { backgroundColor: getBadgeStyle(lastRecord.eventType).bg }]}>
              <Text style={[styles.badgeText, { color: getBadgeStyle(lastRecord.eventType).text }]}>
                {getBadgeStyle(lastRecord.eventType).label}
              </Text>
            </View>
          </View>
          <Text style={styles.lastExpenseTitle}>{lastRecord.title}</Text>
          <Text style={styles.lastExpenseTotal}>
            {formatCost(lastRecord.totalCost, lastRecord.currency)}
          </Text>
          <View style={styles.openRow}>
            <Text style={styles.openText}>Подробнее</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.light.tint} />
          </View>
        </Pressable>
      ) : (
        <View style={styles.emptyCard}>
          <Ionicons name="receipt-outline" size={36} color={Colors.light.tabIconDefault} />
          <Text style={styles.emptyText}>Расходов пока нет</Text>
          <Pressable style={styles.addBtn} onPress={() => router.push("/add-record")}>
            <Text style={styles.addBtnText}>Добавить запись</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.sectionTitle}>Обзор</Text>
      <View style={styles.kpiRow}>
        <View style={styles.kpiCard}>
          <Ionicons name="calendar-outline" size={22} color={Colors.light.tint} />
          <Text style={styles.kpiLabel}>Среднее / мес.</Text>
          <Text style={styles.kpiValue}>
            {nonFutureRecords.length > 0 ? formatCost(avgMonth, car.currency) : "Нет данных"}
          </Text>
        </View>
        <View style={styles.kpiCard}>
          <Ionicons name="trending-up-outline" size={22} color={Colors.light.accent} />
          <Text style={styles.kpiLabel}>Среднее / год</Text>
          <Text style={styles.kpiValue}>
            {nonFutureRecords.length > 0 ? formatCost(avgYear, car.currency) : "Нет данных"}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: Colors.light.background },
  greeting: {
    fontFamily: "Inter_700Bold",
    fontSize: 28,
    color: Colors.light.text,
    marginBottom: 20,
  },
  heroCard: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: Colors.light.surface,
    marginBottom: 16,
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  heroImage: { width: "100%", height: 180 },
  heroPlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: Colors.light.tintLight,
    justifyContent: "center",
    alignItems: "center",
  },
  heroOverlay: { padding: 16 },
  carName: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.light.text },
  carYear: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.light.textSecondary, marginTop: 2 },
  infoCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  infoRow: { flexDirection: "row", alignItems: "center", paddingVertical: 8 },
  infoIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.tintLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  infoTextWrap: { flex: 1 },
  infoLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.light.textSecondary },
  infoValue: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.light.text, marginTop: 1 },
  sectionTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 18,
    color: Colors.light.text,
    marginBottom: 12,
  },
  serviceCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.tint,
  },
  serviceCardOverdue: {
    borderLeftColor: Colors.light.danger,
    backgroundColor: "#FFF5F5",
  },
  serviceRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  serviceIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.tintLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  serviceIconOverdue: { backgroundColor: Colors.light.dangerLight },
  serviceInfo: { flex: 1 },
  serviceLabel: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.light.tint },
  serviceDate: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.light.textSecondary, marginTop: 2 },
  serviceMeta: { flexDirection: "row", gap: 16, marginBottom: 8 },
  serviceMetaItem: {},
  serviceMetaLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.light.textSecondary },
  serviceMetaValue: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.light.text, marginTop: 2 },
  serviceNote: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.light.tabIconDefault, fontStyle: "italic" as const },
  emptyServiceCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
    alignItems: "center",
    gap: 8,
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyServiceText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.light.textSecondary, textAlign: "center" as const },
  lastExpenseCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  lastExpenseTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  lastExpenseDate: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.light.textSecondary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  lastExpenseTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: Colors.light.text, marginBottom: 4 },
  lastExpenseTotal: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.light.tint, marginBottom: 8 },
  openRow: { flexDirection: "row", alignItems: "center" },
  openText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.light.tint, marginRight: 2 },
  emptyCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.light.textSecondary, marginTop: 12, marginBottom: 16 },
  addBtn: {
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  kpiCard: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  kpiLabel: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.light.textSecondary, marginTop: 8 },
  kpiValue: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.light.text, marginTop: 4, textAlign: "center" as const },
});
