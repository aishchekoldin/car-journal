import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  TextInput,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useData } from "@/lib/DataContext";
import type { MaintenanceRecord, EventType } from "@/lib/types";

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

function RecordCard({ record }: { record: MaintenanceRecord }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push({ pathname: "/record-detail", params: { id: record.id } })}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardDate}>{formatDate(record.date)}</Text>
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                record.eventType === "planned" ? Colors.light.plannedBg : Colors.light.unplannedBg,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: record.eventType === "planned" ? Colors.light.planned : Colors.light.unplanned,
              },
            ]}
          >
            {record.eventType === "planned" ? "Planned" : "Unplanned"}
          </Text>
        </View>
      </View>
      <Text style={styles.cardTitle} numberOfLines={1}>
        {record.title}
      </Text>
      <View style={styles.cardBottom}>
        <View style={styles.cardMileage}>
          <Ionicons name="speedometer-outline" size={14} color={Colors.light.textSecondary} />
          <Text style={styles.cardMileageText}>{record.mileageKm.toLocaleString("ru-RU")} km</Text>
        </View>
        <Text style={styles.cardTotal}>
          {record.totalCost.toLocaleString("ru-RU")} {record.currency}
        </Text>
      </View>
    </Pressable>
  );
}

export default function JournalScreen() {
  const insets = useSafeAreaInsets();
  const { records, car } = useData();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | EventType>("all");

  const filtered = useMemo(() => {
    let list = [...records].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (filter !== "all") {
      list = list.filter((r) => r.eventType === filter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.items.some((item) => item.name.toLowerCase().includes(q))
      );
    }
    return list;
  }, [records, filter, search]);

  const handleAdd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/add-record");
  };

  return (
    <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Journal</Text>
        <Pressable onPress={handleAdd} style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8 }]}>
          <Ionicons name="add" size={24} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={Colors.light.tabIconDefault} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search records..."
          placeholderTextColor={Colors.light.tabIconDefault}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Ionicons name="close-circle" size={18} color={Colors.light.tabIconDefault} />
          </Pressable>
        )}
      </View>

      <View style={styles.filterRow}>
        {(["all", "planned", "unplanned"] as const).map((f) => (
          <Pressable
            key={f}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
              {f === "all" ? "All" : f === "planned" ? "Planned" : "Unplanned"}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RecordCard record={item} />}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: Platform.OS === "web" ? 34 + 90 : 100,
        }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="document-text-outline" size={48} color={Colors.light.tabIconDefault} />
            <Text style={styles.emptyTitle}>No records yet</Text>
            <Text style={styles.emptySubtitle}>Add your first maintenance record</Text>
            <Pressable style={styles.emptyBtn} onPress={handleAdd}>
              <Text style={styles.emptyBtnText}>Add Record</Text>
            </Pressable>
          </View>
        }
      />
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
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 28, color: Colors.light.text },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    marginHorizontal: 20,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchInput: {
    flex: 1,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    padding: 0,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  filterChipActive: {
    backgroundColor: Colors.light.tint,
    borderColor: Colors.light.tint,
  },
  filterChipText: {
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  filterChipTextActive: {
    color: "#fff",
  },
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.light.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  cardPressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardDate: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.light.textSecondary },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  cardTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.light.text, marginBottom: 8 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardMileage: { flexDirection: "row", alignItems: "center", gap: 4 },
  cardMileageText: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.light.textSecondary },
  cardTotal: { fontFamily: "Inter_700Bold", fontSize: 16, color: Colors.light.tint },
  emptyWrap: { alignItems: "center", paddingTop: 80 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.light.text, marginTop: 16 },
  emptySubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, color: Colors.light.textSecondary, marginTop: 4, marginBottom: 20 },
  emptyBtn: { backgroundColor: Colors.light.tint, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  emptyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
});
