# API Testing Guide

## Setup
First, make sure your backend is running:
```bash
cd backend
npm run dev
```

## Endpoints

### 1. Create a Flag
```bash
curl -X POST http://localhost:3001/api/flags \
  -H "Content-Type: application/json" \
  -d '{
    "key": "beta_feature",
    "name": "Beta Feature",
    "description": "New beta feature for testing",
    "enabled": false,
    "rollout_percentage": 0,
    "targeting_rules": []
  }'
```

### 2. Get All Flags
```bash
# Get all flags
curl http://localhost:3001/api/flags

# Get only enabled flags
curl http://localhost:3001/api/flags?enabled=true
```

### 3. Get Single Flag
```bash
curl http://localhost:3001/api/flags/dark_mode
```

### 4. Update a Flag
```bash
curl -X PUT http://localhost:3001/api/flags/beta_feature \
  -H "Content-Type: application/json" \
  -d '{
    "enabled": true,
    "rollout_percentage": 25,
    "description": "Updated description"
  }'
```

### 5. Toggle a Flag
```bash
curl -X PATCH http://localhost:3001/api/flags/dark_mode/toggle
```

### 6. Delete a Flag
```bash
curl -X DELETE http://localhost:3001/api/flags/beta_feature
```

## PowerShell Examples

If you're using PowerShell on Windows:

### Create a Flag
```powershell
$body = @{
    key = "beta_feature"
    name = "Beta Feature"
    description = "New beta feature"
    enabled = $false
    rollout_percentage = 0
    targeting_rules = @()
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/flags" `
  -Method Post `
  -Body $body `
  -ContentType "application/json"
```

### Get All Flags
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/flags"
```

### Update a Flag
```powershell
$body = @{
    enabled = $true
    rollout_percentage = 50
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/flags/beta_feature" `
  -Method Put `
  -Body $body `
  -ContentType "application/json"
```

### Toggle a Flag
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/flags/dark_mode/toggle" `
  -Method Patch
```

### Delete a Flag
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/flags/beta_feature" `
  -Method Delete
```

## Response Examples

### Success Response
```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "key": "dark_mode",
    "name": "Dark Mode",
    "description": "Enable dark theme",
    "enabled": true,
    "rollout_percentage": 50,
    "targeting_rules": [],
    "created_at": "2026-01-07T...",
    "updated_at": "2026-01-07T..."
  }
}
```

### Error Response
```json
{
  "error": "Validation Error",
  "message": "Invalid input data",
  "details": [
    "Field \"key\" is required and must be a non-empty string"
  ]
}
```

## Validation Rules

### Flag Key
- Required for creation
- Must contain only lowercase letters, numbers, and underscores
- Example: `dark_mode`, `new_feature_v2`, `beta_test`

### Flag Name
- Required for creation
- Non-empty string

### Rollout Percentage
- Must be a number between 0 and 100

### Targeting Rules
- Must be an array
- Each rule must have `type` and `operator` fields
