# DevStore Backend & Supabase Setup Guide

This guide explains how to connect DevStore to a real **Supabase** backend (PostgreSQL database, Supabase Auth, and Supabase Storage with Row Level Security).

---

## 1. Create a Supabase Project

1. Sign up or log in at [https://supabase.com](https://supabase.com).
2. Click **New Project**, choose an organization, enter a name (e.g. `devstore-backend`), set a strong database password, and choose your preferred region.
3. Wait for the project to provision.

---

## 2. Apply Database Schema & Migrations

### Option A: Using the Supabase Dashboard (Fastest)
1. In your Supabase project dashboard, navigate to the **SQL Editor** on the left navigation bar.
2. Click **New query**.
3. Open `supabase/migrations/20261023000001_phase9a_init.sql` from this repository.
4. Paste the entire file contents into the SQL Editor and click **Run**.
5. Verify that all 7 tables and custom enums were created:
   - `profiles`
   - `developer_applications`
   - `applications`
   - `app_versions`
   - `reviews`
   - `favorites`
   - `moderation_audit_logs`

### Option B: Using the Supabase CLI
```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

---

## 3. Storage Buckets Verification

The migration automatically creates two storage buckets in `storage.buckets`:
- **`app-packages`** (`public: false`): Private storage for binary releases (`.zip`, `.apk`, `.tar.gz`, `.msi`, `.exe`). Direct public URLs are disabled; downloads are only accessible through signed short-lived URLs or by verified developers/admins.
- **`app-assets`** (`public: true`): Public storage for application icons and screenshot previews.

In your Supabase dashboard, visit **Storage** to confirm both buckets appear and the RLS policies are active.

---

## 4. Frontend Client Configuration

1. In your Supabase dashboard, go to **Project Settings** -> **API**.
2. Note your **Project URL** and the **anon public API key**.
3. In the root directory of DevStore, copy `config.example.js` to `config.js`:
   ```bash
   cp config.example.js config.js
   ```
4. Edit `config.js` and set:
   ```javascript
   window.DEVSTORE_CONFIG = {
     supabaseUrl: 'https://xyzcompany.supabase.co',
     supabaseAnonKey: 'eyJhbGciOi...',
     maxPackageSizeBytes: 250 * 1024 * 1024,
     allowedPackageExtensions: ['.zip', '.apk', '.tar.gz', '.msi', '.exe']
   };
   ```
5. `config.js` is included in `.gitignore` to prevent committing your real project URL and public key to git.

---

## 5. Security & Role Assignment Rules

DevStore enforces a 3-tier role architecture:
- **`user`** (Default): Can browse, download approved releases, manage favorites/wishlist, and post reviews.
- **`developer`**: Can apply for developer status, draft application listings, upload package binaries and assets, submit releases for moderation, and view owned applications.
- **`admin`**: Has full access to the Admin Moderation Dashboard (`#admin-dashboard`), can approve/reject developer applications and app releases, inspect SHA-256 package checksums, and view moderation logs.

### Role Security Invariant
> [!IMPORTANT]
> A newly registered account is ALWAYS created with `role = 'user'`.
> PostgreSQL trigger `prevent_role_self_escalation()` blocks any non-admin from modifying the `role` column in `public.profiles`. The browser client and localStorage cannot alter roles.

### Setting Up Your First Admin Account
1. Open DevStore in your browser and register a new account (e.g. `admin@yourdomain.com`).
2. Go to your Supabase Dashboard -> **SQL Editor**.
3. Run the following command using the service role / PostgreSQL console:
   ```sql
   UPDATE public.profiles
   SET role = 'admin'
   WHERE email = 'admin@yourdomain.com';
   ```
4. Now sign in on DevStore. Your profile popover will display the **Admin Dashboard** option!
