# RentBook Kenya 🇰🇪

> **Production-grade multi-user rental management system & digital cash book engine engineered for Kenyan apartments, flats, and commercial estates.**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38b2ac.svg)](https://tailwindcss.com/)
[![SQLite](https://img.shields.io/badge/SQLite-3.46-003B57.svg)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)](#)

---

## ⚡ System Architecture

RentBook Kenya is architected as an offline-first, multi-role Progressive Web Application (PWA). It provides high-speed administrative operation for property managers, financial oversight for landlords, and rapid corridor payment entry for caretakers.

```
       ┌────────────────────────────────────────────────────────┐
       │                Desktop / Admin Console                 │
       │    - Full Financial Ledger, Audit Trail & Settings     │
       │    - Estate Provisioning & Naming Format Generator     │
       │    - Command Palette (Ctrl+K) & Fast Excel Grid Entry  │
       └──────────────────────────┬─────────────────────────────┘
                                  │ Real-Time Sync
                                  ▼
         ┌────────────────────────────────────────────────────────┐
         │     Database Layer: SQLite 3 (WAL) / Supabase Cloud    │
         │  - ACID Transactions, Append-Only Logs, RLS Security   │
         │  - Multi-Tier Cache with Embedded IndexedDB Offline    │
         └────────────────────────┬───────────────────────────────┘
                                  │ Encrypted WebSocket Sync
          ┌───────────────────────┴───────────────────────┐
          ▼                                               ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│   Landlord Mobile Client      │   │   Caretaker Mobile Client     │
│ - Property portfolio metrics  │   │ - Fast payment entry (<15s)   │
│ - Approves caretaker entries  │   │ - M-Pesa reference validation │
│ - Arrears aging & statements  │   │ - Property expense logging    │
│ - WhatsApp receipt generator  │   │ - Offline queueing in bounds  │
└───────────────────────────────┘   └───────────────────────────────┘
```

---

## 🚀 Key Modules & Features

### 1. Multi-Tier Relational Database Engine
* **Local Relational Core:** Native SQLite 3 engine with Write-Ahead Logging (`WAL`), strict foreign keys, and sub-millisecond local query resolution via a zero-dependency Python API service.
* **Cloud Database Synchronization:** Automated synchronization pipeline with Supabase PostgreSQL, supporting Row-Level Security (`RLS`) and multi-client broadcast events.
* **Offline Fallback:** Embedded client-side IndexedDB persistence ensures continuous operations even in cellular dead zones.

### 2. Authentic Kasuku Counter Book Ledger
* **Sequential House Ordering:** Renders units in strict physical floor sequence (`G1..G9`, `A1..A9`, `B1..B9` or `101..109`).
* **Multi-Receipt Grouping:** Combines partial tenant payments within the same physical house block while preserving distinct receipt references and timestamps.
* **Tamper-Resistant Cash Book Lock 🔒:** Protects historical financial periods from accidental edits while allowing rapid spreadsheet-style grid entry when unlocked.

### 3. Kenyan Estate Provisioning & Unit Naming System
* **Kenyan Floor Letters (Standard):** Ground Floor (`G1..G9`), 1st Floor (`A1..A9`), 2nd Floor (`B1..B9`).
* **100-Series Floor Numbers:** Ground Floor (`G1..G9` or `1..9`), 1st Floor (`101..109`), 2nd Floor (`201..209`).
* **Corridor Floor + Unit Letters:** Ground Floor (`GA..GI`), 1st Floor (`1A..1I`), 2nd Floor (`2A..2I`).
* **Sequential & Prefix Formats:** Numbered blocks (`1..N`) and villa plots (`House 1..N`).
* **Interactive Live Preview:** Real-time visual badge rendering before committing database migrations.

### 4. Official Printable Rent Receipts
* **Formal Kenyan Receipt Modal:** Complies with Kenyan tenancy standards, complete with amount-in-words conversion (`Kenya Shillings ... Only`), authorized landlord stamp, print stylesheet, and 1-click WhatsApp transmission.

### 5. Role-Based Access Control (RBAC)
* **System Administrator:** Global estate provisioning, system configuration, database dumps, and irreversible operations.
* **Landlord:** Portfolio cash flows, payment approvals, expense monitoring, and arrears aging.
* **Caretaker:** Rapid payment collection, compound maintenance expense submissions, and tenant phone directory.

---

## 🛠️ Tech Stack

* **Frontend:** React 19, TypeScript 5.7, Tailwind CSS v4, Lucide Icons, Vite 6
* **Backend Engine:** Python 3.13 standard library (`http.server`, `sqlite3`), SQLite 3.46 with WAL
* **Cloud Database:** PostgreSQL / Supabase with Row-Level Security
* **Persistence:** SQLite WAL + IndexedDB Browser Store
* **Deployment:** Vercel (Edge CDN) + Custom Domain

---

## 💻 Local Development Setup

### Prerequisites
* **Node.js** v18+ and **npm**
* **Python** 3.10+ (standard library only, zero pip dependencies required)

### Getting Started

```bash
# 1. Clone repository
git clone git@github.com:lEEPAULFLIPPER/rentbook-kenya.git
cd rentbook-kenya

# 2. Install dependencies
npm install

# 3. Start local SQLite API server (Port 3001)
python3 server/db_server.py 3001 &

# 4. Start frontend development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## ⌨️ Productivity Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + K` or `/` | Open Command Palette (Jump to unit, tenant, or screen) |
| `N` | Open **Record Rent Payment** modal |
| `E` | Open **Add Compound Expense** modal |
| `Esc` | Close active modal, sheet, or command palette |

---

## 🚢 Production Build & Deployment

```bash
# Type check and production bundle
npm run build

# Preview production build locally
npm run preview
```

### Cloud Environment Variables
To connect Supabase Cloud:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

---

## 👤 Author & Engineering

* **Lead Architect:** [lEEPAULFLIPPER](https://github.com/lEEPAULFLIPPER)  
* **System:** RentBook Kenya Engineering  
* **Contact:** `davinci@rentbook.ke`

---

## 📄 License

Proprietary Software. All rights reserved © 2026 RentBook Kenya.
