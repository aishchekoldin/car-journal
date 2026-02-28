import AsyncStorage from "@react-native-async-storage/async-storage";
import type { MaintenanceRecord, CarProfile, UserProfile } from "./types";
import { generateId } from "./types";

const RECORDS_KEY = "@car_journal_records";
const CARS_KEY = "@car_journal_cars";
const SELECTED_CAR_KEY = "@car_journal_selected_car";
const USER_KEY = "@car_journal_user";

const DEFAULT_CAR: CarProfile = {
  id: "default",
  make: "Skoda",
  model: "Yeti",
  year: "2015",
  vin: "",
  photoUri: null,
  currency: "\u20BD",
  customIntervalKm: null,
  customIntervalMonths: null,
};

export async function loadRecords(): Promise<MaintenanceRecord[]> {
  const raw = await AsyncStorage.getItem(RECORDS_KEY);
  if (!raw) return [];
  const records = JSON.parse(raw) as MaintenanceRecord[];
  return records.map((r) => ({
    ...r,
    carId: r.carId || "default",
  }));
}

export async function saveRecords(records: MaintenanceRecord[]): Promise<void> {
  await AsyncStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export async function loadCars(): Promise<CarProfile[]> {
  const raw = await AsyncStorage.getItem(CARS_KEY);
  if (!raw) {
    const oldCarRaw = await AsyncStorage.getItem("@car_journal_car");
    if (oldCarRaw) {
      const oldCar = JSON.parse(oldCarRaw) as any;
      const migrated: CarProfile = {
        id: "default",
        make: oldCar.make || "Skoda",
        model: oldCar.model || "Yeti",
        year: oldCar.year || "2015",
        vin: oldCar.vin || "",
        photoUri: oldCar.photoUri || null,
        currency: oldCar.currency || "\u20BD",
        customIntervalKm: oldCar.customIntervalKm ?? null,
        customIntervalMonths: oldCar.customIntervalMonths ?? null,
      };
      await saveCars([migrated]);
      return [migrated];
    }
    const defaultCars = [{ ...DEFAULT_CAR, id: generateId() }];
    await saveCars(defaultCars);
    return defaultCars;
  }
  const cars = JSON.parse(raw) as CarProfile[];
  return cars.map((c) => ({
    ...c,
    id: c.id || generateId(),
    customIntervalKm: c.customIntervalKm ?? null,
    customIntervalMonths: c.customIntervalMonths ?? null,
  }));
}

export async function saveCars(cars: CarProfile[]): Promise<void> {
  await AsyncStorage.setItem(CARS_KEY, JSON.stringify(cars));
}

export async function loadSelectedCarId(): Promise<string | null> {
  return AsyncStorage.getItem(SELECTED_CAR_KEY);
}

export async function saveSelectedCarId(id: string): Promise<void> {
  await AsyncStorage.setItem(SELECTED_CAR_KEY, id);
}

export async function loadUserProfile(): Promise<UserProfile> {
  const raw = await AsyncStorage.getItem(USER_KEY);
  if (!raw) return { name: "", email: "" };
  return JSON.parse(raw) as UserProfile;
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(USER_KEY, JSON.stringify(profile));
}
