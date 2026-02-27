import type { ServiceInterval, MaintenanceRecord, CarProfile } from "./types";

export const SERVICE_INTERVALS: ServiceInterval[] = [
  { make: "Lada", models: ["Vesta", "Granta", "Niva", "XRAY", "Largus"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Toyota", models: ["Camry", "RAV4", "Corolla", "Land Cruiser", "Hilux", "Fortuner"], intervalKm: 10000, intervalMonths: 12 },
  { make: "Hyundai", models: ["Solaris", "Tucson", "Creta", "Santa Fe", "Elantra", "i30"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Kia", models: ["Rio", "Sportage", "Ceed", "Sorento", "Optima", "Seltos", "K5"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Volkswagen", models: ["Polo", "Tiguan", "Golf", "Passat", "Touareg", "Jetta", "ID.4"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Skoda", models: ["Octavia", "Rapid", "Kodiaq", "Karoq", "Superb", "Yeti", "Fabia"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Renault", models: ["Duster", "Logan", "Sandero", "Kaptur", "Arkana", "Koleos"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Nissan", models: ["Qashqai", "X-Trail", "Almera", "Juke", "Patrol", "Terrano", "Murano"], intervalKm: 15000, intervalMonths: 12 },
  { make: "BMW", models: ["3 Series", "5 Series", "X3", "X5", "X1", "7 Series", "X6"], intervalKm: 15000, intervalMonths: 24 },
  { make: "Mercedes-Benz", models: ["C-Class", "E-Class", "GLC", "GLE", "S-Class", "A-Class", "GLA"], intervalKm: 15000, intervalMonths: 24 },
  { make: "Audi", models: ["A3", "A4", "A6", "Q3", "Q5", "Q7", "Q8"], intervalKm: 15000, intervalMonths: 24 },
  { make: "Mazda", models: ["3", "6", "CX-5", "CX-9", "CX-30", "MX-5"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Ford", models: ["Focus", "Kuga", "Mondeo", "Explorer", "EcoSport", "Fiesta"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Chevrolet", models: ["Cruze", "Niva", "Aveo", "Cobalt", "Tracker", "Tahoe"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Mitsubishi", models: ["Outlander", "ASX", "Pajero", "L200", "Eclipse Cross", "Lancer"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Honda", models: ["CR-V", "Civic", "Accord", "HR-V", "Pilot", "Jazz"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Subaru", models: ["Forester", "Outback", "XV", "Impreza", "Legacy", "WRX"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Suzuki", models: ["Vitara", "SX4", "Jimny", "Swift", "Grand Vitara"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Geely", models: ["Atlas", "Coolray", "Tugella", "Monjaro", "Emgrand"], intervalKm: 10000, intervalMonths: 12 },
  { make: "Chery", models: ["Tiggo 4", "Tiggo 7 Pro", "Tiggo 8 Pro", "Arrizo", "Omoda"], intervalKm: 10000, intervalMonths: 6 },
  { make: "Haval", models: ["Jolion", "F7", "H9", "Dargo", "H5"], intervalKm: 10000, intervalMonths: 12 },
  { make: "Changan", models: ["CS35 Plus", "CS55 Plus", "CS75 Plus", "Uni-K", "Uni-V"], intervalKm: 10000, intervalMonths: 6 },
  { make: "GAC", models: ["GS8", "GS5", "GN6", "Empow"], intervalKm: 10000, intervalMonths: 6 },
  { make: "Volvo", models: ["XC60", "XC90", "S60", "S90", "V60", "XC40"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Peugeot", models: ["308", "408", "3008", "5008", "2008", "Partner"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Citroen", models: ["C4", "C5", "Berlingo", "C-Elysee", "C3"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Lexus", models: ["RX", "NX", "ES", "LX", "GX", "IS"], intervalKm: 10000, intervalMonths: 12 },
  { make: "Infiniti", models: ["QX50", "QX60", "QX80", "Q50", "Q60"], intervalKm: 15000, intervalMonths: 12 },
  { make: "Land Rover", models: ["Discovery", "Range Rover", "Defender", "Freelander", "Evoque"], intervalKm: 16000, intervalMonths: 12 },
  { make: "Porsche", models: ["Cayenne", "Macan", "Panamera", "911", "Taycan"], intervalKm: 15000, intervalMonths: 24 },
];

const DEFAULT_INTERVAL_KM = 15000;
const DEFAULT_INTERVAL_MONTHS = 12;

export function getServiceInterval(car: CarProfile): { intervalKm: number; intervalMonths: number; isCustom: boolean } {
  if (car.customIntervalKm && car.customIntervalKm > 0 && car.customIntervalMonths && car.customIntervalMonths > 0) {
    return { intervalKm: car.customIntervalKm, intervalMonths: car.customIntervalMonths, isCustom: true };
  }

  const entry = SERVICE_INTERVALS.find(
    (s) => s.make.toLowerCase() === car.make.toLowerCase()
  );
  if (entry) {
    return { intervalKm: entry.intervalKm, intervalMonths: entry.intervalMonths, isCustom: false };
  }
  return { intervalKm: DEFAULT_INTERVAL_KM, intervalMonths: DEFAULT_INTERVAL_MONTHS, isCustom: false };
}

export interface NextServiceInfo {
  byMileageKm: number;
  byDate: string;
  daysLeft: number | null;
  kmLeft: number | null;
  overdue: boolean;
}

export function calcNextService(
  records: MaintenanceRecord[],
  car: CarProfile
): NextServiceInfo | null {
  const plannedRecords = records
    .filter((r) => r.eventType === "planned")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (plannedRecords.length === 0) return null;

  const lastPlanned = plannedRecords[0];
  const { intervalKm, intervalMonths } = getServiceInterval(car);

  const byMileageKm = lastPlanned.mileageKm + intervalKm;

  const lastDate = new Date(lastPlanned.date);
  const nextDate = new Date(lastDate);
  nextDate.setMonth(nextDate.getMonth() + intervalMonths);
  const byDate = nextDate.toISOString().slice(0, 10);

  const now = new Date();
  const diffMs = nextDate.getTime() - now.getTime();
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const allSorted = [...records].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const currentMileage = allSorted.length > 0 ? allSorted[0].mileageKm : lastPlanned.mileageKm;
  const kmLeft = byMileageKm - currentMileage;

  const overdue = daysLeft < 0 || kmLeft < 0;

  return { byMileageKm, byDate, daysLeft, kmLeft, overdue };
}
