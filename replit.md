# replit.md

## Overview

Car Journal is a mobile application for tracking car maintenance, built with React Native (Expo) and an Express backend. Users can log maintenance records (planned, unplanned, refueling, future), track mileage, view spending statistics, and manage their car profile. The app features a bottom tab navigation with four sections: Home (dashboard), Journal (maintenance log), Stats (spending analytics), and Profile (user/car settings). The entire UI is in Russian.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Mobile App)
- **Framework**: React Native with Expo SDK 54, TypeScript
- **Navigation**: Expo Router (file-based routing) with bottom tabs and stack navigation
  - Tab screens: `app/(tabs)/` — index (dashboard), journal, stats, profile
  - Modal/stack screens: `app/add-record.tsx`, `app/edit-car.tsx`, `app/record-detail.tsx`
- **State Management**: React Context (`lib/DataContext.tsx`) wrapping the entire app, providing CRUD operations for records, **multiple cars**, and user profile. Exposes `cars[]`, `car` (active selected), `carRecords` (filtered by active car), `addCar`, `updateCar`, `deleteCar`, `selectCar`.
- **Data Persistence**: AsyncStorage (`lib/storage.ts`) — stores cars array, selected car ID, records, and user profile. Migrates legacy single-car data. Not yet connected to the backend API.
- **Styling**: Custom StyleSheet-based styling with a centralized color system (`constants/colors.ts`). Primary color is blue (#2563EB). Uses Inter font family via `@expo-google-fonts/inter`.
- **Key Libraries**: 
  - `react-native-gesture-handler`, `react-native-reanimated` for gestures/animations
  - `react-native-keyboard-controller` for keyboard handling
  - `expo-image-picker` for car photos
  - `expo-haptics` for tactile feedback
  - `expo-auth-session`, `expo-web-browser` for Google OAuth
  - `@tanstack/react-query` (configured but primarily used for potential API integration)

### Backend (Express Server)
- **Framework**: Express 5 on Node.js (`server/index.ts`)
- **Database Connection**: `server/db.ts` — Drizzle ORM with `pg` (node-postgres) Pool driver
- **Routes**: `server/routes.ts` — Full RESTful API with `/api` prefix:
  - `POST /api/users` — create user
  - `GET /api/users/:id` — get user (excludes password)
  - `PUT /api/users/:id` — update user profile
  - `POST /api/auth/google` — Google OAuth login/registration (upsert by googleId)
  - `GET /api/users/:userId/cars` — list user's cars
  - `GET /api/cars/:id` — get car
  - `POST /api/cars` — create car
  - `PUT /api/cars/:id` — update car
  - `DELETE /api/cars/:id` — delete car (cascades to records)
  - `GET /api/cars/:carId/records` — list records for car
  - `GET /api/users/:userId/records` — list records for user
  - `GET /api/records/:id` — get record with items
  - `POST /api/records` — create record with items
  - `PUT /api/records/:id` — update record (replaces items if provided)
  - `DELETE /api/records/:id` — delete record
  - `GET /api/service-intervals` — list all brand intervals
  - `GET /api/service-intervals/:make` — get interval by make
- **Storage Layer**: `server/storage.ts` — `DatabaseStorage` class implementing `IStorage` interface with full PostgreSQL persistence via Drizzle ORM
- **Seed Data**: `server/seed-data.ts` — 30+ car brand service intervals auto-seeded on startup
- **GitHub Integration**: `server/github.ts` — Octokit client for GitHub connector
- **CORS**: Configured for Replit domains and localhost development
- **Build**: Uses `esbuild` for server bundling, `tsx` for development

### Database Schema (Drizzle ORM)
- **ORM**: Drizzle ORM with PostgreSQL dialect (`drizzle.config.ts`)
- **Schema**: `shared/schema.ts` — 5 tables:
  - `users` — id (UUID), username, password, displayName, email, googleId, createdAt
  - `cars` — id (UUID), userId (FK→users), make, model, year, vin, photoUri, currency, customIntervalKm, customIntervalMonths, createdAt
  - `service_intervals` — id (UUID), make, models (text[]), intervalKm, intervalMonths
  - `maintenance_records` — id (UUID), carId (FK→cars), userId (FK→users), date, mileageKm, eventType (enum: planned/unplanned/refueling/future), title, totalCost (numeric), currency, createdAt
  - `record_items` — id (UUID), recordId (FK→maintenance_records), name, cost (numeric)
- **Cascade deletes**: Deleting a user cascades to cars → records → items; deleting a car cascades to records → items
- **Enum**: `event_type` PostgreSQL enum for planned/unplanned/refueling/future
- **Migration**: Uses `drizzle-kit push` for schema sync
- **Validation**: `drizzle-zod` for schema-to-Zod validation

### Data Models (Client-Side)
Defined in `lib/types.ts`:
- **MaintenanceRecord**: id, **carId**, date, mileageKm, eventType (planned/unplanned/refueling/future), title, items (array of name+cost), totalCost, currency
- **CarProfile**: **id**, make, model, year, VIN, photoUri, currency, customIntervalKm, customIntervalMonths
- **UserProfile**: name, email
- **ServiceInterval**: make, models, intervalKm, intervalMonths — used for service schedule predictions

### Event Types
- **Плановое (planned)**: Regular scheduled maintenance — counts toward next service calculation
- **Внеплановое (unplanned)**: Unexpected repairs
- **Заправка (refueling)**: Fuel stops
- **На будущее (future)**: Planned future work — hides date/mileage/cost fields, shown with purple (#8B5CF6) badge, excluded from stats and dashboard KPIs

### Key Architectural Notes
- The backend is fully built with PostgreSQL persistence for users, cars, records, and service intervals.
- The mobile frontend still stores data locally via AsyncStorage — not yet wired to the API. Future step: connect frontend DataContext to backend API via React Query.
- **Service intervals** (`lib/service-intervals.ts` client-side + `service_intervals` DB table) contain 30+ car makes with recommended maintenance intervals. `getServiceInterval(car: CarProfile)` checks custom interval first, then falls back to brand defaults.
- **Custom service intervals** can be set per car (km and months) in the Profile screen, saved to `CarProfile.customIntervalKm` and `CarProfile.customIntervalMonths`.
- **Statistics** (`lib/stats.ts`) compute monthly totals, averages, planned vs unplanned breakdowns, cost per km, yearly totals — "future" records are excluded. Stats screen has time-period filters (3m/6m/12m/all). `getAvgPerYear` uses actual 12-month rolling periods.
- The app uses Russian locale formatting (dates, numbers) and Ruble (₽) currency, but currency is configurable per car profile.
- **Google Auth**: Uses `expo-auth-session` with platform-specific client IDs (`EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`). Backend has `/api/auth/google` endpoint for user upsert by googleId.

### Build & Development
- **Dev mode**: Two processes — `expo:dev` for the mobile app, `server:dev` for the Express backend
- **Production**: Static Expo build (`expo:static:build`) served by the Express server (`server:prod`)
- **Replit integration**: Uses `REPLIT_DEV_DOMAIN` and related env vars for proxying and CORS
- **GitHub**: Synced to `aishchekoldin/car-journal` via Replit GitHub connector

## External Dependencies

- **PostgreSQL**: Required via `DATABASE_URL` environment variable. Full schema with 5 tables for users, cars, records, record items, and service intervals.
- **pg**: `pg` (node-postgres) for database connections via connection pool
- **AsyncStorage**: `@react-native-async-storage/async-storage` for client-side persistent storage (still in use, not yet migrated to API)
- **Expo Services**: Standard Expo managed workflow services (splash screen, fonts, image picker, haptics, auth-session, web-browser, etc.)
- **Google OAuth**: Optional — requires `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (and optionally platform-specific IDs) to enable Google sign-in.
