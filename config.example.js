/**
 * DevStore Client Configuration Template
 * 
 * To connect your DevStore instance to a real Supabase backend:
 * 1. Copy this file to "config.js" in the root directory:
 *    cp config.example.js config.js
 * 2. Replace the placeholder values with your Supabase Project settings.
 *    (Found in: Supabase Dashboard -> Project Settings -> API)
 * 3. Never commit "config.js" to git (it is already in .gitignore).
 */

window.DEVSTORE_CONFIG = {
  // Your Supabase Project URL (e.g. https://xyzcompany.supabase.co)
  supabaseUrl: 'https://your-project-id.supabase.co',

  // Your Supabase public 'anon' key (safe for browser client with RLS)
  supabaseAnonKey: 'your-anon-public-key-here',

  // Maximum allowed file size for package uploads (bytes) - default 250 MB
  maxPackageSizeBytes: 250 * 1024 * 1024,

  // Allowed file extensions for software packages
  allowedPackageExtensions: ['.zip', '.apk', '.tar.gz', '.msi', '.exe']
};
