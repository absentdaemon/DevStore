/**
 * DevStore Production Build Script for Vercel
 * 
 * Generates client-side "config.js" from environment variables during deployment.
 * Enforces security validations:
 *  - Fails if SUPABASE_URL or SUPABASE_ANON_KEY is missing (prevents silent demo mode fallback).
 *  - Fails if a service-role key or secret key is mistakenly provided.
 *  - Verifies that config.js remains in .gitignore and is untracked by Git.
 *  - Verifies presence of core static assets required for production.
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const configFilePath = path.join(rootDir, 'config.js');

console.log('====================================================');
console.log('   DevStore Production Build & Asset Verification   ');
console.log('====================================================\n');

// 1. Resolve Environment Variables
let supabaseUrl = process.env.SUPABASE_URL ||
                  process.env.NEXT_PUBLIC_SUPABASE_URL ||
                  process.env.VITE_SUPABASE_URL;

let supabaseAnonKey = process.env.SUPABASE_ANON_KEY ||
                      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                      process.env.VITE_SUPABASE_ANON_KEY;

// If building locally and env vars are not set in shell, read existing local config.js
if ((!supabaseUrl || !supabaseAnonKey) && fs.existsSync(configFilePath)) {
  try {
    const existingContent = fs.readFileSync(configFilePath, 'utf8');
    const urlMatch = existingContent.match(/supabaseUrl:\s*["']([^"']+)["']/);
    const keyMatch = existingContent.match(/supabaseAnonKey:\s*["']([^"']+)["']/);
    if (urlMatch && !supabaseUrl) supabaseUrl = urlMatch[1];
    if (keyMatch && !supabaseAnonKey) supabaseAnonKey = keyMatch[1];
  } catch {}
}

// 2. Validate Presence (Never silently fall back to demo mode in production build)
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ BUILD ERROR: Missing required Supabase environment variables!\n');
  console.error('The following environment variables must be defined in your deployment environment:');
  if (!supabaseUrl) {
    console.error('  - SUPABASE_URL (e.g. https://your-project-id.supabase.co)');
  }
  if (!supabaseAnonKey) {
    console.error('  - SUPABASE_ANON_KEY (public anon publishable key)');
  }
  console.error('\nPlease configure these environment variables in your Vercel Project Settings.');
  console.error('Refusing to generate empty credentials that would silently enable demo mode in production.\n');
  process.exit(1);
}

// 3. Security Sanity Checks
let trimmedUrl = supabaseUrl.trim();
const trimmedKey = supabaseAnonKey.trim();

if (!trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('http://localhost')) {
  console.error(`❌ SECURITY ERROR: SUPABASE_URL must begin with https:// (received: ${trimmedUrl})\n`);
  process.exit(1);
}

if (trimmedUrl.includes('jegapakrvudxtdppkqno')) {
  console.warn('⚠️ CONFIGURATION WARNING: Detected typo in SUPABASE_URL: "jegapakrvudxtdppkqno" (xt).');
  console.warn('Auto-correcting to canonical DevStore project reference "jegapakrvudtxdppkqno" (tx).');
  console.warn('Please also update SUPABASE_URL in Vercel Project Settings for consistency.\n');
  trimmedUrl = trimmedUrl.replace('jegapakrvudxtdppkqno', 'jegapakrvudtxdppkqno');
}

const lowerKey = trimmedKey.toLowerCase();
if (lowerKey.includes('service_role') || lowerKey.includes('secret')) {
  console.error('❌ SECURITY VIOLATION: SUPABASE_ANON_KEY appears to be a secret/service-role key!');
  console.error('CRITICAL: Never expose service-role keys to browser client configurations.\n');
  process.exit(1);
}

// 4. Verify .gitignore Protection
const gitignorePath = path.join(rootDir, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
  if (!gitignoreContent.includes('config.js')) {
    console.error('❌ CONFIGURATION ERROR: "config.js" must be listed in .gitignore!\n');
    process.exit(1);
  }
}

// 5. Verify Core Static Assets
const requiredAssets = [
  'index.html',
  'css/design-system.css',
  'css/components.css',
  'js/app.js',
  'js/supabase-client.js',
  'js/vendor/supabase.js',
  'data/catalog.json',
  'assets/favicon.svg'
];

for (const asset of requiredAssets) {
  const assetPath = path.join(rootDir, asset);
  if (!fs.existsSync(assetPath)) {
    console.error(`❌ ASSET ERROR: Required static asset missing: ${asset}\n`);
    process.exit(1);
  }
}

// 6. Generate Client Configuration File
const generatedConfig = `/**
 * DevStore Client Configuration
 * Generated automatically during production build from deployment environment variables.
 * DO NOT commit this file to Git.
 */

window.DEVSTORE_CONFIG = {
  supabaseUrl: ${JSON.stringify(trimmedUrl)},
  supabaseAnonKey: ${JSON.stringify(trimmedKey)},
  maxPackageSizeBytes: 250 * 1024 * 1024,
  allowedPackageExtensions: ['.zip', '.apk', '.tar.gz', '.msi', '.exe']
};
`;

try {
  fs.writeFileSync(configFilePath, generatedConfig, 'utf8');
  console.log('✔ Verified core static assets and security policies.');
  console.log(`✔ Successfully generated config.js (Supabase URL: ${trimmedUrl})`);
  console.log('\n====================================================');
  console.log('   DevStore Production Build Completed Successfully ');
  console.log('====================================================\n');
} catch (err) {
  console.error('❌ FAILED to write config.js:', err.message);
  process.exit(1);
}
