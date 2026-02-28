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
  Modal,
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
  const { user, cars, car, updateUser, addCar, selectCar } = useData();

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);

  const [googleLoading, setGoogleLoading] = useState(false);

  const clientId = Platform.select({
    ios: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
    android: GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID,
    default: GOOGLE_WEB_CLIENT_ID,
  }) || "";

  const redirectUri = AuthSession.makeRedirectUri({ scheme: "com.carjournal.app" });
  const discovery = AuthSession.useAutoDiscovery("https://accounts.google.com");

  const handleGoogleLogin = async () => {
    if (!discovery) {
      Alert.alert("Ошибка", "Не удалось подключиться к Google. Попробуйте позже.");
      return;
    }
    if (!clientId) {
      Alert.alert("Настройка Google", "Для авторизации через Google укажите EXPO_PUBLIC_GOOGLE_CLIENT_ID.");
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
        const resp = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${result.authentication.accessToken}` },
        });
        const info = await resp.json();
        await updateUser({ name: info.name || user.name, email: info.email || user.email });
        setName(info.name || user.name);
        setEmail(info.email || user.email);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert("Успешно", `Вы вошли как ${info.email}`);
      }
    } catch {
      Alert.alert("Ошибка", "Не удалось войти через Google.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    await updateUser({ name, email });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setProfileModalVisible(false);
  };

  const handleAddCar = async () => {
    const newCar = await addCar({
      make: "",
      model: "",
      year: "",
      vin: "",
      photoUri: null,
      currency: "\u20BD",
      customIntervalKm: null,
      customIntervalMonths: null,
    });
    router.push({ pathname: "/edit-car", params: { carId: newCar.id } });
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
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>Профиль</Text>

      <View style={styles.card}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ваши автомобили</Text>
          <Pressable onPress={handleAddCar} style={({ pressed }) => [styles.addCarBtn, pressed && { opacity: 0.8 }]}>
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>
        {cars.map((c) => {
          const interval = getServiceInterval(c);
          const isSelected = c.id === car.id;
          return (
            <Pressable
              key={c.id}
              style={({ pressed }) => [styles.carRow, isSelected && styles.carRowSelected, pressed && { opacity: 0.9 }]}
              onPress={() => {
                selectCar(c.id);
                router.push({ pathname: "/edit-car", params: { carId: c.id } });
              }}
            >
              {c.photoUri ? (
                <Image source={{ uri: c.photoUri }} style={styles.carThumb} contentFit="cover" />
              ) : (
                <View style={[styles.carThumb, styles.carThumbPlaceholder]}>
                  <Ionicons name="car-sport" size={22} color={Colors.light.tint} />
                </View>
              )}
              <View style={styles.carInfo}>
                <Text style={styles.carName}>
                  {c.make || "Новый авто"} {c.model}
                </Text>
                <Text style={styles.carSub}>
                  {c.year ? c.year : ""}
                  {c.vin ? ` · ${c.vin}` : ""}
                </Text>
                <Text style={styles.carInterval}>
                  ТО: {interval.intervalKm.toLocaleString("ru-RU")} км / {interval.intervalMonths} мес.
                  {interval.isCustom ? " (свой)" : ""}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.light.tabIconDefault} />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Аккаунт</Text>
        {user.name || user.email ? (
          <View style={styles.userInfoRow}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={22} color={Colors.light.tint} />
            </View>
            <View style={styles.userInfoText}>
              {user.name ? <Text style={styles.userName}>{user.name}</Text> : null}
              {user.email ? <Text style={styles.userEmail}>{user.email}</Text> : null}
            </View>
          </View>
        ) : null}
        <Pressable
          style={({ pressed }) => [styles.editProfileBtn, pressed && { opacity: 0.85 }]}
          onPress={() => {
            setName(user.name);
            setEmail(user.email);
            setProfileModalVisible(true);
          }}
        >
          <Ionicons name="create-outline" size={18} color={Colors.light.tint} />
          <Text style={styles.editProfileBtnText}>Редактировать профиль</Text>
        </Pressable>
        <View style={styles.divider} />
        <Pressable
          style={({ pressed }) => [styles.googleBtn, pressed && { opacity: 0.85 }]}
          onPress={handleGoogleLogin}
          disabled={googleLoading}
        >
          <Ionicons name="logo-google" size={18} color="#fff" />
          <Text style={styles.googleBtnText}>{googleLoading ? "Вход..." : "Войти через Google"}</Text>
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

      <Modal visible={profileModalVisible} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setProfileModalVisible(false)}>
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>Редактировать профиль</Text>
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
            <View style={styles.modalBtnRow}>
              <Pressable
                style={({ pressed }) => [styles.modalCancelBtn, pressed && { opacity: 0.85 }]}
                onPress={() => setProfileModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>Отмена</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [styles.saveBtn, { flex: 1 }, pressed && { opacity: 0.85 }]}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveBtnText}>Сохранить</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
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
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, color: Colors.light.text, marginBottom: 12 },
  addCarBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  carRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  carRowSelected: { backgroundColor: Colors.light.tintLight },
  carThumb: { width: 48, height: 48, borderRadius: 12 },
  carThumbPlaceholder: {
    backgroundColor: Colors.light.background,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  carInfo: { flex: 1, marginLeft: 12 },
  carName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.light.text },
  carSub: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.light.textSecondary, marginTop: 1 },
  carInterval: { fontFamily: "Inter_400Regular", fontSize: 11, color: Colors.light.tabIconDefault, marginTop: 1 },
  userInfoRow: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  userAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.tintLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInfoText: { flex: 1 },
  userName: { fontFamily: "Inter_600SemiBold", fontSize: 15, color: Colors.light.text },
  userEmail: { fontFamily: "Inter_400Regular", fontSize: 13, color: Colors.light.textSecondary, marginTop: 1 },
  editProfileBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.light.tintLight,
    marginBottom: 12,
  },
  editProfileBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.light.tint },
  googleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#EA4335",
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  googleBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  actionText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.light.text },
  divider: { height: 1, backgroundColor: Colors.light.border },
  label: { fontFamily: "Inter_500Medium", fontSize: 13, color: Colors.light.textSecondary, marginBottom: 4, marginTop: 12 },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontFamily: "Inter_600SemiBold", fontSize: 18, color: Colors.light.text, textAlign: "center" as const },
  modalBtnRow: { flexDirection: "row", gap: 10, marginTop: 20 },
  modalCancelBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  modalCancelText: { fontFamily: "Inter_600SemiBold", fontSize: 14, color: Colors.light.textSecondary },
});
