# QuizHUB - Online Quiz Platform

## Project Description
QuizHUB is a full-stack MERN-style quiz platform where faculty create and publish quizzes and students attempt them under controlled conditions.

Role flow implemented in code:
- Faculty registers using a faculty secret, creates quizzes, and reviews/downloads student attempt data.
- Student registers, verifies email via OTP, logs in, attempts available quizzes, and reviews detailed attempt history.

Authentication and quiz flow implemented:
- Registration and login issue JWT-based sessions.
- Student accounts require email OTP verification before login.
- Forgot/reset password uses OTP via email.
- Quizzes support optional access code, optional time limit, availability windows, anti-cheating violation tracking, and auto-submission.

## Features
Only features confirmed in the current codebase:
- User registration (student/faculty)
- Faculty secret validation during faculty signup
- Student email OTP verification
- Resend verification code
- Login with JWT token issuance
- Authenticated profile fetch (`/api/auth/me`)
- Forgot password (send reset OTP)
- Reset password with OTP
- Role-based protected UI routes (student/faculty)
- Faculty-only quiz creation
- Quiz list retrieval (faculty sees own quizzes, students see published quizzes)
- Optional quiz availability window (`availableFrom`, `availableUntil`)
- Optional quiz duration timer (`durationMinutes`)
- Optional quiz access code validation
- Student quiz attempts with scoring and per-question answer review
- Attempt history for students
- Quiz-wise attempt analytics for faculty
- CSV export of quiz attempt results (frontend)
- Violation tracking with lock behavior (`>= 4` violations)
- Fullscreen enforcement and anti-cheating checks in attempt screen
- MongoDB persistence via Mongoose
- Frontend dark/light theme toggle

## Tech Stack
Frontend:
- React 18
- TypeScript
- Vite
- Tailwind CSS
- TanStack Query
- Wouter
- shadcn/ui + Radix UI

Backend:
- Node.js
- Express
- MongoDB (Mongoose)
- JWT (`jsonwebtoken`)
- Nodemailer (Brevo SMTP)

## Project Structure
Repository layout:

```text
QuizHUB/
|- README.md
|- QuizHUB_main/
|  |- backend/
|  |  |- server.cjs              # Express entry point
|  |  |- routes.cjs              # Auth, quiz, attempt, OTP endpoints
|  |  |- config/db.cjs           # Mongo connection logic
|  |  |- models/                 # Mongoose models (User, Quiz, Attempt)
|  |  |- utils/                  # OTP generator + email sender
|  |- frontend/
|  |  |- src/
|  |  |  |- pages/               # Login/Register/Dashboard/Quiz/History pages
|  |  |  |- components/          # Reusable UI + protected route/navigation
|  |  |  |- hooks/               # Auth, quiz, attempt hooks
|  |  |  |- lib/                 # API client + query client
|  |- shared/
|  |  |- schema.ts               # Shared zod/drizzle types used by frontend
|  |  |- routes.ts               # Shared API route contracts
|  |- script/
|  |  |- build.ts                # Build helper script (legacy toolchain)
|  |- package.json               # Root scripts (build/start/dev)
```

Notes from the current structure:
- There is no separate `controllers/`, `middleware/`, or `services/` folder in active backend runtime.
- Route handlers and token middleware logic are implemented directly in `backend/routes.cjs`.
- Active production server serves `frontend/dist` from Express.

## Installation Instructions
### 1. Clone repository
```bash
git clone https://github.com/Harish77-github/Online-Quiz-paltform.git
cd QuizHUB
```

### 2. Install dependencies
```bash
cd QuizHUB_main
npm install
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 3. Configure environment variables
Create `QuizHUB_main/.env` and add the variables from the Environment Variables section below.

### 4. Build frontend assets
(Required because `backend/server.cjs` serves `frontend/dist`.)
```bash
npm run build
```

### 5. Run backend (serves API + built frontend)
```bash
npm run dev
```
App runs on `http://localhost:5000` by default.

### 6. Optional frontend-only dev server
```bash
cd frontend
npm run dev
```
This starts Vite using `../vite.config.ts`.

## Environment Variables
Create `QuizHUB_main/.env` with placeholders:

```env
# Server
PORT=5000

# MongoDB
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority
# or
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>/<db>?retryWrites=true&w=majority

# JWT
JWT_SECRET=<your_jwt_secret>
JWT_EXPIRES_IN=1d

# Faculty registration gate
FACULTY_SECRET=<faculty_registration_secret>

# Email / OTP (Brevo SMTP)
BREVO_SMTP_HOST=<smtp_host>
BREVO_SMTP_PORT=<smtp_port>
BREVO_SMTP_USER=<smtp_user>
BREVO_SMTP_PASS=<smtp_password>
EMAIL_FROM=<verified_sender_email>

# Optional (used by drizzle config tooling)
DATABASE_URL=<postgres_url_if_using_drizzle_tools>
```

## API Overview
Major backend routes currently implemented:

### Auth
- `POST /api/auth/register` - Register user (student/faculty)
- `POST /api/auth/login` - Login and return JWT
- `GET /api/auth/me` - Get current authenticated user
- `POST /api/auth/verify-email` - Verify student email using OTP
- `POST /api/auth/resend-verification` - Resend email verification OTP
- `POST /api/auth/send-reset-code` - Send password reset OTP
- `POST /api/auth/reset-password` - Reset password with OTP

### Quizzes
- `GET /api/quizzes` - List quizzes (role-aware)
- `POST /api/quizzes` - Create quiz (faculty only)
- `GET /api/quizzes/:id` - Get single quiz (safe question payload)
- `POST /api/quizzes/:id/validate-access-code` - Validate quiz access code
- `GET /api/quizzes/:id/lock-status` - Check student lock status
- `POST /api/quizzes/:id/record-violation` - Record/check violation lock state

### Attempts
- `POST /api/quizzes/:id/attempts` - Submit quiz attempt
- `GET /api/my-attempts` - Student attempt history
- `GET /api/quizzes/:id/attempts` - Faculty view attempts for owned quiz

## Deployment Instructions
### Option A: Deploy full app on Render (recommended for current code)
This codebase is currently easiest to deploy as one Node service because frontend API calls are relative (`/api/...`).

1. Create a Render Web Service from this repo.
2. Set Root Directory to `QuizHUB_main`.
3. Build Command:
   ```bash
   npm install && npm run build
   ```
4. Start Command:
   ```bash
   npm run start
   ```
5. Add required environment variables in Render dashboard.
6. Deploy and open the Render URL.

### Option B: Backend on Render + Frontend on Render Static Site
1. Deploy backend as Web Service from `QuizHUB_main/backend`.
   - Build: `npm install`
   - Start: `npm start`
2. Deploy frontend as Static Site from `QuizHUB_main/frontend`.
   - Build: `npm install && npm run build`
   - Publish Directory: `dist`
3. Configure frontend rewrite/proxy so `/api/*` points to backend URL.

### Option C: Backend on Render + Frontend on Vercel
1. Deploy backend as above on Render.
2. Deploy `QuizHUB_main/frontend` to Vercel.
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. Add Vercel rewrites so `/api/*` routes forward to Render backend.

## Screenshots
(Add screenshots here)

## Author
- GitHub: [@Harish77-github](https://github.com/Harish77-github)

## License
MIT License
