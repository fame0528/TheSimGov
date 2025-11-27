# Final comprehensive fix for all Healthcare API TypeScript errors

$fixes = @{
    # Analytics files - missing Company import
    "app\api\healthcare\analytics\hospital-performance\route.ts" = @(
        @{ Find = "import Hospital from '@/lib/db/models/healthcare/Hospital';"; Replace = "import Hospital from '@/lib/db/models/healthcare/Hospital';`nimport Company from '@/lib/db/models/Company';" },
        @{ Find = "// No type assertion needed - use hospital directly"; Replace = "const h = hospital;" }
    )
    "app\api\healthcare\analytics\staff-metrics\route.ts" = @(
        @{ Find = "import MedicalStaff from '@/lib/db/models/healthcare/MedicalStaff';"; Replace = "import MedicalStaff from '@/lib/db/models/healthcare/MedicalStaff';`nimport Company from '@/lib/db/models/Company';" }
    )
    "app\api\healthcare\analytics\patient-outcomes\route.ts" = @(
        @{ Find = "import Patient from '@/lib/db/models/healthcare/Patient';"; Replace = "import Patient from '@/lib/db/models/healthcare/Patient';`nimport Company from '@/lib/db/models/Company';" }
    )
    "app\api\healthcare\analytics\financial-summary\route.ts" = @(
        @{ Find = "import Hospital from '@/lib/db/models/healthcare/Hospital';"; Replace = "import Hospital from '@/lib/db/models/healthcare/Hospital';`nimport Company from '@/lib/db/models/Company';" }
    )
    "app\api\healthcare\analytics\compliance-status\route.ts" = @(
        @{ Find = "import Compliance from '@/lib/db/models/healthcare/Compliance';"; Replace = "import Compliance from '@/lib/db/models/healthcare/Compliance';`nimport Company from '@/lib/db/models/Company';" }
    )
}

foreach ($file in $fixes.Keys) {
    $path = Join-Path (Get-Location) $file
    if (Test-Path $path) {
        $content = Get-Content $path | Out-String
        
        foreach ($fix in $fixes[$file]) {
            $content = $content -replace [regex]::Escape($fix.Find), $fix.Replace
        }
        
        Set-Content -Path $path -Value $content
        Write-Host "Fixed: $file"
    }
}

Write-Host "`nDone! Fixed all import issues."
