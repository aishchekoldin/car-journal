import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useData } from "@/lib/DataContext";
import { generateId } from "@/lib/types";
import type { RecordItem, EventType } from "@/lib/types";

const EVENT_LABELS: Record<EventType, string> = {
  planned: "Planned",
  unplanned: "Unplanned",
  refueling: "Refueling",
};

export default function AddRecordScreen() {
  const insets = useSafeAreaInsets();
  const { car, addRecord } = useData();

  const [mileage, setMileage] = useState("");
  const [eventType, setEventType] = useState<EventType>("planned");
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState<RecordItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemCost, setNewItemCost] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const totalCost = items.reduce((s, i) => s + i.cost, 0);

  const clearError = (key: string) => {
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleAddItem = () => {
    const errs: Record<string, string> = {};
    if (!newItemName.trim()) errs.itemName = "Enter item name";
    const costVal = newItemCost.trim();
    const costNum = costVal === "" ? NaN : parseFloat(costVal);
    if (costVal === "" || isNaN(costNum) || costNum < 0) errs.itemCost = "Enter cost (>= 0)";

    if (Object.keys(errs).length > 0) {
      setErrors((prev) => ({ ...prev, ...errs }));
      return;
    }

    setItems((prev) => [
      ...prev,
      { itemId: generateId(), name: newItemName.trim(), cost: costNum },
    ]);
    setNewItemName("");
    setNewItemCost("");
    setErrors((prev) => {
      const next = { ...prev };
      delete next.itemName;
      delete next.itemCost;
      delete next.items;
      return next;
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((i) => i.itemId !== id));
  };

  const handleSave = async () => {
    const errs: Record<string, string> = {};
    const mileageNum = parseInt(mileage, 10);
    if (!mileage || isNaN(mileageNum) || mileageNum <= 0) errs.mileage = "Must be > 0";
    if (!title.trim()) errs.title = "Required";
    if (items.length === 0) errs.items = "Add at least one item";
    if (!date) errs.date = "Required";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const computedTotal = items.reduce((s, i) => s + i.cost, 0);

    await addRecord({
      id: generateId(),
      date,
      mileageKm: mileageNum,
      eventType,
      title: title.trim(),
      items: [...items],
      totalCost: computedTotal,
      currency: car.currency,
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <View style={[styles.container, { paddingTop: Platform.OS === "web" ? 67 : insets.top }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Ionicons name="close" size={26} color={Colors.light.text} />
          </Pressable>
          <Text style={styles.headerTitle}>New Record</Text>
          <Pressable onPress={handleSave} hitSlop={12}>
            <Ionicons name="checkmark" size={26} color={Colors.light.tint} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: Platform.OS === "web" ? 34 + 40 : insets.bottom + 40,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={[styles.input, errors.date && styles.inputError]}
            value={date}
            onChangeText={(t) => { setDate(t); clearError("date"); }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.light.tabIconDefault}
          />
          {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}

          <Text style={styles.label}>Mileage (km)</Text>
          <TextInput
            style={[styles.input, errors.mileage && styles.inputError]}
            value={mileage}
            onChangeText={(t) => { setMileage(t.replace(/[^0-9]/g, "")); clearError("mileage"); }}
            placeholder="e.g. 120000"
            placeholderTextColor={Colors.light.tabIconDefault}
            keyboardType="numeric"
          />
          {errors.mileage ? <Text style={styles.errorText}>{errors.mileage}</Text> : null}

          <Text style={styles.label}>Event Type</Text>
          <View style={styles.typeRow}>
            {(["planned", "unplanned", "refueling"] as EventType[]).map((t) => (
              <Pressable
                key={t}
                style={[styles.typeChip, eventType === t && styles.typeChipActive]}
                onPress={() => setEventType(t)}
              >
                <Text style={[styles.typeChipText, eventType === t && styles.typeChipTextActive]}>
                  {EVENT_LABELS[t]}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={title}
            onChangeText={(t) => { setTitle(t); clearError("title"); }}
            placeholder={eventType === "refueling" ? "e.g. AI-95 50L" : "e.g. TO 120 000"}
            placeholderTextColor={Colors.light.tabIconDefault}
          />
          {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}

          <View style={styles.itemsSection}>
            <View style={styles.itemsHeader}>
              <Text style={styles.itemsSectionTitle}>Items</Text>
              {errors.items ? <Text style={styles.errorTextInline}>{errors.items}</Text> : null}
            </View>

            {items.map((item) => (
              <View key={item.itemId} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCost}>{item.cost.toLocaleString("ru-RU")} {car.currency}</Text>
                </View>
                <Pressable onPress={() => handleRemoveItem(item.itemId)} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color={Colors.light.danger} />
                </Pressable>
              </View>
            ))}

            <View style={styles.addItemCard}>
              <TextInput
                style={[styles.addItemInput, errors.itemName && styles.inputError]}
                value={newItemName}
                onChangeText={(t) => { setNewItemName(t); clearError("itemName"); }}
                placeholder="Item name"
                placeholderTextColor={Colors.light.tabIconDefault}
              />
              <View style={styles.addItemBottomRow}>
                <TextInput
                  style={[styles.addItemCostInput, errors.itemCost && styles.inputError]}
                  value={newItemCost}
                  onChangeText={(t) => { setNewItemCost(t.replace(/[^0-9.]/g, "")); clearError("itemCost"); }}
                  placeholder="Cost"
                  placeholderTextColor={Colors.light.tabIconDefault}
                  keyboardType="numeric"
                />
                <Pressable
                  style={({ pressed }) => [styles.addItemBtn, pressed && { opacity: 0.85 }]}
                  onPress={handleAddItem}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addItemBtnText}>Add</Text>
                </Pressable>
              </View>
            </View>
          </View>

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{totalCost.toLocaleString("ru-RU")} {car.currency}</Text>
          </View>

          <Pressable
            style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.85 }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Record</Text>
          </Pressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
  },
  headerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 17, color: Colors.light.text },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.light.textSecondary, marginBottom: 6, marginTop: 16 },
  input: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  inputError: { borderColor: Colors.light.danger },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.light.danger, marginTop: 4 },
  errorTextInline: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.light.danger },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
  },
  typeChipActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  typeChipText: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.light.textSecondary },
  typeChipTextActive: { color: "#fff" },
  itemsSection: { marginTop: 20 },
  itemsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  itemsSectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.light.text },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  itemInfo: { flex: 1 },
  itemName: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.light.text },
  itemCost: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.light.textSecondary, marginTop: 2 },
  addItemCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.tint,
    borderStyle: "dashed" as const,
  },
  addItemInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 8,
  },
  addItemBottomRow: { flexDirection: "row", gap: 8 },
  addItemCostInput: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  addItemBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
  },
  addItemBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  totalLabel: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.light.text },
  totalValue: { fontFamily: "Inter_700Bold", fontSize: 20, color: Colors.light.tint },
  saveButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  saveButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#fff" },
});
