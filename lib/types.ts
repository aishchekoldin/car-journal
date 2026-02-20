export interface RecordItem {
  itemId: string;
  name: string;
  cost: number;
}

export type EventType = "planned" | "unplanned";

export interface MaintenanceRecord {
  id: string;
  date: string;
  mileageKm: number;
  eventType: EventType;
  title: string;
  items: RecordItem[];
  totalCost: number;
  currency: string;
}

export interface CarProfile {
  make: string;
  model: string;
  year: string;
  vin: string;
  photoUri: string | null;
  currency: string;
}

export interface UserProfile {
  name: string;
  email: string;
}

export function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}
