# Unified Vercel Deployment Guide: Project Expo Voting System

This guide outlines step-by-step instructions to deploy **BOTH** the React/Vite Frontend and Express Node.js Backend together on **Vercel** as a single deployment connected to **MongoDB Atlas**.

---

## Architecture Overview

```text
                      ┌───────────────────────────────┐
                      │          USER BROWSER         │
                      └───────────────┬───────────────┘
                                      │ https://your-app.vercel.app
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                                 VERCEL                                    │
│                                                                           │
│   ┌───────────────────────────────┐   ┌───────────────────────────────┐   │
│   │   React + Vite Frontend SPA   │   │  Express API (Serverless Fn)  │   │
│   │   Routes: /                   │   │  Routes: /api/*               │   │
│   └───────────────────────────────┘   └───────────────┬───────────────┘   │
└───────────────────────────────────────────────────────┼───────────────────┘
                                                        │ TLS / SRV
                                                        ▼
                                       ┌──────────────────────────────────┐
                                       │          MONGODB ATLAS           │
                                       │        (Cloud Database)          │
                                       └──────────────────────────────────┘
```

---

## How It Works Under the Hood

1. **Vercel Serverless Function**: The Express API in `backend/server.js` is exported as `module.exports = app`. Requests matching `/api/*` are routed directly to the Express serverless function via `vercel.json` and `api/index.js`.
2. **Serverless Database Caching**: [`backend/config/db.js`](file:///c:/Users/suhitha/OneDrive/Desktop/Project%20-Expo-Voting-System/backend/config/db.js) utilizes a cached Mongoose connection pattern (`global.mongoose`) to reuse connections across warm serverless invocations.
3. **Same-Origin API**: Frontend and Backend share the same domain (`https://your-app.vercel.app`), enabling clean `/api` relative routing without cross-domain CORS issues.

---

## Step 1: Configure MongoDB Atlas

1. Log in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Go to **Network Access** -> Click **Add IP Address** -> Add `0.0.0.0/0` (Allows serverless access from Vercel edge/function IPs).
3. Go to **Database Access** -> Create a database user (e.g. `expo_admin`) and password.
4. Copy your connection string:
   ```text
   mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER-NAME>.mongodb.net/decentralized_voting?retryWrites=true&w=majority
   ```

---

## Step 2: Deploy to Vercel

1. Push your repository to **GitHub**.
2. Go to [Vercel](https://vercel.com/new) and click **Import** on your GitHub repository.
3. Keep the **Root Directory** as `./` (repository root).
4. Under **Environment Variables**, configure:
   * `NODE_ENV`: `production`
   * `MONGO_URI`: `mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER-NAME>.mongodb.net/decentralized_voting?retryWrites=true&w=majority`
   * `JWT_SECRET`: `your_secure_random_64_char_secret_key`
5. Click **Deploy**.

Vercel will automatically build the Vite React frontend into `react-app/dist` and deploy `backend/server.js` as an API serverless function.

---

## Step 3: Seed MongoDB Atlas Database (Optional)

To seed initial projects and admin account into your MongoDB Atlas cloud database:

1. In your local terminal, add your Atlas connection string to `backend/.env`:
   ```env
   MONGO_URI=mongodb+srv://<USERNAME>:<PASSWORD>@<CLUSTER-NAME>.mongodb.net/decentralized_voting?retryWrites=true&w=majority
   ```
2. Run the seed script:
   ```bash
   cd backend
   npm run seed
   ```
