import type { Express, Request, Response } from "express";
import { createServer, type Server } from "node:http";
import { storage } from "./storage";
import { SERVICE_INTERVALS_SEED } from "./seed-data";
import {
  insertUserSchema,
  insertCarSchema,
  insertMaintenanceRecordSchema,
} from "@shared/schema";
import { z } from "zod";

function normalizeRecord(record: any) {
  return {
    ...record,
    totalCost: Number(record.totalCost),
    items: (record.items || []).map((item: any) => ({
      ...item,
      cost: Number(item.cost),
    })),
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  await storage.seedServiceIntervals(SERVICE_INTERVALS_SEED);

  app.get("/api/users/:id", async (req: Request, res: Response) => {
    const user = await storage.getUser(req.params.id);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    const { password, ...safe } = user;
    res.json(safe);
  });

  app.post("/api/users", async (req: Request, res: Response) => {
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
    }
    try {
      const user = await storage.createUser(parsed.data);
      const { password, ...safe } = user;
      res.status(201).json(safe);
    } catch (err: any) {
      if (err?.message?.includes("unique")) {
        return res.status(409).json({ error: "Пользователь уже существует" });
      }
      throw err;
    }
  });

  app.put("/api/users/:id", async (req: Request, res: Response) => {
    const user = await storage.updateUser(req.params.id, req.body);
    if (!user) return res.status(404).json({ error: "Пользователь не найден" });
    const { password, ...safe } = user;
    res.json(safe);
  });

  app.post("/api/auth/google", async (req: Request, res: Response) => {
    const { googleId, email, displayName } = req.body;
    if (!googleId || !email) {
      return res.status(400).json({ error: "googleId и email обязательны" });
    }

    let user = await storage.getUserByGoogleId(googleId);
    if (user) {
      user = (await storage.updateUser(user.id, { displayName, email }))!;
      const { password, ...safe } = user;
      return res.json(safe);
    }

    const username = email.split("@")[0] + "_" + Date.now();
    const newUser = await storage.createUser({
      username,
      password: "",
    });
    user = (await storage.updateUser(newUser.id, {
      googleId,
      email,
      displayName,
    }))!;
    const { password, ...safe } = user;
    res.status(201).json(safe);
  });

  app.get("/api/users/:userId/cars", async (req: Request, res: Response) => {
    const carsList = await storage.getCarsByUser(req.params.userId);
    res.json(carsList);
  });

  app.get("/api/cars/:id", async (req: Request, res: Response) => {
    const car = await storage.getCar(req.params.id);
    if (!car) return res.status(404).json({ error: "Машина не найдена" });
    res.json(car);
  });

  app.post("/api/cars", async (req: Request, res: Response) => {
    const parsed = insertCarSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
    }
    const car = await storage.createCar(parsed.data);
    res.status(201).json(car);
  });

  app.put("/api/cars/:id", async (req: Request, res: Response) => {
    const car = await storage.updateCar(req.params.id, req.body);
    if (!car) return res.status(404).json({ error: "Машина не найдена" });
    res.json(car);
  });

  app.delete("/api/cars/:id", async (req: Request, res: Response) => {
    const ok = await storage.deleteCar(req.params.id);
    if (!ok) return res.status(404).json({ error: "Машина не найдена" });
    res.json({ success: true });
  });

  app.get(
    "/api/cars/:carId/records",
    async (req: Request, res: Response) => {
      const records = await storage.getRecordsByCar(req.params.carId);
      res.json(records.map(normalizeRecord));
    }
  );

  app.get(
    "/api/users/:userId/records",
    async (req: Request, res: Response) => {
      const records = await storage.getRecordsByUser(req.params.userId);
      res.json(records.map(normalizeRecord));
    }
  );

  app.get("/api/records/:id", async (req: Request, res: Response) => {
    const record = await storage.getRecord(req.params.id);
    if (!record) return res.status(404).json({ error: "Запись не найдена" });
    res.json(normalizeRecord(record));
  });

  app.post("/api/records", async (req: Request, res: Response) => {
    const parsed = insertMaintenanceRecordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: "Неверные данные", details: parsed.error.flatten() });
    }
    const record = await storage.createRecord(parsed.data);
    res.status(201).json(normalizeRecord(record));
  });

  app.put("/api/records/:id", async (req: Request, res: Response) => {
    const record = await storage.updateRecord(req.params.id, req.body);
    if (!record) return res.status(404).json({ error: "Запись не найдена" });
    res.json(normalizeRecord(record));
  });

  app.delete("/api/records/:id", async (req: Request, res: Response) => {
    const ok = await storage.deleteRecord(req.params.id);
    if (!ok) return res.status(404).json({ error: "Запись не найдена" });
    res.json({ success: true });
  });

  app.get("/api/service-intervals", async (_req: Request, res: Response) => {
    const intervals = await storage.getAllServiceIntervals();
    res.json(intervals);
  });

  app.get(
    "/api/service-intervals/:make",
    async (req: Request, res: Response) => {
      const interval = await storage.getServiceIntervalByMake(req.params.make);
      if (!interval)
        return res
          .status(404)
          .json({ error: "Интервал для этой марки не найден" });
      res.json(interval);
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
