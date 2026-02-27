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
- **State Management**: React Context (`lib/DataContext.tsx`) wrapping the entire app, providing CRUD operations for records, car profile, and user profile
- **Data Persistence**: AsyncStorage (`lib/storage.ts`) — currently the primary data store for all app data (records, car profile, user profile). This is a local-only solution.
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
- **Routes**: Registered in `server/routes.ts` — currently minimal, serves as API scaffold with `/api` prefix convention
- **Storage Layer**: `server/storage.ts` has a `MemStorage` class implementing `IStorage` interface for users. This is an in-memory placeholder.
- **GitHub Integration**: `server/github.ts` — Octokit client for GitHub connector
- **CORS**: Configured for Replit domains and localhost development
- **Build**: Uses `esbuild` for server bundling, `tsx` for development

### Database Schema (Drizzle ORM)
- **ORM**: Drizzle ORM with PostgreSQL dialect (`drizzle.config.ts`)
- **Schema**: `shared/schema.ts` — currently only has a `users` table (id, username, password). The maintenance records, car profiles, etc. are NOT yet in the database schema — they live in AsyncStorage on the client.
- **Migration**: Uses `drizzle-kit push` for schema sync
- **Validation**: `drizzle-zod` for schema-to-Zod validation

### Data Models (Client-Side)
Defined in `lib/types.ts`:
- **MaintenanceRecord**: id, date, mileageKm, eventType (planned/unplanned/refueling/future), title, items (array of name+cost), totalCost, currency
- **CarProfile**: make, model, year, VIN, photoUri, currency, customIntervalKm, customIntervalMonths
- **UserProfile**: name, email
- **ServiceInterval**: make, models, intervalKm, intervalMonths — used for service schedule predictions

### Event Types
- **Плановое (planned)**: Regular scheduled maintenance — counts toward next service calculation
- **Внеплановое (unplanned)**: Unexpected repairs
- **Заправка (refueling)**: Fuel stops
- **На будущее (future)**: Planned future work — hides date/mileage/cost fields, shown with purple (#8B5CF6) badge, excluded from stats and dashboard KPIs

### Key Architectural Notes
- The app has a **split architecture**: the mobile frontend stores all car/record data locally via AsyncStorage, while the Express backend with Postgres is scaffolded but not yet wired up for this data.
- **Service intervals** (`lib/service-intervals.ts`) contain 30+ car makes with recommended maintenance intervals. `getServiceInterval(car: CarProfile)` checks custom interval first, then falls back to brand defaults.
- **Custom service intervals** can be set per car (km and months) in the Profile screen, saved to `CarProfile.customIntervalKm` and `CarProfile.customIntervalMonths`.
- **Statistics** (`lib/stats.ts`) compute monthly totals, averages, and planned vs unplanned breakdowns — "future" records are excluded.
- The app uses Russian locale formatting (dates, numbers) and Ruble (₽) currency, but currency is configurable per car profile.
- **Google Auth**: Uses `expo-auth-session` with platform-specific client IDs (`EXPO_PUBLIC_GOOGLE_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`). Requires Google OAuth credentials to function.

### Build & Development
- **Dev mode**: Two processes — `expo:dev` for the mobile app, `server:dev` for the Express backend
- **Production**: Static Expo build (`expo:static:build`) served by the Express server (`server:prod`)
- **Replit integration**: Uses `REPLIT_DEV_DOMAIN` and related env vars for proxying and CORS
- **GitHub**: Synced to `aishchekoldin/car-journal` via Replit GitHub connector

## External Dependencies

- **PostgreSQL**: Required via `DATABASE_URL` environment variable. Used by Drizzle ORM for the server-side database. Currently only the `users` table is defined.
- **AsyncStorage**: `@react-native-async-storage/async-storage` for client-side persistent storage of maintenance records, car profile, and user profile.
- **Expo Services**: Standard Expo managed workflow services (splash screen, fonts, image picker, haptics, auth-session, web-browser, etc.)
- **Google OAuth**: Optional — requires `EXPO_PUBLIC_GOOGLE_CLIENT_ID` (and optionally platform-specific IDs) to enable Google sign-in.
