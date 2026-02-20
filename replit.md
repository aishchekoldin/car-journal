# replit.md

## Overview

Car Journal is a mobile application for tracking car maintenance, built with React Native (Expo) and an Express backend. Users can log maintenance records (planned, unplanned, refueling), track mileage, view spending statistics, and manage their car profile. The app features a bottom tab navigation with four sections: Home (dashboard), Journal (maintenance log), Stats (spending analytics), and Profile (user/car settings).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Mobile App)
- **Framework**: React Native with Expo SDK 54, TypeScript
- **Navigation**: Expo Router (file-based routing) with bottom tabs and stack navigation
  - Tab screens: `app/(tabs)/` — index (dashboard), journal, stats, profile
  - Modal/stack screens: `app/add-record.tsx`, `app/edit-car.tsx`, `app/record-detail.tsx`
- **State Management**: React Context (`lib/DataContext.tsx`) wrapping the entire app, providing CRUD operations for records, car profile, and user profile
- **Data Persistence**: AsyncStorage (`lib/storage.ts`) — currently the primary data store for all app data (records, car profile, user profile). This is a local-only solution.
- **Styling**: Custom StyleSheet-based styling with a centralized color system (`constants/colors.ts`). Primary color is blue (#2563EB). Uses Inter font family via `@expo-google-fonts/inter`.
- **Key Libraries**: 
  - `react-native-gesture-handler`, `react-native-reanimated` for gestures/animations
  - `react-native-keyboard-controller` for keyboard handling
  - `expo-image-picker` for car photos
  - `expo-haptics` for tactile feedback
  - `@tanstack/react-query` (configured but primarily used for potential API integration)

### Backend (Express Server)
- **Framework**: Express 5 on Node.js (`server/index.ts`)
- **Routes**: Registered in `server/routes.ts` — currently minimal, serves as API scaffold with `/api` prefix convention
- **Storage Layer**: `server/storage.ts` has a `MemStorage` class implementing `IStorage` interface for users. This is an in-memory placeholder.
- **CORS**: Configured for Replit domains and localhost development
- **Build**: Uses `esbuild` for server bundling, `tsx` for development

### Database Schema (Drizzle ORM)
- **ORM**: Drizzle ORM with PostgreSQL dialect (`drizzle.config.ts`)
- **Schema**: `shared/schema.ts` — currently only has a `users` table (id, username, password). The maintenance records, car profiles, etc. are NOT yet in the database schema — they live in AsyncStorage on the client.
- **Migration**: Uses `drizzle-kit push` for schema sync
- **Validation**: `drizzle-zod` for schema-to-Zod validation

### Data Models (Client-Side)
Defined in `lib/types.ts`:
- **MaintenanceRecord**: id, date, mileageKm, eventType (planned/unplanned/refueling), title, items (array of name+cost), totalCost, currency
- **CarProfile**: make, model, year, VIN, photoUri, currency
- **UserProfile**: name, email
- **ServiceInterval**: make, models, intervalKm, intervalMonths — used for service schedule predictions

### Key Architectural Notes
- The app has a **split architecture**: the mobile frontend stores all car/record data locally via AsyncStorage, while the Express backend with Postgres is scaffolded but not yet wired up for this data. The backend currently only has a basic user table.
- **Service intervals** (`lib/service-intervals.ts`) contain a comprehensive list of car makes with recommended maintenance intervals, used to calculate next service predictions on the dashboard.
- **Statistics** (`lib/stats.ts`) compute monthly totals, averages, and planned vs unplanned breakdowns from records.
- The app defaults to Russian locale formatting (dates, numbers) and Ruble (₽) currency, but currency is configurable per car profile.

### Build & Development
- **Dev mode**: Two processes — `expo:dev` for the mobile app, `server:dev` for the Express backend
- **Production**: Static Expo build (`expo:static:build`) served by the Express server (`server:prod`)
- **Replit integration**: Uses `REPLIT_DEV_DOMAIN` and related env vars for proxying and CORS

## External Dependencies

- **PostgreSQL**: Required via `DATABASE_URL` environment variable. Used by Drizzle ORM for the server-side database. Currently only the `users` table is defined.
- **AsyncStorage**: `@react-native-async-storage/async-storage` for client-side persistent storage of maintenance records, car profile, and user profile.
- **Expo Services**: Standard Expo managed workflow services (splash screen, fonts, image picker, haptics, etc.)
- **No external APIs or third-party services** are currently integrated beyond the Expo ecosystem.