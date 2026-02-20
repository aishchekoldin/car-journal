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
import Colors from "@/constants/colors";
import { useData } from "@/lib/DataContext";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, car, updateUser } = useData();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [saved, setSaved] = useState(false);

  const handleSaveUser = async () => {
    await updateUser({ name, email });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleStub = (action: string) => {
    Alert.alert(action, "This feature will be available in a future update.");
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
      <Text style={styles.title}>Profile</Text>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your Info</Text>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Your name"
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
            <Text style={styles.saveBtnText}>Save</Text>
          )}
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Your Car</Text>
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
            <Text style={styles.carCurrency}>Currency: {car.currency}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.light.tabIconDefault} />
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Account</Text>
        <Pressable style={styles.actionRow} onPress={() => handleStub("Change Password")}>
          <Ionicons name="lock-closed-outline" size={20} color={Colors.light.text} />
          <Text style={styles.actionText}>Change Password</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.tabIconDefault} />
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.actionRow} onPress={() => handleStub("Change Email")}>
          <Ionicons name="mail-outline" size={20} color={Colors.light.text} />
          <Text style={styles.actionText}>Change Email</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.tabIconDefault} />
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.actionRow} onPress={() => handleStub("Log Out")}>
          <Ionicons name="log-out-outline" size={20} color={Colors.light.accent} />
          <Text style={[styles.actionText, { color: Colors.light.accent }]}>Log Out</Text>
          <Ionicons name="chevron-forward" size={18} color={Colors.light.tabIconDefault} />
        </Pressable>
        <View style={styles.divider} />
        <Pressable style={styles.actionRow} onPress={() => handleStub("Delete Account")}>
          <Ionicons name="trash-outline" size={20} color={Colors.light.danger} />
          <Text style={[styles.actionText, { color: Colors.light.danger }]}>Delete Account</Text>
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
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  actionText: { flex: 1, fontFamily: "Inter_500Medium", fontSize: 15, color: Colors.light.text },
  divider: { height: 1, backgroundColor: Colors.light.border },
});
