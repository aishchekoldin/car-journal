import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, ReactNode } from "react";
import type { MaintenanceRecord, CarProfile, UserProfile } from "./types";
import { loadRecords, saveRecords, loadCarProfile, saveCarProfile, loadUserProfile, saveUserProfile } from "./storage";

interface DataContextValue {
  records: MaintenanceRecord[];
  car: CarProfile;
  user: UserProfile;
  isLoading: boolean;
  addRecord: (record: MaintenanceRecord) => Promise<void>;
  deleteRecord: (id: string) => Promise<void>;
  updateCar: (car: CarProfile) => Promise<void>;
  updateUser: (user: UserProfile) => Promise<void>;
  reload: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [car, setCar] = useState<CarProfile>({
    make: "Skoda",
    model: "Yeti",
    year: "2015",
    vin: "",
    photoUri: null,
    currency: "\u20BD",
    customIntervalKm: null,
    customIntervalMonths: null,
  });
  const [user, setUser] = useState<UserProfile>({ name: "", email: "" });
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    setIsLoading(true);
    const [r, c, u] = await Promise.all([loadRecords(), loadCarProfile(), loadUserProfile()]);
    setRecords(r);
    setCar(c);
    setUser(u);
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

  const updateCar = useCallback(async (c: CarProfile) => {
    setCar(c);
    await saveCarProfile(c);
  }, []);

  const updateUser = useCallback(async (u: UserProfile) => {
    setUser(u);
    await saveUserProfile(u);
  }, []);

  const value = useMemo(
    () => ({ records, car, user, isLoading, addRecord, deleteRecord, updateCar, updateUser, reload }),
    [records, car, user, isLoading, addRecord, deleteRecord, updateCar, updateUser, reload]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
