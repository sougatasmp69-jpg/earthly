# 🌿 Earthly — Personal Carbon Footprint Tracker & AI Wellness Hub

> **A dark glassmorphic personal carbon tracker and AI wellness companion built with React, TypeScript, Vite, Tailwind CSS, and Node.js.**

---

## 🌟 Highlights

- **Track Real Emissions**: Automatically calculates CO₂ impact using fixed emission factors (Car, Bus, Flight, Electricity, Veg/Non-Veg meals).
- **Weekly Target Tracking**: Interactive goal tracking with real-time gradient progress bar and dynamic status badges.
- **AI-Powered Diet Plan**: Tailored nutrition and macro breakdown based on BMI, height, and weight.
- **AI-Powered Fitness Routine**: Functional calisthenics and workout plan customized to user body metrics.
- **Scheduled Reminders & Alarms**: Synthesized Web Audio API alarms, browser push notifications, and customizable daily schedules.
- **Phone + Password Auth**: Dedicated user accounts with persistent data storage and offline-first fallback.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Locally (Frontend + Backend)
```bash
npm run dev:full
```
- **Client**: `http://localhost:3000`
- **Server**: `http://localhost:3001`

### 3. Build for Production
```bash
npm run build
```

---

## 🌐 Deployment Options

### Option A: GitHub Pages (Automatic via GitHub Actions)
1. Go to your repository settings on GitHub: `https://github.com/sougatasmp69-jpg/earthly/settings/pages`
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. Every push to `main` automatically triggers the deployment workflow (`.github/workflows/deploy.yml`).
4. Your live app will be accessible at: **`https://sougatasmp69-jpg.github.io/earthly/`**

### Option B: Netlify
1. Connect your GitHub repository (`earthly`) to [Netlify](https://app.netlify.com).
2. The build settings are pre-configured in `netlify.toml` (`npm run build` → `dist`).
3. Deploy! Netlify automatically handles SPA routing via `_redirects`.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Build Tool**: Vite 5
- **Audio Engine**: Web Audio API Synthesizer (Zero external assets)
- **Backend API**: Node.js, Express, JSON database with crypto password hashing

---

## 📄 License
MIT License
