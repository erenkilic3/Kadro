# ⚽ Kadro — Amateur Football Matchmaking, Squad Organizer & Gear Marketplace

[![Platform](https://img.shields.io/badge/Platform-Flutter%20%7C%20Android%20%7C%20iOS-02569B?logo=flutter)](https://flutter.dev)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-In%20Development-orange.svg)]()
[![Architecture](https://img.shields.io/badge/Architecture-MVVM%20%2B%20Clean%20Architecture-blue.svg)]()

> **Kadro** is an all-in-one cross-platform mobile application designed to solve persistent logistical hurdles in amateur football (*halı saha* culture). It empowers players and squad captains to complete match lineups, find last-minute players, schedule games, and **buy or sell second-hand football gear** (cleats, jerseys, gloves, and equipment) within a trusted local community.

---

## 📌 Table of Contents
1. [Problem Definition & Motivation](#-problem-definition--motivation)
2. [Target Audience](#-target-audience)
3. [Key Features](#-key-features)
4. [App Screens & Navigation Flow](#-app-screens--navigation-flow)
5. [Tech Stack & Architecture](#-tech-stack--architecture)
6. [Data Management & Persistence](#-data-management--persistence)
7. [Getting Started & Installation](#-getting-started--installation)
8. [Git Workflow & Commit Guidelines](#-git-workflow--commit-guidelines)
9. [Future Roadmap](#-future-roadmap)
10. [Academic Integrity & Originality](#-academic-integrity--originality)
11. [Author & Contact](#-author--contact)

---

## 🎯 Problem Definition & Motivation

In amateur football and local mini-pitch matches, players and organizers encounter recurrent challenges:
* **Last-Minute Dropouts:** A team member cancels hours before kick-off, putting the entire reservation and game at risk.
* **Scattered Communication:** Disorganized messaging groups make it hard to confirm attendance, positions, and fees.
* **Unbalanced Teams:** Organizers struggle to match player skill levels and find specialized roles (e.g., goalkeepers or defenders).
* **High Equipment Costs & Idle Gear:** Football boots, goalkeeper gloves, and original kits are expensive. Players frequently have outgrown or barely-used gear sitting idle with no targeted, reliable platform to sell or trade locally.

**Kadro** unites both needs into a single ecosystem: a **matchmaking & squad organizer** combined with a **community second-hand football marketplace**.

---

## 👥 Target Audience

* **Squad Captains / Organizers:** Users who book local pitches and need a reliable tool to manage line-ups and fill missing player spots.
* **Amateur Football Players:** Individuals looking for games in their neighborhood matching their skill level, position, and schedule.
* **Sports Gear Buyers & Sellers:** Footballers seeking affordable, pre-owned boots, authentic kits, gloves, and equipment, or looking to declutter their own sports bags.
* **Pitch Operators / Communities:** Local sports enthusiasts creating recreational tournaments and leagues.

---

## 🌟 Key Features

| Category | Feature | Description |
| :--- | :--- | :--- |
| **Auth & Profile** | **🔐 User Authentication** | Secure sign-up/login, player profile setup (preferred positions: GK, DEF, MID, FWD, skill level, and city/district). |
| **Matchmaking** | **🏟️ Match Discovery Feed** | Explore upcoming matches with real-time badges for missing slots, pitch venue, date/time, and player fee share. |
| **Matchmaking** | **📋 Interactive Squad Builder** | Visual 7v7 / 5v5 tactical pitch layout displaying confirmed players and open position slots waiting to be filled. |
| **Matchmaking** | **➕ Match Creation & RSVP** | Organizers publish match listings; free agents submit join requests with instant organizer confirmation. |
| **Marketplace** | **🛒 Second-Hand Gear Bazaar** | Community-driven marketplace to browse and search used football boots, jerseys, goalkeeper gloves, balls, and shin guards. |
| **Marketplace** | **🏷️ Sell Gear / Item Listing** | Simple multi-attribute form allowing players to post listings with photos, condition grade, size, brand, price, and location. |
| **Marketplace** | **💬 Direct Seller Contact** | Buyers can directly initiate contact with item owners to ask questions or arrange local pick-up at nearby pitches. |
| **Storage** | **💾 Offline Persistence** | Local caching ensures users can view their matches, squad rosters, and saved marketplace listings offline. |

---

## 📱 App Screens & Navigation Flow

The application features a clean, responsive mobile user interface with **6 primary screens** linked via smooth transitions:

```
                  [Splash / Authentication]
                             │
                             ▼
              [Main App Shell (Bottom Navigation)]
 ┌─────────────────┬─────────────────┬──────────────────┬─────────────────┐
 ▼                 ▼                 ▼                  ▼                 ▼
🏠 Match Feed     🛍️ Gear Market    ➕ Create / Sell   📋 Match Detail   👤 User Profile
(Browse Matches)  (Second-Hand UI)   (Match / Item)    (Tactical Pitch)   (Stats & Listings)
```

### 1. Authentication & Onboarding Screen
* User Login & Registration with email/password validation.
* Player onboarding: preferred positions, skill level, and location preferences.

### 2. Match Discovery Feed Screen
* Filterable match list (date, district, position needed, match format).
* Card UI highlighting missing roles (e.g., `Need 1 Goalkeeper (GK)`).

### 3. Match Detail & Tactical Pitch Screen
* Detailed pitch info: venue location map pin, kick-off time, surface type, and cost breakdown.
* Visual interactive football pitch representing confirmed roster slots and open vacancies.
* One-tap "Request to Join" button.

### 4. Second-Hand Gear Marketplace Screen *(New)*
* Grid and card layout showcasing pre-owned sports gear (Boots, Kits, Goalkeeper Gear, Training Equipment).
* Category filter tabs, price range slider, size picker, and condition badges (*Brand New*, *Like New*, *Good*).
* Search bar for quick discovery by brand (Nike, Adidas, Puma, etc.) or item name.

### 5. Create Match / List Item Screen
* **Create Match Mode:** Set venue, date/time picker, 5v5/7v7 format, and open position slots.
* **List Item Mode:** Upload product photo, enter title, category, size, price, condition, and contact preference.
* Form validation to ensure all required fields are provided before submission.

### 6. Profile & Activity Center Screen
* Personal player card (matches played, fair-play rating, preferred foot, primary position).
* Tabs for **"My Upcoming Matches"**, **"My Listed Items"**, and saved favorites.
* Settings: Light/Dark theme toggle, edit profile, and logout.

---

## 🛠️ Tech Stack & Architecture

### Technology Stack
* **Framework:** [Flutter](https://flutter.dev) (Dart) / Multiplatform (Android & iOS)
* **State Management:** Provider / Riverpod / Bloc *(Predictable unidirectional data flow)*
* **Database & Persistence:**
  * **Local DB:** `sqflite` (SQLite) / `hive` / `shared_preferences` for offline caching and session state
  * **Remote Backend (Optional/Future):** Firebase Firestore & Authentication / REST API
* **Image Handling:** Image picker with local caching for marketplace listings
* **Navigation:** Flutter Navigator 2.0 / GoRouter with type-safe deep linking
* **Design System:** Material 3 Design & cohesive sports-themed color palette

### Architecture: MVVM (Model - View - ViewModel)
The project adheres to clean architectural separation of concerns to maximize modularity and code reuse:

```
lib/
├── core/
│   ├── constants/       # App colors, typography, assets, strings
│   ├── theme/           # Dark and Light sports theme configurations
│   └── utils/           # Formatters, currency/price helpers, validators
├── data/
│   ├── datasources/     # Local SQLite/Hive helpers & mock/remote data providers
│   ├── models/          # MatchModel, PlayerModel, GearItemModel
│   └── repositories/    # Repository implementations
├── domain/
│   ├── entities/        # Core business entities (Match, Player, GearItem)
│   └── repositories/    # Abstract repository contracts
├── presentation/
│   ├── providers/       # ViewModels / State Notifiers (MatchProvider, MarketProvider)
│   ├── views/
│   │   ├── auth/        # Login & Signup screens
│   │   ├── matches/     # Feed & Match Detail (Tactical Pitch) screens
│   │   ├── market/      # Second-Hand Marketplace & Item Detail screens
│   │   ├── create/      # Create Match & List Gear item forms
│   │   └── profile/     # Profile, stats, and user listings
│   └── widgets/         # PitchView, GearCard, MatchCard, CustomButtons
└── main.dart            # Application initialization & provider injection
```

---

## 💾 Data Management & Persistence

Kadro implements a clean, relational data modeling schema:

### Data Models
* **`User`:** `id`, `name`, `email`, `phone`, `preferredPosition`, `rating`, `avatarUrl`
* **`Match`:** `id`, `creatorId`, `venueName`, `location`, `dateTime`, `format`, `totalPlayers`, `missingPositions`, `feePerPlayer`, `status`
* **`RosterEntry`:** `matchId`, `userId`, `position`, `status` (*confirmed* / *pending*)
* **`GearItem`:**
  * `id`: Unique identifier
  * `sellerId`: User reference
  * `title`: Name of the product (e.g., *"Nike Mercurial Vapor 15 FG"*)
  * `description`: Item condition, usage duration, and notes
  * `category`: `Boots`, `Jerseys`, `Goalkeeper Gloves`, `Equipment`
  * `size`: Shoe or clothing size (e.g., `42.5`, `L`)
  * `price`: Listing price in local currency
  * `condition`: `Brand New`, `Like New`, `Good`, `Fair`
  * `imageUrl`: Local path or asset preview
  * `status`: `Available`, `Reserved`, `Sold`
  * `createdAt`: Timestamp

### Persistence & Error Handling
* Persistent local storage via SQLite/Hive keeps cached matches and gear items accessible without internet.
* User preferences (theme, active session, draft listings) preserved across app restarts.
* Graceful UI handling for empty marketplace searches, zero match results, and invalid form submissions.

---

## 🚀 Getting Started & Installation

### Prerequisites
* [Flutter SDK](https://docs.flutter.dev/get-started/install) (`^3.19.0` or later)
* [Dart SDK](https://dart.dev/get-dart) (`^3.3.0` or later)
* [Android Studio](https://developer.android.com/studio) or [Xcode](https://developer.apple.com/xcode/)
* VS Code or Android Studio with Flutter & Dart plugins

### Step-by-Step Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/erenkilic3/Kadro.git
   cd Kadro
   ```

2. **Install dependencies:**
   ```bash
   flutter pub get
   ```

3. **Verify Flutter environment:**
   ```bash
   flutter doctor
   ```

4. **Run on connected device or simulator:**
   ```bash
   flutter run
   ```

5. **Build Android Release APK:**
   ```bash
   flutter build apk --release
   ```
   *The APK binary will be produced at `build/app/outputs/flutter-apk/app-release.apk`.*

---

## 🌿 Git Workflow & Commit Guidelines

The project maintains clear, traceable Git history reflecting iterative development:

### Commit Format Convention
```
<type>(<scope>): <subject>

Examples:
feat(market): implement second-hand football gear catalog and filters
feat(market): add create item listing form with category and price validation
feat(pitch): build interactive 7v7 lineup view with missing slot tags
fix(auth): correct form validation on phone number input
docs(readme): add marketplace documentation, data models, and screen flow
```

* **Types:** `feat` (new feature), `fix` (bug fix), `docs` (documentation), `style` (formatting), `refactor` (code structure), `test` (tests).
* **Branching:** New functionality developed in feature branches (`feature/gear-marketplace`, `feature/pitch-lineup`) and merged to `main`.

---

## 🔮 Future Roadmap

- [ ] **In-App Messaging & Match Lobby:** Group chat for confirmed match players and direct messaging for gear buyers/sellers.
- [ ] **Pitch Booking API:** Direct reservation integration with municipal and private sports facilities.
- [ ] **Secure Escrow Payments:** Optional in-app payment protection for second-hand gear sales.
- [ ] **Proximity Alerts:** Push notifications when someone within 5 km lists boots in your size or needs your playing position.
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
