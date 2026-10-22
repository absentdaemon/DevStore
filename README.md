# DevStore

> **Alternative of Google Play Store**

DevStore (Aether Market) is an open, independent, and ethical application marketplace designed to deliver a modern, fast, and transparent discovery and distribution platform for Windows desktop browsers and Android mobile devices / PWAs.

---

## 🌟 Key Features

- **Modern Discovery Interface**: Responsive desktop and mobile UI with clean visual hierarchy, smooth transitions, and dark theme support.
- **Instant Search & Autocomplete**: Debounced fuzzy search indexing titles, categories, developers, and tags with keyboard navigation.
- **Category Navigation**: Faceted filtering across Developer Tools, Productivity, Utilities, Games, Media, and Graphics.
- **Detailed App Listings**: Complete metadata views with platform badges (Windows / Android), screenshot carousels, permission declarations, and version history.
- **Clean Architecture**: Lightweight, dependency-free vanilla JS & CSS frontend with optional Node.js static/API server (`server.cjs`).
- **Comprehensive Test Suite**: Automated unit and browser test scripts included in `tests/`.

---

## 🚀 Getting Started

### Prerequisites

- Any modern web browser (Chrome, Firefox, Edge, Safari)
- (Optional) Node.js 18+ to run the local server

### Running Locally

#### Option 1: Direct in Browser
Open `index.html` directly in your browser or serve via any static file server (e.g., Live Server, Python `http.server`).

#### Option 2: Using the Included Node Server
```bash
node server.cjs
```
Then navigate to:
```
http://localhost:3000
```

---

## 📁 Project Structure

```text
DevStore/
├── assets/          # Icons, screenshots, and visual assets
├── css/             # Modern CSS styles and responsive design system
├── data/            # Application catalog JSON datasets
├── js/              # Application logic, router, and search modules
├── research/        # Behavioral reverse-engineering and architecture notes
├── tests/           # Functional and end-to-end tests
├── index.html       # Single Page Application entrypoint
├── server.cjs       # Node.js development server
└── SPEC.md          # Complete project and feature specification
```

---

## 📜 License & Compliance

All branding, user interface code, visual styles, and backend services in DevStore are 100% original, clean-room implementations designed as an open and ethical alternative platform.
