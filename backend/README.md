# 🧵 Rakib Silk & Fashion — Production Backend API

A clean, modular, and deployment-ready Node.js & Express REST API backend for the **Rakib Silk & Fashion (Tally Khata)** merchant management platform.

---

## 📁 Architecture Overview

```
backend/
├── .env.example              # Environment variables template
├── .gitignore                # Git ignore rules for node_modules & secrets
├── Dockerfile                # Production container specification (Node 20 Alpine)
├── package.json              # Dependencies and lifecycle scripts
├── render.yaml               # Render Blueprint Infrastructure-as-Code
├── server.js                 # Server entrypoint (initializes DB connection & starts HTTP server)
└── src/
    ├── app.js                # Express app setup, CORS whitelist, JSON parsers, route registration
    ├── config/
    │   ├── db.js             # MongoDB Atlas Mongoose connection handler
    │   └── cloudinary.js     # Cloudinary media storage engine configuration
    ├── controllers/
    │   ├── authController.js        # Multi-stage auth, OTP management, password reset, session verification
    │   ├── customerController.js    # Customer contact details synchronization
    │   ├── inventoryController.js   # Saree catalog CRUD, atomic sale deductions, and bulk data operations
    │   ├── productionController.js  # Loom manufacturing batch tracking
    │   ├── transactionController.js # Financial ledger & cashflow records
    │   └── uploadController.js      # Cloudinary image upload & asset cleanup
    ├── middleware/
    │   ├── authHeader.js     # Multi-tenant X-User-Email extractor
    │   └── errorHandler.js   # Centralized error handler and 404 responder
    ├── models/
    │   ├── User.js           # Merchant credentials model ('user' collection)
    │   └── UserLog.js        # Polymorphic multi-tenant ledger ('user-log' collection)
    └── routes/
        ├── authRoutes.js        # Protected /v1/auth/* endpoints with express-rate-limit
        ├── customerRoutes.js    # /v1/customers/*
        ├── inventoryRoutes.js   # /v1/inventory/*
        ├── productionRoutes.js  # /v1/production/*
        ├── transactionRoutes.js # /v1/transactions/*
        └── uploadRoutes.js      # /v1/upload & /v1/delete-image
```

---

## 🛡️ Security Architecture

1. **Multi-Tenant Authorization Guards:**
   - Every protected route verifies the presence of an authenticated `X-User-Email` header.
   - Anonymous and unauthenticated requests are strictly rejected (`401 Unauthorized`), preventing unauthorized cross-tenant data leaks.

2. **Rate Limiting & Anti-Brute-Force Protection:**
   - Configured via `express-rate-limit` on all sensitive authentication routes:
     - `authLimiter`: 15 requests per 15-minute window for login, registration, and email existence checks.
     - `otpVerifyLimiter`: 10 attempts per 15-minute window to prevent 6-digit OTP brute-forcing.
     - `otpSendLimiter`: 8 requests per 15-minute window to prevent email flooding.

3. **Two-Stage Registration with 30-Minute MongoDB TTL:**
   - New accounts are first written to `pending_registrations` with a 30-minute auto-expiry TTL index.
   - Accounts are only promoted to the primary `users` collection once the user verifies their 6-digit OTP.
   - Abandoned registrations expire cleanly without blocking the email address from future signups.

4. **Multi-Device Session Revocation:**
   - Account passwords maintain a `tokenVersion` counter.
   - When a password is reset via `/v1/auth/complete-password-reset`, `tokenVersion` is automatically incremented, invalidating active sessions across all other devices.

5. **Strict CORS Whitelist:**
   - Requests are restricted to authorized production domains (e.g. Render frontends) and local development ports (`http://localhost:3000`, `http://localhost:5173`).

---

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment Variables
Copy the example file to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials:
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/?retryWrites=true&w=majority
DB_NAME=Silk_and_fashion

# Optional: Cloudinary photo storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Optional: EmailJS passcode delivery
EMAILJS_SERVICE_ID=service_gifq25t
EMAILJS_TEMPLATE_ID=template_fxkonbp
EMAILJS_USER_ID=S-Rf-rtEkTugqgxM4
EMAILJS_PRIVATE_KEY=your_private_key
```

### 3. Start Server
- **Development mode (auto-reload on file changes):**
  ```bash
  npm run dev
  ```
- **Production mode:**
  ```bash
  npm start
  ```

### 4. Verify Server Status
```bash
curl http://localhost:5000/health
```
Response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-11-07T14:00:00.000Z",
  "uptimeSeconds": 15
}
```

---

## 🌐 Deploying to Render

### Option A: 1-Click Blueprint (Simplest)
1. In the [Render Dashboard](https://dashboard.render.com), click **New +** ➔ **Blueprint**.
2. Connect your Git repository. Render automatically reads [`render.yaml`](./render.yaml).
3. Fill in your environment variables (`MONGODB_URI`, `CLOUDINARY_*`, `EMAILJS_*`) when prompted.
4. Click **Apply**.

### Option B: Manual Web Service
1. In the [Render Dashboard](https://dashboard.render.com), click **New +** ➔ **Web Service**.
2. Connect your Git repository.
3. Set the following settings:
   - **Root Directory:** `backend`
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
4. In **Environment Variables**, add the keys from your `.env` file.
5. Click **Create Web Service**.

---

## 🐳 Running with Docker

Build and run container locally or on any server:
```bash
# Build Docker image
docker build -t rakib-silk-backend .

# Run container with environment variables
docker run -p 5000:5000 --env-file .env rakib-silk-backend
```

---

## 🔗 Connecting the Frontend

Connect your frontend client by setting the `VITE_API_URL` environment variable or configuring `BASE_URL` in [frontend/src/services/api.ts](file:///d:/project/thysis/silk-and-fashion/frontend/src/services/api.ts):
```typescript
export const BASE_URL = 'https://<your-backend-app>.onrender.com/v1';
```

---

## 🛡️ API Endpoints Reference

### Health & Diagnostics
| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server status, MongoDB connection health ping, and uptime |

### Authentication & Account Security (`/v1/auth`)
| Method | Endpoint | Rate Limit | Description |
|---|---|---|---|
| `POST` | `/v1/auth/register-pending` | 15 / 15m | Step 1 of Registration: stores credentials with 30-min TTL and sends 6-digit OTP |
| `POST` | `/v1/auth/verify-registration` | 10 / 15m | Step 2 of Registration: verifies OTP and promotes account to permanent `User` |
| `POST` | `/v1/auth/request-password-reset` | 8 / 15m | Step 1 of Password Reset: sends 6-digit reset code to verified email |
| `POST` | `/v1/auth/verify-otp` | 10 / 15m | Step 2 of Password Reset: validates OTP code without consuming it |
| `POST` | `/v1/auth/complete-password-reset` | 10 / 15m | Step 3 of Password Reset: updates password, consumes OTP, and revokes other device sessions |
| `POST` | `/v1/auth/resend-otp` | 8 / 15m | Revokes previous OTP and issues a fresh 6-digit code with cooldown protection |
| `POST` | `/v1/auth/verify-session` | None | Validates client `tokenVersion` against active merchant profile |
| `POST` | `/v1/auth/login` | 15 / 15m | Authenticate merchant credentials |
| `POST` | `/v1/auth/check` | 15 / 15m | Check if merchant email already exists in system |
| `POST` | `/v1/auth/register` | 15 / 15m | Direct registration endpoint (guarded against account takeover) |

### Saree Inventory (`/v1/inventory`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/v1/inventory` | Yes (`X-User-Email`) | Retrieve merchant saree inventory items |
| `POST` | `/v1/inventory` | Yes (`X-User-Email`) | Bulk upsert saree inventory items |
| `POST` | `/v1/inventory/item` | Yes (`X-User-Email`) | Upsert single saree inventory item |
| `POST` | `/v1/inventory/sell` | Yes (`X-User-Email`) | Atomic inventory deduction during sale |
| `DELETE` | `/v1/inventory/item/:id` | Yes (`X-User-Email`) | Soft delete inventory item |

### Loom Manufacturing (`/v1/production`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/v1/production` | Yes (`X-User-Email`) | Retrieve loom production batches |
| `POST` | `/v1/production` | Yes (`X-User-Email`) | Bulk upsert loom production batches |
| `DELETE` | `/v1/production/item/:id` | Yes (`X-User-Email`) | Soft delete loom production batch |

### Financial Ledger & Transactions (`/v1/transactions`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/v1/transactions` | Yes (`X-User-Email`) | Retrieve financial ledger transactions |
| `POST` | `/v1/transactions` | Yes (`X-User-Email`) | Record single or bulk transactions |

### Customers & Media (`/v1/customers`, `/v1/upload`)
| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/v1/customers/update` | Yes (`X-User-Email`) | Synchronize customer contact across sale records |
| `POST` | `/v1/upload` | Yes (`X-User-Email`) | Upload saree photo to Cloudinary CDN (`tally-app` bucket) |
| `POST` | `/v1/delete-image` | Yes (`X-User-Email`) | Delete media asset from Cloudinary |
