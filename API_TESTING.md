# API Testing Examples

Use these examples to test the authentication endpoints with tools like:
- cURL (command line)
- Postman
- VS Code REST Client extension
- Thunder Client

## Base URL

```
http://localhost:8000
```

## Register User

### cURL
```bash
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johnDoe",
    "password": "SecurePass123"
  }'
```

### Response (Success - 200)
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "email": "user@example.com",
  "username": "johnDoe"
}
```

### Response (Error - 400)
```json
{
  "detail": "Email or username already registered"
}
```

---

## Login User

### cURL
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
```

### Response (Success - 200)
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "email": "user@example.com",
  "username": "johnDoe"
}
```

### Response (Error - 401)
```json
{
  "detail": "Invalid email or password"
}
```

---

## Verify Token

### cURL
```bash
curl -X POST http://localhost:8000/auth/verify \
  -d "token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
```

### Response (Valid Token - 200)
```json
{
  "valid": true,
  "email": "user@example.com"
}
```

### Response (Invalid Token - 200)
```json
{
  "valid": false
}
```

---

## Test Cases

### Test 1: Register New User
```bash
# Register
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "username": "testuser1",
    "password": "password123"
  }'

# Expected: Token received
```

### Test 2: Duplicate Email
```bash
# Try to register same email
curl -X POST http://localhost:8000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "username": "testuser2",
    "password": "password123"
  }'

# Expected: 400 error - "Email or username already registered"
```

### Test 3: Login with Correct Credentials
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "password": "password123"
  }'

# Expected: Token received
```

### Test 4: Login with Wrong Password
```bash
curl -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "password": "wrongpassword"
  }'

# Expected: 401 error - "Invalid email or password"
```

### Test 5: Verify Valid Token
```bash
# First login to get token
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test1@example.com",
    "password": "password123"
  }' | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)

# Then verify it
curl -X POST http://localhost:8000/auth/verify \
  -d "token=$TOKEN"

# Expected: {"valid": true, "email": "test1@example.com"}
```

---

## Frontend Testing

### Test Registration
```typescript
// In browser console
const authService = require('./services/authService');

authService.authService.register(
  'frontend@example.com',
  'frontenduser',
  'password123'
).then(res => console.log('Registered:', res))
  .catch(err => console.error('Error:', err));
```

### Test Login
```typescript
authService.authService.login(
  'frontend@example.com',
  'password123'
).then(res => {
  console.log('Logged in:', res);
  authService.authService.saveToken(res.access_token, res.email, res.username);
})
.catch(err => console.error('Error:', err));
```

### Test Token Verification
```typescript
const token = authService.authService.getStoredToken();
authService.authService.verifyToken(token)
  .then(res => console.log('Token valid:', res))
  .catch(err => console.error('Error:', err));
```

### Test Logout
```typescript
authService.authService.clearToken();
console.log('Token cleared');
```

---

## Postman Collection

Import this JSON into Postman:

```json
{
  "info": {
    "name": "Quality Control Pipeline Auth",
    "description": "Authentication API endpoints"
  },
  "item": [
    {
      "name": "Register",
      "request": {
        "method": "POST",
        "url": "http://localhost:8000/auth/register",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"email\": \"user@example.com\", \"username\": \"username\", \"password\": \"password123\"}"
        }
      }
    },
    {
      "name": "Login",
      "request": {
        "method": "POST",
        "url": "http://localhost:8000/auth/login",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\"email\": \"user@example.com\", \"password\": \"password123\"}"
        }
      }
    },
    {
      "name": "Verify Token",
      "request": {
        "method": "POST",
        "url": "http://localhost:8000/auth/verify",
        "body": {
          "mode": "urlencoded",
          "urlencoded": [
            {
              "key": "token",
              "value": "<your-token-here>"
            }
          ]
        }
      }
    }
  ]
}
```

---

## Expected Database State

After running tests, check `users.db`:

```python
# Python script to check database
from database import User, SessionLocal

db = SessionLocal()
users = db.query(User).all()
for user in users:
    print(f"Email: {user.email}")
    print(f"Username: {user.username}")
    print(f"Created: {user.created_at}")
    print(f"Last Login: {user.last_login}")
    print("---")
```

---

## Debugging

### Enable Debug Logs in FastAPI
```python
# In api.py - add logging
import logging

logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

@app.post("/auth/login")
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    logger.debug(f"Login attempt for: {user_data.email}")
    # ... rest of code
```

### Check Token Content
```python
import jwt
token = "your-token-here"
decoded = jwt.decode(token, options={"verify_signature": False})
print(decoded)
```

### View Database Records
```bash
# Using sqlite3 CLI
sqlite3 users.db
sqlite> SELECT email, username, created_at FROM users;
sqlite> .quit
```
