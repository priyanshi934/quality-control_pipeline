# Authentication & User Management System

This document explains how the user authentication and data storage system works in the Quality Control Pipeline.

## Overview

The system implements JWT (JSON Web Token) based authentication with the following components:

### Backend Architecture

#### 1. **auth.py** - Authentication Module
- Password hashing using `bcrypt` for secure password storage
- JWT token creation and verification
- Token expiration management (24 hours default)

#### 2. **database.py** - Database Models
- SQLite database for user storage
- `User` model with fields:
  - `email` (primary key, unique)
  - `username` (unique)
  - `hashed_password` (bcrypt hashed)
  - `created_at` (timestamp)
  - `last_login` (timestamp)

#### 3. **api.py** - Authentication Endpoints
Added three new endpoints:
- `POST /auth/register` - Register new users
- `POST /auth/login` - Login existing users
- `POST /auth/verify` - Verify JWT tokens

### Frontend Architecture

#### 1. **AuthContext.tsx** - State Management
- Manages user authentication state globally
- `useAuth()` hook for accessing auth state in components
- Automatic token verification on app load
- Session persistence via localStorage

#### 2. **authService.ts** - API Service
- Handles API calls to backend authentication endpoints
- Token storage and retrieval
- User data caching

#### 3. **Login.tsx** - Login/Register UI
- Toggle between login and registration modes
- Form validation
- Error handling
- Responsive design with Tailwind CSS

#### 4. **UserNav.tsx** - User Navigation
- Displays current user info
- Logout button

#### 5. **app.tsx** - Protected Routes
- `ProtectedRoute` component for route protection
- Redirects unauthenticated users to login
- Loading state during authentication check

## Setup Instructions

### Backend Setup

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set environment variables:**
   Create a `.env` file in the project root:
   ```
   SECRET_KEY=your-secret-key-here-change-in-production
   ```

3. **Initialize database:**
   The database is automatically created on first run. SQLite database file will be created at `./users.db`

4. **Run the backend:**
   ```bash
   python api.py
   ```
   or
   ```bash
   uvicorn api:app --reload --host 0.0.0.0 --port 8000
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

## User Data Storage

### What's Stored
- **Email**: User email address (unique identifier)
- **Username**: Display name (unique)
- **Password**: Bcrypt hashed (never stored in plain text)
- **Created At**: Account creation timestamp
- **Last Login**: Most recent login timestamp

### Where It's Stored
- **SQLite Database**: `./users.db` (local file)
- **Local Storage** (Frontend): JWT token, user email, and username

### Data Security
- Passwords are hashed with bcrypt (salt rounds: default)
- JWT tokens expire after 24 hours
- Token verification happens automatically
- HTTPS recommended for production

## API Documentation

### Register User
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "username": "username",
  "password": "password123"
}

Response:
{
  "access_token": "eyJ0eXAi...",
  "token_type": "bearer",
  "email": "user@example.com",
  "username": "username"
}
```

### Login User
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "access_token": "eyJ0eXAi...",
  "token_type": "bearer",
  "email": "user@example.com",
  "username": "username"
}
```

### Verify Token
```
POST /auth/verify
Content-Type: application/x-www-form-urlencoded

token=eyJ0eXAi...

Response:
{
  "valid": true,
  "email": "user@example.com"
}
```

## User Flow

1. **New User**: Clicks "Sign up" → Fills registration form → Account created → Redirected to pipeline
2. **Existing User**: Clicks "Sign in" → Enters credentials → Token received → Redirected to pipeline
3. **Session**: Token stored in localStorage → Auto-verified on app reload
4. **Logout**: Clears token from storage → Redirected to login page

## Production Deployment Checklist

- [ ] Change `SECRET_KEY` to a strong, random value
- [ ] Set up proper database (PostgreSQL recommended instead of SQLite)
- [ ] Enable HTTPS/SSL certificates
- [ ] Configure CORS properly (don't use `allow_origins=["*"]` in production)
- [ ] Add rate limiting to auth endpoints
- [ ] Implement refresh tokens for long sessions
- [ ] Set up database backups
- [ ] Monitor and log authentication events
- [ ] Use environment variables for sensitive data
- [ ] Enable CSRF protection

## Extending the System

### Add Additional User Fields
Edit `database.py` and add fields to the `User` model:
```python
class User(Base):
    # ... existing fields
    phone_number = Column(String, nullable=True)
    bio = Column(String, nullable=True)
```

### Add User Profile Endpoints
Create endpoints in `api.py` to get/update user profiles:
```python
@app.get("/users/{email}")
def get_user_profile(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(404, "User not found")
    return user

@app.put("/users/{email}")
def update_user_profile(email: str, updates: dict, db: Session = Depends(get_db)):
    # Update logic here
    pass
```

### Add Email Verification
Implement email verification during registration for added security.

### Add Password Reset
Implement password reset functionality via email.

## Troubleshooting

### Backend Issues

**Database Error: "database is locked"**
- SQLite has limited concurrent access. For production, use PostgreSQL.

**Token verification fails**
- Check that `SECRET_KEY` is the same in `.env`
- Verify token hasn't expired (24 hour default)

**CORS errors**
- Ensure frontend URL is in CORS allowed origins (or use `*` for development)

### Frontend Issues

**Login redirect loop**
- Check browser console for errors
- Verify backend is running and accessible
- Check `VITE_API_URL` environment variable

**Token not persisting**
- Check browser localStorage is enabled
- Clear browser cache and try again

## Additional Notes

- Database file (`users.db`) should be backed up regularly
- Consider implementing audit logging for security events
- JWT tokens can be refreshed for longer sessions
- Consider implementing two-factor authentication for production
