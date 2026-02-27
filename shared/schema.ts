import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  numeric,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const eventTypeEnum = pgEnum("event_type", [
  "planned",
  "unplanned",
  "refueling",
  "future",
]);

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name").default(""),
  email: text("email").default(""),
  googleId: text("google_id").unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const cars = pgTable("cars", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  make: text("make").notNull(),
  model: text("model").notNull().default(""),
  year: text("year").notNull().default(""),
  vin: text("vin").default(""),
  photoUri: text("photo_uri"),
  currency: text("currency").notNull().default("₽"),
  customIntervalKm: integer("custom_interval_km"),
  customIntervalMonths: integer("custom_interval_months"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const serviceIntervals = pgTable("service_intervals", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  make: text("make").notNull(),
  models: text("models").array().notNull().default(sql`'{}'::text[]`),
  intervalKm: integer("interval_km").notNull().default(15000),
  intervalMonths: integer("interval_months").notNull().default(12),
});

export const maintenanceRecords = pgTable("maintenance_records", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  carId: varchar("car_id")
    .notNull()
    .references(() => cars.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  date: text("date").notNull().default(""),
  mileageKm: integer("mileage_km").notNull().default(0),
  eventType: eventTypeEnum("event_type").notNull().default("planned"),
  title: text("title").notNull().default(""),
  totalCost: numeric("total_cost", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  currency: text("currency").notNull().default("₽"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const recordItems = pgTable("record_items", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  recordId: varchar("record_id")
    .notNull()
    .references(() => maintenanceRecords.id, { onDelete: "cascade" }),
  name: text("name").notNull().default(""),
  cost: numeric("cost", { precision: 12, scale: 2 }).notNull().default("0"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCarSchema = createInsertSchema(cars)
  .omit({ id: true, createdAt: true })
  .extend({
    userId: z.string(),
    make: z.string().min(1),
  });

export const insertMaintenanceRecordSchema = createInsertSchema(
  maintenanceRecords
)
  .omit({ id: true, createdAt: true })
  .extend({
    carId: z.string(),
    userId: z.string(),
    totalCost: z.union([z.string(), z.number()]).transform(String).optional().default("0"),
    items: z
      .array(z.object({ name: z.string(), cost: z.number() }))
      .optional()
      .default([]),
  });

export const insertRecordItemSchema = createInsertSchema(recordItems).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCar = z.infer<typeof insertCarSchema>;
export type Car = typeof cars.$inferSelect;

export type ServiceInterval = typeof serviceIntervals.$inferSelect;

export type InsertMaintenanceRecord = z.infer<
  typeof insertMaintenanceRecordSchema
>;
export type MaintenanceRecord = typeof maintenanceRecords.$inferSelect;

export type InsertRecordItem = z.infer<typeof insertRecordItemSchema>;
export type RecordItem = typeof recordItems.$inferSelect;
