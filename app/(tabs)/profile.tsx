import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import Colors from "@/constants/colors";
import { useData } from "@/lib/DataContext";
import { getServiceInterval } from "@/lib/service-intervals";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || "";
const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || "";
const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || "";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, car, updateUser, updateCar } = useData();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [saved, setSaved] = useState(false);

  const currentInterval = getServiceInterval(car);
  const [customKm, setCustomKm] = useState(
    car.customIntervalKm ? car.customIntervalKm.toString() : ""
  );
  const [customMonths, setCustomMonths] = useState(
    car.customIntervalMonths ? car.customIntervalMonths.toString() : ""
  );
  const [intervalSaved, setIntervalSaved] = useState(false);

  const [googleLoading, setGoogleLoading] = useState(false);

  const clientId = Platform.select({
    ios: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
    android: GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
    default: GOOGLE_WEB_CLIENT_ID,
  }) || "";

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: "com.carjournal.app",
  });

  const discovery = AuthSession.useAutoDiscovery("https://accounts.google.com");

  const handleGoogleLogin = async () => {
    if (!discovery) {
      Alert.alert("Ошибка", "Не удалось подключиться к Google. Попробуйте позже.");
      return;
    }

    if (!clientId) {
      Alert.alert(
        "Настройка Google",
        "Для авторизации через Google укажите EXPO_PUBLIC_GOOGLE_CLIENT_ID в настройках приложения."
      );
      return;
    }

    setGoogleLoading(true);
    try {
      const request = new AuthSession.AuthRequest({
        clientId,
        redirectUri,
        scopes: ["openid", "profile", "email"],
        responseType: AuthSession.ResponseType.Token,
      });

      const result = await request.promptAsync(discovery);

      if (result.type === "success" && result.authentication?.accessToken) {
        const userInfoResponse = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          { headers: { Authorization: `Bearer ${result.authentication.accessToken}` } }
        );
        const userInfo = await userInfoResponse.json();

        await updateUser({
          name: userInfo.name || user.name,
          email: userInfo.email || user.email,
        });
        setName(userInfo.name || user.name);
        setEmail(userInfo.email || user.email);

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Успешно", `Вы вошли как ${userInfo.email}`);
      }
    } catch (error) {
      Alert.alert("Ошибка", "Не удалось войти через Google. Попробуйте ещё раз.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSaveUser = async () => {
    await updateUser({ name, email });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSaveInterval = async () => {
    const km = customKm.trim() ? parseInt(customKm, 10) : null;
    const months = customMonths.trim() ? parseInt(customMonths, 10) : null;

    if (km !== null && (isNaN(km) || km <= 0)) {
      Alert.alert("Ошибка", "Пробег должен быть > 0");
      return;
    }
    if (months !== null && (isNaN(months) || months <= 0)) {
      Alert.alert("Ошибка", "Количество месяцев должно быть > 0");
      return;
    }

    const bothSet = km !== null && months !== null;
    const noneSet = km === null && months === null;

    if (!bothSet && !noneSet) {
      Alert.alert("Ошибка", "Укажите оба значения (пробег и месяцы) или оставьте оба поля пустыми для сброса");
      return;
    }

    await updateCar({
      ...car,
      customIntervalKm: km,
      customIntervalMonths: months,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIntervalSaved(true);
    setTimeout(() => setIntervalSaved(false), 2000);
  };

  const handleResetInterval = async () => {
    setCustomKm("");
    setCustomMonths("");
    await updateCar({
      ...car,
      customIntervalKm: null,
      customIntervalMonths: null,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIntervalSaved(true);
    setTimeout(() => setIntervalSaved(false), 2000);
  };

  const handleStub = (action: string) => {
    Alert.alert(action, "Эта функция будет доступна в будущем обновлении.");
  };

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
      <Text style={styles.title}>Профиль</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ваши данные</Text>
        <Text style={styles.label}>Имя</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ваше имя"
          placeholderTextColor={Colors.light.tabIconDefault}
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder="your@email.com"
          placeholderTextColor={Colors.light.tabIconDefault}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <Pressable
          style={({ pressed }) => [styles.saveBtn, pressed && { opacity: 0.85 }]}
          onPress={handleSaveUser}
        >
          {saved ? (
            <Ionicons name="checkmark" size={18} color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Сохранить</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Ваш автомобиль</Text>
        <Pressable
          style={({ pressed }) => [styles.carRow, pressed && { opacity: 0.9 }]}
          onPress={() => router.push("/edit-car")}
        >
          {car.photoUri ? (
            <Image source={{ uri: car.photoUri }} style={styles.carThumb} contentFit="cover" />
          ) : (
            <View style={[styles.carThumb, styles.carThumbPlaceholder]}>
              <Ionicons name="car-sport" size={24} color={Colors.light.tint} />
            </View>
          )}
          <View style={styles.carInfo}>
            <Text style={styles.carName}>{car.make} {car.model}</Text>
            <Text style={styles.carSub}>{car.year}{car.vin ? ` \u00B7 ${car.vin}` : ""}</Text>
            <Text style={styles.carCurrency}>Валюта: {car.currency}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Интервал ТО</Text>
        <Text style={styles.intervalHint}>
          {currentInterval.isCustom
            ? `Свой интервал: ${currentInterval.intervalKm.toLocaleString("ru-RU")} км / ${currentInterval.intervalMonths} мес.`
            : `По умолчанию (${car.make}): ${currentInterval.intervalKm.toLocaleString("ru-RU")} км / ${currentInterval.intervalMonths} мес.`}
        </Text>
        <Text style={styles.label}>Пробег (км)</Text>
        <TextInput
          style={styles.input}
          value={customKm}
          onChangeText={(t) => setCustomKm(t.replace(/[^0-9]/g, ""))}
          placeholder={`напр. ${currentInterval.intervalKm}`}
          placeholderTextColor={Colors.light.tabIconDefault}
          keyboardType="numeric"
        />
        <Text style={styles.label}>Интервал (мес.)</Text>
        <TextInput
          style={styles.input}
          value={customMonths}
          onChangeText={(t) => setCustomMonths(t.replace(/[^0-9]/g, ""))}
          placeholder={`напр. ${currentInterval.intervalMonths}`}
          placeholderTextColor={Colors.light.tabIconDefault}
          keyboardType="numeric"
        />
        <View style={styles.intervalBtnRow}>
          <Pressable
            style={({ pressed }) => [styles.saveBtn, styles.intervalSaveBtn, pressed && { opacity: 0.85 }]}
            onPress={handleSaveInterval}
          >
            {intervalSaved ? (
              <Ionicons name="checkmark" size={18} color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Сохранить</Text>
            )}
          </Pressable>
          {currentInterval.isCustom && (
            <Pressable
              style={({ pressed }) => [styles.resetBtn, pressed && { opacity: 0.85 }]}
              onPress={handleResetInterval}
            >
              <Text style={styles.resetBtnText}>Сбросить</Text>
            </Pressable>
          )}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Аккаунт</Text>
        <Pressable
          style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.85 }]}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
        >
          <Ionicons name="logo-google" size={20} color="#fff" />
          <Text style={styles.googleBtnText}>
            {googleLoading ? "Вход..." : "Войти через Google"}
          </Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.actionRow} onPress={() => handleStub("Сменить пароль")}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.light.text} />
          <Text style={styles.actionText}>Сменить пароль</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.tabIconDefault} />
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.actionRow} onPress={() => handleStub("Выйти")}>
          <Ionicons name="log-out-outline" size={20} color={Colors.light.accent} />
          <Text style={[styles.actionText, { color: Colors.light.accent }]}>Выйти</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.tabIconDefault} />
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.actionRow} onPress={() => handleStub("Удалить аккаунт")}>
          <Ionicons name="trash-outline" size={20} color={Colors.light.danger} />
          <Text style={[styles.actionText, { color: Colors.light.danger }]}>Удалить аккаунт</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.tabIconDefault} />
        </Pressable>
      </View>
    </ScrollView>
  );
}

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
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.light.text, marginBottom: 12 },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.light.textSecondary, marginBottom: 4 },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  saveBtn: {
    backgroundColor: Colors.light.tint,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginTop: 4,
  },
  saveBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
  intervalHint: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginBottom: 12,
    fontStyle: "italic" as const,
  },
  intervalBtnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  intervalSaveBtn: { flex: 1 },
  resetBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  resetBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.light.textSecondary },
  carRow: { flexDirection: "row", alignItems: "center" },
  carThumb: { width: 56, height: 56, borderRadius: 14 },
  carThumbPlaceholder: {
    backgroundColor: Colors.light.tintLight,
    justifyContent: "center",
    alignItems: "center",
  },
  carInfo: { flex: 1, marginLeft: 12 },
  carName: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.light.text },
  carSub: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.light.textSecondary, marginTop: 2 },
  carCurrency: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.light.textSecondary, marginTop: 1 },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#EA4335",
    borderRadius: 12,
    paddingVertical: 14,
    marginBottom: 12,
  },
  googleBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  actionText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.light.text },
  divider: { height: 1, backgroundColor: Colors.light.border },
});
