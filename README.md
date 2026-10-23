# DevStore

> **Independent Open-Source Application Catalog & Discovery Storefront**

DevStore is an open-source, ethical application marketplace and catalog browser. It provides a transparent discovery and distribution interface inspired by modern mobile and desktop store designs, featuring fast search, category navigation, multi-platform filters (Windows, Android, Web), and accessible UI notifications.

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 18+ (tested on Node 20, 22, and 24)
- **Web Browser**: Any modern browser (Google Chrome, Mozilla Firefox, Microsoft Edge, Apple Safari)

### Installation & Launch

1. Clone or download the repository to your local machine:
   ```bash
   git clone https://github.com/absentdaemon/DevStore.git
   cd DevStore
   ```

2. Start the local server:
   ```bash
   npm start
   # or
   node server.cjs
   ```

3. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```
   *(The server port can be customized by setting the `PORT` environment variable, e.g., `PORT=8080 node server.cjs`)*.

---

## 🧪 Testing & Verification

DevStore includes a comprehensive test suite covering unit contracts, server security, download artifact validation, and real browser-level interaction tests via headless Chrome.

### Run All Test Suites
```bash
npm test
# or
node tests/run-all-tests.mjs
```

### Run Individual Test Suites
- **Server Security & HTTP Hardening**:
  ```bash
  npm run test:security
  # Runs tests/test-server-security.mjs
  ```
  *Verifies filesystem path traversal containment (`..`, `%2e%2e`, `%00`), method filtering (only `GET` and `HEAD` permitted, `POST`/`PUT`/`DELETE` return `405 Method Not Allowed`), CORS header removal, and graceful shutdown.*

- **Real Headless Chrome Browser Integration**:
  ```bash
  npm run test:browser
  # Runs tests/test-browser-integration.mjs
  ```
  *Launches a real headless Chrome instance via Chrome DevTools Protocol (CDP). Verifies live DOM rendering, query search routing, empty results fallback recommendations, back/forward history transitions, video demo notices, genuine download 404 error handling (no fake installs), unverified demo profile badges, keyboard Escape dismissal, 390px mobile responsiveness with zero horizontal overflow, zoom accessibility, and zero runtime console errors.*

- **Catalog Download & Media Assets Audit**:
  ```bash
  npm run test:audit
  # Runs tests/validate-downloads.mjs
  ```
  *Audits all 8 catalog entries across 20 download targets, reporting the genuine availability of local binaries, remote web targets, and trailer media.*

- **Additional Unit Suites**:
  ```bash
  node tests/test-parity-phase8.mjs     # Phase 8 parity contract validation
  node tests/test-profile-auth.mjs      # Profile state machine & localStorage persistence
  node tests/test-phase7-validation.mjs  # Search engine, autocomplete, and UI filters
  node tests/test-search-engine.mjs     # Search engine scoring and recommendations
  ```

---

## 📦 Download Availability & Genuine State

- **Independent Open Source Catalog**: DevStore indexes open-source software and progressive web apps.
- **Web Applications**: Apps with web targets (such as Retro Chess Arena, Aether Calculator, Chronos Task Manager, Markdown Canvas, Pixel Pulse Audio, and Vector Craft Paint) launch genuine web apps in a new tab via verified external links.
- **Local Binary Packages**: Large native `.apk` and `.zip` binaries are **not bundled** in this git repository to prevent repository bloat and avoid distributing unverified binary blobs.
- **No Fake Installation State**: When a user clicks "Install" on a package that is not mirrored on the server, the client performs a real HTTP `HEAD` check. When the server responds with `404 Not Found`, the client displays an accessible notification (`Download Artifact Unavailable`) and **never** advances a fake timer to mark the application as installed.
- **Unsupported Platforms**: If an application does not support the user's active device platform, an explanatory notice is displayed and installation is blocked.

---

## 👤 Demo Profiles & Truthful Security Labels

- **Local Demo Profiles Only**: Pre-configured user profiles (e.g., Alex Mercer, Sarah Connor) are client-side demonstrations stored in `localStorage`. DevStore **does not** transmit credentials to any remote identity provider or Google backend.
- **Unverified Identity Notice**: All profiles are explicitly badged as `Demo • Unverified`. DevStore never implies an email address has been authenticated or verified against an external authority.
- **Truthful Safety & Inspection Labels**:
  - DevStore does not run a device-level anti-virus background daemon. The "Security Inspection" interface performs client-side catalog integrity checks and transparently advises users to verify SHA-256 checksums and source code prior to running downloaded software.
  - The "Catalog Version Check" accurately reports static manifest v1.0.0 status rather than simulating a fake background update service.
  - Video trailer preview cards without media stream files display a clear `Demo Preview • No media attached` badge, with audio controls disabled.

---

---

## ☁️ Phase 9A — Real Backend, Accounts & Roles (Supabase)

DevStore Phase 9A integrates a production-ready, secure **Supabase** backend (PostgreSQL database, Supabase Auth, and private package file storage) while retaining its clean vanilla HTML/CSS/JavaScript architecture with zero external CDN dependencies.

### 1. Three Role-Based Access Control (RBAC) Levels
All roles and permissions are enforced strictly on the PostgreSQL backend using **Row Level Security (RLS)** and constraint triggers. The client never trusts roles stored in `localStorage` or claims sent from the browser.
- **Normal Users**: Register, sign in, verify email, reset passwords, browse apps, download approved releases, manage favorites/library, and post reviews.
- **Developers**: Apply for developer privileges, manage developer profile, create application listings, upload package binaries (`.apk`, `.zip`, `.tar.gz`, `.msi`, `.exe`) with client-calculated SHA-256 checksums, and submit releases for review.
- **Administrators**: Access the protected **Admin Moderation Dashboard**, review and approve/reject developer applications, inspect submitted releases and SHA-256 checksums, approve packages for distribution, and inspect moderation audit logs.

### 2. Publishing & Download Safety
- **Private Package Storage**: All submitted packages are stored in a private Supabase Storage bucket (`app-packages`, `public: false`). Packages remain inaccessible to the public until explicitly reviewed and approved by an administrator.
- **Integrity Checksums**: Checksums are computed locally using the browser's Web Cryptography API (`crypto.subtle.digest('SHA-256')`) upon upload and displayed transparently in the moderation dashboard and download dialogs.
- **Package Limits**: Enforces 250 MB maximum file size and strict file extension filtering.
- **Truthful Catalog Claims**: Demo listings and unbundled binaries are marked honestly as unavailable. DevStore never claims automated malware scanning is active until an automated antivirus engine is integrated.

### 3. Backend Setup & Configuration
To connect DevStore to your own Supabase project:
1. Create a free project at [supabase.com](https://supabase.com).
2. Run the Phase 9A database migration:
   - Navigate to the **SQL Editor** in your Supabase dashboard.
   - Open and execute [supabase/migrations/20261023000001_phase9a_init.sql](file:///d:/DevStore/supabase/migrations/20261023000001_phase9a_init.sql).
3. Configure your browser credentials:
   - Copy `config.example.js` to `config.js`:
     ```bash
     cp config.example.js config.js
     ```
   - Open `config.js` and set your `supabaseUrl` and public `supabaseAnonKey`.
   *(Note: Never place your `service_role` key in `config.js`. `config.js` is ignored by git).*
4. Promote your initial administrator account:
   - Sign up via the DevStore UI or Supabase Auth tab.
   - Run this SQL query in the Supabase SQL Editor:
     ```sql
     UPDATE public.profiles
     SET role = 'admin'
     WHERE email = 'your-admin-email@example.com';
     ```

---

## ♿ Accessibility & Quality Standards

- **Browser Zoom Allowed**: The viewport meta tag retains `width=device-width, initial-scale=1.0` without `user-scalable=no` or `maximum-scale=1.0`, ensuring users can zoom and scale content according to WCAG guidelines.
- **Reduced Motion Support**: Modern `@media (prefers-reduced-motion: reduce)` rules disable non-essential animations and transitions for users with vestibular sensitivities.
- **Modal Focus Management**: All dialogs implement focus trapping, Escape key dismissal, and focus restoration to the trigger element upon closing via `ModalManager`.
- **Accessible Notifications**: Browser-blocking `alert()`, `prompt()`, and `confirm()` dialogs have been completely replaced by accessible toast notifications (`role="status"` / `role="alert"`) and accessible modal dialogs.
- **Safe DOM APIs**: All catalog strings and user inputs are strictly escaped or inserted via safe DOM APIs, preventing cross-site scripting (XSS).

---

## ⚠️ Deployment Risks & Hardening Guidelines

1. **Development Server Scope**: `server.cjs` is a lightweight, zero-dependency static file server intended for local development, testing, and offline browsing.
2. **Production Reverse Proxy**: For public internet deployment, host DevStore behind a production-grade reverse proxy (e.g., Nginx, Caddy, or Cloudflare) configured with:
   - Mandatory HTTPS / TLS termination.
   - Robust Content Security Policy (CSP) headers restricting script execution to self.
   - HTTP Strict Transport Security (`HSTS`).
   - Rate limiting and connection limits.
3. **CORS Configuration**: Permissive `Access-Control-Allow-Origin: *` headers have been removed from the server. If cross-origin resource sharing is required for specific API endpoints in the future, whitelist explicit trusted origins.
4. **Binary Integrity**: If mirroring real executable binaries (`.exe`, `.apk`, `.zip`), implement cryptographic SHA-256 verification and sign all binaries with developer certificates.

---

## 📁 Repository Structure

```text
DevStore/
├── assets/                  # Application icons, glyphs, and visual parity assets
├── css/
│   ├── components.css       # UI components, modals, toasts, cards, portal & admin styling
│   ├── design-system.css    # CSS variables, typography, and reduced-motion rules
│   └── responsive.css       # Media queries for tablet and mobile form factors
├── data/
│   └── catalog.json         # Structured application catalog manifest
├── js/
│   ├── app.js               # Main store application controller & portal routers
│   ├── catalog-validator.js # Catalog schema validation and URL sanitization
│   ├── download-manager.js  # Real HTTP download capability & platform check
│   ├── modal-manager.js     # Focus trapping, Escape dismissal & focus restoration
│   ├── notifications.js     # Accessible toast notifications and modal dialogs
│   ├── search-engine.js     # Fuzzy search index, autocomplete & recommendations
│   ├── supabase-client.js   # Supabase client adapter, auth, RBAC & SHA-256 validator
│   ├── vendor/
│   │   └── supabase.js      # Vendored offline-first Supabase JS client bundle
│   └── video-player.js      # HTML5 video controller and truthful demo trailer handler
├── supabase/
│   ├── migrations/
│   │   └── 20261023000001_phase9a_init.sql # Database schema, RLS, triggers & RPCs
│   └── README.md            # Detailed Supabase setup, migrations & admin promotion guide
├── tests/
│   ├── run-all-tests.mjs             # Master test suite runner
│   ├── test-backend-roles.mjs        # Phase 9A schema, RBAC, RLS & SHA-256 unit tests
│   ├── test-browser-integration.mjs  # Real headless Chrome browser test suite
│   ├── test-parity-phase8.mjs        # Parity validation contract
│   ├── test-phase7-validation.mjs    # Search and UI validation
│   ├── test-profile-auth.mjs         # Demo authentication and profile persistence
│   ├── test-search-engine.mjs        # Search indexing unit tests
│   ├── test-server-security.mjs      # Server filesystem traversal & HTTP hardening
│   └── validate-downloads.mjs        # Catalog download artifacts audit
├── .env.example             # Environment variable template (safe, no secrets)
├── config.example.js        # Browser configuration template (safe, no secrets)
├── index.html               # Storefront Single Page Application entrypoint
├── package.json             # Project configuration and test scripts
└── server.cjs               # Hardened Node.js local development server
```

---

## 📜 License

DevStore is released under the MIT License. All cataloged applications are open-source projects governed by their respective original developer licenses.

