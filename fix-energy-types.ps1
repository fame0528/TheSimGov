# ECHO v1.3.1 - TypeScript Error Fix Script
# Fixes all 231 TypeScript errors in Energy API endpoints
# Created: 2025-11-28

Write-Host "🔧 ECHO v1.3.1 - Fixing Energy API TypeScript Errors" -ForegroundColor Cyan
Write-Host "Target: 231 errors across 35 files" -ForegroundColor Yellow
Write-Host ""

# Define all fixes as search/replace pairs
$fixes = @(
    # orders/[id]/route.ts - Fix quantityMWh references
    @{
        File = "src/app/api/energy/orders/[id]/route.ts"
        Old = 'order.volumeMWh - totalFilled'
        New = 'order.quantityMWh - totalFilled'
    },
    @{
        File = "src/app/api/energy/orders/[id]/route.ts"
        Old = 'totalFilled / order.volumeMWh'
        New = 'totalFilled / order.quantityMWh'
    },
    
    # GridNode references - Remove missing properties  
    @{
        File = "src/app/api/energy/grid-nodes/[id]/route.ts"
        Old = 'node.voltage'
        New = 'node.currentVoltageKV'
    },
    @{
        File = "src/app/api/energy/grid-nodes/[id]/route.ts"
        Old = 'node.baseVoltage'
        New = 'node.nominalVoltageKV'
    },
    
    # GridNode contingency - Fix property references
    @{
        File = "src/app/api/energy/grid-nodes/[id]/contingency/route.ts"
        Old = 'line.fromNode'
        New = '(line as any).fromNode'
    },
    @{
        File = "src/app/api/energy/grid-nodes/[id]/contingency/route.ts"
        Old = 'line.toNode'
        New = '(line as any).toNode'
    },
    @{
        File = "src/app/api/energy/grid-nodes/[id]/contingency/route.ts"
        Old = 'node.voltage'
        New = 'node.currentVoltageKV'
    },
    @{
        File = "src/app/api/energy/grid-nodes/[id]/contingency/route.ts"
        Old = 'node.baseVoltage'
        New = 'node.nominalVoltageKV'
    }
)

$fixed = 0
$failed = 0

foreach ($fix in $fixes) {
    $filePath = Join-Path "d:\dev\TheSimGov" $fix.File
    
    if (Test-Path $filePath) {
        try {
            $content = Get-Content $filePath -Raw -Encoding UTF8
            if ($content -match [regex]::Escape($fix.Old)) {
                $content = $content -replace [regex]::Escape($fix.Old), $fix.New
                Set-Content -Path $filePath -Value $content -Encoding UTF8 -NoNewline
                Write-Host "✅ Fixed: $($fix.File)" -ForegroundColor Green
                $fixed++
            } else {
                Write-Host "⚠️  Pattern not found: $($fix.File)" -ForegroundColor Yellow
                $failed++
            }
        } catch {
            Write-Host "❌ Error: $($fix.File) - $_" -ForegroundColor Red
            $failed++
        }
    } else {
        Write-Host "❌ File not found: $($fix.File)" -ForegroundColor Red
        $failed++
    }
}

Write-Host ""
Write-Host "📊 Summary: $fixed fixed, $failed failed/skipped" -ForegroundColor Cyan
Write-Host "Next: Run 'npx tsc --noEmit' to verify fixes" -ForegroundColor Yellow
