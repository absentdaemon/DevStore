# Aether Market: Independent App Marketplace Specification

**Document Version:** 1.0.0  
**Status:** Approved for Milestone Planning  
**Target Environments:** Windows Web Browsers & Mobile Android Browsers / PWA  
**Research References:**
- Web Reverse-Engineering Report: [`research/google-play-search.md`](file:///d:/Playstore/research/google-play-search.md)
- Android Diagnostic Report: [`research/google-play-android.md`](file:///d:/Playstore/research/google-play-android.md)
- Skill Guidelines: [`reverse-engineer-anything`](file:///C:/Users/Asus/.gemini/config/skills/reverse-engineer-anything/SKILL.md)

---

## 1. Project Overview & Scope

### 1.1 Mission & Vision
**Aether Market** is an open, independent, and ethical application marketplace designed to deliver a modern, fast, and transparent discovery and distribution platform for Windows desktop browsers and Android mobile devices.

### 1.2 Core Tenets
1. **Originality & Clean-Room Architecture:** Google Play Store serves solely as an external behavioral reference model for user expectations, not as code or asset provenance. All branding, user interface code, visual styles, and backend services are 100% original.
2. **Safety & Transparency:** No deceptive installation tactics, no background silent installs, and no unauthorized distribution. Clear permission declarations and privacy indicators for all catalog items.
3. **Responsive Multi-Platform Experience:** A unified responsive design that feels native on desktop Windows browsers (mouse/keyboard workflows) and Android devices (touch gestures, bottom navigation, mobile viewport ergonomics).
4. **Beginner-Friendly Maintainability:** Modular, clean architecture avoiding brittle build systems or unnecessary heavy frameworks.

### 1.3 Scope Boundaries
* **In Scope (MVP):**
  - Original branding ("Aether Market") and curated responsive UI.
  - Curated, seeded demonstration catalog of authorized open-source and utility applications.
  - Search engine with instant debounced autocomplete suggestions.
  - Category navigation and filtering (Tools, Productivity, Utilities, Games, Media).
  - Detailed application listing pages with versioning, platform badges, screenshots, and metadata.
  - Graceful empty states, loading skeletons, and accessible keyboard/screen reader navigation.
  - Desktop-first and mobile-responsive viewport layouts.
* **Out of Scope for MVP:**
  - Real user account registration or OAuth authentication.
  - Real monetary transactions or payment processing (a clearly labeled sandbox simulation is defined for future premium tiers).
  - Modifying, hooking, or communicating with the proprietary Google Play Store app or Google Play Services.

---

## 2. Research Evidence & Behavior Extraction

The following behavioral baseline was established from live tests conducted in [`research/google-play-search.md`](file:///d:/Playstore/research/google-play-search.md).

### 2.1 Extraction Matrix

| Interface Behavior | Verified Observations (Evidence from `google-play-search.md`) | Design Inferences & Adaptations | Features Defined as Original Choices |
| :--- | :--- | :--- | :--- |
| **1. Default Header & Search Trigger** | Top banner contains navigation links, logo, and a `Button "Search"` ([Section 2, State 1](file:///d:/Playstore/research/google-play-search.md#L37-L44)). | Collapsed search keeps header clutter-free; on wide desktop screens, search can be persistent. | Aether Market provides a persistent search input on desktop (>1024px) and an expandable search bar on mobile (<768px). |
| **2. Expanded Search Input** | Clicking Search transitions header into a `combobox` containing `textbox "Search Google Play"` with placeholder `"Search for apps & games"` ([Section 2, State 2](file:///d:/Playstore/research/google-play-search.md#L47-L55)). | ARIA combobox pattern (`role="combobox"`, `aria-expanded`, `aria-autocomplete="list"`) ensures accessibility compliance. | Explicit clear button (`aria-label="Clear search input"`), back button for mobile dismiss, and `Escape` key shortcut. |
| **3. Input & Clearing Lifecycle** | Textbox supports live input; clear button appears once text length > 0; uses `jsaction` bindings ([Section 4.1](file:///d:/Playstore/research/google-play-search.md#L114-L123)). | Clearing immediately refocuses the input field and dismisses suggestions. | Pure standards-based event listeners (`input`, `keydown`, `click`) replacing complex Google JSAction bindings. |
| **4. Autocomplete Suggestions** | Debounced POST to `batchexecute?rpcids=teXCtc` generates dropdown listbox options linking to `/store/search?q=...&c=apps` ([Section 3.1 & 5](file:///d:/Playstore/research/google-play-search.md#L137-L144)). | Client-side debouncing (~250-300ms) minimizes server requests and DOM thrashing. | Client-side fuzzy substring search over indexed catalog titles, keywords, and tags; keyboard arrow-key navigation. |
| **5. Search Submission & Results** | Pressing Enter or clicking a suggestion routes to `/store/search?q=<query>&c=apps`, hydrating result cards ([Section 3.1](file:///d:/Playstore/research/google-play-search.md#L68-L80)). | URL query parameters enable shareable URLs, bookmarking, and browser history traversal. | Standard URL path: `/?q={query}&category={category}` with HTML5 `history.pushState` integration. |
| **6. Category Controls** | Category pills under search bar toggle between content types (`c=apps`, `c=books`) ([Section 3.1](file:///d:/Playstore/research/google-play-search.md#L71-L75)). | Horizontal pill bar provides immediate facet filtering without retyping query. | Dynamic category pill carousel with active indicator ("All", "Productivity", "Utilities", "Games", "Development"). |
| **7. Application Result Cards** | Cards display icon, title, developer, numeric rating (e.g. `4.7`), and IAP indicators ([Section 3.2](file:///d:/Playstore/research/google-play-search.md#L82-L91)). | High scannability requires standardized thumbnail aspect ratios and distinct typographic hierarchy. | Original card design with hover micro-animations, platform compatibility chips (Windows / Android), and verified license tags. |
| **8. Empty Results State** | Querying non-matching string displays `"No results for {query} Here are some apps you might like"` plus recommendations ([Section 3.3](file:///d:/Playstore/research/google-play-search.md#L93-L101)). | Zero-result screens should never be a dead end; always provide alternative discovery paths. | Informative empty-state illustration, helpful query adjustment tips, and a "Featured Discovery" card carousel. |
| **9. Loading & Errors** | Asynchronous RPC hydration with pre-rendered initial state; fallback HTTP 200 ([Section 4.2](file:///d:/Playstore/research/google-play-search.md#L125-L136)). | Skeleton loaders prevent cumulative layout shift (CLS) during asynchronous fetches. | Lightweight animated CSS shimmer skeleton placeholders during search indexing and page transitions. |

### 2.2 Boundary Note on Android Research
Per [`research/google-play-android.md`](file:///d:/Playstore/research/google-play-android.md), external inspection of the physical Android device was blocked due to missing ADB and lack of local decompilation tooling. Therefore:
- **No private Android OS APIs, proprietary Play Store services, or undocumented IPC endpoints are assumed or emulated.**
- All mobile interactions are engineered to follow standard web specifications, Progressive Web App (PWA) guidelines, and standard Android APK download protocols.

---

## 3. Functional Requirements

### 3.1 Navigation & Browsing
- **FR-1.1 (Home Feed):** The homepage must display:
  - Hero banner highlighting featured open-source/utility apps.
  - Category quick-links.
  - "Top Rated Apps" section.
  - "New & Updated" section.
- **FR-1.2 (Category Browsing):** Users must be able to filter the catalog by categories: `All`, `Productivity`, `Developer Tools`, `Utilities`, `Games`, and `Media`.
- **FR-1.3 (Platform Filtering):** Users must be able to toggle filters between `All Platforms`, `Windows Web`, and `Android (APK)`.

### 3.2 Search Experience
- **FR-2.1 (Search Activation):**
  - On desktop viewports (>= 768px): Search bar is persistently visible in the top header.
  - On mobile viewports (< 768px): Header displays a search icon that expands a full-width search overlay when tapped.
- **FR-2.2 (Instant Autocomplete):** As the user types (minimum 2 characters), a debounced (250ms) dropdown list must show up to 6 matching suggestions highlighting matching substrings.
- **FR-2.3 (Search Execution):** Submitting a query (via Enter, clicking search button, or selecting a suggestion) updates the results view and reflects the state in the URL (`?q={query}&c={category}`).
- **FR-2.4 (Search Clearing):** A clear button ("✕") appears when text is entered. Clicking it clears the text, closes suggestions, and restores focus to the input field.
- **FR-2.5 (Empty Query Fallback):** If a search yields zero matches, display the exact query string, advice for refining the search, and a curated list of top alternative apps.

### 3.3 Application Details & Media
- **FR-3.1 (App Detail Page):** Each application must feature a dedicated view displaying:
  - App Name, Developer/Author, License (e.g. MIT, Apache 2.0).
  - Primary Icon (high-DPI SVG/PNG).
  - Star Rating score (0.0 to 5.0) and review count.
  - Supported Platforms (Windows, Android) and current Version tag.
  - File Size and Last Updated date.
  - Screenshots gallery/carousel.
  - Rich Markdown-formatted description and changelog.
  - Declared Permissions / System Requirements table.
- **FR-3.2 (Download Action):**
  - Download button provides explicit download links for authorized targets (e.g., `.apk` for Android, Web link / `.zip` for Windows).
  - No silent downloads or automated installations.
  - Confirmation dialog informs the user of file type and installation steps.

### 3.4 Ratings & Reviews (MVP Staging)
- **FR-4.1 (Display Ratings):** Display pre-seeded community reviews with author name, star rating (1-5), submission date, and review comment.
- **FR-4.2 (Mock Submission):** Provide a "Write a Review" modal allowing users to enter a star rating and comment, with client-side validation and immediate local optimistic UI updates.

---

## 4. Non-Functional Requirements

### 4.1 Performance & Responsiveness
- **NFR-1.1 (Load Speed):** Initial load time under 1.5 seconds on 4G networks; Largest Contentful Paint (LCP) < 2.0s.
- **NFR-1.2 (Client-Side Search Latency):** Search filtering and autocomplete suggestions must render within 50ms of debounce completion.
- **NFR-1.3 (Zero Layout Shift):** Cumulative Layout Shift (CLS) score < 0.05 through fixed skeleton dimensions and pre-allocated image containers.

### 4.2 Accessibility (a11y) & WCAG 2.1 AA Compliance
- **NFR-2.1 (Keyboard Traversal):** Full functional navigation achievable via `Tab`, `Shift+Tab`, `Enter`, `Escape`, and `Arrow Keys`.
- **NFR-2.2 (ARIA Search Semantics):** Search input complies with the W3C ARIA Combobox pattern (`role="combobox"`, `aria-autocomplete="list"`, `aria-expanded`, `aria-controls="search-suggestions"`).
- **NFR-2.3 (Color Contrast):** Text and interactive elements maintain a minimum contrast ratio of 4.5:1 for normal text and 3:1 for large text / UI controls.
- **NFR-2.4 (Touch Targets):** All buttons and interactive links on mobile viewports adhere to a minimum physical touch target of 48x48 CSS pixels.

### 4.3 Security & Ethics
- **NFR-3.1 (No Malicious Code / Warez):** Only open-source, public domain, or self-authored demonstration packages are distributed.
- **NFR-3.2 (Content Security Policy):** Strict CSP preventing unauthorized script injection and unsafe evals.
- **NFR-3.3 (Data Privacy):** No personal telemetry, user tracking, or cookie harvesting without consent.

---

## 5. Information Architecture & Sitemap

```
/ (Root)
│
├── Homepage / Catalog Feed (/)
│     ├── Hero Carousel (Featured Spotlight)
│     ├── Category Filter Bar
│     ├── Top Trending Grid
│     └── New & Updated Grid
│
├── Search Results View (/?q={query}&category={category}&platform={platform})
│     ├── Search Summary & Active Filters
│     ├── Results Card Grid
│     └── Empty State Recommendations (conditional)
│
├── App Detail View (/?app={app_id})
│     ├── Header Summary & Install/Download Trigger
│     ├── Media / Screenshot Carousel
│     ├── About this App & Feature Highlights
│     ├── Technical Specifications (Version, Size, Package ID, License)
│     ├── Declared Permissions Matrix
│     └── Ratings & User Reviews
│
└── About & Distribution Policy (/?page=about)
      ├── Open Source Manifest
      └── Developer Submission & Safety Policy
```

---

## 6. User Journeys

### Journey 1: Quick Search & Exploration (Desktop)
1. User enters Aether Market on Windows browser.
2. Focuses search input using click or keyboard shortcut (`/`).
3. Types `"calc"`. Autocomplete displays `"Calculator Plus"` and `"Scientific Matrix Calc"`.
4. Presses `ArrowDown` to highlight `"Calculator Plus"` and presses `Enter`.
5. Page updates to search view filtered to `"calc"`.
6. Clicks the `"Calculator Plus"` card, navigates to App Detail View.
7. Reads description, verifies Android & Windows compatibility, clicks "Download".

### Journey 2: Mobile Category Discovery & Empty Query Recovery (Android Browser)
1. User opens marketplace on Android Chrome.
2. Views mobile-optimized layout with bottom navigation bar.
3. Taps search icon in top header; search overlay expands with focused input.
4. Types accidental typo `"qwertyxyz"`.
5. System displays empty state: *"No applications found for 'qwertyxyz'"*.
6. Helpful discovery carousel presents *"Popular Utilities"*.
7. User taps `"Terminal Utility"`, navigates to detail page, and downloads APK.

---

## 7. Data Model

The catalog is managed through a normalized, validated JSON schema:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "AetherMarketCatalog",
  "type": "object",
  "required": ["version", "updatedAt", "categories", "applications"],
  "properties": {
    "version": { "type": "string" },
    "updatedAt": { "type": "string", "format": "date-time" },
    "categories": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "label", "icon"],
        "properties": {
          "id": { "type": "string" },
          "label": { "type": "string" },
          "icon": { "type": "string" }
        }
      }
    },
    "applications": {
      "type": "array",
      "items": {
        "type": "object",
        "required": [
          "id",
          "name",
          "developer",
          "category",
          "rating",
          "reviewCount",
          "iconUrl",
          "version",
          "platforms",
          "license",
          "description",
          "downloads"
        ],
        "properties": {
          "id": { "type": "string", "pattern": "^[a-z0-9_.]+$" },
          "name": { "type": "string" },
          "tagline": { "type": "string" },
          "developer": { "type": "string" },
          "category": { "type": "string" },
          "rating": { "type": "number", "minimum": 0, "maximum": 5 },
          "reviewCount": { "type": "integer", "minimum": 0 },
          "iconUrl": { "type": "string" },
          "version": { "type": "string" },
          "sizeBytes": { "type": "integer" },
          "platforms": {
            "type": "array",
            "items": { "enum": ["windows", "android", "web"] }
          },
          "license": { "type": "string" },
          "description": { "type": "string" },
          "screenshots": {
            "type": "array",
            "items": { "type": "string" }
          },
          "permissions": {
            "type": "array",
            "items": { "type": "string" }
          },
          "downloads": {
            "type": "object",
            "properties": {
              "apk": { "type": "string" },
              "web": { "type": "string" },
              "windows": { "type": "string" }
            }
          }
        }
      }
    }
  }
}
```

---

## 8. Recommended Architecture & Technology Choices

### 8.1 Evaluated Architecture Options

| Architecture Option | Strengths | Trade-offs / Weaknesses | Fit for Project Scope |
| :--- | :--- | :--- | :---: |
| **Option A: Heavy SPA Framework (Next.js / Angular / Nuxt)** | Comprehensive ecosystem, built-in routing. | Complex node toolchain, heavy runtime bundles, frequent deprecations, unnecessary for seeded catalog. | Overkill |
| **Option B: Pure Modern Web App (HTML5 + Modular ES6 + Modern Vanilla CSS System)** | **Blazing fast, zero runtime overhead, 100% native browser support on Windows & Android, instant hot-reload, zero build errors.** | Requires disciplined code modularity (easily maintained via standard ES modules). | **Recommended (Best Fit)** |
| **Option C: Electron / Heavy Native Android APK first** | Full native OS integrations. | High prerequisite barrier (requires JDK, Android SDK, Gradle, C++ compilation); blocked by environment. | Incompatible with current prerequisites |

### 8.2 Recommended Stack
1. **Core Web App:**
   - **Structure:** Semantic HTML5 (`<header>`, `<nav>`, `<main>`, `<article>`, `<section>`, `<footer>`).
   - **Styling:** Modern Vanilla CSS design system using CSS Variables (Custom Properties), fluid Typography (`clamp()`), CSS Grid, and Flexbox. Full dark-mode and high-contrast support.
   - **Logic & Routing:** Modular Vanilla JavaScript (ES6 Modules) with custom Router and Catalog Store.
2. **Catalog & Search Engine:**
   - Static-seeded JSON catalog (`data/catalog.json`) loaded asynchronously with client-side caching.
   - High-speed in-memory indexing with tokenized prefix and fuzzy substring matching.
3. **PWA & Android Compatibility:**
   - Web App Manifest (`manifest.json`) providing standalone display, app icons, and theme color for Android "Add to Home Screen".
   - Responsive Touch Navigation: Bottom navigation bar on mobile screen sizes; desktop header on wide screens.
4. **Dev Server & Testing:**
   - Local development using lightweight Node static server (or Vite if bundled compilation is ever required).
   - Automated testing via `node:test` for catalog/search logic and REA browser scenario captures for UI verification.

---

## 9. Seeded Catalog Specifications (Initial Demonstration Packages)

The MVP catalog will be seeded with 6 high-quality, authorized open-source / utility demonstration applications:

1. **Aether Calculator (`org.aether.calculator`):**
   - *Category:* Utilities | *Platforms:* Windows, Android | *License:* MIT
   - *Features:* Standard arithmetic, scientific functions, calculation history.
2. **Chronos Task Manager (`org.aether.chronos`):**
   - *Category:* Productivity | *Platforms:* Windows, Android, Web | *License:* Apache 2.0
   - *Features:* Kanban board, task timers, exportable task lists.
3. **Markdown Canvas (`org.aether.mdcanvas`):**
   - *Category:* Productivity | *Platforms:* Windows, Web | *License:* MIT
   - *Features:* Real-time markdown preview, syntax highlighting, offline auto-save.
4. **Retro Chess Arena (`org.aether.chess`):**
   - *Category:* Games | *Platforms:* Windows, Android | *License:* MIT
   - *Features:* Offline engine play, 2D chess board, move notation log.
5. **Weather Pulse (`org.aether.weather`):**
   - *Category:* Utilities | *Platforms:* Windows, Android | *License:* MIT
   - *Features:* Forecast widgets, atmospheric telemetry, offline cache.
6. **Pixel Pulse Audio Studio (`org.aether.audiopulse`):**
   - *Category:* Media | *Platforms:* Windows, Web | *License:* MIT
   - *Features:* Visual sound equalizer, synthesizer pad, sound recorder.

---

## 10. Testable Acceptance Criteria (MVP Features)

### AC-1: Header & Navigation
- [ ] On desktop (>768px), brand logo, category tabs, and search input are visible simultaneously.
- [ ] On mobile (<768px), header displays logo and search button; tapping search button reveals full-width search overlay.
- [ ] Navigation links update active state indicators and route without full page refreshes.

### AC-2: Autocomplete & Search Execution
- [ ] Typing `"chess"` into search input shows suggestions within 250ms debounce time.
- [ ] Clicking a suggestion navigates to `/?q=chess&category=all`.
- [ ] Submitting search displays matching cards containing `"Chess"` in title or tags.
- [ ] Clear button ("✕") clears the search box and restores focus.
- [ ] Keyboard `Escape` dismisses the suggestion dropdown.

### AC-3: Empty Search Results
- [ ] Querying `"nonexistentquery123"` displays the text `"No applications found for 'nonexistentquery123'"`.
- [ ] The empty results page displays at least 3 alternative featured recommendations.
- [ ] The HTTP response remains 200 without throwing unhandled exceptions.

### AC-4: App Detail View
- [ ] Clicking any application card opens the App Detail View.
- [ ] Detail view displays app title, icon, developer, rating, version, size, platforms, and description.
- [ ] Clicking "Back" returns to the previous search or catalog position.

### AC-5: Accessibility & WCAG Standards
- [ ] Entire search flow can be operated using only `Tab`, `ArrowDown`, `ArrowUp`, `Enter`, and `Escape`.
- [ ] All interactive elements feature distinct `:focus-visible` outlines.
- [ ] Color contrast meets WCAG 2.1 AA (tested ratio >= 4.5:1).

---

## 11. Implementation Milestones

```
[Milestone 1: Search & Catalog Engine Foundation]
  ├── Directory structure & design system tokens
  ├── Seeded catalog JSON schema & dataset
  ├── In-memory search & autocomplete engine
  └── Core responsive header & search bar
        │
        ▼
[Milestone 2: Marketplace Catalog & Results View]
  ├── Hero spotlight & trending app grids
  ├── Category filtering pills
  ├── Search results card grid
  └── Empty result recommendations view
        │
        ▼
[Milestone 3: App Detail Experience & Media]
  ├── Dedicated App Detail view
  ├── Screenshot gallery & specifications table
  ├── Download modal & platform selector
  └── Mock review submission modal
        │
        ▼
[Milestone 4: Mobile & PWA Optimization]
  ├── Mobile bottom navigation bar
  ├── Touch gesture tuning & mobile search overlay
  ├── Web App Manifest (`manifest.json`)
  └── Cross-browser verification (Windows & Android)
```

---

## 12. Plan for Milestone 1 (First Implementation Phase)

### 12.1 Objective
Deliver a functioning, interactive search experience with our seeded catalog on a responsive Windows browser view.

### 12.2 Files to be Created in Milestone 1
1. [`index.html`](file:///d:/Playstore/index.html): Semantic foundation, header, search combobox, suggestion listbox, and main results mount point.
2. [`css/design-system.css`](file:///d:/Playstore/css/design-system.css): Design tokens (colors, typography, spacing, shadows, animations).
3. [`css/components.css`](file:///d:/Playstore/css/components.css): Search bar, dropdown suggestions, cards, and buttons.
4. [`data/catalog.json`](file:///d:/Playstore/data/catalog.json): Seeded database of 6 demonstration apps.
5. [`js/search-engine.js`](file:///d:/Playstore/js/search-engine.js): Pure ES6 module for indexing, debouncing, substring matching, and ranking.
6. [`js/app.js`](file:///d:/Playstore/js/app.js): Application bootstrap, DOM event wiring, and ARIA state manager.

### 12.3 Required Dependencies & Approvals
* **Zero external runtime dependencies:** Milestone 1 uses standard ES6 modules, CSS Custom Properties, and native browser APIs.
* **No external package installation needed** for initial execution.

### 12.4 Verification & Acceptance Tests
1. **Windows Browser Verification:** Run a lightweight local dev server, open in Chrome/Edge, and verify:
   - Search input displays placeholder `"Search apps, games & tools..."`.
   - Typing `"ch"` renders `"Retro Chess Arena"` and `"Chronos Task Manager"` in suggestions.
   - Selecting a suggestion filters the view and updates the URL.
2. **Automated Verification:** Use REA's `capture_browser_scenario` to launch headless Chromium, perform automated typing, capture accessibility tree, and assert complete matching.
