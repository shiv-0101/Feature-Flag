$ErrorActionPreference = "Stop"

Write-Host "🧪 Testing Feature Flag API..." -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3001"
$passed = 0
$failed = 0

function Test-Endpoint {
    param($name, $scriptBlock)
    try {
        Write-Host "Testing: $name" -ForegroundColor Yellow
        & $scriptBlock
        Write-Host "✅ PASSED`n" -ForegroundColor Green
        $script:passed++
    } catch {
        Write-Host "❌ FAILED: $($_.Exception.Message)`n" -ForegroundColor Red
        $script:failed++
    }
}

Test-Endpoint "Health Check" {
    $result = Invoke-RestMethod -Uri "$baseUrl/health"
    if ($result.status -ne "ok") { throw "Health check failed" }
    Write-Host "   Status: $($result.status)"
}

Test-Endpoint "Get All Flags" {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/flags"
    Write-Host "   Found: $($result.count) flags"
    if ($result.count -eq 0) { throw "No flags found" }
}

Test-Endpoint "Get Single Flag (dark_mode)" {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/flags/dark_mode"
    Write-Host "   Name: $($result.data.name)"
    Write-Host "   Enabled: $($result.data.enabled)"
}

Test-Endpoint "Create New Flag" {
    $body = @{
        key = "test_flag_$(Get-Random)"
        name = "Test Flag"
        description = "Automated test flag"
        enabled = $false
        rollout_percentage = 0
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$baseUrl/api/flags" `
        -Method Post -Body $body -ContentType "application/json"
    
    $script:testFlagKey = $result.data.key
    Write-Host "   Created: $($result.data.key)"
}

Test-Endpoint "Update Flag" {
    $body = @{
        enabled = $true
        rollout_percentage = 50
    } | ConvertTo-Json

    $result = Invoke-RestMethod -Uri "$baseUrl/api/flags/$($script:testFlagKey)" `
        -Method Put -Body $body -ContentType "application/json"
    
    Write-Host "   Enabled: $($result.data.enabled)"
    Write-Host "   Rollout: $($result.data.rollout_percentage)%"
}

Test-Endpoint "Toggle Flag" {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/flags/$($script:testFlagKey)/toggle" `
        -Method Patch
    Write-Host "   New State: $($result.data.enabled)"
}

Test-Endpoint "Delete Flag" {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/flags/$($script:testFlagKey)" `
        -Method Delete
    Write-Host "   Message: $($result.message)"
}

Test-Endpoint "Validation Error (Should Fail)" {
    try {
        $body = @{
            key = "INVALID-KEY"
            name = "Test"
        } | ConvertTo-Json

        Invoke-RestMethod -Uri "$baseUrl/api/flags" `
            -Method Post -Body $body -ContentType "application/json"
        throw "Should have failed validation"
    } catch {
        if ($_.Exception.Response.StatusCode -eq 400) {
            Write-Host "   Correctly rejected invalid input"
        } else {
            throw
        }
    }
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Test Results:" -ForegroundColor Cyan
Write-Host "✅ Passed: $passed" -ForegroundColor Green
Write-Host "❌ Failed: $failed" -ForegroundColor Red

if ($failed -eq 0) {
    Write-Host "`n🎉 All tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`n⚠️  Some tests failed" -ForegroundColor Yellow
    exit 1
}
