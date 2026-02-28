import React, { useState, useMemo } from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { useData } from "@/lib/DataContext";
import { getServiceInterval } from "@/lib/service-intervals";

const CURRENCIES = ["\u20BD", "\u20AC", "$"];

export default function EditCarScreen() {
  const insets = useSafeAreaInsets();
  const { carId } = useLocalSearchParams<{ carId?: string }>();
  const { cars, car: selectedCar, updateCar } = useData();

  const targetCar = carId ? cars.find((c) => c.id === carId) : selectedCar;
  const carToEdit = targetCar || selectedCar;

  const [make, setMake] = useState(carToEdit.make);
  const [model, setModel] = useState(carToEdit.model);
  const [year, setYear] = useState(carToEdit.year);
  const [vin, setVin] = useState(carToEdit.vin);
  const [photoUri, setPhotoUri] = useState(carToEdit.photoUri);
  const [currency, setCurrency] = useState(carToEdit.currency);
  const [customKm, setCustomKm] = useState(carToEdit.customIntervalKm ? carToEdit.customIntervalKm.toString() : "");
  const [customMonths, setCustomMonths] = useState(carToEdit.customIntervalMonths ? carToEdit.customIntervalMonths.toString() : "");

  const defaultInterval = useMemo(() => {
    const temp = { ...carToEdit, make };
    return getServiceInterval(temp);
  }, [carToEdit, make]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const km = customKm.trim() ? parseInt(customKm, 10) : null;
    const months = customMonths.trim() ? parseInt(customMonths, 10) : null;
    await updateCar({
      ...carToEdit,
      make,
      model,
      year,
      vin,
      photoUri,
      currency,
      customIntervalKm: km,
      customIntervalMonths: months,
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
          <Text style={styles.headerTitle}>Редактировать авто</Text>
          <Pressable onPress={handleSave} hitSlop={12}>
            <Ionicons name="checkmark" size={26} color={Colors.light.tint} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: Platform.OS === "web" ? 34 + 20 : insets.bottom + 20,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={styles.photoWrap} onPress={handlePickImage}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photo} contentFit="cover" />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={36} color={Colors.light.tint} />
                <Text style={styles.photoText}>Нажмите, чтобы добавить фото</Text>
              </View>
            )}
          </Pressable>

          <Text style={styles.label}>Марка</Text>
          <TextInput
            style={styles.input}
            value={make}
            onChangeText={setMake}
            placeholder="напр. Skoda"
            placeholderTextColor={Colors.light.tabIconDefault}
          />

          <Text style={styles.label}>Модель</Text>
          <TextInput
            style={styles.input}
            value={model}
            onChangeText={setModel}
            placeholder="напр. Yeti"
            placeholderTextColor={Colors.light.tabIconDefault}
          />

          <Text style={styles.label}>Год выпуска</Text>
          <TextInput
            style={styles.input}
            value={year}
            onChangeText={(t) => setYear(t.replace(/[^0-9]/g, ""))}
            placeholder="напр. 2015"
            placeholderTextColor={Colors.light.tabIconDefault}
            keyboardType="numeric"
            maxLength={4}
          />

          <Text style={styles.label}>VIN</Text>
          <TextInput
            style={styles.input}
            value={vin}
            onChangeText={setVin}
            placeholder="VIN номер"
            placeholderTextColor={Colors.light.tabIconDefault}
            autoCapitalize="characters"
            maxLength={17}
          />

          <Text style={styles.label}>Валюта</Text>
          <View style={styles.currencyRow}>
            {CURRENCIES.map((c) => (
              <Pressable
                key={c}
                style={[styles.currencyChip, currency === c && styles.currencyChipActive]}
                onPress={() => setCurrency(c)}
              >
                <Text style={[styles.currencyText, currency === c && styles.currencyTextActive]}>
                  {c}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.intervalSection}>
            <Text style={styles.intervalSectionTitle}>Интервал ТО</Text>
            <Text style={styles.intervalHint}>
              {defaultInterval.isCustom
                ? `Свой интервал: ${defaultInterval.intervalKm.toLocaleString("ru-RU")} км / ${defaultInterval.intervalMonths} мес.`
                : `По умолчанию (${make || "—"}): ${defaultInterval.intervalKm.toLocaleString("ru-RU")} км / ${defaultInterval.intervalMonths} мес.`}
            </Text>
            <View style={styles.intervalRow}>
              <View style={styles.intervalInputWrap}>
                <Text style={styles.intervalInputLabel}>Пробег (км)</Text>
                <TextInput
                  style={styles.input}
                  value={customKm}
                  onChangeText={(t) => setCustomKm(t.replace(/[^0-9]/g, ""))}
                  placeholder={`${defaultInterval.intervalKm}`}
                  placeholderTextColor={Colors.light.tabIconDefault}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.intervalInputWrap}>
                <Text style={styles.intervalInputLabel}>Месяцы</Text>
                <TextInput
                  style={styles.input}
                  value={customMonths}
                  onChangeText={(t) => setCustomMonths(t.replace(/[^0-9]/g, ""))}
                  placeholder={`${defaultInterval.intervalMonths}`}
                  placeholderTextColor={Colors.light.tabIconDefault}
                  keyboardType="numeric"
                />
              </View>
            </View>
            {(customKm.trim() !== "" || customMonths.trim() !== "") && (
              <Pressable
                style={({ pressed }) => [styles.resetIntervalBtn, pressed && { opacity: 0.85 }]}
                onPress={() => { setCustomKm(""); setCustomMonths(""); }}
              >
                <Ionicons name="refresh-outline" size={14} color={Colors.light.textSecondary} />
                <Text style={styles.resetIntervalText}>Сбросить к значениям по умолчанию</Text>
              </Pressable>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [styles.saveButton, pressed && { opacity: 0.85 }]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Сохранить изменения</Text>
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
  photoWrap: { marginTop: 20, borderRadius: 16, overflow: "hidden" },
  photo: { width: "100%", height: 180, borderRadius: 16 },
  photoPlaceholder: {
    width: "100%",
    height: 180,
    backgroundColor: Colors.light.tintLight,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: "dashed",
  },
  photoText: { fontFamily: "Inter_500Medium", fontSize: 14, color: Colors.light.tint, marginTop: 8 },
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
  currencyRow: { flexDirection: "row", gap: 10 },
  currencyChip: {
    width: 56,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
  },
  currencyChipActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  currencyText: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.light.textSecondary },
  currencyTextActive: { color: "#fff" },
  intervalSection: {
    marginTop: 24,
    backgroundColor: Colors.light.surface,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  intervalSectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.light.text, marginBottom: 4 },
  intervalHint: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.light.textSecondary, marginBottom: 12, fontStyle: "italic" as const },
  intervalRow: { flexDirection: "row", gap: 10 },
  intervalInputWrap: { flex: 1 },
  intervalInputLabel: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.light.textSecondary, marginBottom: 4 },
  resetIntervalBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
  },
  resetIntervalText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.light.textSecondary },
  saveButton: {
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 32,
  },
  saveButtonText: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: "#fff" },
});
