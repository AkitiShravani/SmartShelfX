# Registration Endpoint - Status Codes & Error Reference

## Status Code Reference

### Success Response

**Status: 201 Created** ✅
```json
{
  "success": true,
  "message": "User registered successfully",
  "userId": 123
}
```
- Registration successful
- User created in database
- Can now login

---

### Client Errors (4xx)

#### Status: 400 Bad Request
**Cause:** Validation failed

```json
{
  "success": false,
  "message": "Validation error",
  "errors": [
    {
      "message": "Password must be at least 8 characters",
      "value": "weak"
    },
    {
      "message": "Invalid email format",
      "value": "notanemail"
    }
  ]
}
```

**Validation Rules:**
- Name: Required, 2-100 characters
- Username: Required (not enforced by backend currently)
- Email: Required, valid email format
- Password: 8+ chars, uppercase, lowercase, number, @/#/_
- Role: MANAGER or VENDOR

**Frontend Action:** Show validation errors to user

---

#### Status: 409 Conflict
**Cause:** Email or username already exists

```json
{
  "success": false,
  "message": "Email is already registered"
}
```

OR

```json
{
  "success": false,
  "message": "Username is already taken"
}
```

**Frontend Action:** Show conflict message, suggest choosing different email/username

---

### Server Errors (5xx)

#### Status: 500 Internal Server Error
**Cause:** Unhandled exception in backend

```json
{
  "success": false,
  "message": "Internal server error",
  "error": "..."
}
```

**Possible Causes:**
- Database connection error
- bcrypt hashing error
- Unexpected exception
- Null pointer exception
- Unhandled promise rejection

**Frontend Action:** Show generic "Server error. Try again later."

---

#### Status: 503 Service Unavailable
**Cause:** Backend not running or database unreachable

```
Cannot connect to server
```

**Frontend Action:** Show "Service unavailable. Please try again later."

---

### Network Errors

#### Status: 0 Unknown Error ❌
**The Error We Fixed!**

```
Http failure response: 0 Unknown Error
```

**Root Causes (Before Fix):**
- CORS blocked request
- CSP blocked request
- Network timeout
- SSL certificate error
- Firewall blocking request

**Root Causes (After Fix - Should Not Happen):**
- Browser offline
- Network connection lost
- Server not responding
- Request timeout (> 30 seconds)
- Firewall blocking traffic

**Frontend Action:** Show "Network error: Unable to reach server"

---

#### Status: (empty/null) - Network Error
**Cause:** No connection to server

**Possible Causes:**
- Server not running
- Invalid URL
- DNS resolution failed
- Firewall blocking
- VPN/Proxy issues

**Frontend Action:** Same as Status 0

---

## Error Response Format

All backend error responses follow this format:

```typescript
{
  success: false,          // Always false on error
  message: "User message", // Shown to user
  error?: "...",          // Optional: error details (if 5xx)
  errors?: [              // Optional: validation errors (if 400)
    {
      message: "...",
      value: "..."
    }
  ]
}
```

---

## CORS Error Scenarios

### Scenario 1: CORS Preflight Blocked
```
Request: OPTIONS /api/auth/register
Response: 403 Forbidden (or no response)
Headers: No Access-Control-Allow-* headers
Result: Status 0 error in browser
```

**Fix:** Add origin to ALLOWED_ORIGINS

---

### Scenario 2: CORS Origin Mismatch
```
Request from: https://frontend-prod.up.railway.app
Allowed origins: https://frontend-dev.up.railway.app
Response: 403 Forbidden
Result: Status 0 error
```

**Fix:** Ensure exact URL match (including https://)

---

### Scenario 3: CORS Credentials Not Included
```
Request: POST (without credentials)
Response: Successful
Result: JavaScript cannot access response (blocked by browser)
Status: 0 error
```

**Fix:** Ensure credentials: true in CORS options

---

## CSP Error Scenarios

### Scenario 1: connectSrc Blocks Domain
```
Browser: connectSrc policy blocks https://api.example.com
JavaScript: Cannot connect
Result: Status 0 error
```

**Fix:** Add domain to CSP connectSrc directive

---

### Scenario 2: Mixed Content (HTTP from HTTPS)
```
Frontend: https://app.example.com
API: http://api.example.com (not HTTPS)
Browser: Blocks mixed content
Result: Status 0 error
```

**Fix:** Ensure API uses HTTPS in production

---

## Request/Response Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│ 1. User Fills Form                                  │
│    - Name, Username, Email, Password                │
└─────────────┬───────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────┐
│ 2. Frontend Validation (Client-side)                │
│    - Check required fields                          │
│    - Check password strength                        │
│    - Check email format                             │
│    [AuthService] logs: URL and payload              │
└─────────────┬───────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────┐
│ 3. CORS Preflight (OPTIONS request)                 │
│    Browser checks CORS policy                       │
│    Server returns CORS headers                      │
│    ✅ Status 200 OK (if configured correctly)       │
│    ❌ Status 0 Error (if CORS blocked)              │
└─────────────┬───────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────┐
│ 4. Browser CSP Check                                │
│    Check if connectSrc allows domain                │
│    ✅ Allowed (if in CSP policy)                    │
│    ❌ Blocked (if not in CSP policy)                │
└─────────────┬───────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────┐
│ 5. Actual POST Request                              │
│    POST /api/auth/register                          │
│    Headers: Content-Type, Authorization, etc.       │
│    Body: { name, username, email, password, ... }   │
└─────────────┬───────────────────────────────────────┘
              │
┌─────────────▼───────────────────────────────────────┐
│ 6. Backend Processing                               │
│    - Validation middleware checks input             │
│    - Database checks for duplicate email/username   │
│    - Hash password with bcrypt                      │
│    - Create user record                             │
└─────────────┬───────────────────────────────────────┘
              │
        ┌─────┴──────────────────────┐
        │                            │
   ┌────▼───────────────┐    ┌───────▼──────────────┐
   │ Success            │    │ Error                │
   │ Status: 201        │    │ Status: 400/409/500  │
   │ Body:              │    │ Body:                │
   │ {                  │    │ {                    │
   │   success: true,   │    │   success: false,    │
   │   userId: 123      │    │   message: "..."     │
   │ }                  │    │ }                    │
   └─────┬──────────────┘    └─────┬────────────────┘
         │                         │
    ┌────▼─────────────┐      ┌────▼──────────────┐
    │ Frontend Success │      │ Frontend Error    │
    │ Handler          │      │ Handler           │
    │ - Log response   │      │ - Log error       │
    │ - Show toast     │      │ - Show message    │
    │ - Navigate away  │      │ - Show in UI      │
    └──────────────────┘      └───────────────────┘
```

---

## Expected Console Logs

### Success Path
```
[AuthService] Registering user at: http://localhost:3000/api/auth/register
[AuthService] Payload: { name: "Test", username: "test123", email: "test@example.com", ... }
[RegisterComponent] Submitting registration form
[AuthService] Registration successful: { success: true, userId: 123 }
```

### Validation Error Path
```
[AuthService] Registering user at: http://localhost:3000/api/auth/register
[AuthService] Payload: { name: "", username: "test", email: "invalid", ... }
[RegisterComponent] Submitting registration form
[RegisterComponent] Registration error: { status: 400, statusText: "Bad Request", ... }
[RegisterComponent] Validation error: Validation error
```

### Conflict Error Path
```
[AuthService] Registering user at: http://localhost:3000/api/auth/register
[AuthService] Payload: { name: "Test", email: "existing@example.com", ... }
[RegisterComponent] Submitting registration form
[RegisterComponent] Registration error: { status: 409, statusText: "Conflict", ... }
[RegisterComponent] Conflict error: Email is already registered
```

### Network Error Path (Status 0)
```
[AuthService] Registering user at: http://localhost:3000/api/auth/register
[AuthService] Payload: { ... }
[RegisterComponent] Submitting registration form
[RegisterComponent] Registration error: { status: 0, statusText: "", ... }
[RegisterComponent] ⚠️  Status 0 Network Error detected
[RegisterComponent] Possible causes:
  - CORS blocked by server
  - Network timeout
  - SSL/TLS certificate issue
  - Request blocked by firewall/proxy
```

---

## Debugging Decision Tree

```
Registration fails
       │
       └──► Check DevTools Console
            │
            ├──► Status 0 Error?
            │    └──► Check Network tab → CORS headers missing?
            │         └──► Check backend CORS configuration
            │         └──► Check ALLOWED_ORIGINS env var
            │
            ├──► Status 400 Error?
            │    └──► Check error message
            │         └──► "Validation error" → Fix form input
            │
            ├──► Status 409 Error?
            │    └──► "Email already exists" → Choose different email
            │
            ├──► Status 500+ Error?
            │    └──► Check backend logs
            │         └──► Check database connection
            │         └──► Check server errors
            │
            └──► No console logs at all?
                 └──► Check if JavaScript is enabled
                 └──► Check if DevTools console is open
                 └──► Hard refresh page (Ctrl+Shift+R)
```

---

## Quick Reference Table

| Scenario | Status | Message | Action |
|----------|--------|---------|--------|
| Success | 201 | Account created | Redirect to login |
| Invalid input | 400 | Validation error | Show form errors |
| Duplicate email | 409 | Email already exists | Choose new email |
| Server error | 500 | Server error | Try again later |
| CORS blocked | 0 | Network error | Check CORS config |
| Timeout | 0 | Network error | Check connection |
| Offline | 0 | Network error | Check internet |
| CSP blocked | 0 | Network error | Check CSP config |

---

## Testing Payloads

### Valid Registration
```json
{
  "name": "John Doe",
  "username": "johndoe123",
  "email": "john@example.com",
  "personal_email": "",
  "password": "Test@123Password",
  "role": "MANAGER"
}
```
Expected: Status 201 ✅

### Invalid Email
```json
{
  "name": "John Doe",
  "username": "johndoe123",
  "email": "notanemail",
  "password": "Test@123Password",
  "role": "MANAGER"
}
```
Expected: Status 400, "Invalid email format"

### Weak Password
```json
{
  "name": "John Doe",
  "username": "johndoe123",
  "email": "john@example.com",
  "password": "weak",
  "role": "MANAGER"
}
```
Expected: Status 400, "Password must be at least 8 characters"

### Missing Name
```json
{
  "name": "",
  "username": "johndoe123",
  "email": "john@example.com",
  "password": "Test@123Password",
  "role": "MANAGER"
}
```
Expected: Status 400, "Name is required"

### Duplicate Email
```json
{
  "name": "Jane Doe",
  "username": "janedoe123",
  "email": "john@example.com",  // Email from previous registration
  "password": "Test@123Password",
  "role": "VENDOR"
}
```
Expected: Status 409, "Email is already registered"

---

**Last Updated:** 2026-06-17
**Version:** 1.0
**Applicable To:** SmartShelfX Registration Endpoint
