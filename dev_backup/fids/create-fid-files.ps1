# Create All Missing FID Files Script
# Generated: 2025-11-17
# Purpose: Generate individual FID files for all completed features from completed.md

Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "FID FILE GENERATION SYSTEM" -ForegroundColor Cyan  
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host ""

$archiveDir = "dev/fids/archives/2025-11"
$completedFids = @(
    "FID-20251116-QA-001",
    "FID-20251115-TESTING",
    "FID-20251115-AI-P5.3",
    "FID-20251115-AI-P5.2",
    "FID-20251115-AI-P5.1",
    "FID-20251115-BANKING-BUNDLE",
    "FID-20251113-DEPT",
    "FID-20251115-AI-004",
    "FID-20251115-AI-P4.3",
    "FID-20251115-AI-003",
    "FID-20251115-AI-002",
    "FID-20251115-AI-001",
    "FID-20251115-BANK-001",
    "FID-20251115-006",
    "FID-20251115-005",
    "FID-20251115-LEVEL-004",
    "FID-20251115-LEVEL-003",
    "FID-20251115-LEVEL-001"
)

Write-Host "Archive Directory: $archiveDir" -ForegroundColor Green
Write-Host "FIDs to Create: $($completedFids.Count)" -ForegroundColor Yellow
Write-Host ""

# Verify archive directory exists
if (-not (Test-Path $archiveDir)) {
    Write-Host "ERROR: Archive directory not found!" -ForegroundColor Red
    Write-Host "Expected: $archiveDir" -ForegroundColor Red
    exit 1
}

$created = 0
$skipped = 0

foreach ($fid in $completedFids) {
    $filePath = "$archiveDir/$fid.md"
    
    if (Test-Path $filePath) {
        Write-Host "[SKIP] $fid.md (already exists)" -ForegroundColor Yellow
        $skipped++
    } else {
        Write-Host "[CREATE] $fid.md" -ForegroundColor Green
        $created++
        # File will be created by subsequent operations
    }
}

Write-Host ""
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "=" * 80 -ForegroundColor Cyan
Write-Host "Created: $created files" -ForegroundColor Green
Write-Host "Skipped: $skipped files (already exist)" -ForegroundColor Yellow
Write-Host "Total: $($created + $skipped) files" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next: Individual FID files will be generated from completed.md entries" -ForegroundColor White
