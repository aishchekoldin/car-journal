import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import type { MaintenanceRecord, CarProfile, UserProfile } from "./types";
import { generateId } from "./types";
import {
  loadRecords, saveRecords,
  loadCars, saveCars,
  loadSelectedCarId, saveSelectedCarId,
  loadUserProfile, saveUserProfile,
} from "./storage";

interface DataContextValue {
  records: MaintenanceRecord[];
  carRecords: MaintenanceRecord[];
  cars: CarProfile[];
  car: CarProfile;
  user: UserProfile;
  isLoading: boolean;
  addRecord: (record: MaintenanceRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  addCar: (car: Omit<CarProfile, "id">) => Promise<CarProfile>;
  updateCar: (car: CarProfile) => Promise<void>;
  deleteCar: (id: string) => Promise<void>;
  selectCar: (id: string) => Promise<void>;
  updateUser: (user: UserProfile) => Promise<void>;
  reload: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

const DEFAULT_CAR: CarProfile = {
  id: "default",
  make: "",
  model: "",
  year: "",
  vin: "",
  photoUri: null,
  currency: "\u20BD",
  customIntervalKm: null,
  customIntervalMonths: null,
};

export function DataProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [cars, setCars] = useState<CarProfile[]>([]);
  const [selectedCarId, setSelectedCarId] = useState<string>("");
  const [user, setUser] = useState<UserProfile>({ name: "", email: "" });
  const [isLoading, setIsLoading] = useState(true);

  const car = useMemo(() => {
    return cars.find((c) => c.id === selectedCarId) || cars[0] || DEFAULT_CAR;
  }, [cars, selectedCarId]);

  const carRecords = useMemo(() => {
    if (!car.id) return [];
    return records.filter((r) => r.carId === car.id);
  }, [records, car.id]);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const [r, c, u, selId] = await Promise.all([
      loadRecords(),
      loadCars(),
      loadUserProfile(),
      loadSelectedCarId(),
    ]);
    setRecords(r);
    setCars(c);
    setUser(u);
    if (selId && c.some((car) => car.id === selId)) {
      setSelectedCarId(selId);
    } else if (c.length > 0) {
      setSelectedCarId(c[0].id);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const addRecord = useCallback(async (record: MaintenanceRecord) => {
    setRecords((prev) => {
      const updated = [record, ...prev];
      saveRecords(updated);
      return updated;
    });
  }, []);

  const deleteRecord = useCallback(async (id: string) => {
    setRecords((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveRecords(updated);
      return updated;
    });
  }, []);

  const addCar = useCallback(async (carData: Omit<CarProfile, "id">): Promise<CarProfile> => {
    const newCar: CarProfile = { ...carData, id: generateId() };
    setCars((prev) => {
      const updated = [...prev, newCar];
      saveCars(updated);
      return updated;
    });
    setSelectedCarId(newCar.id);
    await saveSelectedCarId(newCar.id);
    return newCar;
  }, []);

  const updateCar = useCallback(async (updatedCar: CarProfile) => {
    setCars((prev) => {
      const updated = prev.map((c) => (c.id === updatedCar.id ? updatedCar : c));
      saveCars(updated);
      return updated;
    });
  }, []);

  const deleteCar = useCallback(async (id: string) => {
    const isActive = id === selectedCarId;
    setCars((prev) => {
      const updated = prev.filter((c) => c.id !== id);
      saveCars(updated);
      if (isActive && updated.length > 0) {
        setSelectedCarId(updated[0].id);
        saveSelectedCarId(updated[0].id);
      }
      return updated;
    });
    setRecords((prev) => {
      const updated = prev.filter((r) => r.carId !== id);
      saveRecords(updated);
      return updated;
    });
  }, [selectedCarId]);

  const selectCar = useCallback(async (id: string) => {
    setSelectedCarId(id);
    await saveSelectedCarId(id);
  }, []);

  const updateUser = useCallback(async (u: UserProfile) => {
    setUser(u);
    await saveUserProfile(u);
  }, []);

  const value = useMemo(
    () => ({
      records, carRecords, cars, car, user, isLoading,
      addRecord, deleteRecord, addCar, updateCar, deleteCar, selectCar, updateUser, reload,
    }),
    [records, carRecords, cars, car, user, isLoading, addRecord, deleteRecord, addCar, updateCar, deleteCar, selectCar, updateUser, reload]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
