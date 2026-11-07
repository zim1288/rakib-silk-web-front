# 🧵 Rakib Silk & Fashion — Tally Khata Fullstack Platform

> A production-grade, multi-tenant inventory, manufacturing, and financial ledger platform tailored for silk & saree merchants.

[![React 19](https://img.shields.io/badge/Frontend-React%2019%20%7C%20TypeScript%20%7C%20Vite%208-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB Atlas](https://img.shields.io/badge/Database-MongoDB%20Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/atlas)
[![Cloudinary](https://img.shields.io/badge/Media-Cloudinary%20CDN-3448C5?logo=cloudinary&logoColor=white)](https://cloudinary.com/)
[![Render](https://img.shields.io/badge/Deployment-Render-46E3B7?logo=render&logoColor=black)](https://render.com/)

---

## ✨ Key Features & Capabilities

- **🏬 Brand Division (Rakib Silk vs. Rakib Fashion):**
  - Seamlessly toggle or filter across distinct product lines (Rakib Silk vs. Rakib Fashion) in Inventory, Loom Production, and Sales.
  - Granular brand categorization, inventory counts, and sales revenue insights.

- **📦 Saree Inventory & Atomic Sales:**
  - Complete saree catalog management with high-res Cloudinary photo uploads.
  - Real-time stock status badges (`In Stock`, `Low Stock`, `Out of Stock`).
  - Atomic inventory deduction (`/v1/inventory/sell`) during sales to prevent race conditions.

- **🪡 Loom Manufacturing & Batch Tracking:**
  - Track active, completed, and pending loom batches with raw silk, zari, and labor cost breakdowns.
  - Automatic yield calculations and direct promotion of completed batches into inventory.

- **📊 Financial Ledger & Operations Audit (`/history`):**
  - Consolidated ledger tracking cash inflow, customer credit, receivables, supplier payments, and loom expenditures.
  - Searchable, filterable audit trail by date range, customer name, transaction type, or phone number.

- **💾 Data Export Center & Backup:**
  - One-click CSV and JSON data export for financial records, inventory items, and production batches directly from the Settings page.

- **📱 Fully Responsive Mobile & Tablet Layout:**
  - Tailored UI optimized for mobile phones, tablets, and desktop workstations with sticky headers, drawer navigation, and responsive data tables.

- **🛡️ Enterprise-Grade Security Architecture:**
  - **Multi-Tenant Isolation:** Enforced non-anonymous `X-User-Email` verification across all data endpoints to prevent unauthorized data exposure.
  - **Rate Limiting:** Granular rate limits powered by `express-rate-limit` protecting against brute-force login attempts, OTP guessing, and email flooding.
  - **30-Minute Registration TTL:** Two-stage registration stores unverified accounts in a temporary MongoDB collection with a 30-minute auto-expiry, ensuring users who abandon signup midway are never locked out.
  - **Multi-Device Session Revocation:** Changing passwords increments account `tokenVersion`, instantly terminating unauthorized sessions across all other devices.
  - **Strict CORS Whitelist:** Locked down to verified production domains and local development environments.

---

## 📁 Repository Structure

```
silk-and-fashion/
├── 📁 frontend/                 # React 19 + TypeScript SPA (Vite 8, Tailwind CSS)
│   ├── 📁 src/
│   │   ├── 📁 components/       # Domain-specific UI modules (auth, inventory, production, history)
│   │   ├── 📁 context/          # React AuthContext, theme & multi-device session providers
│   │   ├── 📁 pages/            # App routes (Dashboard, Sales, Inventory, Production, History, Settings)
│   │   ├── 📁 services/         # API HTTP client, EmailJS integration, audit logging
│   │   └── 📁 utils/            # Gregorian/Bengali date formatters, validation logic
│   ├── package.json             # Frontend dependencies (React 19, Lucide, Tailwind, Vite)
│   └── vite.config.ts           # Vite build orchestration
│
├── 📁 backend/                  # REST API Microservice (Node.js + Express + Mongoose)
│   ├── 📁 src/
│   │   ├── 📁 config/           # MongoDB Atlas & Cloudinary SDK configurations
│   │   ├── 📁 controllers/      # Business logic (auth, inventory, production, transactions, media)
│   │   ├── 📁 middleware/       # Multi-tenant auth headers & centralized error handling
│   │   ├── 📁 models/           # Mongoose schemas (User, UserLog, PendingRegistration, OtpToken)
│   │   └── 📁 routes/           # Protected Express API routes with rate limiters (/v1/*)
│   ├── Dockerfile               # Production container image (Node 20 Alpine)
│   ├── render.yaml              # 1-Click Render Blueprint Infrastructure-as-Code
│   ├── server.js                # Server entrypoint with graceful shutdown & healthchecks
│   └── package.json             # Backend dependencies (Express, express-rate-limit, Mongoose, etc.)
│
├── .env.example                 # Environment variables reference template
├── .gitignore                   # Professional gitignore preventing secret or build leakage
├── package.json                 # Monorepo root workspace orchestration scripts
└── README.md                    # Platform documentation & deployment manual
```

---

## 🛠️ Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS, Lucide Icons, Boxicons |
| **Backend** | Node.js, Express, `express-rate-limit`, Mongoose, Multer, Cloudinary SDK v2 |
| **Database** | MongoDB Atlas (`users`, `user_logs`, `pending_registrations`, `otp_tokens`) |
| **Cloud Storage** | Cloudinary CDN (`tally-app` secure asset bucket) |
| **Communications** | EmailJS REST API for 6-digit OTP verification codes |
| **Deployment** | Render (Web Service for Backend, Static Site for Frontend), Docker |

---

## 🚀 Quick Start (Local Setup)

### 1. Prerequisites
- **Node.js** v18+ (Node 20+ recommended)
- **npm** v9+
- A free **MongoDB Atlas** cluster URL

### 2. Install Dependencies
From the repository root:
```bash
npm run install:all
```
*(Or run `npm install` inside `backend/` and `frontend/` separately).*

### 3. Configure Environment Variables
Copy `.env.example` into `backend/.env`:
```bash
cp .env.example backend/.env
```
Update `backend/.env` with your credentials:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
DB_NAME=Silk_and_fashion

# Optional: Cloudinary Media Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: EmailJS Verification
EMAILJS_SERVICE_ID=service_gifq25t
EMAILJS_TEMPLATE_ID=template_fxkonbp
EMAILJS_USER_ID=S-Rf-rtEkTugqgxM4
EMAILJS_PRIVATE_KEY=your_private_key
```

### 4. Start Development Servers
From the repository root:
- **Start Backend (Port 5000):**
  ```bash
  npm run dev:backend
  ```
  *Health status check available at: `http://localhost:5000/health`*

- **Start Frontend (Port 3000):**
  ```bash
  npm run dev:frontend
  ```
  *App available at: `http://localhost:3000`*

---

## 🌐 Production Deployment Guide

### Deploying the Backend to Render (Web Service)
1. In the [Render Dashboard](https://dashboard.render.com), click **New +** ➔ **Web Service** (or use **Blueprint** with [`backend/render.yaml`](./backend/render.yaml)).
2. Connect your GitHub repository.
3. Configure the service settings:
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
4. Under **Environment Variables**, add:
   - `MONGODB_URI` = Your MongoDB connection string
   - `DB_NAME` = `Silk_and_fashion`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (if using photos)
   - `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_USER_ID`, `EMAILJS_PRIVATE_KEY`
5. Click **Deploy Web Service**.

### Deploying the Frontend to Render (Static Site)
1. In the [Render Dashboard](https://dashboard.render.com), click **New +** ➔ **Static Site**.
2. Connect your GitHub repository.
3. Configure the site settings:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install --legacy-peer-deps && npm run build`
   - **Publish Directory:** `dist`
4. Under **Environment Variables**, add:
   - `VITE_API_URL` = `https://<your-backend-app>.onrender.com/v1`
5. **Add SPA Rewrite Rule (Mandatory for React Router):**
   - In the left menu, click **Redirects/Rewrites**.
   - Click **Add Rule**:
     - **Type:** `Rewrite`
     - **Source:** `/*`
     - **Destination:** `/index.html`
   - Click **Save Changes**.

---

## 🔐 Security Standards & Git Hygiene

- ✅ **No Secret Leaks:** `.env` files are strictly excluded via [`.gitignore`](./.gitignore).
- ✅ **Clean Repository:** `node_modules/`, `dist/`, `build/`, and OS temp files are barred from git history.
- ✅ **Multi-Tenant Protection:** Every database interaction is scoped to the verified `X-User-Email` header.
- ✅ **Anti-Brute Force:** Strictest rate-limiting rules applied on OTP generation (8 per 15 min), OTP verification (10 attempts per 15 min), and logins (15 attempts per 15 min).
