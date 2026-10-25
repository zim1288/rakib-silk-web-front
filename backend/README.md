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
    ├── app.js                # Express app setup, CORS, JSON parsers, route registration
    ├── config/
    │   ├── db.js             # MongoDB Atlas Mongoose connection handler
    │   └── cloudinary.js     # Cloudinary media storage engine configuration
    ├── controllers/
    │   ├── authController.js        # User registration, login, email verification
    │   ├── customerController.js    # Customer contact details synchronization
    │   ├── inventoryController.js   # Saree catalog CRUD & bulk data operations
    │   ├── productionController.js  # Loom manufacturing batch tracking
    │   ├── transactionController.js # Financial ledger & cashflow records
    │   └── uploadController.js       # Cloudinary image upload & cleanup
    ├── middleware/
    │   ├── authHeader.js     # Multi-tenant X-User-Email extractor
    │   └── errorHandler.js   # Centralized error handler and 404 responder
    ├── models/
    │   ├── User.js           # Merchant credentials model ('user' collection)
    │   └── UserLog.js        # Polymorphic multi-tenant ledger ('user-log' collection)
    └── routes/
        ├── authRoutes.js        # /v1/auth/*
        ├── customerRoutes.js    # /v1/customers/*
        ├── inventoryRoutes.js   # /v1/inventory/*
        ├── productionRoutes.js  # /v1/production/*
        ├── transactionRoutes.js # /v1/transactions/*
        └── uploadRoutes.js      # /v1/upload & /v1/delete-image
```

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
- **Development mode (auto-reload on save):**
  ```bash
  npm run dev
  ```
- **Production mode:**
  ```bash
  npm start
  ```

### 4. Verify Server Status
Open your browser or run:
```bash
curl http://localhost:5000/health
```
Response:
```json
{
  "status": "ok",
  "database": "connected",
  "timestamp": "2026-10-23T14:00:00.000Z",
  "uptimeSeconds": 12
}
```

---

## 🌐 Deploying to Render (Recommended)

### Option A: Automatic Blueprint Deployment (Simplest)
1. Push this repository to GitHub or GitLab.
2. Go to the [Render Dashboard](https://dashboard.render.com).
3. Click **New +** > **Blueprint**.
4. Connect your repository. Render will automatically detect [`render.yaml`](./render.yaml).
5. Render will prompt you for the un-synced environment variables:
   - `MONGODB_URI`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
   - `EMAILJS_PRIVATE_KEY` (optional)
6. Click **Apply**. Render will build and deploy your service with a free public HTTPS URL (e.g. `https://your-app-name.onrender.com`).

### Option B: Manual Web Service on Render
1. In the [Render Dashboard](https://dashboard.render.com), click **New +** > **Web Service**.
2. Connect your Git repository.
3. Choose the root directory or `backend` folder if monorepo.
4. Set the following settings:
   - **Runtime:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/health`
5. In **Environment Variables**, add the keys from your `.env` file.
6. Click **Create Web Service**.

---

## 🚂 Deploying to Railway

1. Open [Railway](https://railway.app) and create a **New Project**.
2. Select **Deploy from GitHub repo**.
3. In project settings, add the environment variables (`MONGODB_URI`, `CLOUDINARY_*`, etc.).
4. Under **Networking**, click **Generate Domain** to get your public API URL.

---

## 🐳 Running with Docker

Build and run container locally or on any VPS:
```bash
# Build Docker image
docker build -t rakib-silk-backend .

# Run container with environment variables
docker run -p 5000:5000 --env-file .env rakib-silk-backend
```

---

## 🔗 Connecting the Frontend

Once your backend is deployed, connect your frontend by updating `BASE_URL` in `rakib-silk-&-fashion---tally-khata/src/services/api.ts`:
```typescript
export const BASE_URL = 'https://<your-new-render-app>.onrender.com/v1';
```

---

## 🛡️ API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server & MongoDB health ping |
| `POST` | `/v1/auth/register` | Register merchant credentials |
| `POST` | `/v1/auth/login` | Authenticate merchant credentials |
| `POST` | `/v1/auth/check` | Check if merchant email exists |
| `POST` | `/v1/auth/send-verification` | Send OTP verification passcode via EmailJS |
| `GET` | `/v1/inventory` | Retrieve merchant saree inventory items |
| `POST` | `/v1/inventory` | Bulk upsert saree inventory items |
| `POST` | `/v1/inventory/item` | Upsert single saree inventory item |
| `DELETE` | `/v1/inventory/item/:id` | Soft delete inventory item |
| `GET` | `/v1/production` | Retrieve loom production batches |
| `POST` | `/v1/production` | Bulk upsert loom production batches |
| `DELETE` | `/v1/production/item/:id` | Soft delete loom production batch |
| `GET` | `/v1/transactions` | Retrieve financial ledger transactions |
| `POST` | `/v1/transactions` | Record single or bulk transactions |
| `POST` | `/v1/customers/update` | Synchronize customer contact across sale records |
| `POST` | `/v1/upload` | Upload saree photo to Cloudinary CDN |
| `POST` | `/v1/delete-image` | Delete image asset from Cloudinary |
