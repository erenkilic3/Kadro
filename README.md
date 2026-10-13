# ⚽ Kadro — Amateur Football Matchmaking, Squad Organizer & Gear Marketplace

[![Platform](https://img.shields.io/badge/Platform-React%20Native%20%7C%20Expo-000020?logo=expo)](https://expo.dev)
[![Language](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript)](https://www.typescriptlang.org)
[![Router](https://img.shields.io/badge/Router-Expo%20Router-black)](https://docs.expo.dev/router/introduction/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Status](https://img.shields.io/badge/Status-Runnable%20%26%20Complete-success.svg)]()

> **Kadro** is a universal cross-platform mobile application designed to solve persistent logistical hurdles in amateur football (*halı saha* culture). It empowers players and squad captains to complete match lineups, find last-minute players, schedule games on an interactive tactical pitch, and **buy or sell second-hand football gear** (cleats, jerseys, goalkeeper gloves, and equipment) within a trusted local community.

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
| **Auth & Profile** | **🔐 Player Profile & Stats** | Detailed player identity with preferred position (GK, DEF, MID, FWD), rating (⭐ 4.9), matches played, attendance rate, and editable bio. |
| **Matchmaking** | **🏟️ Match Discovery Feed** | Explore upcoming matches with real-time badges for missing slots, pitch venue, date/time, and player fee share. |
| **Matchmaking** | **📋 Interactive Tactical Pitch** | Visual green pitch showing squad formation (7v7 / 6v6). Tapping any open slot lets players claim that position instantly. |
| **Matchmaking** | **➕ Match Creation & RSVP** | Multi-attribute form with validation to publish matches with custom format, missing roles, venue address, and participation fees. |
| **Marketplace** | **🛒 Second-Hand Gear Bazaar** | Community catalog to browse, search, and filter pre-owned boots, jerseys, goalkeeper gloves, balls, and protective gear. |
| **Marketplace** | **🏷️ Sell Gear / Listing Form** | Easy-to-use form with category selection, brand, size, price in TL, and condition grades (*Sıfır*, *Çok İyi*, *İyi*). |
| **Marketplace** | **💬 Direct Seller Contact** | Buyers can call the seller or start a conversation via WhatsApp with pre-filled match/item details. |
| **Storage** | **💾 Offline Persistence** | AsyncStorage persistent layer saves match rosters, marketplace items, and profile changes across app restarts. |
| **Demo Ready** | **🔄 1-Click Demo Reset** | Settings tab features an instant demo data reset button tailored for live classroom presentations and grading. |

---

## 📱 App Screens & Navigation Flow

The application follows Expo Router file-based routing with **6 navigable screens**:

```
                  [Root Layout (Stack Navigator)]
                             │
                             ▼
              [Main App Shell (Tabs Navigator)]
 ┌─────────────────┬─────────────────┬──────────────────┬─────────────────┐
 ▼                 ▼                 ▼                  ▼                 ▼
⚽ Maçlar          🛍️ 2. El Pazar    ➕ İlan / Maç      👤 Profil        [Dynamic Modals]
(Feed & Search)   (Gear Bazaar)     (Create Forms)     (Stats & Setup)   ├─ 📋 match/[id] (Pitch Detail)
                                                                         └─ 📦 gear/[id]  (Item Detail)
```

### 1. Match Discovery Feed (`src/app/(tabs)/index.tsx`)
* Live search by venue, title, or district.
* Position filter chips: `Tüm Maçlar`, `🧤 Kaleci (GK)`, `🛡️ Defans (DEF)`, `🎯 Orta Saha (MID)`, `⚡ Forvet (FWD)`, `Kadıköy`, `Beşiktaş`.
* Live missing player banner counting total vacant spots across Istanbul.
* Pull-to-refresh support.

### 2. Second-Hand Gear Marketplace (`src/app/(tabs)/market.tsx`)
* 2-column responsive product card grid (`GearCard`).
* Category filters: `Tümü`, `👟 Kramponlar`, `👕 Formalar`, `🧤 Kaleci Eldiveni`, `🛡️ Ekipman`.
* Price sort toggle (Fiyat: Artan / Fiyat: Azalan / En Yeniler).
* Direct "+ İlan Ver" navigation button.

### 3. Create Match & Sell Gear (`src/app/(tabs)/create.tsx`)
* Segmented tab switcher: "⚽ Maç Oluştur" vs "🛍️ 2. El Eşya Sat".
* Form validation with user-friendly error banners and submission alerts.
* Date-time inputs, format selectors (5v5, 6v6, 7v7, 8v8), and multi-select missing positions.

### 4. Player Profile & Settings (`src/app/(tabs)/profile.tsx`)
* Player card with rating, attendance rate, and editable bio/phone/position.
* Tab views for "⚽ Maçlarım" and "🛍️ İlanlarım".
* Mark items as "Satıldı" (Sold).
* One-click "Demo Verilerini Sıfırla" button to reset initial seed data.

### 5. Match Detail & Tactical Pitch Screen (`src/app/match/[id].tsx`)
* Venue address, surface type (Açık/Kapalı), fee per player, and organizer contact.
* **Interactive Pitch Lineup (`PitchLineup`):** Visual tactical soccer pitch with goal boxes, center circle, and player nodes.
* Tap any vacant position slot to join or leave the lineup.
* Team roster list with confirmation badges.

### 6. Gear Item Detail Screen (`src/app/gear/[id].tsx`)
* Product illustration hero, condition badge, brand, and size specification table.
* Full seller notes and location.
* Direct action buttons: "Satıcıyı Ara" and "WhatsApp".
* Seller action: "Satıldı Olarak İşaretle".

---

## 🛠️ Tech Stack & Architecture

### Technology Stack
* **Framework:** [React Native](https://reactnative.dev) with [Expo](https://expo.dev) (SDK 57)
* **Language:** [TypeScript](https://www.typescriptlang.org) (`v5.x` strict mode)
* **Routing & Navigation:** [Expo Router](https://docs.expo.dev/router/introduction/) (File-based typed navigation)
* **State Management:** React Context API (`AppContext`) + custom hooks (`useApp`)
* **Data Persistence:** `@react-native-async-storage/async-storage`
* **Icons:** `@expo/vector-icons` (Ionicons)
* **Layout:** `react-native-safe-area-context`
* **Styling:** React Native StyleSheet with central Design Tokens

### Project Directory Organization
```
src/
├── app/                  # Expo Router file-based screens
│   ├── (tabs)/           # Main bottom tabs navigator
│   │   ├── index.tsx     # Match Feed & Search Screen
│   │   ├── market.tsx    # Second-Hand Football Gear Bazaar
│   │   ├── create.tsx    # Create Match / Sell Gear Form
│   │   ├── profile.tsx   # Player Profile, Activity & Settings
│   │   └── _layout.tsx   # Tabs layout & custom icons
│   ├── match/[id].tsx    # Match Detail & Interactive Tactical Pitch
│   ├── gear/[id].tsx     # Gear Item Detail & Seller Contact
│   └── _layout.tsx       # Root stack navigator & providers
├── components/           # Reusable UI components
│   ├── PitchLineup.tsx   # Interactive tactical 7v7 football pitch
│   ├── MatchCard.tsx     # Match listing card with missing positions
│   ├── GearCard.tsx      # Second-hand product card
│   ├── PositionBadge.tsx # GK, DEF, MID, FWD color-coded badges
│   └── EmptyState.tsx    # Edge-case fallback view
├── constants/
│   ├── theme.ts          # Color palette, spacing, and typography tokens
│   └── mockData.ts       # Rich seed data for matches and gear
├── context/
│   └── AppContext.tsx    # Global reactive state provider
├── services/
│   └── storageService.ts # AsyncStorage persistence layer
└── types/
    └── index.ts          # TypeScript interfaces & domain models
```

---

## 💾 Data Management & Persistence

Kadro implements a clean, relational data modeling schema backed by `@react-native-async-storage/async-storage`:

### Key Data Entities
* **`User`:** `id`, `name`, `email`, `phone`, `position`, `rating`, `matchesPlayed`, `bio`, `city`, `district`
* **`Match`:** `id`, `title`, `organizerId`, `venueName`, `address`, `date`, `time`, `format`, `pitchType`, `feePerPlayer`, `missingPositions`, `roster`
* **`RosterSlot`:** `id`, `position`, `isFilled`, `assignedPlayer` (id, name, rating), `isOrganizer`
* **`GearItem`:** `id`, `sellerId`, `sellerName`, `sellerPhone`, `title`, `description`, `category`, `brand`, `size`, `price`, `condition`, `location`, `status`

### Edge-Case Handling & Reliability
* **Offline Access:** All matches, rosters, and marketplace listings remain persistent and accessible without active internet.
* **Empty State Messages:** Informative placeholders are shown when searches yield 0 results or filters are empty.
* **Input Validation:** Prevents submission of invalid fees, empty titles, or missing positions.

---

## 🚀 Getting Started & Installation

### Prerequisites
* [Node.js](https://nodejs.org/) (`v18.0.0` or later — tested on `v24.21.0`)
* [npm](https://www.npmjs.com/) (`v9.0.0` or later — tested on `v11.19.0`)
* Physical iOS or Android smartphone with the free **Expo Go** app installed, or Android/iOS Simulator.

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

3. **Verify project health and TypeScript:**
   ```bash
   npx expo-doctor
   npx tsc --noEmit
   ```

4. **Start the development server:**
   ```bash
   npx expo start
   ```
   * Open the **Expo Go** app on your phone and scan the displayed QR code.
   * Or press `w` to run in web browser for an instant live presentation demo.
   * Or press `a` for Android Emulator / `i` for iOS Simulator.

---

## 🌿 Git Workflow & Commit Guidelines

The project maintains clean, traceable Git history reflecting iterative development:

### Commit Format Convention
```
<type>(<scope>): <subject>

Examples:
feat(feed): implement match listing card with missing position badges
feat(pitch): build interactive 7v7 lineup view with missing slot tags
feat(market): implement second-hand football gear catalog and filters
fix(auth): correct form validation on phone number input
docs(readme): add comprehensive project documentation and setup instructions
```

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
