<#
.SYNOPSIS
  vMaker - Build and Deploy to Cloudflare
#>
$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot

if (-not $env:HTTPS_PROXY) {
  try {
    $reg = Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -ErrorAction SilentlyContinue
    if ($reg.ProxyEnable -eq 1 -and $reg.ProxyServer) {
      $proxyServer = $reg.ProxyServer
      if ($proxyServer -notmatch '^https?://') { $proxyServer = "http://$proxyServer" }
      $env:HTTPS_PROXY = $proxyServer
      $env:HTTP_PROXY  = $proxyServer
      Write-Host "[*] Proxy detected: $proxyServer" -ForegroundColor DarkGray
    }
  } catch {}
}

Write-Host '[1/2] Building production bundle...' -ForegroundColor Cyan
Push-Location $Root
try {
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Build failed" }

  Write-Host '[2/2] Deploying to Cloudflare (vmaker.xmtlz.dev)...' -ForegroundColor Cyan
  npx wrangler deploy
  if ($LASTEXITCODE -ne 0) { throw "Deploy failed" }

  Write-Host '[OK] vMaker deployment succeeded!' -ForegroundColor Green
} finally {
  Pop-Location
}
