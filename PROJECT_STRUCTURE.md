# Project Structure - Authentication Implementation

## Complete File Tree

```
quality-control_pipeline/
│
├── 📄 auth.py                         [NEW] Authentication utilities
│   ├── Password hashing (bcrypt)
│   ├── JWT token creation
│   └── Token verification
│
├── 📄 database.py                     [NEW] Database layer
│   ├── SQLite setup
│   ├── User model
│   └── Session management
│
├── 📄 api.py                          [MODIFIED] Backend API
│   ├── /auth/register endpoint
│   ├── /auth/login endpoint
│   ├── /auth/verify endpoint
│   └── Database initialization
│
├── 📄 requirements.txt                [MODIFIED] Python dependencies
│   ├── PyJWT
│   ├── bcrypt
│   ├── SQLAlchemy
│   └── python-dotenv
│
├── 📄 .env.example                    [NEW] Environment template
│   └── SECRET_KEY configuration
│
├── 📄 QUICK_START.md                  [NEW] 5-minute setup guide
├── 📄 AUTH_SETUP.md                   [NEW] Complete documentation
├── 📄 IMPLEMENTATION_SUMMARY.md       [NEW] Implementation details
│
├── 📂 frontend/
│   ├── 📄 package.json
│   ├── 📄 vite.config.ts
│   ├── 📄 tsconfig.json
│   │
│   └── 📂 src/
│       │
│       ├── 📄 app.tsx                 [MODIFIED] Protected routing
│       │   ├── AuthProvider wrapper
│       │   ├── ProtectedRoute component
│       │   └── Route guards
│       │
│       ├── 📂 contexts/
│       │   └── 📄 AuthContext.tsx     [NEW] Auth state management
│       │       ├── useAuth() hook
│       │       ├── AuthProvider
│       │       └── Session handling
│       │
│       ├── 📂 services/
│       │   └── 📄 authService.ts      [NEW] Auth API service
│       │       ├── register()
│       │       ├── login()
│       │       ├── verifyToken()
│       │       └── Token storage
│       │
│       ├── 📂 pages/
│       │   ├── 📄 Login.tsx           [NEW] Login/signup page
│       │   │   ├── Form validation
│       │   │   ├── Mode toggle
│       │   │   └── Error handling
│       │   │
│       │   ├── 📄 home.tsx            [MODIFIED] Home page
│       │   │   └── UserNav component
│       │   │
│       │   ├── 📄 home.css
│       │   └── 📄 Pipeline.tsx
│       │
│       ├── 📂 components/
│       │   ├── 📄 UserNav.tsx         [NEW] User navigation bar
│       │   │   ├── User info display
│       │   │   └── Logout button
│       │   │
│       │   ├── 📄 QCSummary.tsx
│       │   └── 📂 ui/
│       │       ├── badge.tsx
│       │       ├── button.tsx
│       │       ├── card.tsx
│       │       ├── input.tsx
│       │       ├── label.tsx
│       │       └── select.tsx
│       │
│       ├── 📂 lib/
│       │   └── utils.ts
│       │
│       ├── 📂 assets/
│       ├── 📄 index.css
│       ├── 📄 main.tsx
│       └── 📄 api.ts
│
├── 📂 public/
├── 🔐 users.db                        [AUTO-CREATED] SQLite database
│
└── 📄 README.md
```

## Component Relationship Diagram

```
Frontend Flow:
===============

App (app.tsx)
  ├── AuthProvider (AuthContext)
  │   ├── useAuth() - provides auth state
  │   └── Automatic token verification on load
  │
  ├── Route: /login → Login Page
  │   ├── Sign Up Form
  │   ├── Sign In Form
  │   └── authService.register/login
  │       └── Sends to backend /auth/register or /auth/login
  │
  ├── ProtectedRoute → Home Page
  │   ├── UserNav (displays user info)
  │   └── Navigation component
  │
  └── ProtectedRoute → Pipeline Page
      ├── UserNav (displays user info)
      └── PipelineApp component


Backend Flow:
==============

FastAPI (api.py)
  ├── Database (SQLite via SQLAlchemy)
  │   └── User Model (email, username, password_hash, timestamps)
  │
  ├── Auth Module (auth.py)
  │   ├── hash_password() - bcrypt
  │   ├── verify_password() - bcrypt check
  │   ├── create_access_token() - JWT
  │   └── verify_token() - JWT decode
  │
  ├── POST /auth/register
  │   ├── Validate input
  │   ├── Hash password (bcrypt)
  │   ├── Create user in DB
  │   └── Return JWT token
  │
  ├── POST /auth/login
  │   ├── Find user by email
  │   ├── Verify password
  │   ├── Update last_login
  │   └── Return JWT token
  │
  └── POST /auth/verify
      ├── Decode JWT token
      └── Return token validity


Data Storage:
==============

SQLite Database (users.db)
├── Table: users
│   ├── email (PK, Unique)
│   ├── username (Unique)
│   ├── hashed_password
│   ├── created_at (Timestamp)
│   └── last_login (Timestamp)

Browser LocalStorage
├── access_token (JWT)
├── user_email
└── user_username
```

## Authentication Flow

```
User Registration/Login Flow:
============================

1. User Access → http://localhost:5173
   ↓
2. App Loads → AuthProvider wraps app
   ↓
3. useAuth() hook checks for stored token
   ↓
4. No token? → Redirect to /login
   ↓
5. User Fills Form
   ├─ Option A: New user → Click "Sign Up"
   │  ├─ Form validation
   │  ├─ POST /auth/register
   │  ├─ Backend: Hash password, create user
   │  ├─ Backend: Return JWT token
   │  └─ Frontend: Store token, redirect to /
   │
   └─ Option B: Existing user → Click "Sign In"
      ├─ Form validation
      ├─ POST /auth/login
      ├─ Backend: Verify password
      ├─ Backend: Return JWT token
      └─ Frontend: Store token, redirect to /

6. Authenticated User Access Pipeline
   ├─ All pages show UserNav component
   ├─ UserNav displays username & email
   └─ Logout button clears token & redirects
```

## File Dependencies

```
Key Dependencies:

Backend:
--------
api.py
  ├── imports: auth (password, token handling)
  ├── imports: database (User model, session)
  └── uses: FastAPI, SQLAlchemy, PyJWT, bcrypt

auth.py
  ├── imports: jwt, bcrypt, datetime
  └── uses: Python standard library

database.py
  ├── imports: sqlalchemy
  └── creates: SQLite database connection


Frontend:
---------
app.tsx
  ├── imports: AuthContext (AuthProvider)
  ├── imports: Login page
  ├── imports: Home, PipelineApp pages
  └── uses: react-router-dom, React 19

contexts/AuthContext.tsx
  ├── imports: authService
  ├── imports: React hooks
  └── uses: localStorage API

services/authService.ts
  ├── imports: axios
  └── uses: API calls to backend

pages/Login.tsx
  ├── imports: authService
  ├── imports: UI components
  └── uses: React Router navigation

components/UserNav.tsx
  ├── imports: useAuth hook
  ├── imports: UI components
  └── uses: React Router navigation
```

## Important Notes

⚠️ **Before Production:**
- [ ] Change `SECRET_KEY` in `.env`
- [ ] Configure CORS properly
- [ ] Use PostgreSQL instead of SQLite
- [ ] Add HTTPS/SSL certificates
- [ ] Set up regular database backups
- [ ] Configure environment variables properly

✅ **Features Included:**
- User registration with validation
- User login with password verification
- JWT-based session management
- Automatic session restoration on page reload
- Protected routes
- User information display
- Logout functionality
- SQLite database for persistence
- Bcrypt password hashing
- Error handling and user feedback
