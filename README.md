# Project Expo Decentralized Voting System

A transparent, real-time interactive voting and showcase platform designed for student innovation expos, hackathons, and project showcases. Built with a modern full-stack web architecture featuring role-based access control, cryptographic vote verification, and interactive top 3 live leaderboards.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Environment Variables](#environment-variables)
5. [Local Development Setup](#local-development-setup)
   - [Prerequisites](#prerequisites)
   - [MongoDB Setup](#mongodb-setup)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
   - [Database Seeding & Admin Setup](#database-seeding--admin-setup)
6. [API Endpoints Reference](#api-endpoints-reference)
7. [Production Deployment](#production-deployment)
   - [Backend Deployment (Render)](#backend-deployment-render)
   - [Frontend Deployment (Vercel)](#frontend-frontend-deployment-vercel)
   - [Database Deployment (MongoDB Atlas)](#database-deployment-mongodb-atlas)

---

## Project Overview

The **Project Expo Voting System** empowers students, visitors, and judges to explore participating projects across multiple innovation domains (AI, IoT, Robotics, Cybersecurity, Healthcare, Agriculture, Blockchain) and cast secure votes.

Key Features:
- **Project Showcase**: Detailed project cards, team member highlights, and dynamic category filters.
- **Voter Authentication**: JWT Bearer token authentication for user registration and login.
- **Vote Integrity Protection**: Enforces 1 vote per user per project using a unique compound index (`{ userId, projectId }`) in MongoDB.
- **Real-Time Leaderboard**: Live calculation of top 3 podium rankings and voting metrics.
- **Admin Dashboard**: Secure project management (Create, Edit, Delete) restricted to admin accounts.
- **Project Reviews & Feedback**: Ratings, appreciation messages, and constructive suggestions per project.

---

## Tech Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: TailwindCSS, Bootstrap 5 (Glassmorphism & Neon theme)
- **Routing**: React Router v6
- **Icons & UI**: Lucide-React, FontAwesome 6

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens) & Bcryptjs password hashing
- **Middleware**: Custom JWT `protect` and `adminOnly` authorization middleware

---

## Project Structure

```
Project-Expo-Voting-System/
├── react-app/              # Standalone React Frontend
│   ├── src/
│   │   ├── components/     # UI components (Navbar, Hero, Leaderboard, ProjectCard, etc.)
│   │   ├── constants/      # Category configurations
│   │   ├── context/        # ExpoContext state management
│   │   ├── pages/          # HomePage, ProjectDetailsPage, VotePage, AdminPage
│   │   ├── services/       # Centralized API service client (api.js)
│   │   └── styles/         # Custom styling
│   ├── .env.example        # Frontend environment documentation
│   ├── vercel.json         # Vercel SPA routing rewrites
│   └── package.json
│
├── backend/                # Standalone Express Backend
│   ├── config/             # Mongoose database connection (db.js)
│   ├── controllers/        # Route controllers (Auth, Projects, Votes, Feedback, Results)
│   ├── middleware/         # JWT protect & adminOnly middleware
│   ├── models/             # Mongoose Schemas (User, Project, Vote, Feedback)
│   ├── routes/             # Express API routes
│   ├── seed.js             # Idempotent database seeder
│   ├── server.js           # Express app entry point
│   ├── render.yaml         # Render deployment blueprint
│   ├── .env.example        # Backend environment documentation
│   └── package.json
│
├── .gitignore              # Root Git ignore rules
├── DEPLOYMENT.md           # Production deployment guide
└── README.md               # Project documentation
```

---

## Environment Variables

### 1. Backend (`backend/.env`)

Create a `.env` file inside the `backend/` directory:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/decentralized_voting
JWT_SECRET=your_secure_random_jwt_secret
FRONTEND_URL=http://localhost:3000
```

### 2. Frontend (`react-app/.env`)

Create a `.env` file inside the `react-app/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

---

## Local Development Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally on port `27017` (or a MongoDB Atlas connection string).

### 1. MongoDB Setup
Ensure your local MongoDB service is active:
```bash
# Verify MongoDB service status (Windows)
net start MongoDB
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd backend
npm install
```

### 3. Database Seeding & Admin Setup
Seed the initial project dataset and default test accounts:
```bash
npm run seed
```

**Created Seed Accounts**:
- **System Admin**: `admin@expo.com` / Password: `admin123`
- **Test Voter**: `test@example.com` / Password: `123456`

Start the backend development server:
```bash
npm run dev
```
The server will run on `http://localhost:5000`. Verify status at `http://localhost:5000/api/health`.

### 4. Frontend Setup
In a new terminal window, navigate to the frontend directory:
```bash
cd react-app
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## API Endpoints Reference

| Category | Method | Endpoint | Access |
| :--- | :--- | :--- | :--- |
| **System** | `GET` | `/api/health` | Public |
| **Auth** | `POST` | `/api/auth/register` | Public |
| **Auth** | `POST` | `/api/auth/login` | Public |
| **Projects** | `GET` | `/api/projects` | Public |
| **Projects** | `GET` | `/api/projects/:id` | Public |
| **Projects** | `POST` | `/api/projects` | Admin (JWT) |
| **Projects** | `PUT` | `/api/projects/:id` | Admin (JWT) |
| **Projects** | `DELETE` | `/api/projects/:id` | Admin (JWT) |
| **Voting** | `POST` | `/api/votes` | Voter (JWT, 1-vote/project) |
| **Voting** | `GET` | `/api/votes/check/:projectId` | Voter (JWT) |
| **Feedback** | `POST` | `/api/feedback` | Voter (JWT) |
| **Feedback** | `GET` | `/api/feedback/:projectId` | Public |
| **Results** | `GET` | `/api/results` | Public |

---

## Production Deployment

### Database Deployment (MongoDB Atlas)
1. Create an M0 cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Configure **Network Access** (`0.0.0.0/0`) and create a database user.
3. Obtain your connection string: `mongodb+srv://<username>:<password>@cluster.xxxx.mongodb.net/decentralized_voting?retryWrites=true&w=majority`

### Backend Deployment (Render)
1. Deploy a new **Web Service** on [Render](https://render.com) from your repository (`backend` root directory).
2. Set Build Command: `npm install`
3. Set Start Command: `node server.js`
4. Configure Environment Variables:
   - `PORT`: `5000`
   - `NODE_ENV`: `production`
   - `MONGO_URI`: `YOUR_MONGODB_ATLAS_CONNECTION_STRING`
   - `JWT_SECRET`: `YOUR_SECURE_RANDOM_SECRET`
   - `FRONTEND_URL`: `https://YOUR-VERCEL-DOMAIN`

### Frontend Deployment (Vercel)
1. Import your repository into [Vercel](https://vercel.com) (`react-app` root directory).
2. Set Build Command: `npm run build`
3. Set Output Directory: `dist`
4. Configure Environment Variable:
   - `VITE_API_URL`: `https://YOUR-BACKEND-URL/api`

---

## License

This project is licensed under the ISC License.
