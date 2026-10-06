# RentBook Kenya 🇰🇪
> **Multi-User Rental Management & Digital Cash Book for Kenyan Flats & Apartments**  
> Built for simultaneous real-time use by **Admin** (Acer Chromebook Spin 311), **Landlord** (Phone), and **Caretaker** (Phone).

---

## ⚡ Quick Architecture Overview

RentBook Kenya is a production-grade, progressive web application (PWA) with real-time multi-device sync, role-based access control (RLS), and authentic Kenyan compound conventions (Scheme 1–6 house naming, M-Pesa receipts, waterfall arrears, and Swahili/English SMS reminders).

```
   ┌────────────────────────────────────────────────────────┐
   │            Acer Chromebook Spin 311 (ChromeOS)         │
   │               ADMIN (Master Control Cockpit)           │
   │     - 1366 x 768 Compact Layout & Keyboard Shortcuts   │
   │     - View-As Preview Mode, Full Audit Log, Danger Zone│
   └──────────────────────────┬─────────────────────────────┘
                              │ Realtime Sync
                              ▼
        ┌───────────────────────────────────────────┐
        │   Supabase Postgres + Auth + Realtime RLS │
        └─────────────────────┬─────────────────────┘
                              │ Realtime Sync
         ┌────────────────────┴────────────────────┐
         ▼                                         ▼
┌───────────────────────────────┐   ┌───────────────────────────────┐
│     Landlord (Phone Browser)  │   │    Caretaker (Phone Browser)  │
│ - Own property financials     │   │ - Fast payment entry (<15s)   │
│ - Approves caretaker entries  │   │ - Property expense logging    │
│ - Arrears & Master Rent Roll  │   │ - Arrears glance on rounds    │
│ - Pre-filled polite SMS       │   │ - Offline queueing if no net  │
└───────────────────────────────┘   └───────────────────────────────┘
```

---

## 🌐 PATH A: NO-TERMINAL PATH (100% Inside Chrome Browser)
*Recommended for your Acer Chromebook Spin 311 — you never need to open a terminal.*

### Step 1: Create Your Free Supabase Project in Chrome
1. In your Chromebook's Chrome browser, open **[supabase.com](https://supabase.com)** and sign in with GitHub or your Google account.
2. Click **"New Project"**.
3. Fill in:
   - **Name:** `RentBook Kenya`
   - **Database Password:** Enter a secure password and save it.
   - **Region:** Pick **Europe (Frankfurt)** or **Middle East / Africa** for the lowest latency to Kenya.
4. Click **"Create new project"** (takes ~1 minute to spin up).

---

### Step 2: Run Database Schema & Seed Data in Supabase SQL Editor
1. In the left sidebar of your Supabase dashboard, click the **SQL Editor** icon (`>_`).
2. Click **"New query"**.
3. Open [`supabase/schema.sql`](file:///home/davinci/rentbook-kenya/supabase/schema.sql), copy the entire SQL text, paste it into the editor, and click **"Run"** (green button).  
   *This creates all tables (`profiles`, `properties`, `property_access`, `units`, `tenants`, `payments`, `expenses`, `audit_log`, `settings`), triggers, indexes, and Row-Level Security policies.*
4. Open a second query tab in the SQL Editor.
5. Copy the contents of [`supabase/seed.sql`](file:///home/davinci/rentbook-kenya/supabase/seed.sql), paste it, and click **"Run"**.  
   *This loads Kilimani Heights (12 units A1..C4, 9 tenants, Brian Otieno's KSh 22,000 arrears, and one pending caretaker payment waiting for your approval).*

---

### Step 3: Get Your API Keys
1. In Supabase, click **Project Settings** (gear icon at the bottom left) -> **API**.
2. Find:
   - **Project URL:** `https://xyzcompany.supabase.co`
   - **Project API keys -> `anon` / `public`:** `eyJhbGciOi...`
3. Leave this tab open.

---

### Step 4: Deploy to Vercel in 2 Minutes (Free Hosted URL)
1. In Chrome, open **[vercel.com](https://vercel.com)** and log in.
2. Click **"Add New..." -> "Project"**.
3. Import your GitHub repository for `rentbook-kenya`.
4. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase `anon` key
5. Click **"Deploy"**.
6. Within 60 seconds, Vercel will give you your live URL (e.g. `https://rentbook-kenya.vercel.app`).

---

### Step 5: Install as a PWA on your Acer Chromebook
1. Open your live URL in Chrome on the Chromebook.
2. Look at the right side of Chrome's address bar: click the **Install icon** (monitor with a down arrow) or click the 3-dots menu -> **"Install RentBook Kenya"**.
3. Click **"Install"**.
4. The app now launches in its own dedicated, chromeless window!
5. Right-click the app icon in your ChromeOS shelf (taskbar) and select **"Pin"**.

---

### Step 6: Install on Landlord and Caretaker Phones
1. Send the same URL to the Landlord and Caretaker on WhatsApp or SMS.
2. On Android (Chrome): Tap the 3 dots in the top right -> **"Add to Home Screen"** or **"Install app"**.
3. On iPhone (Safari): Tap the Share button (square with arrow) -> **"Add to Home Screen"**.
4. Both now have full phone-first access that works offline in compound corridors.

---

## 💻 PATH B: LOCAL TERMINAL PATH (Chromebook Linux Crostini)
*Use this if you prefer running a local development server on your laptop.*

### Enabling Linux on ChromeOS (if not already enabled)
1. On your Chromebook, open **Settings** (gear icon).
2. Click **Advanced** -> **Developers**.
3. Next to **Linux development environment (Beta)**, click **"Turn on"**.
4. Follow the on-screen prompts and allocate 10–15 GB of disk space.
5. Once installed, search for **Terminal** in your Chromebook launcher and open it.

### Launching RentBook Kenya Locally
```bash
# 1. Navigate to the project directory
cd /home/davinci/rentbook-kenya

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```
Open **`http://localhost:5173`** in your Chromebook's Chrome browser.

---

## 🔑 Demo Personas & Instant 1-Click Role Testing

RentBook Kenya includes a live simulator in the top-right header so you can test all 3 roles simultaneously without needing multiple logins:

| Role | Name | Device / Focus | Permissions & Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** | You (Chromebook Master) | Acer Chromebook Spin 311 | Master control: views all properties, full append-only audit log, user invites, settings, danger zone (`DELETE` confirmation), and "View As" preview mode. |
| **Landlord** | David Kimani | Phone | Full financial oversight of Kilimani Heights, approves/rejects caretaker payments, arrears aging, master rent roll, and CSV tax export. |
| **Caretaker** | Jackson Omondi | Phone | Fast payment recording (<15s), compound repairs & utility expense logging, tenant contact roster with tap-to-call/SMS, offline queueing. **Cannot** delete records or alter rent amounts. |

---

## ⌨️ Acer Chromebook Spin 311 Keyboard Shortcuts

Designed for high-speed administration on an 11.6" screen:

* `Ctrl + K` or `/` : Open **Command Palette** (jump directly to any unit, tenant, or action)
* `N` : Open **Record Rent Payment** modal
* `E` : Open **Add Compound Expense** modal
* `Esc` : Close any active modal, sheet, or command palette
* `Tab` / `Enter` : Full keyboard focus outlines and form submission

---

## 🇰🇪 Kenyan Flat Conventions Supported

1. **Auto-Naming Schemes (Scheme 1 to 6):**
   - Scheme 1 (Kenyan Default): Ground = `A1..A4`, 1st = `B1..B4`, 2nd = `C1..C4`
   - Scheme 2: `G1..G4`, `F1..F4`, `S1..S4`, `T1..T4`
   - Scheme 3: Sequential `1, 2, 3, 4, 5...`
   - Scheme 4: `1A..1D`, `2A..2D`, `GA..GD`
   - Scheme 5: `House 1`, `Unit 1`, `Door 1`
   - Scheme 6: Custom tokens (`{block}-{floor}{index}`)
2. **Waterfall Arrears Allocation:**
   - Payments apply to the oldest unpaid month first. Supports partial payments with live remaining debt calculation.
3. **SMS Rent Reminders:**
   - Pre-filled in Swahili: `Habari {name}, kumbusho la kodi ya nyumba {unit} ni KSh {amount}. Asante.`
   - Pre-filled in English: `Hello {name}, polite reminder that rent for house {unit} is KSh {amount}. Thank you.`
4. **Append-Only Audit Log:**
   - Every single database transaction stores actor, role, table, timestamp, device info, and before/after JSON states.
