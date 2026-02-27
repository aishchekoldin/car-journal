import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MaintenanceRecord, CarProfile, UserProfile } from "./types";

const RECORDS_KEY = "@car_journal_records";
const CAR_KEY = "@car_journal_car";
const USER_KEY = "@car_journal_user";

export async function loadRecords(): Promise<MaintenanceRecord[]> {
  const raw = await AsyncStorage.getItem(RECORDS_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as MaintenanceRecord[];
}

export async function saveRecords(records: MaintenanceRecord[]): Promise<void> {
  await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export async function loadCarProfile(): Promise<CarProfile> {
  const raw = await AsyncStorage.getItem(CAR_KEY);
  if (!raw) {
    return {
      make: "Skoda",
      model: "Yeti",
      year: "2015",
      vin: "",
      photoUri: null,
      currency: "\u20BD",
      customIntervalKm: null,
      customIntervalMonths: null,
    };
  }
  const parsed = JSON.parse(raw) as CarProfile;
  if (parsed.customIntervalKm === undefined) parsed.customIntervalKm = null;
  if (parsed.customIntervalMonths === undefined) parsed.customIntervalMonths = null;
  return parsed;
}

export async function saveCarProfile(profile: CarProfile): Promise<void> {
  await AsyncStorage.setItem(CAR_KEY, JSON.stringify(profile));
}

export async function loadUserProfile(): Promise<UserProfile> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) {
    return { name: "", email: "" };
  }
  return JSON.parse(raw) as UserProfile;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
}
