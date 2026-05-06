# Render Deployment Guide

This guide provides step-by-step instructions for deploying the Authentication Microservice to Render.

## Option 1: Docker Container Deployment (Recommended)

### Prerequisites
- Render account (free tier available)
- GitHub repository with your code
- Neon.tech PostgreSQL database
- Google OAuth credentials (optional)

### Step 1: Prepare Your Environment

1. **Set up Neon Database:**
   - Create a new Neon project at https://neon.tech
   - Copy the connection string with pooling: `postgresql://username:password@your-neon-hostname.neon.tech/dbname?sslmode=require&pgbouncer=true`

2. **Set up Google OAuth (Optional):**
   - Go to Google Cloud Console
   - Create a new project or select existing one
   - Enable Google+ API
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `https://your-app-name.onrender.com/auth/google/callback`

### Step 2: Deploy to Render

1. **Create Web Service:**
   - Go to Render Dashboard → New → Web Service
   - Connect your GitHub repository
   - Select the repository branch

2. **Configure Docker Settings:**
   - **Runtime**: Docker
   - **Docker Context**: `.`
   - **Dockerfile Path**: `Dockerfile`

3. **Environment Variables:**
   ```
   DATABASE_URL=postgresql://username:password@your-neon-hostname.neon.tech/dbname?sslmode=require&pgbouncer=true
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
   JWT_EXPIRY=15m
   JWT_REFRESH_EXPIRY=7d
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_CALLBACK_URL=https://your-app-name.onrender.com/auth/google/callback
   PORT=3000
   NODE_ENV=production
   THROTTLE_TTL=60
   THROTTLE_LIMIT=10
   FRONTEND_URL=https://your-frontend-domain.com
   ```

4. **Advanced Settings:**
   - **Health Check Path**: `/api/health`
   - **Auto-Deploy**: Yes (for automatic updates)

### Step 3: Database Migration

After deployment, you'll need to run database migrations:

1. **SSH into your Render service:**
   ```bash
   ssh -i your-private-key render@your-app-name.onrender.com
   ```

2. **Run Prisma migrations:**
   ```bash
   cd /app
   npx prisma migrate deploy
   npx prisma generate
   ```

Alternatively, add a build script to your package.json:
```json
{
  "scripts": {
    "build": "nest build && npx prisma generate",
    "postbuild": "npx prisma migrate deploy"
  }
}
```

## Option 2: Node.js Direct Deployment

### Step 1: Configure Build Settings

1. **Create Web Service:**
   - Runtime: Node
   - Build Command: `npm install && npm run build && npx prisma generate`
   - Start Command: `npm run start:prod`

2. **Add to package.json:**
   ```json
   {
     "scripts": {
       "start:prod": "node dist/main"
     }
   }
   ```

### Step 2: Environment Variables

Same as Docker deployment, but also add:
```
NPM_CONFIG_PRODUCTION=false
```

## Post-Deployment Setup

### 1. Verify Health Check
Visit: `https://your-app-name.onrender.com/api/health`
Should return: `{"status":"ok","message":"I am awake!"}`

### 2. Test Authentication Endpoints
- Register: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Health: `GET /api/health`

### 3. Set Up Cron Job (Optional)
To keep your service awake on Render's free tier:
1. Go to Render Dashboard → New → Cron Job
2. Set schedule: `*/10 * * * *` (every 10 minutes)
3. URL: `https://your-app-name.onrender.com/api/health`
4. HTTP Method: GET

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `JWT_SECRET` | Yes | Secret for JWT access tokens |
| `JWT_REFRESH_SECRET` | Yes | Secret for JWT refresh tokens |
| `JWT_EXPIRY` | No | Access token expiry (default: 15m) |
| `JWT_REFRESH_EXPIRY` | No | Refresh token expiry (default: 7d) |
| `GOOGLE_CLIENT_ID` | Optional | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Optional | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Optional | Google OAuth callback URL |
| `PORT` | No | Port number (default: 3000) |
| `NODE_ENV` | No | Environment (default: production) |
| `THROTTLE_TTL` | No | Rate limit TTL in seconds (default: 60) |
| `THROTTLE_LIMIT` | No | Rate limit requests per TTL (default: 10) |
| `FRONTEND_URL` | No | Frontend URL for OAuth redirects |

## Troubleshooting

### Common Issues

1. **Database Connection Errors:**
   - Verify DATABASE_URL format
   - Ensure Neon database is active
   - Check if pgbouncer=true is included

2. **Build Failures:**
   - Check Docker logs in Render dashboard
   - Verify all dependencies are in package.json
   - Ensure Prisma schema is valid

3. **Runtime Errors:**
   - Check environment variables are set correctly
   - Verify JWT secrets are strong and unique
   - Ensure Google OAuth URLs match exactly

### Monitoring

- **Logs**: Available in Render dashboard
- **Metrics**: Built-in Render metrics
- **Health Checks**: Automatic based on `/api/health` endpoint

## Security Best Practices

1. **Use strong, unique JWT secrets**
2. **Enable SSL (automatic on Render)**
3. **Set up proper CORS origins**
4. **Use environment variables for all secrets**
5. **Regularly update dependencies**
6. **Monitor logs for suspicious activity**

## Scaling

- **Free Tier**: Limited resources, suitable for development
- **Starter Tier**: Better performance for small applications
- **Standard Tier**: Production-ready with auto-scaling

## API Endpoints

After deployment, your API will be available at:
`https://your-app-name.onrender.com/api/`

### Authentication Endpoints:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh tokens
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify-email` - Email verification
- `POST /api/auth/forgot-password` - Forgot password
- `POST /api/auth/reset-password` - Reset password
- `DELETE /api/auth/me` - Delete account
- `GET /api/auth/google` - Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback

### Health Check:
- `GET /api/health` - Service health check
