import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  cars,
  maintenanceRecords,
  recordItems,
  serviceIntervals,
  type User,
  type InsertUser,
  type Car,
  type InsertCar,
  type MaintenanceRecord,
  type InsertMaintenanceRecord,
  type RecordItem,
  type ServiceInterval,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByGoogleId(googleId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(
    id: string,
    data: Partial<Pick<User, "displayName" | "email" | "googleId">>
  ): Promise<User | undefined>;

  getCarsByUser(userId: string): Promise<Car[]>;
  getCar(id: string): Promise<Car | undefined>;
  createCar(data: InsertCar): Promise<Car>;
  updateCar(id: string, data: Partial<Omit<Car, "id" | "createdAt">>): Promise<Car | undefined>;
  deleteCar(id: string): Promise<boolean>;

  getRecordsByCar(carId: string): Promise<(MaintenanceRecord & { items: RecordItem[] })[]>;
  getRecordsByUser(userId: string): Promise<(MaintenanceRecord & { items: RecordItem[] })[]>;
  getRecord(id: string): Promise<(MaintenanceRecord & { items: RecordItem[] }) | undefined>;
  createRecord(
    data: InsertMaintenanceRecord
  ): Promise<MaintenanceRecord & { items: RecordItem[] }>;
  updateRecord(
    id: string,
    data: Partial<Omit<MaintenanceRecord, "id" | "createdAt">> & {
      items?: { name: string; cost: number }[];
    }
  ): Promise<(MaintenanceRecord & { items: RecordItem[] }) | undefined>;
  deleteRecord(id: string): Promise<boolean>;

  getAllServiceIntervals(): Promise<ServiceInterval[]>;
  getServiceIntervalByMake(make: string): Promise<ServiceInterval | undefined>;
  seedServiceIntervals(intervals: Omit<ServiceInterval, "id">[]): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.username, username));
    return rows[0];
  }

  async getUserByGoogleId(googleId: string): Promise<User | undefined> {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId));
    return rows[0];
  }

  async createUser(data: InsertUser): Promise<User> {
    const rows = await db.insert(users).values(data).returning();
    return rows[0];
  }

  async updateUser(
    id: string,
    data: Partial<Pick<User, "displayName" | "email" | "googleId">>
  ): Promise<User | undefined> {
    const rows = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return rows[0];
  }

  async getCarsByUser(userId: string): Promise<Car[]> {
    return db
      .select()
      .from(cars)
      .where(eq(cars.userId, userId))
      .orderBy(desc(cars.createdAt));
  }

  async getCar(id: string): Promise<Car | undefined> {
    const rows = await db.select().from(cars).where(eq(cars.id, id));
    return rows[0];
  }

  async createCar(data: InsertCar): Promise<Car> {
    const rows = await db.insert(cars).values(data).returning();
    return rows[0];
  }

  async updateCar(
    id: string,
    data: Partial<Omit<Car, "id" | "createdAt">>
  ): Promise<Car | undefined> {
    const rows = await db
      .update(cars)
      .set(data)
      .where(eq(cars.id, id))
      .returning();
    return rows[0];
  }

  async deleteCar(id: string): Promise<boolean> {
    const rows = await db.delete(cars).where(eq(cars.id, id)).returning();
    return rows.length > 0;
  }

  private async attachItems(
    record: MaintenanceRecord
  ): Promise<MaintenanceRecord & { items: RecordItem[] }> {
    const items = await db
      .select()
      .from(recordItems)
      .where(eq(recordItems.recordId, record.id));
    return { ...record, items };
  }

  async getRecordsByCar(
    carId: string
  ): Promise<(MaintenanceRecord & { items: RecordItem[] })[]> {
    const rows = await db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.carId, carId))
      .orderBy(desc(maintenanceRecords.createdAt));
    return Promise.all(rows.map((r) => this.attachItems(r)));
  }

  async getRecordsByUser(
    userId: string
  ): Promise<(MaintenanceRecord & { items: RecordItem[] })[]> {
    const rows = await db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.userId, userId))
      .orderBy(desc(maintenanceRecords.createdAt));
    return Promise.all(rows.map((r) => this.attachItems(r)));
  }

  async getRecord(
    id: string
  ): Promise<(MaintenanceRecord & { items: RecordItem[] }) | undefined> {
    const rows = await db
      .select()
      .from(maintenanceRecords)
      .where(eq(maintenanceRecords.id, id));
    if (rows.length === 0) return undefined;
    return this.attachItems(rows[0]);
  }

  async createRecord(
    data: InsertMaintenanceRecord
  ): Promise<MaintenanceRecord & { items: RecordItem[] }> {
    const { items: itemsData, ...recordData } = data;
    const rows = await db
      .insert(maintenanceRecords)
      .values(recordData)
      .returning();
    const record = rows[0];

    let items: RecordItem[] = [];
    if (itemsData && itemsData.length > 0) {
      items = await db
        .insert(recordItems)
        .values(
          itemsData.map((item) => ({
            recordId: record.id,
            name: item.name,
            cost: item.cost.toString(),
          }))
        )
        .returning();
    }

    return { ...record, items };
  }

  async updateRecord(
    id: string,
    data: Partial<Omit<MaintenanceRecord, "id" | "createdAt">> & {
      items?: { name: string; cost: number }[];
    }
  ): Promise<(MaintenanceRecord & { items: RecordItem[] }) | undefined> {
    const { items: itemsData, ...recordData } = data;

    const cleanData: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(recordData)) {
      if (val !== undefined) cleanData[key] = val;
    }

    let record: MaintenanceRecord;
    if (Object.keys(cleanData).length > 0) {
      const rows = await db
        .update(maintenanceRecords)
        .set(cleanData)
        .where(eq(maintenanceRecords.id, id))
        .returning();
      if (rows.length === 0) return undefined;
      record = rows[0];
    } else {
      const rows = await db
        .select()
        .from(maintenanceRecords)
        .where(eq(maintenanceRecords.id, id));
      if (rows.length === 0) return undefined;
      record = rows[0];
    }

    if (itemsData !== undefined) {
      await db.delete(recordItems).where(eq(recordItems.recordId, id));
      let items: RecordItem[] = [];
      if (itemsData.length > 0) {
        items = await db
          .insert(recordItems)
          .values(
            itemsData.map((item) => ({
              recordId: id,
              name: item.name,
              cost: item.cost.toString(),
            }))
          )
          .returning();
      }
      return { ...record, items };
    }

    return this.attachItems(record);
  }

  async deleteRecord(id: string): Promise<boolean> {
    const rows = await db
      .delete(maintenanceRecords)
      .where(eq(maintenanceRecords.id, id))
      .returning();
    return rows.length > 0;
  }

  async getAllServiceIntervals(): Promise<ServiceInterval[]> {
    return db.select().from(serviceIntervals);
  }

  async getServiceIntervalByMake(
    make: string
  ): Promise<ServiceInterval | undefined> {
    const rows = await db
      .select()
      .from(serviceIntervals)
      .where(eq(serviceIntervals.make, make));
    return rows[0];
  }

  async seedServiceIntervals(
    intervals: Omit<ServiceInterval, "id">[]
  ): Promise<void> {
    const existing = await db.select().from(serviceIntervals);
    if (existing.length > 0) return;

    if (intervals.length > 0) {
      await db.insert(serviceIntervals).values(intervals);
    }
  }
}

export const storage = new DatabaseStorage();
