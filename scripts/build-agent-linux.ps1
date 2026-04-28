$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$distDir = Join-Path $repoRoot "dist"
$agentDir = Join-Path $repoRoot "services/agent"
$go = "C:\Program Files\Go\bin\go.exe"

New-Item -ItemType Directory -Force -Path $distDir | Out-Null

$env:GOOS = "linux"
$env:GOARCH = "amd64"
$env:CGO_ENABLED = "0"

Push-Location $agentDir
try {
  & $go build -o (Join-Path $distDir "agent-linux-amd64") ./cmd/agent
}
finally {
  Pop-Location
  Remove-Item Env:\GOOS -ErrorAction SilentlyContinue
  Remove-Item Env:\GOARCH -ErrorAction SilentlyContinue
  Remove-Item Env:\CGO_ENABLED -ErrorAction SilentlyContinue
}

Write-Output "Built dist/agent-linux-amd64"
