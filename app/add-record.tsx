import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
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

  const totalCost = useMemo(() => items.reduce((s, i) => s + i.cost, 0), [items]);

  const handleAddItem = () => {
    const errs: Record<string, string> = {};
    if (!newItemName.trim()) errs.itemName = "Required";
    const costNum = parseFloat(newItemCost);
    if (isNaN(costNum) || costNum < 0) errs.itemCost = "Must be >= 0";
    if (Object.keys(errs).length > 0) {
      setErrors((prev) => ({ ...prev, ...errs }));
      return;
    }
    setItems([...items, { itemId: generateId(), name: newItemName.trim(), cost: costNum }]);
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
    setItems(items.filter((i) => i.itemId !== id));
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

    await addRecord({
      id: generateId(),
      date,
      mileageKm: mileageNum,
      eventType,
      title: title.trim(),
      items,
      totalCost,
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
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Platform.OS === "web" ? 34 + 20 : insets.bottom + 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.label}>Date</Text>
          <TextInput
            style={[styles.input, errors.date && styles.inputError]}
            value={date}
            onChangeText={(t) => { setDate(t); setErrors((p) => { const n = { ...p }; delete n.date; return n; }); }}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.light.tabIconDefault}
          />
          {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}

          <Text style={styles.label}>Mileage (km)</Text>
          <TextInput
            style={[styles.input, errors.mileage && styles.inputError]}
            value={mileage}
            onChangeText={(t) => { setMileage(t.replace(/[^0-9]/g, "")); setErrors((p) => { const n = { ...p }; delete n.mileage; return n; }); }}
            placeholder="e.g. 120000"
            placeholderTextColor={Colors.light.tabIconDefault}
            keyboardType="numeric"
          />
          {errors.mileage ? <Text style={styles.errorText}>{errors.mileage}</Text> : null}

          <Text style={styles.label}>Event Type</Text>
          <View style={styles.typeRow}>
            {(["planned", "unplanned"] as EventType[]).map((t) => (
              <Pressable
                key={t}
                style={[styles.typeChip, eventType === t && styles.typeChipActive]}
                onPress={() => setEventType(t)}
              >
                <Text style={[styles.typeChipText, eventType === t && styles.typeChipTextActive]}>
                  {t === "planned" ? "Planned" : "Unplanned"}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>Title</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={title}
            onChangeText={(t) => { setTitle(t); setErrors((p) => { const n = { ...p }; delete n.title; return n; }); }}
            placeholder="e.g. TO 120 000"
            placeholderTextColor={Colors.light.tabIconDefault}
          />
          {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}

          <View style={styles.itemsHeader}>
            <Text style={styles.label}>Items</Text>
            {errors.items ? <Text style={styles.errorText}>{errors.items}</Text> : null}
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

          <View style={styles.addItemWrap}>
            <TextInput
              style={[styles.addItemInput, { flex: 2 }, errors.itemName && styles.inputError]}
              value={newItemName}
              onChangeText={(t) => { setNewItemName(t); setErrors((p) => { const n = { ...p }; delete n.itemName; return n; }); }}
              placeholder="Item name"
              placeholderTextColor={Colors.light.tabIconDefault}
            />
            <TextInput
              style={[styles.addItemInput, { flex: 1 }, errors.itemCost && styles.inputError]}
              value={newItemCost}
              onChangeText={(t) => { setNewItemCost(t.replace(/[^0-9.]/g, "")); setErrors((p) => { const n = { ...p }; delete n.itemCost; return n; }); }}
              placeholder="Cost"
              placeholderTextColor={Colors.light.tabIconDefault}
              keyboardType="numeric"
            />
            <Pressable style={styles.addItemBtn} onPress={handleAddItem}>
              <Ionicons name="add" size={22} color="#fff" />
            </Pressable>
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
  typeRow: { flexDirection: "row", gap: 10 },
  typeChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
  },
  typeChipActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  typeChipText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.light.textSecondary },
  typeChipTextActive: { color: "#fff" },
  itemsHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
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
  addItemWrap: { flexDirection: "row", gap: 8, marginTop: 4 },
  addItemInput: {
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  addItemBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
  },
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
