# QuizHUB — Online Quiz Assessment Platform

## Project Structure

```
QuizHUB/
├── backend/          # Express.js server (API, auth, MongoDB)
│   ├── server.cjs    # Entry point
│   ├── routes.cjs    # All API routes
│   ├── config/       # Database config
│   ├── models/       # Mongoose models (User, Quiz, Attempt)
│   └── ...
├── frontend/         # React + Vite frontend
│   ├── index.html    # Entry HTML
│   ├── src/          # React source code
│   │   ├── pages/    # All page components
│   │   ├── components/ # Shared components
│   │   ├── hooks/    # Custom React hooks
│   │   └── lib/      # Utilities
│   └── public/       # Static assets
├── shared/           # Shared schemas and types
├── start.bat         # One-click startup (Windows)
├── package.json      # Root package.json with scripts
└── README.md
```

## Quick Start

### Option 1: One-Click (Windows)

Double-click `start.bat`

### Option 2: Manual

```bash
# Install dependencies
npm install

# Start development server (backend + frontend)
npm run dev
```

### Open in Browser

- **Application:** http://localhost:5000
- **Vite Dev Server:** Served through the backend in dev mode

## Environment Variables

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb+srv://your-connection-string
JWT_SECRET=your-jwt-secret
FACULTY_SECRET=your-faculty-registration-code
PORT=5000
```

## Features

- **Faculty Dashboard** — Create quizzes, view student results, download CSV
- **Student Dashboard** — Browse available quizzes, attempt quizzes
- **Anti-Cheating** — Fullscreen enforcement, tab-switch detection, violation tracking
- **Timer Support** — Configurable quiz duration with auto-submit
- **Access Codes** — Optional quiz access codes for controlled access
- **Mobile Responsive** — Fully responsive design for all devices
- **Dark Mode** — Toggle between light and dark themes

## Tech Stack

- **Frontend:** React 18, TypeScript, Tailwind CSS, Vite, Wouter, TanStack Query
- **Backend:** Express.js, MongoDB, Mongoose, JWT Authentication
- **UI:** Radix UI, shadcn/ui, Lucide Icons
