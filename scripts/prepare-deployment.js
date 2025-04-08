#!/usr/bin/env node

/**
 * This script prepares the application for deployment by:
 * 1. Ensuring .env.production exists with the correct values
 * 2. Copying required files to the deployment directory
 * 3. Checking for common deployment issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Check if .env.production exists
if (!fs.existsSync('.env.production')) {
  console.error('❌ .env.production file not found!');
  console.log('Please create it with the following variables:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_ANON_KEY');
  console.log('- VITE_GOOGLE_CLIENT_ID (if using Google auth)');
  console.log('- VITE_GITHUB_CLIENT_ID (if using GitHub auth)');
  console.log('- SITE_URL (should be your production URL)');
  console.log('- REDIRECT_URL (should be your production URL + /auth/callback)');
  process.exit(1);
}

// Check if vercel.json exists
if (!fs.existsSync('vercel.json')) {
  console.warn('⚠️ vercel.json not found! Deploying to Vercel may require additional configuration.');
  console.log('Run this script again after creating the file.');
}

// Ensure dist directory exists
if (!fs.existsSync('dist')) {
  console.log('📁 Creating dist directory...');
  fs.mkdirSync('dist', { recursive: true });
}

// Copy _redirects for Netlify (if it exists)
if (fs.existsSync('_redirects')) {
  console.log('📄 Copying _redirects file for Netlify deployment...');
  fs.copyFileSync('_redirects', 'dist/_redirects');
}

// Run a production build
console.log('🔨 Building for production...');
try {
  execSync('npm run build', { stdio: 'inherit' });
  console.log('✅ Build completed successfully!');
} catch (error) {
  console.error('❌ Build failed!', error);
  process.exit(1);
}

console.log('\n🚀 Deployment preparation complete!');
console.log('Remember to configure your Supabase project with the correct site URLs before deploying.');
console.log('For Vercel deployment, make sure to add all environment variables from .env.production to your Vercel project settings.'); 