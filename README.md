# 🛠️ Exigen Web App: Smart Maintenance Integration Portal

[![Next.js Version](https://img.shields.io/badge/Next.js-16.2.6-black.svg?logo=next.js&logoColor=white)](https://nextjs.org/)
[![React Version](https://img.shields.io/badge/React-19.2.4-blue.svg?logo=react&logoColor=white)](https://react.dev/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL-blue.svg?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![ORM](https://img.shields.io/badge/ORM-Prisma_6.19.3-teal.svg?logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Styling](https://img.shields.io/badge/Styling-Tailwind_CSS_v4-06B6D4.svg?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

**Exigen Web App** is the frontend portal, analytics dashboard, and integrated ticket management system for the **Exigen Smart Maintenance** platform. This portal connects reporters (general users submitting complaints), field technicians, and management with the backend AI engines.

---

## 🔗 Relationship with the AI Model Repository (`exigen-smart-maintenance`)

The Exigen system is built on a decoupled architecture to separate user interfaces from machine learning research and modeling operations:

1. **`exigen-app` (This Repository):**
   * Acts as the *Frontend Portal*, *Database Orchestrator*, and *Business Logic Gateway*.
   * Developed using **Next.js 16 (App Router)** and **Prisma ORM** with a **PostgreSQL** database.
   * Manages user authentication (Next-Auth), management approval workflows, technician tasking, and the industrial asset registry.

2. **`exigen-smart-maintenance` (AI Model Repository):**
   * Acts as the *Core AI Engine*, running as a separate **FastAPI Python** service (defaulting to Port `8000`).
   * Hosts the NLP model pipeline (**IndoBERT + TF-IDF**) to parse unstructured text or audio voice recordings into structured maintenance parameters.
   * Hosts the **Predictive Maintenance (Regression)** models based on **Random Forest** to calculate Remaining Useful Life (RUL) estimates for equipment.

### System Topology
```mermaid
graph TD
    User([Reporter / Technician]) <-->|Web Interface| NextJS[Next.js Web Server (exigen-app)]
    NextJS <-->|Prisma ORM| PostgreSQL[(PostgreSQL Database)]
    NextJS <-->|REST API / HTTP JSON| FastAPI[FastAPI Server (exigen-smart-maintenance)]
    FastAPI <-->|Inference| NLP[NLP IndoBERT Engine]
    FastAPI <-->|Inference| ML_Reg[RUL Predictor Regressor]
```

---

## 🧠 Sinergy of Two Core AI Pillars & Two-Phase Ticket Lifecycle

The Next.js backend integrates with the FastAPI server to coordinate the lifecycle of asset maintenance from initial report submission to final completion:

### 📑 PHASE 1: Ticket Reporting & NLP Classification (Administrative Automation)
1. **Trigger:** A user enters a free-form complaint or records a voice note through the web submission form.
2. **Gateway:** Next.js captures the input and forwards it to the FastAPI server (`/api/predict/text` or `/api/predict/voice`).
3. **AI Analysis:** The NLP model parses the raw text/audio into 6 structured parameters: `Asset Type`, `Building Location`, `Floor Location`, `Zone Location`, `Department Category`, and `Initial Severity`.
4. **Next.js Data Contract Logic (`is_complete`):**
   * **`is_complete == true`:** The ticket is automatically saved in the staging table (`KomplainPerbaikan`) with an **`OPEN`** status and is queued for technician assignment.
   * **`is_complete == false`:** Next.js stores the record as a draft and returns a warning message in the UI (*bot message*) prompting the user to complete missing location or asset details (e.g., specifying which building floor or department).

### 🛠️ PHASE 2: Field Verification & Service Completion (Predictive Maintenance Input)
1. **Execution:** Technicians view assigned tickets on their mobile-responsive dashboard, click *Start Work*, and perform the physical repairs.
2. **Data Logging:** Upon completing the repair, technicians close the ticket by entering objective field observations:
   * **`Asset ID`:** Scanned from the unit's QR/Barcode label or selected manually.
   * **`Failure Type` & `Root Cause`:** Selected from standardized technical dropdown options.
   * **`Actual Severity`:** Final field verification (acting as ground truth validation for Phase 1 NLP predictions).
   * **`Repair Cost` & `Spare Parts Used`:** Recorded accurately for operational tracking and maintenance costs.
3. **Automated RUL Recalculation:**
   * Once a ticket is closed, Next.js calls the server action `recalculateAssetRUL(assetId)`.
   * This action builds a feature map of historical lag data (asset age, historical repair counts, average service intervals, cost trends, severity levels, and complaint velocity) and posts a JSON payload to FastAPI (`/api/predict/rul`).
   * The predicted Remaining Useful Life (RUL in days) is returned to Next.js, which updates the health status of the asset in the `MasterAsset` table in real-time:
     * **RUL ≤ 30 Days:** Health Status = `Critical` 🔴
     * **RUL ≤ 90 Days:** Health Status = `Warning` 🟡
     * **RUL ≤ 180 Days:** Health Status = `Watch` 🔵
     * **RUL > 180 Days:** Health Status = `Healthy` 🟢

---

## 💻 Tech Stack Specification

* **Main Framework:** Next.js 16.2.6 (App Router, Server Actions, TypeScript)
* **Runtime Node:** React 19.2.4
* **Authentication:** NextAuth.js
* **Database & ORM:** PostgreSQL & Prisma ORM v6
* **Styling (CSS/UI):** Tailwind CSS v4, Lucide React, SweetAlert2, Recharts (for analytics dashboard)
* **Data Exports:** XLSX (exporting repair reports for management)

---

## 🏗️ Project Directory Structure

```
exigen-app/
├── app/
│   ├── (dashboard)/            # Main layout, Analytics, Asset Inventory & Ticket lists
│   ├── actions/                # Next.js Server Actions (asset.ts, ticket.ts)
│   ├── api/                    # API Integration Routes
│   │   ├── auth/               # NextAuth authentication flow
│   │   └── ticket/             # Proxy handlers communicating with FastAPI
│   │       ├── predict/        # Forwards complaint text/audio to AI server
│   │       └── transcribe/     # Transcribes raw audio (Whisper API)
│   ├── globals.css             # Global Tailwind stylesheets
│   ├── layout.tsx              # Root Layout
│   └── page.tsx                # Landing Page
├── components/                 # Reusable UI Components (Dashboard widgets, Forms)
├── lib/                        # Prisma Client initialization & utilities
├── prisma/
│   ├── schema.prisma           # Relational Database Schema (Asset, Tickets, Staging)
│   └── seed.ts                 # Database seeder for Development & Demos
└── package.json                # Project dependencies
```

---

## ⚙️ Environment Variables (`.env`)

Create a `.env` file in the root of the `exigen-app` directory with the following variables:

```env
# PostgreSQL Connection URL
DATABASE_URL="postgresql://username:password@localhost:5432/exigen_db?schema=public&connection_limit=5"

# NextAuth Authentication Config
NEXTAUTH_SECRET="your_secure_auth_secret_phrase"
NEXTAUTH_URL="http://localhost:3000"

# Target Endpoint for FastAPI AI Service (exigen-smart-maintenance)
AI_SERVICE_URL="http://localhost:8000"
```

---

## 🚀 Getting Started

### Prerequisites
* Node.js v20+ or Bun v1+
* PostgreSQL Database running locally or via Docker

### Installation & Running

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Sync Database Schema:**
   Apply Prisma migrations to initialize the database tables:
   ```bash
   npx prisma db push
   ```

3. **Seed Initial Data:**
   Seed the database with initial demo users (Management & Technicians) and master assets:
   ```bash
   npx prisma db seed
   ```

4. **Run Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---