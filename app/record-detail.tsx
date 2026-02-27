import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useData } from "@/lib/DataContext";

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function getBadgeStyle(eventType: string) {
  if (eventType === "planned") return { bg: Colors.light.plannedBg, text: Colors.light.planned, label: "Плановое" };
  if (eventType === "refueling") return { bg: Colors.light.refuelingBg, text: Colors.light.refueling, label: "Заправка" };
  if (eventType === "future") return { bg: Colors.light.futureBg, text: Colors.light.future, label: "На будущее" };
  return { bg: Colors.light.unplannedBg, text: Colors.light.unplanned, label: "Внеплановое" };
}

export default function RecordDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { records, deleteRecord } = useData();

  const record = records.find((r) => r.id === id);

  if (!record) {
    return (
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.headerTitle}>Запись</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>Запись не найдена</Text>
        </View>
      </View>
    );
  }

  const badge = getBadgeStyle(record.eventType);
  const isFuture = record.eventType === "future";

  const handleDelete = () => {
    Alert.alert("Удалить запись", "Вы уверены, что хотите удалить эту запись?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: async () => {
          await deleteRecord(record.id);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.back();
        },
      },
    ]);
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </Pressable>
        <Text style={styles.headerTitle}>Подробности</Text>
        <Pressable onPress={handleDelete} hitSlop={12}>
          <Ionicons name="trash-outline" size={22} color={Colors.light.danger} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: Platform.OS === "web" ? 34 + 20 : insets.bottom + 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topCard}>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: badge.bg }]}>
              <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
            </View>
          </View>

          <Text style={styles.recordTitle}>{record.title}</Text>
          {!isFuture && record.date ? (
            <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
          ) : isFuture ? (
            <Text style={styles.recordDate}>Запланировано на будущее</Text>
          ) : null}

          {!isFuture && (
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="speedometer-outline" size={18} color={Colors.light.tint} />
                <Text style={styles.metaText}>{record.mileageKm.toLocaleString("ru-RU")} км</Text>
              </View>
              <View style={styles.metaItem}>
                <Ionicons name="wallet-outline" size={18} color={Colors.light.tint} />
                <Text style={styles.metaText}>
                  {record.totalCost.toLocaleString("ru-RU")} {record.currency}
                </Text>
              </View>
            </View>
          )}
        </View>

        <Text style={styles.sectionTitle}>Позиции ({record.items.length})</Text>

        {record.items.map((item, index) => (
          <View key={item.itemId} style={styles.itemRow}>
            <View style={styles.itemIndex}>
              <Text style={styles.itemIndexText}>{index + 1}</Text>
            </View>
            <Text style={styles.itemName}>{item.name}</Text>
            {!isFuture && (
              <Text style={styles.itemCost}>
                {item.cost.toLocaleString("ru-RU")} {record.currency}
              </Text>
            )}
          </View>
        ))}

        {!isFuture && (
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Итого</Text>
            <Text style={styles.totalValue}>
              {record.totalCost.toLocaleString("ru-RU")} {record.currency}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.light.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: Colors.light.text },
  emptyWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyText: { fontFamily: "Inter_500Medium", fontSize: 16, color: Colors.light.textSecondary },
  topCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  badgeRow: { marginBottom: 12 },
  badge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, alignSelf: "flex-start" },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  recordTitle: { fontFamily: "Inter_700Bold", fontSize: 24, color: Colors.light.text, marginBottom: 4 },
  recordDate: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.light.textSecondary, marginBottom: 16 },
  metaRow: { flexDirection: "row", gap: 24 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.light.text },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.light.text, marginBottom: 12 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 1,
  },
  itemIndex: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: Colors.light.tintLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemIndexText: { fontFamily: "Inter_600SemiBold", fontSize: 12, color: Colors.light.tint },
  itemName: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.light.text },
  itemCost: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.light.text },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  totalLabel: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.light.text },
  totalValue: { fontFamily: "Inter_700Bold", fontSize: 22, color: Colors.light.tint },
});
