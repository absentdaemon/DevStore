# DevStore Visual Audit: Reference vs. Implementation Baseline

**Target:** High-Fidelity Google Play Store Web Interface Recreation  
**Reference Website:** [Google Play Store](https://play.google.com/store)  
**Date of Inspection:** October 2026  
**Audited Viewports:**
- Desktop: `1440 × 900`
- Laptop: `1280 × 800`
- Mobile: `390 × 844`

---

## 1. Reference Website Architecture & Measurements

From captured and verified browser scenario screenshots (`ref-desktop-1440.png`, `ref-laptop-1280.png`, `ref-mobile-390.png`):

### 1.1 Header & Navigation Bar
- **Canvas & Elevation:** Pure white background (`#ffffff`), 64px fixed/sticky height, subtle hairline border-bottom (`1px solid #dadce0`).
- **Brand Footprint:** Left-aligned logo mark (32×32px) + product name "Google Play" (DevStore brand: 20px, font-weight 500, `#202124`, letter-spacing -0.2px).
- **Primary Category Tabs:** Immediately follows logo footprint on desktop/laptop:
  - Tabs: `Games` (active by default), `Apps`, `Books`, `Kids`.
  - Active Tab Style: Text `#01875f` (Google Play Green), bold font-weight (500-600), with a crisp 3px bottom indicator bar (`#01875f`) aligned with the bottom border.
  - Inactive Tab Style: Text `#5f6368`, font-weight 500, font-size 14px, hover color `#202124`, padding `18px 16px`.
- **Top-Right Action Bar:**
  - Search trigger: Circular icon button (`40×40px`, hover background `#f1f3f4`, `#5f6368` magnifying glass icon). Does NOT show a permanent text box in desktop default state; expands on click.
  - Help trigger: Circular icon button (`?` inside circle, `#5f6368`).
  - Profile avatar: Circular avatar badge (`32×32px`, grey circle with user silhouette `#5f6368`).

### 1.2 Device Target / Subheader Filter Bar
- **Position & Background:** Directly below the 64px header, white background (`#ffffff`), height ~52px, vertical alignment centered.
- **Pills Layout:**
  - Active Pill (`Windows PC`): Light mint background (`#e6f4ea`), border `none` or matching light mint, text `#01875f` (font-size 14px, font-weight 500), border-radius 8px / pill shape. Accompanied by device icon.
  - Hairline Separator: 1px vertical line (`#dadce0`), height 24px, margin `0 12px`.
  - Inactive Target Pills: `📱 Phone`, `💻 Tablet`, `📺 TV`, `🖥 Desktop`, `⌚ Watch`, `🥽 XR headset`. Outlined with `1px solid #dadce0`, background `#ffffff`, text `#3c4043`, font-size 14px, border-radius 8px, hover background `#f8f9fa`.
  - Responsive / Overflow: On narrower viewports and mobile, horizontal scroll with a circular `>` next-arrow floating button.

### 1.3 Hero Feature Showcase (Carousel)
- **Geometry:** Horizontal carousel of featured app cards, card width ~540px on 1440/1280 desktop, border-radius 8px, dark background (`#121212` / `#000000`).
- **Content Hierarchy:**
  - Top/Center: High-resolution featured game/app key art graphic with subtle border and neon frame. Play emblem in top right corner.
  - Lower Half:
    - Headline: 20-22px, font-weight 600, color `#ffffff` (e.g., "Play SD Gundam G Generation ETERNAL on PC").
    - Subtitle: 13-14px, color `#9aa0a6` ("Get started with Google Play Games").
    - App Metadata Row: Square app icon (44×44px, border-radius 8px), title & rating text in white/gray, and a vibrant Google Play green install pill button (`#00875e` / `#01875f`, text `#ffffff`, border-radius 20px, font-weight 500, "Install on Windows").

### 1.4 Section Titles & App Cards
- **Section Headers:**
  - Title: 22px, font-weight 500, color `#202124`.
  - Subtitle: 13px, color `#5f6368` (e.g., "Play with Google Play Games on PC").
  - Navigation Circle: Circular button with arrow icon (`→`) on the right side of the section header.
- **Card Grid & Metrics:**
  - Clean white canvas, generous gutters (max-width ~1280px centered or 24px side gutters).
  - Cards are compact: 56×56px square icons (border-radius 12px), title 14px `#202124` medium weight (max 2 lines), category 12px `#5f6368`, rating `4.8 ★` in `#5f6368`.
  - Media cards for video/trailer highlights have 16:9 previews with central round play button.

### 1.5 Mobile Layout (390 × 844)
- **Top Bar:** Pure white, brand logo + "Google Play", search icon, help icon, profile icon.
- **Category Tabs:** Rendered in a sub-header row (`Games`, `Apps`, `Books`, `Kids`) with green underline indicator.
- **Device Filter Bar:** Horizontally scrollable row (`Windows PC`, `Phone`, `Tablet`, `>`).
- **Card Hierarchy:** Single-column hero card with rounded corners, followed by media preview cards and vertical app list cards.
- **Crucial Observation:** The public Google Play web store does *not* render an app-like bottom navigation tab bar on mobile web. Navigation is anchored at the top.

---

## 2. Baseline DevStore Audit (Current Implementation Discrepancies)

Inspected via `devstore-baseline-1440.png`, `devstore-baseline-1280.png`, and `devstore-baseline-390.png`.

### The 5 Largest Visual Discrepancies:

| # | Discrepancy | Current DevStore (Baseline) | Google Play Store Reference | Priority |
|---|-------------|----------------------------|----------------------------|----------|
| **1** | **Canvas Theme & Surfaces** | Dark futuristic slate (`#0a0f1d`) with heavy dark-mode cards, glowing borders, and neon gradients. | Clean, bright `#ffffff` background with light `#f8f9fa` neutral surfaces and `#dadce0` subtle hairlines. Hero cards are black (`#121212`) containers embedded in a white page. | **CRITICAL** |
| **2** | **Header & Navigation Structure** | Centered giant search input with `Press '/' to focus`, theme switcher, and no category tabs in the header. | Header has brand logo, followed immediately by horizontal category tabs (`Games`, `Apps`, `Dev Tools`, `Utilities`) with green active underline (`#01875f`). Search is an expandable circular icon on the right. | **CRITICAL** |
| **3** | **Subheader & Filter Controls** | Category pills mixed with platform pills on the right side. | Dedicated white subheader bar with active green device pill (`🖥 Windows PC`), vertical divider (`#dadce0`), and outlined device chips (`Phone`, `Tablet`, `TV`, `Desktop`). | **HIGH** |
| **4** | **Hero Feature Layout & Density** | Huge marketing hero section with badge "VERIFIED CLEAN PACKAGES", large headline "Discover High-Performance...", and large purple action buttons. | Multi-card horizontal carousel of dark 16:9 featured game/app banners with embedded app icon, title, and green "Install on Windows" pill button. | **HIGH** |
| **5** | **App Card Geometry & Spacing** | Oversized dark cards with bulky metadata, platform badges, description paragraphs, and glowing borders. | Compact, elegant app cards: 56px square icons, 14px 2-line title, category, and star rating (`4.8 ★`). No bloated descriptions or platform tags in cards. | **HIGH** |
| **6 (Mobile)** | **Mobile Navigation Architecture** | Redundant bottom tab bar (`Home`, `Apps`, `Games`, `Search`) obscuring content. | Clean top-anchored tabs (`Games`, `Apps`, etc.) and scrollable device chip row matching the desktop hierarchy. | **MEDIUM** |

---

## 3. Action Plan for Redesign

1. **Design Tokens (`css/design-system.css`):**
   - Switch base background to `#ffffff`, surface to `#ffffff`, surface-variant to `#f8f9fa`, borders to `#dadce0`.
   - Set primary text color to `#202124`, secondary to `#5f6368`, accent green to `#01875f` (Google Play Green), mint background to `#e6f4ea`.
   - Update typography to 14px base, 22px section headings, Roboto / Google Sans fallbacks.
2. **Header & Navigation (`index.html`, `css/components.css`, `js/app.js`):**
   - Reconstruct header: DevStore Logo + Brand wordmark (`#202124`), immediate category tabs (`Games`, `Apps`, `Dev Tools`, `Utilities`) with green active indicator bar.
   - Right side: Search icon button (`#5f6368`), Help icon button, Profile avatar.
   - Implement expandable Google Play search bar: clicking search icon smoothly expands an overlay search bar with autocomplete suggestions, escape key to close, enter to search.
3. **Subheader Device Pills:**
   - Add dedicated device filter bar: `🖥 Windows PC` (active: mint `#e6f4ea`, green `#01875f`), vertical hairline divider `#dadce0`, outlined device pills (`📱 Phone`, `💻 Tablet`, `📺 TV`, `🖥 Desktop`, `⌚ Watch`).
4. **Hero Banner Carousel:**
   - Re-architect hero into a multi-card featured banner carousel with dark `#121212` backgrounds, rich visual graphics, white typography, app icon (44px), rating, and green "Install on Windows" pill button (`#01875f`).
5. **Card Grid & Presentation:**
   - Standardize app discovery rows: Section title (22px `#202124`) + subtitle (13px `#5f6368`) + arrow icon button.
   - Cards: 56px rounded icons (12px radius), title 14px medium, category 12px gray, rating `★ 4.8`.
   - Media highlight cards with video thumbnail and centered play button.
6. **Detail View:**
   - Clean white detail page matching Google Play layout: 72px icon, title (28px `#202124`), author (`#01875f`), rating/downloads row, green Install pill button (`#01875f`), screenshot carousel, "About this app", and data safety cards.
7. **Responsive & Mobile Viewport:**
   - Clean top header + category tabs + scrollable device pills for mobile (390px). Remove unnecessary bottom navigation bar to match reference.
