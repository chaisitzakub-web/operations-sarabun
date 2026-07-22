@echo off
chcp 65001 > nul
echo ========================================================
echo ☁️ Cloudflare Pages & D1 Database Deployment Script
echo ========================================================
echo.

echo 1. Creating Cloudflare D1 Database (esarabun-db)...
npx -y wrangler d1 create esarabun-db

echo.
echo 2. Initializing SQL Schema on Cloudflare D1...
npx -y wrangler d1 execute esarabun-db --file=./schema.sql

echo.
echo 3. Deploying WebApp to Cloudflare Pages...
npx -y wrangler pages deploy . --project-name=e-sarabun-cloud

echo.
echo ========================================================
echo ✅ Deployment Complete! Your e-Sarabun is now live on Cloudflare!
echo ========================================================
pause
