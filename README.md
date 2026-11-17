# ⚽ Kadro — Amateur Football Matchmaking, Regional Leagues & Gear Marketplace

[![Platform](https://img.shields.io/badge/Platform-React%20Native%20%7C%20Expo%20SDK%2058-000020?logo=expo)](https://expo.dev)
[![Language](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Router](https://img.shields.io/badge/Router-Expo%20Router-black)](https://docs.expo.dev/router/introduction/)
[![Database](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ECF8E?logo=supabase)](https://supabase.com)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Runnable%20%26%20Complete-success.svg)]()

> **Kadro** is a universal cross-platform mobile and web application (iOS, Android, and Web) designed to solve persistent logistical hurdles in amateur football (*halı saha* culture). It empowers players and squad captains to complete match lineups on an interactive tactical pitch, compare **pre-match opponent statistics**, vote on **community match predictions**, organize **regional amateur leagues**, submit **post-match Fair-Play & skill evaluations**, and **buy or sell second-hand football gear** within a trusted local community.

---

## 📌 Table of Contents
1. [Problem Definition & Motivation](#-problem-definition--motivation)
2. [Target Audience](#-target-audience)
3. [Key Features](#-key-features)
4. [App Screens & Navigation Flow](#-app-screens--navigation-flow)
5. [Tech Stack & Architecture](#-tech-stack--architecture)
6. [Data Management, Auth & Persistence](#-data-management-auth--persistence)
7. [Getting Started & Installation](#-getting-started--installation)
8. [Git Workflow & Recent Milestones](#-git-workflow--recent-milestones)
9. [Future Roadmap](#-future-roadmap)
10. [Academic Integrity & Originality](#-academic-integrity--originality)
11. [Author & Contact](#-author--contact)

---

## 🎯 Problem Definition & Motivation

In amateur football and local mini-pitch matches, players and organizers encounter recurrent challenges:
* **Last-Minute Dropouts:** A team member cancels hours before kick-off, putting the entire reservation and game at risk.
* **Scattered Communication:** Disorganized messaging groups make it hard to confirm attendance, positions, and fees.
* **No Pre-Match Context or League Structure:** Matched teams lack visibility into their opponents' previous match form, goals scored/conceded, or organized regional standings and fixtures.
* **Lack of Accountability & Fair-Play Tracking:** There is no structured post-match feedback loop to reward respectful opponents and reliable players.
* **High Equipment Costs & Idle Gear:** Football boots, goalkeeper gloves, and original kits are expensive. Players frequently have outgrown or barely-used gear sitting idle with no targeted, reliable platform to sell or trade locally.

**Kadro** unites all of these workflows into a single ecosystem: **matchmaking & tactical squad organization**, **pre-match analytics & predictions**, **regional leagues**, **post-match player/Fair-Play ratings**, and a **second-hand football gear marketplace**.

---

## 👥 Target Audience

* **Squad Captains / Organizers:** Users who book local pitches and need a reliable tool to manage line-ups, recruit missing positions, and review opposing teams.
* **Amateur Football Players:** Individuals looking for games in their neighborhood matching their skill level, position, and Fair-Play reputation.
* **Regional League Coordinators & Teams:** Local communities organizing structured multi-team tournaments with live standings, fixtures, and prize pools.
* **Sports Gear Buyers & Sellers:** Footballers seeking affordable, pre-owned boots, authentic kits, gloves, and equipment locally.

---

## 🌟 Key Features

| Category | Feature | Description |
| :--- | :--- | :--- |
| **Auth & Security** | **🔐 Supabase Auth, Recovery & Protected Routes** | Email/password sign-in, registration, and password reset recovery (`login.tsx`, `register.tsx`, `forgot-password.tsx`, `reset-password.tsx`) backed by `AuthContext`, Expo Router `Stack.Protected` guards, `on_auth_user_created` profile auto-provisioning, private `profile_contacts` separation, and strict Row Level Security (`RLS`). |
| **Matchmaking** | **🏟️ Match Discovery, Lifecycle & Tactical Pitch** | Search/filter matches by district, missing positions (`GK`, `DEF`, `MID`, `FWD`), or polls; inspect interactive pitch slots (`5v5`–`8v8`), send/cancel join requests, approve/reject as captain (`approve_join_request` / `reject_join_request`), edit/delete owned matches, or record final scores (`complete_match_atomic`). |
| **Teams & Leagues** | **🥇 Teams, Regional Leagues & Standings** | Create permanent squads with player search and captain transfer (`teams/index.tsx`), launch or edit regional leagues (`LeagueForm.tsx`), auto-generate round-robin fixtures, and record fixture scores with atomic standings/points recalculation (`record_league_fixture_result`). |
| **Reputation** | **⭐ Completed-Match Player Evaluations** | Rate teammates and opponents on Skill (`1–5`), Fair-Play (`1–5`), and badges strictly after matches are marked completed, backed by Postgres triggers preventing self-evaluation/duplicates and recalculating aggregate player profiles. |
| **Marketplace** | **🛒 Second-Hand Gear Bazaar & Uploads** | 2-column catalog displaying only `Available` listings filtered by category and district, Supabase Storage photo uploads (`avatars` & `gear-images` buckets via `mediaService.ts`), seller edit/delete/sold actions, and buyer moderation reporting. |
| **Realtime Alerts** | **🔔 Live Notifications & Expo Push** | Dedicated notifications inbox (`notifications.tsx`), Postgres trigger-backed notifications synced over Supabase Realtime, and Expo Push Notifications token registration (`notificationService.ts`). |
| **Analytics & AI** | **📊 Pre-Match Stats & KadroAI Robot** | Live H2H comparisons, league form analytics, and Poisson-based on-device score/outcome predictions (`aiPredictor.ts`, `matchupStats.ts`). |
| **Database & Tests** | **🐘 15-Table UUID Schema, Jest & EAS** | Versioned migrations in [`supabase/migrations/`](supabase/migrations/), `jest-expo` unit/service tests ([`src/__tests__/`](src/__tests__/)), and production EAS Build/Submit configuration ([`app.json`](app.json), [`eas.json`](eas.json)). |

---

## 📱 App Screens & Navigation Flow

The application uses **Expo Router** file-based routing with **declarative `Stack.Protected` authentication guards**:

```
                       [Root Layout (Auth Guard)]
                                    │
          ┌─────────────────────────┴─────────────────────────┐
          ▼ (!isAuthenticated || isPasswordRecovery)          ▼ (isAuthenticated && !isPasswordRecovery)
 [Public / Recovery Routes]                          [Protected App Screens]
 ├─ 🔐 login                                         ├─ [Main Tabs Navigator]
 ├─ 📝 register                                      │   ├─ ⚽ Maçlar (index)
 ├─ 🔑 forgot-password                               │   ├─ 🏆 Ligler (leagues)
 └─ 🔄 reset-password                                │   ├─ ➕ Oluştur (create)
                                                     │   ├─ 🛍️ Pazar (market)
                                                     │   └─ 👤 Profil (profile)
                                                     └─ [Protected Stack Screens]
                                                         ├─ 📋 match/[id]
                                                         ├─ 📦 gear/[id]
                                                         ├─ 🥇 league/[id]
                                                         ├─ 🏆 league/create
                                                         ├─ 🛡️ teams/index
                                                         └─ 🔔 notifications
```

### 0. Authentication & Recovery Screens (`login.tsx`, `register.tsx`, `forgot-password.tsx`, `reset-password.tsx`)
* **Login & Register:** Live Supabase email/password authentication capturing Name, Position, City, and District, triggering automatic provisioning in `public.profiles` and `public.profile_contacts`.
* **Password Reset:** Deep-link recovery flow (`kadro://reset-password`) verified through `Linking` URL parsing and gated with `Stack.Protected`.

### 1. Match Discovery Feed (`src/app/(tabs)/index.tsx`)
* Live search by match title, venue, or district.
* Filter chips: `Tüm Maçlar`, `🏆 Maç Tahmini Yap`, `🧤 Kaleci (GK)`, `🛡️ Defans (DEF)`, `🎯 Orta Saha (MID)`, `⚡ Forvet (FWD)`, `📍 Kadıköy`, `📍 Beşiktaş`.
* Header theme toggle (`sunny` / `moon`), live missing-player banner, regional league highlight card, featured **Günün Maç Tahmini** widget, and compact AI score badges (`🤖 AI: 3-2 (1)`) on match cards.

### 2. Regional Leagues Hub (`src/app/(tabs)/leagues.tsx`)
* Filter regional tournaments by district and status (`Tüm Ligler`, `🟢 Kayıtlar Açık`, `⚽ Devam Ediyor`).
* Displays [`LeagueCard`](src/components/LeagueCard.tsx) items with team capacity progress bars, current leader highlight, entry fee, and prize banner.

### 3. Unified Creation Hub (`src/app/(tabs)/create.tsx`)
* 3-mode segmented switcher (`Maç Aç`, `Lig Kur 🏆`, `2. El Sat`) supporting deep-linked `?tab=` parameters.
* Validated forms for publishing matches (`5v5`–`8v8`, open/indoor pitch, missing positions), launching regional leagues (team cap, rules checklist, theme color), and listing second-hand gear.

### 4. Second-Hand Gear Marketplace (`src/app/(tabs)/market.tsx`)
* 2-column responsive product grid ([`GearCard`](src/components/GearCard.tsx)).
* Category pills (`Tümü`, `👟 Kramponlar`, `👕 Formalar`, `🧤 Kaleci Eldiveni`, `🛡️ Ekipman & Top`) and sort cycling (`En Yeniler`, `Fiyat: Artan`, `Fiyat: Azalan`).

### 5. Player Profile, Requests & Settings (`src/app/(tabs)/profile.tsx`)
* Displays Skill rating, Fair-Play percentage, matches played, evaluation count, and opponent-awarded badges showcase.
* Editable profile fields (name, phone, primary position, bio).
* 6 inner tabs: `⚽ Maçlarım`, `🛡️ İstekler` (incoming captain approvals & outgoing player applications), `🏆 Tahmin`, `💬 Yorumlar`, `🛍️ İlanlarım`, and `⚙️ Ayarlar` (theme switcher, **Çıkış Yap**, active session & database engine status, and 1-click `Demo Verilerini Sıfırla`).

### 6. Match Detail, Pre-Match Stats, AI Robot & Post-Match Evaluation (`src/app/match/[id].tsx`)
* **Pre-Match Opponent Statistics ([`PreMatchStatsCard`](src/components/PreMatchStatsCard.tsx)):** Compares both matched teams' previous matches (wins, draws, losses, goals for/against, goal difference, goals per match, last 5 form, Head-to-Head record, and recent match history).
* **KadroAI Prediction Robot ([`AiPredictionBotCard`](src/components/AiPredictionBotCard.tsx)):** Generates pre-match predicted scores, `1 - X - 2` outcome probabilities, Over/Under & BTTS insights, confidence score, re-scan animation, and 1-tap **AI Tahminine Katıl** voting (plus predicted vs. actual score comparison on completed matches).
* **Community Match Prediction ([`MatchPredictionCard`](src/components/MatchPredictionCard.tsx)):** `1 - X - 2` outcome voting with live vote percentages.
* **Interactive Pitch Lineup ([`PitchLineup`](src/components/PitchLineup.tsx)):** Tap any vacant slot to join or tap your own slot to leave, paired with a full player roster list.
* **Post-Match Evaluation ([`PostMatchEvaluationSection`](src/components/PostMatchEvaluationSection.tsx) & [`PlayerEvaluationModal`](src/components/PlayerEvaluationModal.tsx)):** Rate opponents and teammates on performance and Fair-Play and award badges.

### 7. Regional League Detail (`src/app/league/[id].tsx`)
* 4-tab view: `📊 Puan Durumu` (sortable standings table with form dots), `🗓️ Fikstür` (week selector + tappable fixture cards opening a **KadroAI Prediction Robot** & **Pre-Match Opponent Statistics** modal), `🛡️ Takımlar`, and `📜 Kurallar`.
* Share league details via native share sheet and register a new team via the modal form.

### 8. Standalone League Creation (`src/app/league/create.tsx`)
* Dedicated stack screen for configuring and launching a new regional league with rules checklist and badge color selection.

### 9. Gear Item Detail (`src/app/gear/[id].tsx`)
* Product hero, condition badge, brand/size/status specification grid, seller card, direct Call / WhatsApp actions, and seller `Satıldı Olarak İşaretle` action.

---

## 🛠️ Tech Stack & Architecture

### Technology Stack
* **Framework:** [React Native](https://reactnative.dev) (`0.88.1`) with [Expo](https://expo.dev) (**SDK 58** / `~58.0.23`) and **React** (`19.3.0`)
* **Language:** [TypeScript](https://www.typescriptlang.org) (`~6.0.3`, `strict: true`)
* **Routing & Protected Guards:** [Expo Router](https://docs.expo.dev/router/introduction/) (`~58.0.30`, `Stack.Protected` declarative auth guards)
* **Backend, Auth, Storage & Realtime:** [Supabase](https://supabase.com) (`@supabase/supabase-js` `^2.119.0`, `react-native-url-polyfill` `^4.0.0`) — PostgreSQL, Supabase Auth, Storage (`avatars`, `gear-images`), Realtime channels, Row Level Security (`RLS`), and PL/pgSQL RPCs/Triggers
* **Native Capabilities:** `expo-image-picker` (`~58.0.10`), `expo-notifications` (`~58.1.9`), `expo-device` (`~58.0.5`), `expo-linking`, `expo-constants`
* **Testing & Build:** `jest` (`~30.5.2`), `jest-expo` (`~58.0.15`), `@types/jest`, and **EAS Build / Submit** (`eas.json`)
* **Web & Tunneling Support:** `react-dom` (`19.3.0`), `react-native-web` (`~0.21.4`), `@expo/metro-runtime` (`~58.0.17`), `@expo/ngrok` (`^4.1.3`)
* **State Management:** React Context API ([`AuthContext`](src/context/AuthContext.tsx), [`AppContext`](src/context/AppContext.tsx), [`ThemeContext`](src/context/ThemeContext.tsx)) + custom hooks (`useAuth`, `useApp`, `useTheme`)
* **Local Preferences & Session Storage:** `@react-native-async-storage/async-storage` (`2.2.0`)
* **UI & Layout:** `@expo/vector-icons` (`^15.0.2`), `react-native-safe-area-context` (`~5.11.1`), `react-native-screens` (`~4.30.1`), `expo-status-bar`
* **Linting & Quality:** ESLint (`^9.0.0`) with `eslint-config-expo` (`~58.0.4`, configured in `eslint.config.js`)

### Project Directory Organization
```
src/
├── __tests__/                        # Jest unit & service integration tests
├── app/                              # Expo Router file-based screens
│   ├── (tabs)/                       # Protected 5-tab bottom navigator
│   │   ├── index.tsx                 # Match Discovery Feed, Notifications & Error Banner
│   │   ├── leagues.tsx               # Regional Leagues Discovery & Teams Link
│   │   ├── create.tsx                # Unified Match / League / Gear Creation + Photo Picker
│   │   ├── market.tsx                # Available Gear Bazaar (Category + District Filters)
│   │   ├── profile.tsx               # Profile, Avatar Upload, Requests, Reviews & Settings
│   │   └── _layout.tsx               # Bottom Tabs navigator configuration
│   ├── teams/index.tsx               # Permanent Squads, Player Search & Captain Transfer
│   ├── notifications.tsx             # Realtime Notifications Inbox
│   ├── login.tsx                     # Supabase Auth Sign-In Screen
│   ├── register.tsx                  # Player Registration Screen
│   ├── forgot-password.tsx           # Password Reset Request Screen
│   ├── reset-password.tsx            # Deep-Link Password Recovery Screen
│   ├── match/[id].tsx                # Match Detail, Organizer Controls, Requests & Evaluations
│   ├── gear/[id].tsx                 # Gear Detail, Photo Preview, Edit/Delete & Report
│   ├── league/[id].tsx               # Standings, Fixtures, Score Entry, Edit & Report
│   ├── league/create.tsx             # Standalone Regional League Creation (uses LeagueForm)
│   └── _layout.tsx                   # Root Stack with Stack.Protected Auth/Recovery Guards
├── components/                       # Reusable UI components
│   ├── LeagueForm.tsx                # Shared regional league create/edit form
│   ├── ReportModal.tsx               # Content moderation report modal
│   ├── AiPredictionBotCard.tsx       # KadroAI score, outcome & probability robot card
│   ├── CaptainRequestsSection.tsx    # Captain review/approve/reject squad requests card
│   ├── JoinRequestModal.tsx          # Position-based squad join request modal
│   ├── PreMatchStatsCard.tsx         # Pre-match opponent comparison, H2H & recent matches
│   ├── MatchPredictionCard.tsx       # 1-X-2 prediction voting card with live bars
│   ├── PostMatchEvaluationSection.tsx# Completed-match opponent/teammate rating list
│   ├── PlayerEvaluationModal.tsx     # Skill, Fair-Play & badge evaluation modal
│   ├── LeagueCard.tsx                # Regional league summary card
│   ├── PitchLineup.tsx               # Interactive tactical pitch formation view
│   ├── MatchCard.tsx                 # Match card with quick vote & missing positions
│   ├── GearCard.tsx                  # Second-hand gear product card (photo + icon fallback)
│   ├── PositionBadge.tsx             # GK, DEF, MID, FWD color-coded badges
│   └── EmptyState.tsx                # Empty-state fallback view with optional CTA
├── constants/
│   └── theme.ts                      # Floodlight Charcoal & Matchday Paper tokens
├── context/
│   ├── AuthContext.tsx               # Supabase Auth session, recovery & AppState refresh
│   ├── AppContext.tsx                # Live Supabase state, Realtime listeners & actions
│   └── ThemeContext.tsx              # Persistent Dark/Light theme provider
├── lib/
│   └── supabase.ts                   # Typed Supabase client & EXPO_PUBLIC env guard
├── services/
│   ├── supabaseService.ts            # Typed PostgreSQL CRUD, RPCs & Realtime subscriptions
│   ├── mediaService.ts               # Expo ImagePicker + Supabase Storage bucket uploads
│   ├── notificationService.ts        # Expo push token registration & local notifications
│   └── storageService.ts             # AsyncStorage UI preferences helper
├── utils/
│   ├── validators.ts                 # Centralized auth, match, league, gear & rating validators
│   ├── aiPredictor.ts                # Poisson-based on-device AI score & outcome predictor
│   ├── formatters.ts                 # UI formatting helpers & symbol/initial formatters
│   └── matchupStats.ts               # Resolves pre-match & league fixture matchup statistics
└── types/
    ├── database.ts                   # Generated Supabase TypeScript schema definitions
    └── index.ts                      # Domain models & TypeScript interfaces
supabase/
├── migrations/                       # Versioned SQL migrations (tables, RPCs, RLS, hardening)
└── schema.sql                        # Migration index reference
```

---

## 💾 Data Management, Auth & Persistence

Kadro runs directly on **Supabase PostgreSQL**, **Supabase Auth**, **Supabase Storage**, and **Supabase Realtime** via [`src/lib/supabase.ts`](src/lib/supabase.ts) and [`src/services/supabaseService.ts`](src/services/supabaseService.ts):
1. **15 Normalized Tables with UUID Primary Keys:** `profiles`, `profile_contacts` (private phone/email/push token separation), `matches`, `roster_slots`, `join_requests`, `match_prediction_votes`, `teams`, `team_members`, `leagues`, `league_teams`, `league_fixtures`, `gear_items`, `evaluations`, `notifications`, and `reports`.
2. **Atomic Server-Side RPCs & Triggers:** Includes `approve_join_request`, `reject_join_request`, `join_match_slot_atomic`, `leave_match_atomic`, `complete_match_atomic`, `cast_match_prediction_vote`, `register_team_to_league`, `record_league_fixture_result`, plus triggers preventing self-evaluation/non-completed match ratings, auto-adding captains to teams, recalculating player ratings, and emitting Realtime notifications.
3. **Storage & Realtime:** Image uploads write user-scoped objects to `avatars` and `gear-images` buckets (`(storage.foldername(name))[1] = auth.uid()`); live updates subscribe to `notifications`, `matches`, `roster_slots`, and `join_requests`. `AsyncStorage` is reserved strictly for Auth session persistence and UI preferences.

### Key Data Entities (`src/types/index.ts`)
* **`User`:** `id`, `name`, `email`, `phone`, `position`, `rating`, `fairPlayRating`, `matchesPlayed`, `preferredFoot`, `city`, `district`, `bio`, `predictionScore`, `totalPredictions`, `correctPredictions`, `badges`, `evaluationsCount`
* **`Match` & `RosterSlot`:** `id`, `title`, `organizerId`, `venueName`, `address`, `date`, `time`, `format`, `pitchType`, `feePerPlayer`, `totalSlots`, `roster`, `missingPositions`, `isJoined`, `isCompleted`, `finalScore`, `prediction`, `matchupStats`
* **`JoinRequest`:** `id`, `matchId`, `slotId`, `position`, `requesterId`, `requesterName`, `requesterPhone`, `requesterRating`, `requesterFairPlay`, `message`, `status` (`PENDING` | `APPROVED` | `REJECTED`), `createdAt`, `respondedAt`
* **`MatchupStats` & `TeamMatchStats`:** `teamName`, `logoEmoji`, `played`, `won`, `drawn`, `lost`, `goalsFor`, `goalsAgainst`, `cleanSheets`, `form`, `recentMatches`, and `headToHead` (`totalMatches`, `team1Wins`, `draws`, `team2Wins`, `team1Goals`, `team2Goals`, `recentMeetings`)
* **`AiMatchPrediction`:** `predictedScore1`, `predictedScore2`, `recommendedOutcome`, `recommendedLabel`, `probTeam1`, `probDraw`, `probTeam2`, `confidence`, `dataQuality`, `expectedTotalGoals`, `overUnderLine`, `overUnderPick`, `bttsYes`, `bttsProbability`, `insights`
* **`RegionalLeague`, `LeagueTeam` & `LeagueFixture`:** Standings metrics (`played`, `won`, `drawn`, `lost`, `goalsFor`, `goalsAgainst`, `goalDifference`, `points`, `form`), fixtures, rules, prize, and registration capacity
* **`PlayerEvaluation`:** `matchId`, `evaluatorId`, `targetPlayerId`, `isOpponent`, `skillRating`, `fairPlayRating`, `badges`, `comment`
* **`GearItem`:** `id`, `sellerId`, `sellerName`, `sellerPhone`, `title`, `description`, `category`, `brand`, `size`, `price`, `condition`, `location`, `status`

### Edge-Case Handling & Reliability
* **Offline Access & Cache Fallback:** All matches, leagues, evaluations, and gear listings persist offline; [`resolveMatchupStats`](src/utils/matchupStats.ts) seamlessly resolves seeded matchup history even when upgrading from older local storage caches.
* **Empty State Fallbacks:** Informative placeholders appear when searches, filters, H2H histories, or recent match lists are empty.
* **Input Validation:** Prevents submission of empty titles/venues, invalid fees/prices, or missing positions.

---

## 🚀 Getting Started & Installation

### Prerequisites
* [Node.js](https://nodejs.org/) (`v22.13.0` or later recommended for Expo SDK 58 — tested on `v24.21.0`)
* [npm](https://www.npmjs.com/) (`v9.0.0` or later)
* Physical iOS or Android smartphone with **Expo Go** (SDK 58 compatible), Android/iOS Simulator, or a modern web browser.

### Step-by-Step Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/erenkilic3/Kadro.git
   cd Kadro
   ```

2. **Install project dependencies:**
   ```bash
   npm install
   ```

3. **Configure Supabase PostgreSQL, Auth, Storage & Realtime:**
   * Copy `.env.example` to `.env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
   * Apply all SQL migrations under [`supabase/migrations/`](supabase/migrations/) to your Supabase project (via Supabase CLI or SQL Editor).
   * In Supabase Dashboard -> Authentication -> URL Configuration, add `kadro://**` to Redirect URLs for password reset deep links.

4. **Verify tests, project health, TypeScript, and ESLint:**
   ```bash
   npm test -- --watchAll=false
   npx expo-doctor
   npx tsc --noEmit
   npx expo lint
   ```

5. **Production Builds with EAS (`eas.json` & `app.json`):**
   ```bash
   npx eas-cli@latest init
   npx eas-cli@latest build --platform android --profile production
   npx eas-cli@latest build --platform ios --profile production
   ```

5. **Start the development server:**
   ```bash
   npx expo start
   ```
   * Open the **Expo Go** app on your phone and scan the displayed QR code.
   * Or press `w` (`npm run web`) to run in a web browser.
   * Or press `a` (`npm run android`) / `i` (`npm run ios`) for Android Emulator / iOS Simulator.

---

## 🌿 Git Workflow & Recent Milestones

The project maintains a clean, traceable Git history reflecting iterative feature development and SDK maintenance:

* `f69786a` — `chore(setup): initialize Expo SDK 57 project with TypeScript and configuration`
* `8c087f9` — `feat(core): add TypeScript domain models, theme tokens, storage service, and AppContext`
* `0e04fc1` — `feat(components): implement tactical PitchLineup, MatchCard, GearCard, and PositionBadge`
* `6422a98` — `feat(screens): implement Expo Router screens for match feed, gear bazaar, squad builder, and profile`
* `d1d2c29` — `feat(web): add react-dom and react-native-web for browser execution`
* `d6d5ac7` — `feat: modern UI overhaul, light/dark mode, match predictions, regional leagues, and post-match player evaluation system`
* `d37e265` — `chore: update expo packages patch versions and install @expo/ngrok`
* `d59e57f` — `Upgrade to Expo SDK 58 and resolve TypeScript and lint errors`
* `10b28e7` — `Add pre-match opponent statistics comparison UI`
* `7407b8c` — `docs(readme): update documentation with SDK 58, leagues, evaluations, and pre-match stats`
* `78375d9` — `feat(ai): add KadroAI prediction robot for pre-match scores and outcomes and update README`
* `b4a7265` — `refactor(ui): redesign app with clean editorial sports aesthetic`
* `adeea57` — `feat(squad): add team join requests and captain approval system`
* `Supabase + Auth + Touch Ergonomics` — Added Supabase PostgreSQL schema & service layer, Supabase Auth (`AuthContext`, `login`/`register`), Expo Router `Stack.Protected` route guards, and `14px` button touch targets across the app.

---

## 🔮 Future Roadmap

- [ ] **In-App Messaging & Match Lobby:** Real-time group chat for confirmed match players and direct messaging for gear buyers/sellers.
- [ ] **Pitch Booking API:** Direct reservation integration with municipal and private sports facilities.
- [ ] **Secure Escrow Payments:** Optional in-app payment protection for second-hand gear sales.
- [ ] **Proximity Alerts:** Push notifications when someone nearby lists boots in your size or needs your playing position.
- [ ] **Multi-language Support (i18n):** Turkish (TR) and English (EN) full interface localization.

---

## ⚖️ Academic Integrity & Originality

* This project is conceived and developed independently as part of the **Mobile Application Development Final Project**.
* All UI layouts, business logic, state management mechanisms, and data schemas are original implementations authored by the student.
* Third-party open-source libraries are credited and used strictly in accordance with their licenses.
* In full agreement with the course academic integrity policy:
  > *"The code cannot be forked from other repos or someone's project. Your idea may not be original, but your codes have to be original."*

---

## 👨‍💻 Author & Contact

* **Developer:** Eren Kılıç
* **Course:** Mobile Application Development — Final Project
* **Repository:** [https://github.com/erenkilic3/Kadro](https://github.com/erenkilic3/Kadro)
