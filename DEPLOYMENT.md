# Production Deployment Guide: Project Expo Voting System

This guide outlines step-by-step instructions to deploy the **Project Expo Voting System** as a production-ready application using **Vercel** (Frontend), **Render** (Backend), and **MongoDB Atlas** (Cloud Database).

---

## Architecture Overview

* **Frontend**: React + Vite SPA hosted on **Vercel**
* **Backend**: Express + Node.js API hosted on **Render** (Web Service)
* **Database**: **MongoDB Atlas** Managed Cloud Database Cluster

---

## Step 1: Set Up MongoDB Atlas (Database)

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free **M0 Shared Cluster**.
3. Create a **Database User** with a password (e.g. username: `expo_admin`, generate a secure password).
4. In **Network Access**, add IP address `0.0.0.0/0` (Allows connections from Render deployment servers).
5. Click **Connect** -> **Drivers** (Node.js) and copy the Connection String:
   ```text
   mongodb+srv://expo_admin:<password>@cluster0.xxxx.mongodb.net/decentralized_voting?retryWrites=true&w=majority
   ```

---

## Step 2: Deploy Backend to Render

1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com) and click **New +** -> **Web Service**.
3. Connect your GitHub repository.
4. Set the following settings:
   * **Name**: `expo-voting-backend`
   * **Root Directory**: `backend`
   * **Environment**: `Node`
   * **Build Command**: `npm install`
   * **Start Command**: `node server.js`
5. Under **Environment Variables**, add:
   * `NODE_ENV`: `production`
   * `PORT`: `5000` (or leave default, Render sets `$PORT`)
   * `MONGO_URI`: `mongodb+srv://expo_admin:<password>@cluster0.xxxx.mongodb.net/decentralized_voting?retryWrites=true&w=majority`
   * `JWT_SECRET`: `your_super_secret_jwt_key_here`
   * `CLIENT_URL`: `https://your-app.vercel.app` (Add after Step 3)
6. Click **Deploy Web Service** and copy your backend URL (e.g., `https://expo-voting-backend.onrender.com`).

---

## Step 3: Seed Production Database (Optional)

To seed initial projects and admin user into your MongoDB Atlas cloud database:

1. Update `backend/.env` locally or set environment variable `MONGO_URI` to your Atlas connection string.
2. Run the seed script:
   ```bash
   npm run seed
   ```
3. Initial Seed Credentials created:
   * **Admin User**: `admin@expo.com` / Password: `admin123`
   * **Voter User**: `user@expo.com` / Password: `user123`

---

## Step 4: Deploy Frontend to Vercel

1. Sign in to [Vercel](https://vercel.com) and click **Add New** -> **Project**.
2. Import your GitHub repository.
3. Set the following settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `react-app`
   * **Build Command**: `npm run build`
   * **Output Directory**: `dist`
4. Under **Environment Variables**, add:
   * `VITE_API_URL`: `https://expo-voting-backend.onrender.com/api` *(replace with your Render backend URL)*
5. Click **Deploy**.
6. Once deployed, copy your Vercel URL (e.g., `https://your-app.vercel.app`) and update the `CLIENT_URL` environment variable on Render.

---

## Summary of Configured Production Files

- `.gitignore` (Root gitignore)
- `react-app/.gitignore` (React gitignore)
- `react-app/vercel.json` (SPA routing rewrites)
- `backend/.env.example` (Backend Env Documentation)
- `react-app/.env.example` (Frontend Env Documentation)
- `backend/server.js` (Dynamic CORS configuration)
