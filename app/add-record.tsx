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
  planned: "Плановое",
  unplanned: "Внеплановое",
  refueling: "Заправка",
  future: "На будущее",
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

  const isFuture = eventType === "future";
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
    if (!newItemName.trim()) errs.itemName = "Введите название";

    if (!isFuture) {
      const costVal = newItemCost.trim();
      const costNum = costVal === "" ? NaN : parseFloat(costVal);
      if (costVal === "" || isNaN(costNum) || costNum < 0) errs.itemCost = "Введите стоимость (>= 0)";
    }

    if (Object.keys(errs).length > 0) {
      setErrors((prev) => ({ ...prev, ...errs }));
      return;
    }

    const costNum = isFuture ? 0 : parseFloat(newItemCost.trim());

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

    if (!isFuture) {
      const mileageNum = parseInt(mileage, 10);
      if (!mileage || isNaN(mileageNum) || mileageNum <= 0) errs.mileage = "Должно быть > 0";
      if (!date) errs.date = "Обязательное поле";
    }

    if (!title.trim()) errs.title = "Обязательное поле";
    if (items.length === 0) errs.items = "Добавьте хотя бы одну позицию";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const computedTotal = isFuture ? 0 : items.reduce((s, i) => s + i.cost, 0);
    const mileageNum = isFuture ? 0 : parseInt(mileage, 10);

    await addRecord({
      id: generateId(),
      date: isFuture ? "" : date,
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
          <Text style={styles.headerTitle}>Новая запись</Text>
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
          <Text style={styles.label}>Тип события</Text>
          <View style={styles.typeRow}>
            {(["planned", "unplanned", "refueling", "future"] as EventType[]).map((t) => (
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

          {!isFuture && (
            <>
              <Text style={styles.label}>Дата</Text>
              <TextInput
                style={[styles.input, errors.date && styles.inputError]}
                value={date}
                onChangeText={(t) => { setDate(t); clearError("date"); }}
                placeholder="ГГГГ-ММ-ДД"
                placeholderTextColor={Colors.light.tabIconDefault}
              />
              {errors.date ? <Text style={styles.errorText}>{errors.date}</Text> : null}

              <Text style={styles.label}>Пробег (км)</Text>
              <TextInput
                style={[styles.input, errors.mileage && styles.inputError]}
                value={mileage}
                onChangeText={(t) => { setMileage(t.replace(/[^0-9]/g, "")); clearError("mileage"); }}
                placeholder="напр. 120000"
                placeholderTextColor={Colors.light.tabIconDefault}
                keyboardType="numeric"
              />
              {errors.mileage ? <Text style={styles.errorText}>{errors.mileage}</Text> : null}
            </>
          )}

          <Text style={styles.label}>Название</Text>
          <TextInput
            style={[styles.input, errors.title && styles.inputError]}
            value={title}
            onChangeText={(t) => { setTitle(t); clearError("title"); }}
            placeholder={
              isFuture ? "напр. Заменить тормозные колодки" :
              eventType === "refueling" ? "напр. АИ-95 50л" : "напр. ТО 120 000"
            }
            placeholderTextColor={Colors.light.tabIconDefault}
          />
          {errors.title ? <Text style={styles.errorText}>{errors.title}</Text> : null}

          <View style={styles.itemsSection}>
            <View style={styles.itemsHeader}>
              <Text style={styles.itemsSectionTitle}>Позиции</Text>
              {errors.items ? <Text style={styles.errorTextInline}>{errors.items}</Text> : null}
            </View>

            {items.map((item) => (
              <View key={item.itemId} style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  {!isFuture && (
                    <Text style={styles.itemCost}>{item.cost.toLocaleString("ru-RU")} {car.currency}</Text>
                  )}
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
                placeholder={isFuture ? "Что нужно сделать" : "Название позиции"}
                placeholderTextColor={Colors.light.tabIconDefault}
              />
              <View style={styles.addItemBottomRow}>
                {!isFuture && (
                  <TextInput
                    style={[styles.addItemCostInput, errors.itemCost && styles.inputError]}
                    value={newItemCost}
                    onChangeText={(t) => { setNewItemCost(t.replace(/[^0-9.]/g, "")); clearError("itemCost"); }}
                    placeholder="Стоимость"
                    placeholderTextColor={Colors.light.tabIconDefault}
                    keyboardType="numeric"
                  />
                )}
                <Pressable
                  style={({ pressed }) => [
                    styles.addItemBtn,
                    isFuture && styles.addItemBtnFull,
                    pressed && { opacity: 0.85 },
                  ]}
                  onPress={handleAddItem}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.addItemBtnText}>Добавить</Text>
                </Pressable>
              </View>
            </View>
          </View>

          {!isFuture && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Итого</Text>
              <Text style={styles.totalValue}>{totalCost.toLocaleString("ru-RU")} {car.currency}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.85 }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Сохранить запись</Text>
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
  typeRow: { flexDirection: "row", gap: 6, flexWrap: "wrap" },
  typeChip: {
    paddingHorizontal: 14,
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
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    flexShrink: 0,
  },
  addItemBtnFull: { flex: 1 },
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
