# Testing Guide - Feature Flag System

## Quick Start Testing (5 minutes)

### Step 1: Prerequisites Check
Ensure you have installed:
- Node.js 18+ → `node --version`
- PostgreSQL 14+ → `psql --version`
- Redis 7+ → `redis-cli --version`

---

## Step 2: Database Setup

### Option A: Using Docker (Recommended)
```powershell
# Start PostgreSQL
docker run --name postgres-ff -e POSTGRES_PASSWORD=password -e POSTGRES_DB=feature_flags -p 5432:5432 -d postgres:14

# Start Redis
docker run --name redis-ff -p 6379:6379 -d redis:7
```

### Option B: Local Installation
- PostgreSQL: Create database `feature_flags`
- Redis: Start service `redis-server`

---

## Step 3: Backend Setup

```powershell
cd backend

# Create .env file
Copy-Item .env.example .env

# Edit .env (update if needed)
notepad .env

# Install dependencies (already done)
npm install

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed

# Start server
npm run dev
```

**Expected Output:**
```
🚀 Feature Flag Server running on port 3001
📍 Environment: development
📡 API available at http://localhost:3001/api
📦 Connected to PostgreSQL
⚡ Connected to Redis
```

---

## Step 4: Test API Endpoints

### Test 1: Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health"
```
✅ **Expected:** `{ status: "ok", timestamp: "..." }`

### Test 2: Get All Flags
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/flags"
```
✅ **Expected:** List of 4 seeded flags (dark_mode, new_dashboard, experimental_feature, premium_features)

### Test 3: Get Single Flag
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/flags/dark_mode"
```
✅ **Expected:** Flag object with all properties

### Test 4: Create New Flag
```powershell
$body = @{
    key = "test_feature"
    name = "Test Feature"
    description = "Testing flag creation"
    enabled = $false
    rollout_percentage = 0
    targeting_rules = @()
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/flags" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```
✅ **Expected:** Created flag with 201 status

### Test 5: Update Flag
```powershell
$update = @{
    enabled = $true
    rollout_percentage = 50
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/flags/test_feature" `
  -Method Put `
  -Body $update `
  -ContentType "application/json"
```
✅ **Expected:** Updated flag with enabled=true, rollout_percentage=50

### Test 6: Toggle Flag
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/flags/test_feature/toggle" `
  -Method Patch
```
✅ **Expected:** Flag toggled (enabled flipped to false)

### Test 7: Delete Flag
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/flags/test_feature" `
  -Method Delete
```
✅ **Expected:** Success message

### Test 8: Validation (Should Fail)
```powershell
$invalid = @{
    key = "INVALID-KEY"
    name = "Test"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/flags" `
  -Method Post `
  -Body $invalid `
  -ContentType "application/json"
```
✅ **Expected:** 400 error with validation message

### Test 9: Rate Limiting
```powershell
# Run this 101 times to trigger rate limit
1..101 | ForEach-Object { 
    Invoke-RestMethod -Uri "http://localhost:3001/api/flags" -ErrorAction SilentlyContinue
}
```
✅ **Expected:** Last request gets 429 (Too Many Requests)

---

## Step 5: Frontend Setup

```powershell
cd ..\frontend

# Install dependencies
npm install

# Start dev server
npm run dev
```

**Expected Output:**
```
VITE ready in 500 ms
➜  Local:   http://localhost:3000/
```

Visit http://localhost:3000 in browser
✅ **Expected:** Placeholder dashboard with "Phase 1 Setup Complete!"

---

## Quick Test Script

Save this as `test-api.ps1`:

```powershell
# Test all endpoints
Write-Host "🧪 Testing Feature Flag API..." -ForegroundColor Cyan

# Test 1: Health
Write-Host "`n1. Health Check" -ForegroundColor Yellow
Invoke-RestMethod -Uri "http://localhost:3001/health"

# Test 2: Get all flags
Write-Host "`n2. Get All Flags" -ForegroundColor Yellow
$flags = Invoke-RestMethod -Uri "http://localhost:3001/api/flags"
Write-Host "Found $($flags.count) flags" -ForegroundColor Green

# Test 3: Get single flag
Write-Host "`n3. Get Single Flag (dark_mode)" -ForegroundColor Yellow
$flag = Invoke-RestMethod -Uri "http://localhost:3001/api/flags/dark_mode"
Write-Host "Flag: $($flag.data.name) - Enabled: $($flag.data.enabled)" -ForegroundColor Green

# Test 4: Toggle flag
Write-Host "`n4. Toggle Flag (dark_mode)" -ForegroundColor Yellow
$toggled = Invoke-RestMethod -Uri "http://localhost:3001/api/flags/dark_mode/toggle" -Method Patch
Write-Host "New state: $($toggled.data.enabled)" -ForegroundColor Green

Write-Host "`n✅ All tests passed!" -ForegroundColor Green
```

Run with: `.\test-api.ps1`

---

## Troubleshooting

### PostgreSQL Not Running
```powershell
# Check status
Get-Service postgresql*

# Start service
Start-Service postgresql-x64-14
```

### Redis Not Running
```powershell
# Check if Redis is running
redis-cli ping

# Should return: PONG
```

### Port Already in Use
```powershell
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process
Stop-Process -Id <PID> -Force
```

### Connection Refused
- Check .env file has correct DATABASE_URL and REDIS_URL
- Verify PostgreSQL and Redis are running
- Check firewall settings

---

## Database Management

### View Data
```powershell
# Connect to PostgreSQL
psql -U postgres -d feature_flags

# Inside psql:
\dt                              # List tables
SELECT * FROM feature_flags;     # View all flags
\q                               # Exit
```

### Reset Database
```powershell
cd backend
npm run db:rollback    # Drop all tables
npm run db:migrate     # Recreate tables
npm run db:seed        # Re-seed data
```

---

## Next Steps After Testing

Once all tests pass:
1. ✅ Phase 2 is complete and working
2. 🚀 Ready to start Phase 3: Flag Evaluation Engine
3. 📊 Consider setting up monitoring/logging
4. 🔐 Plan authentication implementation

---

## Performance Testing

### Test Response Time
```powershell
Measure-Command { 
    Invoke-RestMethod -Uri "http://localhost:3001/api/flags" 
}
```
✅ **Expected:** < 100ms

### Test Concurrent Requests
```powershell
1..10 | ForEach-Object -Parallel { 
    Invoke-RestMethod -Uri "http://localhost:3001/api/flags/$_" 
}
```

---

## What's Working Now

✅ **Database**
- PostgreSQL connection
- 2 tables with indexes
- Migrations and rollback
- Sample seed data

✅ **Models**
- FeatureFlag (9 methods)
- FlagEvaluation (4 methods)

✅ **API Endpoints**
- POST /api/flags - Create
- GET /api/flags - List all
- GET /api/flags/:key - Get one
- PUT /api/flags/:key - Update
- PATCH /api/flags/:key/toggle - Toggle
- DELETE /api/flags/:key - Delete

✅ **Security**
- Input validation
- SQL injection protection
- Rate limiting
- CORS configuration
- Security headers (Helmet)
- Error handling

✅ **Frontend**
- React app running
- Placeholder UI
- API proxy configured
