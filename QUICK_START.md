# Quick Start Guide - Authentication System

## ⚡ 5-Minute Setup

### Step 1: Backend Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "SECRET_KEY=dev-key-change-in-production" > .env

# Run backend
python api.py
```

Backend will be available at `http://localhost:8000`

### Step 2: Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

Frontend will be available at `http://localhost:5173`

### Step 3: Access Application

Open browser to `http://localhost:5173` → You'll see the login page

## 🔐 Testing

### Create Account
1. Click "Sign up"
2. Enter:
   - Email: `test@example.com`
   - Username: `testuser`
   - Password: `password123`
3. Click "Create Account"

### Login
1. Enter same credentials
2. Click "Sign In"

### Verify Session
1. Refresh page → Should remain logged in
2. Click "Logout" → Redirected to login page

## 📁 Key Files

| File | Purpose |
|------|---------|
| `auth.py` | Password hashing & JWT tokens |
| `database.py` | User database model |
| `api.py` | Authentication endpoints |
| `frontend/src/contexts/AuthContext.tsx` | Auth state management |
| `frontend/src/pages/Login.tsx` | Login/signup UI |
| `frontend/src/components/UserNav.tsx` | User info & logout button |

## 🔗 API Endpoints

```
POST /auth/register  → Create new account
POST /auth/login     → Login user
POST /auth/verify    → Verify token
```

## 💾 Data Storage

- **Database**: `users.db` (SQLite)
- **Browser**: localStorage (tokens)

## 🚀 Production Deployment

Before deploying:

1. Change `SECRET_KEY` in `.env` to random string
2. Set `VITE_API_URL` in frontend to backend URL
3. Configure CORS origins
4. Use PostgreSQL instead of SQLite
5. Enable HTTPS/SSL

See [AUTH_SETUP.md](AUTH_SETUP.md) for full production checklist.

## ❓ Troubleshooting

**Backend won't start?**
- Check if port 8000 is free: `lsof -i :8000` (Mac/Linux) or `netstat -ano | findstr :8000` (Windows)
- Ensure all dependencies installed: `pip install -r requirements.txt`

**Frontend shows login loop?**
- Check browser console (F12) for errors
- Verify backend is running: `http://localhost:8000`
- Clear browser cookies: Settings → Privacy → Clear browsing data

**Can't register/login?**
- Check database file exists: `ls -la users.db`
- Check backend logs for errors
- Verify email format is valid

## 📚 Full Documentation

See [AUTH_SETUP.md](AUTH_SETUP.md) for complete documentation including:
- Architecture explanation
- Full API docs with examples
- User data security details
- Advanced configuration
- Production deployment guide
