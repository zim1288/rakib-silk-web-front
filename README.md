# 🧵 Rakib Silk & Fashion — Tally Khata Fullstack Platform

> A production-grade, multi-tenant inventory, manufacturing, and financial ledger platform tailored for silk & saree merchants.

---

## 📁 Repository Structure

```
silk-and-fashion/
├── 📁 frontend/                 # Interactive React + TypeScript SPA Web Client
│   ├── 📁 src/
│   │   ├── 📁 components/       # Domain-specific UI modules (auth, inventory, production, history)
│   │   ├── 📁 context/          # React AuthContext & session providers
│   │   ├── 📁 pages/            # Application route views (Dashboard, Sales, Inventory, etc.)
│   │   ├── 📁 services/         # API HTTP requester & business calculation services
│   │   └── 📁 utils/            # Bengali/Gregorian date formatting & validation logic
│   ├── package.json             # Frontend dependencies (React 19, Tailwind, Vite)
│   └── vite.config.ts           # Vite build orchestration
│
├── 📁 backend/                  # REST API Microservice (Node.js + Express + Mongoose)
│   ├── 📁 src/
│   │   ├── 📁 config/           # MongoDB Atlas & Cloudinary SDK configurations
│   │   ├── 📁 controllers/      # Modular business logic for auth, inventory, sales, media
│   │   ├── 📁 middleware/       # Multi-tenant X-User-Email extractor & error handlers
│   │   ├── 📁 models/           # Mongoose schemas ('user' & polymorphic 'user-log')
│   │   └── 📁 routes/           # Versioned Express routes (/v1/*)
│   ├── Dockerfile               # Production container image (Node 20 Alpine)
│   ├── render.yaml              # 1-Click Render Blueprint Infrastructure-as-Code
│   ├── server.js                # Server entrypoint with graceful shutdown
│   └── package.json             # Backend dependencies (Express, Mongoose, Multer, etc.)
│
├── .env.example                 # Master environment variables template (Secrets are excluded!)
├── .gitignore                   # Professional gitignore preventing any credential leakage
├── package.json                 # Monorepo root workspace scripts
└── README.md                    # Project documentation & deployment manual
```

---

## 🛠️ Tech Stack

| Domain | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, Motion |
| **Backend** | Node.js, Express, Mongoose, Multer, Cloudinary SDK v2 |
| **Database** | MongoDB Atlas (Collection: `user`, `user-log`) |
| **Cloud Media** | Cloudinary CDN (`tally-app` bucket) |
| **Communications** | EmailJS REST API for verification passcode dispatch |
| **Deployment** | Render (Web Service / Blueprint), Docker, Vercel / Netlify |

---

## 🚀 Quick Start (Local Setup)

### 1. Install All Dependencies
From the repository root:
```bash
npm run install:all
```

### 2. Configure Environment Variables
Copy `.env.example` into `backend/.env`:
```bash
cp .env.example backend/.env
```
Provide your MongoDB Atlas connection string and optional Cloudinary credentials in `backend/.env`.

### 3. Start Development Servers
In two separate terminals (or using the root scripts):

- **Start Backend (Port 5000):**
  ```bash
  npm run dev:backend
  ```
  *Status available at `http://localhost:5000/health`*

- **Start Frontend (Port 3000):**
  ```bash
  npm run dev:frontend
  ```
  *App available at `http://localhost:3000`*

---

## 🌐 Deployment Guide

### Deploying the Backend to Render (1-Click)
1. Push this repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com), select **New +** ➔ **Blueprint**.
3. Select your repository. Render automatically discovers [`backend/render.yaml`](./backend/render.yaml).
4. Fill in your `MONGODB_URI` when prompted and click **Apply**.

### Deploying the Frontend (Vercel / Render / Netlify)
1. Set the root or base directory to `frontend`.
2. Set Build Command: `npm run build`
3. Set Output Directory: `dist`
4. Set Environment Variable:
   ```env
   VITE_API_URL="https://your-backend-app.onrender.com/v1"
   ```

---

## 🔐 Security & Git Hygiene

This repository is configured with a strict [`.gitignore`](./.gitignore):
- ✅ **`.env` files** are strictly ignored; only `.env.example` templates are tracked.
- ✅ **`node_modules/`** in all directories are ignored.
- ✅ **Build outputs (`dist/`, `build/`)** and OS files (`.DS_Store`, `Thumbs.db`) are ignored.
- ✅ **`app-reference/`** (local clone of reference Android code) is ignored so your repository stays clean and uncluttered.
