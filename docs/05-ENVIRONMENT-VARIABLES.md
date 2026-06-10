# Environment Variables

## Backend (`.env`)

Create a `.env` file in the `backend/` directory:

```env
# ─── Server ───────────────────────────────────────────────
NODE_ENV=development
PORT=4000
API_VERSION=v1
FRONTEND_URL=http://localhost:3000

# ─── Database ─────────────────────────────────────────────
DATABASE_URL=mongodb://localhost:27017/billingbee

# ─── JWT ──────────────────────────────────────────────────
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=30d

# ─── Google OAuth ─────────────────────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/v1/auth/google/callback

# ─── SMTP (Email) ─────────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=BillingBee <noreply@billingbee.com>

# ─── Discord Notifications ────────────────────────────────
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
DISCORD_NOTIFICATIONS_ENABLED=false

# ─── File Uploads ─────────────────────────────────────────
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# ─── OpenAI (AI Invoice Parsing) ──────────────────────────
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini

# ─── Rate Limiting ────────────────────────────────────────
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Frontend (`.env.local`)

Create a `.env.local` file in the `frontend/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

---

## Variable Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `4000` | Backend server port |
| `API_VERSION` | No | `v1` | API version prefix |
| `FRONTEND_URL` | No | `http://localhost:3000` | Frontend URL (CORS) |
| `DATABASE_URL` | **Yes** | — | MongoDB connection string |
| `JWT_SECRET` | **Yes** | — | JWT signing secret |
| `JWT_EXPIRES_IN` | No | `7d` | JWT expiry duration |
| `JWT_REFRESH_SECRET` | No | — | Refresh token secret |
| `JWT_REFRESH_EXPIRES_IN` | No | `30d` | Refresh token expiry |
| `GOOGLE_CLIENT_ID` | No | — | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | No | — | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | No | — | Google OAuth callback URL |
| `SMTP_HOST` | No | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | No | `587` | SMTP server port |
| `SMTP_USER` | No | — | SMTP username/email |
| `SMTP_PASS` | No | — | SMTP password/app password |
| `SMTP_FROM` | No | — | Default sender address |
| `DISCORD_WEBHOOK_URL` | No | — | Discord webhook for notifications |
| `DISCORD_NOTIFICATIONS_ENABLED` | No | `false` | Enable Discord notifications |
| `UPLOAD_DIR` | No | `./uploads` | File upload directory |
| `MAX_FILE_SIZE` | No | `10485760` | Max file size (10MB) |
| `OPENAI_API_KEY` | No | — | OpenAI API key for AI invoice parsing |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | OpenAI API base URL (supports proxies) |
| `OPENAI_MODEL` | No | `gpt-4o-mini` | OpenAI model for AI features |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window (15min) |
| `RATE_LIMIT_MAX_REQUESTS` | No | `100` | Max requests per window |
| `NEXT_PUBLIC_API_URL` | **Yes** | — | Backend API URL (frontend) |

---

## Production Checklist

- [ ] Change `JWT_SECRET` to a strong random string
- [ ] Change `JWT_REFRESH_SECRET` to a different strong string
- [ ] Set `NODE_ENV=production`
- [ ] Use a production MongoDB instance (MongoDB Atlas)
- [ ] Configure real SMTP credentials
- [ ] Set `FRONTEND_URL` to production domain
- [ ] Set `GOOGLE_CALLBACK_URL` to production domain
- [ ] Enable HTTPS
- [ ] Set appropriate `RATE_LIMIT` values
- [ ] Configure `DISCORD_WEBHOOK_URL` for monitoring
- [ ] Set `MAX_FILE_SIZE` as needed
