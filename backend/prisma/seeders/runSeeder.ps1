# Script PowerShell para executar o seeder do administrador

Write-Host "Iniciando seeder para criar usuario administrador..." -ForegroundColor Green

# Verificar se o Node.js esta instalado
try {
    $nodeVersion = node --version
    Write-Host "Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js nao encontrado. Instale em: https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Navegar para o diretorio do backend
$backendPath = Split-Path -Parent $PSScriptRoot
Set-Location $backendPath

Write-Host "Diretorio atual: $(Get-Location)" -ForegroundColor Cyan

# Verificar se o package.json existe
if (Test-Path "package.json") {
    Write-Host "package.json encontrado" -ForegroundColor Green
} else {
    Write-Host "package.json nao encontrado" -ForegroundColor Red
    exit 1
}

# Instalar dependencias se necessario
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
}

# Executar o seeder
Write-Host "Executando seeder do administrador..." -ForegroundColor Green
try {
    node prisma/seeders/adminSeeder.js
    Write-Host "Seeder executado com sucesso!" -ForegroundColor Green
} catch {
    Write-Host "Erro ao executar seeder: $_" -ForegroundColor Red
    Write-Host "Execute manualmente: node prisma/seeders/adminSeeder.js" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Credenciais do administrador:" -ForegroundColor Cyan
Write-Host "Email: admin@sistemagestao.com" -ForegroundColor White
Write-Host "Senha: admin123" -ForegroundColor White
Write-Host ""
Write-Host "IMPORTANTE: Altere a senha apos o primeiro login!" -ForegroundColor Yellow