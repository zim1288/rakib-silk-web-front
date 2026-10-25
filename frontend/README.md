# 👗 Rakib Silk & Fashion — Frontend Web Application

The modern web client for **Rakib Silk & Fashion (Tally Khata)**, engineered with React 19, TypeScript, Tailwind CSS, Lucide Icons, and Motion.

---

## 📁 Architecture Overview

```
frontend/
├── index.html               # SPA HTML entrypoint
├── package.json             # Frontend dependencies & scripts
├── tsconfig.json            # Strict TypeScript configuration
├── vite.config.ts           # Vite build & plugin configuration
├── .env.example             # Frontend environment variables template
├── .gitignore               # Ignored build & node_modules directories
└── src/
    ├── main.tsx             # React DOM root entrypoint
    ├── App.tsx              # Application layout & router configuration
    ├── index.css            # Tailwind directives, animations & theme variables
    ├── types.ts             # Complete TypeScript interfaces for domains & APIs
    ├── components/
    │   ├── Navbar.tsx       # Global header navigation & merchant profile menu
    │   ├── Footer.tsx       # Standardized application footer
    │   ├── auth/            # Sliding auth container, login & register forms
    │   ├── inventory/       # Saree catalog table, filter bar, modals & forms
    │   ├── production/      # Loom manufacturing batches table, filter & forms
    │   └── history/         # Dual financial ledger & operation audit trail
    ├── context/
    │   └── AuthContext.tsx  # Global merchant authentication state provider
    ├── pages/
    │   ├── DashboardPage.tsx         # Overview KPIs, fast actions & summary charts
    │   ├── InventoryPage.tsx         # Saree stock management
    │   ├── ProductionPage.tsx        # Loom production batch tracking
    │   ├── PurchasePage.tsx          # Raw materials & stock purchasing
    │   ├── SalesPage.tsx             # Saree sales & billing
    │   ├── HistoryPage.tsx           # Financial cashflow & operations ledger
    │   ├── CustomerDirectoryPage.tsx # Customer directory & debt ledger
    │   ├── SettingsPage.tsx          # App settings & preferences
    │   ├── GuidePage.tsx             # Merchant manual & quick reference
    │   ├── LoginPage.tsx             # Fluid sliding login experience
    │   └── RegisterPage.tsx          # Merchant registration experience
    ├── services/
    │   ├── api.ts           # Centralized backend HTTP client with tenant isolation
    │   └── history.ts       # Ledger calculation helpers & transaction filters
    └── utils/
        ├── date.ts          # Bengali & Gregorian timestamp formatters
        └── validation.ts    # Form sanitization & validation rules
```

---

## 🚀 Running Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Configure your backend endpoint:
```env
VITE_API_URL="https://your-backend.onrender.com/v1"
```
*(If left empty, it defaults to the live Render backend service).*

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 🛠️ Build & Typecheck

```bash
# Verify TypeScript types without emitting files
npm run lint

# Build production bundle to /dist
npm run build

# Preview production build locally
npm run preview
```
