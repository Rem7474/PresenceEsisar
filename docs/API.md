# API Documentation

## Overview

Backend API endpoints for Attendance Sheet Management.

Base URL: `http://localhost:3000` (development) or `https://your-domain.com` (production)

---

## Endpoints

### 1. Upload & Send Email

**POST** `/api/upload`

Upload an attendance sheet and send it via email.

#### Request

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@attendance.pdf" \
  -F "user={\"name\":\"Jean Dupont\",\"email\":\"jean@esisar.fr\",\"password\":\"dGVzdA==\",\"week\":42}"
```

#### Form Data

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | Image (JPEG/PNG/WebP) or PDF |
| `user` | JSON | Yes | User data object |

#### User Object

```json
{
  "name": "Jean Dupont",
  "email": "jean.dupont@esisar.grenoble-inp.fr",
  "password": "dGVzdA==",
  "week": 42
}
```

**Note:** Password must be Base64 encoded (done automatically by frontend)

#### Response Success (200)

```json
{
  "success": true,
  "message": "Email sent successfully"
}
```

#### Response Errors

**400 - Bad Request**
```json
{
  "error": "No file provided"
}
```

**400 - Invalid File Type**
```json
{
  "error": "Invalid file type"
}
```

**400 - Missing User Data**
```json
{
  "error": "Invalid user data"
}
```

**413 - File Too Large**
```json
{
  "error": "File size exceeds limit"
}
```

**500 - Server Error**
```json
{
  "error": "Authentication failed - incorrect password"
}
```

#### Possible SMTP Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `EAUTH` | Invalid credentials | Check email/password |
| `EHOSTUNREACH` | SMTP server unreachable | Check network connectivity |
| `ETIMEDOUT` | Connection timeout | Verify SMTP server address |
| `ECONNREFUSED` | Connection refused | SMTP server down |

---

### 2. Health Check

**GET** `/api/health`

Server health status endpoint.

#### Response (200)

```json
{
  "status": "ok",
  "timestamp": "2024-09-20T10:30:45.123Z"
}
```

---

## Frontend Integration

### JavaScript Fetch Example

```javascript
const uploadFile = async (file, userData) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const userJson = {
    name: userData.name,
    email: userData.email,
    password: btoa(userData.password), // Base64 encode
    week: getCurrentWeekNumber()
  };
  
  formData.append('user', JSON.stringify(userJson));

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (response.ok) {
      console.log('✅ Success:', result.message);
    } else {
      console.error('❌ Error:', result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

---

## Rate Limiting

Currently no rate limiting implemented. 

**Recommended for production:**
- Limit: 10 requests per hour per IP
- Implement using `express-rate-limit` middleware

---

## CORS

**Current Configuration:**
```javascript
cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
})
```

**Update for production with your domain.**

---

## Security Headers

**Recommended additions:**
```javascript
// Security headers middleware
app.use(helmet());
app.disable('x-powered-by');

// Content Security Policy
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

---

## File Upload Limits

| Property | Value |
|----------|-------|
| Max Size | 10 MB |
| Allowed Types | image/jpeg, image/png, image/webp, application/pdf |
| Storage | Memory (multipart/form-data) |

---

## Email Configuration

| Setting | Value |
|---------|-------|
| SMTP Host | smtps.esisar.grenoble-inp.fr |
| SMTP Port | 587 |
| Security | STARTTLS |
| Recipient | apprentissage@esisar.grenoble-inp.fr |
| Subject Template | `Attestation de Présence - [filename]` |

---

## Testing the API

### Using cURL

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test file upload (with actual file)
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test.pdf" \
  -F "user={\"name\":\"Test User\",\"email\":\"test@esisar.fr\",\"password\":\"dGVzdA==\",\"week\":42}"
```

### Using Postman

1. Create POST request to `http://localhost:3000/api/upload`
2. Select "Body" → "form-data"
3. Add fields:
   - `file` (File type) → Select your test image/PDF
   - `user` (Text) → Paste JSON user object
4. Click "Send"

---

## Error Handling

The API always returns JSON with appropriate HTTP status codes:

- **200** - Success
- **400** - Bad Request (invalid data)
- **413** - Payload Too Large (file exceeds limit)
- **500** - Internal Server Error

All error responses include an `error` field with description.

---

## Troubleshooting API

### Cannot connect to backend

```bash
# Check if backend is running
curl -i http://localhost:3000/api/health

# Check for port conflicts
lsof -i :3000
```

### Email sending fails

```bash
# Test SMTP connectivity
telnet smtps.esisar.grenoble-inp.fr 587

# Check backend logs
npm run dev  # See console output
```

### CORS errors

Check `FRONTEND_URL` in `.env` matches your frontend origin.

```bash
# Example .env
FRONTEND_URL=http://localhost:5173
```

---

## API Versioning

Current version: **v1** (no explicit version prefix yet)

Future: `/api/v2/upload` for backward compatibility

---

## Rate Limiting Recommendation

Add to `server.js`:

```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many upload attempts from this IP, please try again later'
});

app.post('/api/upload', limiter, upload.single('file'), async (req, res) => {
  // ... existing code
});
```

Install: `npm install express-rate-limit`

---

**Last Updated:** 2024-09-20  
**API Version:** 1.0.0
