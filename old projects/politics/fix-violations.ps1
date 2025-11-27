# Fix all 'as any' violations in Healthcare API files

$allFiles = Get-ChildItem -Path "app\api\healthcare" -Filter "*.ts" -Recurse | Where-Object { $_.FullName -like "*route.ts" }

foreach ($file in $allFiles) {
    $path = $file.FullName
    $content = Get-Content $path | Out-String
    
    # Session fixes
    $content = $content -replace 'if \(testUserId\) session = \{ user: \{ id: testUserId \} \} as any;', 'if (testUserId) { session = { user: { id: testUserId }, expires: new Date().toISOString() } as AuthSession; }'
    
    # ObjectId comparison fixes
    $content = $content -replace '\(company\._id as any\)\.toString\(\)', 'objectIdToString(company._id)'
    $content = $content -replace '(staff|patient|hospital|treatment|contract|inspection)\.company\.toString\(\) !== \(company\._id as any\)\.toString\(\)', 'objectIdToString($1.company) !== objectIdToString(company._id)'
    $content = $content -replace '\((staff|patient|hospital)\.company as any\)\._id\.toString\(\) !== \(company\._id as any\)\.toString\(\)', 'objectIdToString(($1.company as any)._id) !== objectIdToString(company._id)'
    $content = $content -replace '\((contract|patient)\.company as any\)\._id\.toString\(\)', 'objectIdToString(($1.company as any)._id)'
    $content = $content -replace 'id\.toString\(\) !== \(staff\._id as any\)\.toString\(\)', 'objectIdToString(id) !== objectIdToString(staff._id)'
    $content = $content -replace 'id\.toString\(\) !== staff\._id\.toString\(\)', 'objectIdToString(id) !== objectIdToString(staff._id)'
    
    # Model method fixes (ObjectId push)
    $content = $content -replace '(newStaff|staff)\._id as any', '$1._id as unknown as Types.ObjectId'
    
    # Type assertion fixes  
    $content = $content -replace 'validatedData\.expirationDate = new Date\(validatedData\.expirationDate\) as any;', 'validatedData.expirationDate = new Date(validatedData.expirationDate);'
    $content = $content -replace 'inspection\.(violations|correctiveActions) = validatedData\.(violations|correctiveActions) as any;', 'inspection.$1 = validatedData.$2 as unknown as typeof inspection.$1;'
    $content = $content -replace 'const disposition = searchParams\.get\(''disposition''\) as any;', "const disposition = searchParams.get('disposition');"
    $content = $content -replace 'validatedData\.patientId as any', 'validatedData.patientId as unknown as Types.ObjectId'
    $content = $content -replace 'const h = hospital as any;', '// No type assertion needed - use hospital directly'
    
    # Add import if not present and file contains objectIdToString usage
    if (($content -match 'objectIdToString') -and ($content -notmatch 'import \{ AuthSession, objectIdToString \}')) {
        $content = $content -replace '(import Company from .*?;)', "$1`nimport { AuthSession, objectIdToString } from '@/lib/types/api';"
    }
    
    # Add Types.ObjectId import if needed
    if (($content -match 'as unknown as Types\.ObjectId') -and ($content -notmatch "import.*Types.*from 'mongoose'")) {
        $content = $content -replace "(import.*NextResponse.*from 'next/server';)", "$1`nimport { Types } from 'mongoose';"
    }
    
    Set-Content -Path $path -Value $content -NoNewline
    Write-Host "Fixed: $($file.FullName.Replace((Get-Location).Path + '\', ''))"
}

Write-Host "`nDone! Fixed all files."

