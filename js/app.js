/**
 * DevStore Application Core
 * High-Fidelity Google Play Store Recreation
 * State management, URL query routing, expandable search overlay,
 * hero featured carousel, accessible autocomplete, and detail views.
 */

import { SearchEngine } from './search-engine.js';
import { validateCatalog } from './catalog-validator.js';
import { notifications } from './notifications.js';
import { VideoPlayerController } from './video-player.js';
import { DownloadManager } from './download-manager.js';
import { modalManager } from './modal-manager.js';

// Clean SVG Icon Library
const ICONS = {
  devstore: `<svg viewBox="0 0 512 512" width="22" height="22" fill="none"><defs><linearGradient id="icGradTopCyan" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00b4d8"/><stop offset="100%" stop-color="#0077b6"/></linearGradient><linearGradient id="icGradMidCyan" x1="0%" y1="50%" x2="100%" y2="50%"><stop offset="0%" stop-color="#0096c7"/><stop offset="100%" stop-color="#0077b6"/></linearGradient><linearGradient id="icGradCoral" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff477e"/><stop offset="100%" stop-color="#f72585"/></linearGradient><linearGradient id="icGradAmber" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ffb703"/><stop offset="100%" stop-color="#fb8500"/></linearGradient><linearGradient id="icGradGreenTop" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#00e676"/><stop offset="100%" stop-color="#00c853"/></linearGradient><linearGradient id="icGradGreenBottom" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#00c853"/><stop offset="100%" stop-color="#00a844"/></linearGradient><clipPath id="icPlayClip"><path d="M 120 70 Q 100 55 100 85 L 100 427 Q 100 457 125 442 L 415 275 Q 440 256 415 237 Z"/></clipPath></defs><g clip-path="url(#icPlayClip)"><polygon points="100,55 270,256 345,160 100,55" fill="url(#icGradTopCyan)"/><polygon points="100,55 270,256 100,320" fill="url(#icGradMidCyan)"/><polygon points="100,320 270,256 120,445" fill="url(#icGradCoral)"/><polygon points="120,445 270,256 345,352 120,445" fill="url(#icGradAmber)"/><polygon points="270,256 440,256 345,160" fill="url(#icGradGreenTop)"/><polygon points="270,256 440,256 345,352" fill="url(#icGradGreenBottom)"/><line x1="100" y1="55" x2="270" y2="256" stroke="#ffffff" stroke-width="14" stroke-linecap="round"/><line x1="100" y1="320" x2="270" y2="256" stroke="#ffffff" stroke-width="14" stroke-linecap="round"/><line x1="120" y1="445" x2="270" y2="256" stroke="#ffffff" stroke-width="14" stroke-linecap="round"/><line x1="345" y1="160" x2="270" y2="256" stroke="#ffffff" stroke-width="14" stroke-linecap="round"/><line x1="345" y1="352" x2="270" y2="256" stroke="#ffffff" stroke-width="14" stroke-linecap="round"/><line x1="270" y1="256" x2="440" y2="256" stroke="#ffffff" stroke-width="14" stroke-linecap="round"/></g></svg>`,
  search: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  clear: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  back: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>`,
  star: `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
  play: `<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`,
  verified: `<svg viewBox="0 0 24 24" width="14" height="14" fill="#01875f"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#01875f" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
  appsDevice: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M4 6h18V4H4c-1.1 0-2 .9-2 2v11H0v3h14v-3H4V6zm19 2h-6c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h6c.55 0 1-.45 1-1V9c0-.55-.45-1-1-1zm-1 9h-4v-7h4v7z"/></svg>`,
  payments: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg>`,
  notifications: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/></svg>`,
  playPass: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2l2.4 7.2h7.6l-6.1 4.5 2.3 7.3-6.2-4.6-6.2 4.6 2.3-7.3-6.1-4.5h7.6z"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/></svg>`,
  help: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 16h-2v-2h2v2zm1.07-7.75l-.9.92C12.45 11.9 12 12.5 12 14h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z"/></svg>`,
  user: `<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
  close: `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`,
  trash: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>`,
  openInNew: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>`,
  checkShield: `<svg viewBox="0 0 24 24" width="24" height="24" fill="#01875f"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`,
  // Glyphs for application icons
  glyphChess: `<svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor"><path d="M19 22H5v-2h14v2zm-2.5-4H7.5l.8-4.8c-.8-.4-1.3-1.2-1.3-2.2 0-1.4 1.1-2.5 2.5-2.5.3 0 .6.1.9.2C10.8 7.6 11.8 7 13 7c1.4 0 2.6.9 3 2.2.3-.1.6-.2.9-.2 1.4 0 2.5 1.1 2.5 2.5 0 1-.5 1.8-1.3 2.2l.9 4.8v.5zM12 2a2 2 0 100 4 2 2 0 000-4z"/></svg>`,
  glyphCalc: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="18"></line><path d="M16 10h.01"></path><path d="M12 10h.01"></path><path d="M8 10h.01"></path><path d="M12 14h.01"></path><path d="M8 14h.01"></path><path d="M12 18h.01"></path><path d="M8 18h.01"></path></svg>`,
  glyphTask: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`,
  glyphEdit: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>`,
  glyphWeather: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line></svg>`,
  glyphAudio: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
  glyphTerminal: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
  glyphPalette: `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5"></circle><circle cx="17.5" cy="10.5" r=".5"></circle><circle cx="8.5" cy="7.5" r=".5"></circle><circle cx="6.5" cy="12.5" r=".5"></circle><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path></svg>`
};

// Demo User Account Profiles (Unverified local demo profiles)
const DEFAULT_USER = {
  name: 'Alex Mercer',
  email: 'alex.mercer@devstore.org',
  initial: 'A',
  avatarBg: 'linear-gradient(135deg, #01875f 0%, #34a853 100%)',
  installedApps: ['org.devstore.chess', 'org.devstore.terminal'],
  passActive: true,
  isDemo: true,
  isVerified: false
};

const DEMO_ACCOUNTS = [
  {
    name: 'Alex Mercer',
    email: 'alex.mercer@devstore.org',
    initial: 'A',
    avatarBg: 'linear-gradient(135deg, #01875f 0%, #34a853 100%)',
    installedApps: ['org.devstore.chess', 'org.devstore.terminal'],
    passActive: true,
    isDemo: true,
    isVerified: false
  },
  {
    name: 'Sarah Connor',
    email: 'sarah.c@devstore.org',
    initial: 'S',
    avatarBg: 'linear-gradient(135deg, #1a73e8 0%, #4285f4 100%)',
    installedApps: ['org.devstore.calculator', 'org.devstore.weather', 'org.devstore.audiopulse'],
    passActive: false,
    isDemo: true,
    isVerified: false
  }
];

function getGlyphSvg(glyphName) {
  switch (glyphName) {
    case 'chess': return ICONS.glyphChess;
    case 'calculate': return ICONS.glyphCalc;
    case 'task_alt': return ICONS.glyphTask;
    case 'edit_note': return ICONS.glyphEdit;
    case 'wb_sunny': return ICONS.glyphWeather;
    case 'equalizer': return ICONS.glyphAudio;
    case 'terminal': return ICONS.glyphTerminal;
    case 'palette': return ICONS.glyphPalette;
    default: return ICONS.devstore;
  }
}

export class DevStoreApp {
  constructor() {
    this.searchEngine = new SearchEngine();
    this.catalog = null;
    this.notifications = notifications;
    this.videoPlayer = new VideoPlayerController(notifications);
    this.downloadManager = new DownloadManager(notifications);
    this.modalManager = modalManager;

    this.state = {
      query: '',
      category: 'games', // Google Play defaults to Games
      platform: 'windows', // Google Play on desktop defaults to Windows PC
      activeAppId: null,
      suggestions: [],
      selectedSuggestionIndex: -1,
      debounceTimer: null,
      isSearchOpen: false
    };

    // User Account State
    try {
      const savedUser = localStorage.getItem('devstore_user');
      this.user = savedUser ? JSON.parse(savedUser) : { ...DEFAULT_USER };
    } catch {
      this.user = { ...DEFAULT_USER };
    }

    // DOM Elements
    this.dom = {
      searchToggleBtn: document.getElementById('search-toggle-btn'),
      searchOverlayBar: document.getElementById('search-overlay-bar'),
      searchInput: document.getElementById('search-input'),
      searchSubmitBtn: document.getElementById('search-submit-btn'),
      clearSearchBtn: document.getElementById('clear-search-btn'),
      searchCloseBtn: document.getElementById('search-close-btn'),
      searchCombobox: document.getElementById('search-combobox'),
      suggestionsListbox: document.getElementById('suggestions-listbox'),
      mainContent: document.getElementById('main-content'),
      detailView: document.getElementById('detail-view'),
      downloadModal: document.getElementById('download-modal'),
      screenshotLightboxModal: document.getElementById('screenshot-lightbox-modal'),
      reviewModal: document.getElementById('review-modal'),
      userAvatarBtn: document.getElementById('user-avatar-btn'),
      profilePopover: document.getElementById('profile-popover'),
      signinModal: document.getElementById('signin-modal'),
      manageAppsModal: document.getElementById('manage-apps-modal'),
      infoModal: document.getElementById('info-modal'),
      notificationsContainer: document.getElementById('store-notifications')
    };

    this.state.lightbox = { isOpen: false, appId: null, currentIndex: 0 };
    this.state.reviewDeviceFilter = 'all';
    this.state.supportAccordionOpen = false;
    this.state.videoState = {};
  }

  async init() {
    // Load and validate catalog data
    try {
      const response = await fetch('data/catalog.json');
      if (!response.ok) throw new Error(`HTTP error ${response.status}`);
      const rawCatalog = await response.json();
      const validation = validateCatalog(rawCatalog);
      if (!validation.valid) {
        console.error('Catalog validation errors:', validation.errors);
      }
      if (validation.warnings.length > 0) {
        console.warn('Catalog validation warnings:', validation.warnings);
      }
      this.catalog = validation.sanitizedCatalog;
      this.searchEngine.loadCatalog(this.catalog.applications);
    } catch (err) {
      console.error('Failed to load catalog:', err);
      this.dom.mainContent.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-title">Unable to Load Catalog</div>
          <div class="empty-state-desc">Could not connect to catalog data: ${err.message}</div>
        </div>
      `;
      return;
    }

    // Render user profile avatar in header
    this.renderUserAvatar();

    // Set up event listeners
    this.bindEvents();

    // Parse initial URL query state
    this.handleRouteFromUrl();

    // Listen to browser Back/Forward history events
    window.addEventListener('popstate', () => {
      this.handleRouteFromUrl(false);
    });
  }

  bindEvents() {
    // User profile avatar toggle
    if (this.dom.userAvatarBtn) {
      this.dom.userAvatarBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleProfilePopover();
      });
    }

    // Dismiss profile popover on outside click
    document.addEventListener('click', (e) => {
      if (this.dom.profilePopover && this.dom.profilePopover.classList.contains('open')) {
        if (!this.dom.profilePopover.contains(e.target) && !this.dom.userAvatarBtn.contains(e.target)) {
          this.closeProfilePopover();
        }
      }
    });

    // Close modals when clicking backdrop
    if (this.dom.signinModal) {
      this.dom.signinModal.addEventListener('click', (e) => {
        if (e.target === this.dom.signinModal) {
          this.closeSignInModal();
        }
      });
    }

    if (this.dom.manageAppsModal) {
      this.dom.manageAppsModal.addEventListener('click', (e) => {
        if (e.target === this.dom.manageAppsModal) {
          this.closeManageAppsModal();
        }
      });
    }

    // Search open / toggle
    if (this.dom.searchToggleBtn) {
      this.dom.searchToggleBtn.addEventListener('click', () => this.openSearch());
    }

    // Search close
    if (this.dom.searchCloseBtn) {
      this.dom.searchCloseBtn.addEventListener('click', () => this.closeSearch());
    }

    // Search input
    this.dom.searchInput.addEventListener('input', (e) => this.onSearchInput(e.target.value));
    this.dom.searchInput.addEventListener('keydown', (e) => this.onSearchKeydown(e));
    this.dom.searchInput.addEventListener('focus', () => {
      if (this.state.query.trim().length > 0) {
        this.fetchSuggestions(this.state.query);
      }
    });

    // Clear search button
    this.dom.clearSearchBtn.addEventListener('click', () => {
      this.clearSearch();
      this.dom.searchInput.focus();
    });

    // Submit search on button click
    if (this.dom.searchSubmitBtn) {
      this.dom.searchSubmitBtn.addEventListener('click', () => {
        const val = this.dom.searchInput.value.trim();
        if (val) this.submitSearch(val);
      });
    }

    // Global keyboard shortcut '/' to open search, and 'Escape' to dismiss
    document.addEventListener('keydown', (e) => {
      if (e.key === '/' && document.activeElement !== this.dom.searchInput) {
        e.preventDefault();
        this.openSearch();
      } else if (e.key === 'Escape') {
        if (this.state.lightbox && this.state.lightbox.isOpen) {
          this.closeScreenshotLightbox();
        } else if (this.dom.reviewModal && this.dom.reviewModal.classList.contains('open')) {
          this.dom.reviewModal.classList.remove('open');
        } else if (this.dom.profilePopover && this.dom.profilePopover.classList.contains('open')) {
          this.closeProfilePopover();
        } else if (this.dom.signinModal && this.dom.signinModal.classList.contains('open')) {
          this.closeSignInModal();
        } else if (this.dom.manageAppsModal && this.dom.manageAppsModal.classList.contains('open')) {
          this.closeManageAppsModal();
        } else if (this.state.isSearchOpen) {
          this.closeSearch();
        }
      } else if (this.state.lightbox && this.state.lightbox.isOpen) {
        if (e.key === 'ArrowLeft') {
          this.navigateLightbox(-1);
        } else if (e.key === 'ArrowRight') {
          this.navigateLightbox(1);
        }
      }
    });

    // Close suggestions on outside click
    document.addEventListener('click', (e) => {
      if (!this.dom.searchCombobox.contains(e.target) && e.target !== this.dom.searchToggleBtn) {
        this.hideSuggestions();
      }
    });
  }

  openSearch() {
    this.state.isSearchOpen = true;
    this.dom.searchOverlayBar.classList.add('open');
    this.dom.searchInput.focus();
    if (this.state.query.trim().length > 0) {
      this.fetchSuggestions(this.state.query);
    }
  }

  closeSearch() {
    this.state.isSearchOpen = false;
    this.dom.searchOverlayBar.classList.remove('open');
    this.hideSuggestions();
  }

  // --------------------------------------------------------------------------
  // Search Autocomplete & ARIA Combobox
  // --------------------------------------------------------------------------
  onSearchInput(val) {
    this.state.query = val;
    this.state.selectedSuggestionIndex = -1;

    if (val.trim().length > 0) {
      this.dom.clearSearchBtn.classList.add('visible');
    } else {
      this.dom.clearSearchBtn.classList.remove('visible');
      this.hideSuggestions();
      return;
    }

    clearTimeout(this.state.debounceTimer);
    this.state.debounceTimer = setTimeout(() => {
      this.fetchSuggestions(val);
    }, 120);
  }

  fetchSuggestions(query) {
    const suggestions = this.searchEngine.autocomplete(query, 5);
    this.state.suggestions = suggestions;
    this.state.selectedSuggestionIndex = -1;
    this.renderSuggestions(suggestions);
  }

  renderSuggestions(suggestions) {
    if (!suggestions || suggestions.length === 0) {
      this.hideSuggestions();
      return;
    }

    this.dom.suggestionsListbox.innerHTML = suggestions.map((item, index) => `
      <div 
        class="suggestion-item" 
        id="sug-item-${index}" 
        role="option" 
        aria-selected="false" 
        data-index="${index}"
        data-app-id="${item.id}"
      >
        <div class="suggestion-left">
          <span class="suggestion-icon">${ICONS.search}</span>
          <span class="suggestion-name">${this.highlightMatch(item.name, this.state.query)}</span>
        </div>
        <span class="suggestion-meta">${item.category || ''}</span>
      </div>
    `).join('');

    this.dom.suggestionsListbox.querySelectorAll('.suggestion-item').forEach(el => {
      el.addEventListener('click', () => {
        const appId = el.getAttribute('data-app-id');
        this.closeSearch();
        this.selectApp(appId);
      });
    });

    this.dom.suggestionsListbox.classList.add('visible');
    this.dom.searchCombobox.setAttribute('aria-expanded', 'true');
  }

  hideSuggestions() {
    this.dom.suggestionsListbox.classList.remove('visible');
    this.dom.searchCombobox.setAttribute('aria-expanded', 'false');
    this.dom.searchInput.removeAttribute('aria-activedescendant');
    this.state.selectedSuggestionIndex = -1;
  }

  highlightMatch(text, query) {
    if (!query) return this.escapeHtml(text);
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return this.escapeHtml(text).replace(regex, '<strong>$1</strong>');
  }

  onSearchKeydown(e) {
    const { suggestions, selectedSuggestionIndex } = this.state;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length === 0) return;
      const nextIndex = (selectedSuggestionIndex + 1) % suggestions.length;
      this.highlightSuggestion(nextIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length === 0) return;
      const prevIndex = (selectedSuggestionIndex - 1 + suggestions.length) % suggestions.length;
      this.highlightSuggestion(prevIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
        const chosen = suggestions[selectedSuggestionIndex];
        this.closeSearch();
        this.selectApp(chosen.id);
      } else {
        const val = this.dom.searchInput.value.trim();
        if (val) {
          this.closeSearch();
          this.submitSearch(val);
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      this.closeSearch();
    }
  }

  highlightSuggestion(index) {
    const items = this.dom.suggestionsListbox.querySelectorAll('.suggestion-item');
    items.forEach((item, i) => {
      if (i === index) {
        item.classList.add('selected');
        item.setAttribute('aria-selected', 'true');
        this.dom.searchInput.setAttribute('aria-activedescendant', item.id);
        item.scrollIntoView({ block: 'nearest' });
      } else {
        item.classList.remove('selected');
        item.setAttribute('aria-selected', 'false');
      }
    });
    this.state.selectedSuggestionIndex = index;
  }

  submitSearch(query) {
    this.state.query = query;
    this.state.activeAppId = null;
    this.hideSuggestions();
    this.syncUrl();
    this.renderCurrentView();
  }

  clearSearch() {
    this.state.query = '';
    this.dom.searchInput.value = '';
    this.dom.clearSearchBtn.classList.remove('visible');
    this.hideSuggestions();
    this.syncUrl();
    this.renderCurrentView();
  }

  // --------------------------------------------------------------------------
  // URL & Routing Synchronization
  // --------------------------------------------------------------------------
  syncUrl() {
    const params = new URLSearchParams();
    if (this.state.query) params.set('q', this.state.query);
    if (this.state.category && this.state.category !== 'all') params.set('category', this.state.category);
    if (this.state.platform && this.state.platform !== 'all') params.set('platform', this.state.platform);
    if (this.state.activeAppId) params.set('id', this.state.activeAppId);

    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState(null, '', newUrl);
  }

  handleRouteFromUrl(isInitial = true) {
    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';
    const category = params.get('category') || 'games';
    const platform = params.get('platform') || 'windows';
    const appId = params.get('id') || null;

    this.state.query = query;
    this.state.category = category;
    this.state.platform = platform;
    this.state.activeAppId = appId;

    this.dom.searchInput.value = query;
    if (query) {
      this.dom.clearSearchBtn.classList.add('visible');
    } else {
      this.dom.clearSearchBtn.classList.remove('visible');
    }

    this.updateCategoryTabsUI();
    this.updatePlatformChipsUI();
    this.renderCurrentView();
  }

  // --------------------------------------------------------------------------
  // Navigation & Category Filtering
  // --------------------------------------------------------------------------
  setCategory(category) {
    this.state.category = category;
    this.state.activeAppId = null;
    this.updateCategoryTabsUI();
    this.syncUrl();
    this.renderCurrentView();
  }

  setPlatform(platform) {
    this.state.platform = platform;
    this.state.activeAppId = null;
    this.updatePlatformChipsUI();
    this.syncUrl();
    this.renderCurrentView();
  }

  updateCategoryTabsUI() {
    const current = this.state.category;
    document.querySelectorAll('.nav-tab, .mobile-nav-tab').forEach(tab => {
      const id = tab.id.toLowerCase();
      if ((current === 'games' && id.includes('games')) ||
          (current === 'all' && id.includes('apps')) ||
          (current === 'developer' && id.includes('tools')) ||
          (current === 'utilities' && id.includes('utilities'))) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  updatePlatformChipsUI() {
    const plat = this.state.platform;
    const chips = {
      windows: document.getElementById('chip-windows'),
      android: document.getElementById('chip-phone'),
      all: document.getElementById('chip-tablet')
    };

    document.querySelectorAll('.device-chip').forEach(c => c.classList.remove('active'));
    if (plat === 'windows' && chips.windows) chips.windows.classList.add('active');
    else if (plat === 'android' && chips.android) chips.android.classList.add('active');
    else if (chips.all) chips.all.classList.add('active');
  }

  selectApp(appId) {
    this.state.activeAppId = appId;
    this.syncUrl();
    this.renderCurrentView();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  backToCatalog() {
    this.state.activeAppId = null;
    this.syncUrl();
    this.renderCurrentView();
  }

  // --------------------------------------------------------------------------
  // View Rendering
  // --------------------------------------------------------------------------
  renderCurrentView() {
    if (this.state.activeAppId) {
      this.dom.mainContent.style.display = 'none';
      this.dom.detailView.style.display = 'block';
      this.renderDetailView(this.state.activeAppId);
      return;
    }

    this.dom.detailView.style.display = 'none';
    this.dom.mainContent.style.display = 'block';

    const { query, category, platform } = this.state;

    // Search query => Show Results View
    if (query.trim()) {
      this.renderSearchResults(query, category, platform);
    } else {
      // Home / Discover Feed
      this.renderHomeFeed();
    }
  }

  renderHomeFeed() {
    const apps = this.catalog ? this.catalog.applications : [];
    
    // Sort apps by category & popularity
    const chessApp = apps.find(a => a.id === 'org.devstore.chess') || apps[0];
    const devTermApp = apps.find(a => a.id === 'org.devstore.terminal') || apps[6] || apps[1];
    const audioApp = apps.find(a => a.id === 'org.devstore.audiopulse') || apps[5] || apps[2];
    const calcApp = apps.find(a => a.id === 'org.devstore.calculator') || apps[1] || apps[3];

    this.dom.mainContent.innerHTML = `
      <!-- Google Play Hero Carousel Section -->
      <section class="hero-carousel-container" aria-label="Featured Highlight Banners">
        <div class="hero-carousel-track">
          
          <!-- Hero Card 1: Retro Chess Arena -->
          <article class="hero-card" onclick="devstore.selectApp('${chessApp.id}')">
            <div class="hero-card-media">
              <div class="hero-emblem">${ICONS.devstore}</div>
              <div style="width: 75%; height: 65%; border-radius: 8px; border: 1.5px solid rgba(0, 229, 255, 0.4); box-shadow: 0 0 25px rgba(0, 229, 255, 0.25); background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #00c6ff 100%); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px;">
                <div style="font-size: 56px;">♞</div>
                <div style="font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">CHESS ARENA</div>
              </div>
            </div>
            <div class="hero-card-overlay">
              <h2 class="hero-headline">Play Retro Chess Arena on PC</h2>
              <div class="hero-subheadline">Get started with DevStore Games</div>
              <div class="hero-app-row">
                <div class="hero-app-meta">
                  <div class="hero-app-icon" style="background-color: ${chessApp.iconBg}; color: ${chessApp.iconColor};">
                    ${getGlyphSvg(chessApp.iconGlyph)}
                  </div>
                  <div class="hero-app-details">
                    <span class="hero-app-title">${chessApp.name}</span>
                    <span class="hero-app-rating">Studio 64 Games &bull; Rated for 3+</span>
                  </div>
                </div>
                <button class="hero-install-btn" onclick="event.stopPropagation(); devstore.triggerDownload('${chessApp.id}')">
                  Install on Windows
                </button>
              </div>
            </div>
          </article>

          <!-- Hero Card 2: DevTerm Pro -->
          <article class="hero-card" onclick="devstore.selectApp('${devTermApp.id}')">
            <div class="hero-card-media">
              <div class="hero-emblem">${ICONS.devstore}</div>
              <div style="width: 75%; height: 65%; border-radius: 8px; border: 1.5px solid rgba(52, 211, 153, 0.4); box-shadow: 0 0 25px rgba(52, 211, 153, 0.25); background: linear-gradient(135deg, #051937 0%, #004d7a 50%, #00875f 100%); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px;">
                <div style="font-size: 56px;">⚡</div>
                <div style="font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">DEV TERMINAL</div>
              </div>
            </div>
            <div class="hero-card-overlay">
              <h2 class="hero-headline">Master Your Terminal on PC</h2>
              <div class="hero-subheadline">High-performance GPU terminal emulator</div>
              <div class="hero-app-row">
                <div class="hero-app-meta">
                  <div class="hero-app-icon" style="background-color: ${devTermApp.iconBg}; color: ${devTermApp.iconColor};">
                    ${getGlyphSvg(devTermApp.iconGlyph)}
                  </div>
                  <div class="hero-app-details">
                    <span class="hero-app-title">${devTermApp.name}</span>
                    <span class="hero-app-rating">Terminal Craft &bull; Rated for 12+</span>
                  </div>
                </div>
                <button class="hero-install-btn" onclick="event.stopPropagation(); devstore.triggerDownload('${devTermApp.id}')">
                  Install on Windows
                </button>
              </div>
            </div>
          </article>

          <!-- Hero Card 3: Pixel Pulse -->
          <article class="hero-card" onclick="devstore.selectApp('${audioApp.id}')">
            <div class="hero-card-media">
              <div class="hero-emblem">${ICONS.devstore}</div>
              <div style="width: 75%; height: 65%; border-radius: 8px; border: 1.5px solid rgba(217, 70, 239, 0.4); box-shadow: 0 0 25px rgba(217, 70, 239, 0.25); background: linear-gradient(135deg, #3b0764 0%, #8e2de2 50%, #f953c6 100%); display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 8px;">
                <div style="font-size: 56px;">🎹</div>
                <div style="font-size: 16px; font-weight: 700; color: #ffffff; letter-spacing: 1px;">PIXEL PULSE</div>
              </div>
            </div>
            <div class="hero-card-overlay">
              <h2 class="hero-headline">Compose Music with Pixel Pulse</h2>
              <div class="hero-subheadline">Digital synthesizer studio & beat sequencer</div>
              <div class="hero-app-row">
                <div class="hero-app-meta">
                  <div class="hero-app-icon" style="background-color: ${audioApp.iconBg}; color: ${audioApp.iconColor};">
                    ${getGlyphSvg(audioApp.iconGlyph)}
                  </div>
                  <div class="hero-app-details">
                    <span class="hero-app-title">${audioApp.name}</span>
                    <span class="hero-app-rating">SoundWave Collective &bull; Rated for 3+</span>
                  </div>
                </div>
                <button class="hero-install-btn" onclick="event.stopPropagation(); devstore.triggerDownload('${audioApp.id}')">
                  Install on Windows
                </button>
              </div>
            </div>
          </article>

        </div>
      </section>

      <!-- Section 1: Power up your productivity on PC (Media Showcase matching Reference) -->
      <section class="section-container">
        <div class="section-header">
          <div class="section-title-wrap">
            <h2 class="section-title">Power up your productivity on PC</h2>
            <span class="section-subtitle">Play and work with DevStore on Windows</span>
          </div>
          <button class="section-arrow-btn" aria-label="View more productivity apps" onclick="devstore.setCategory('developer')">
            ${ICONS.arrowRight}
          </button>
        </div>

        <div class="media-showcase-grid">
          <div class="media-card" onclick="devstore.selectApp('${chessApp.id}')">
            <div class="media-thumbnail-wrapper">
              <div style="width:100%; height:100%; background: linear-gradient(135deg, #1e3c72, #2a5298); display:flex; align-items:center; justify-content:center; color:#fff; font-size:24px; font-weight:700; letter-spacing:1px;">RETRO CHESS ARENA</div>
              <div class="media-play-icon">${ICONS.play}</div>
            </div>
            <div class="media-info-row">
              <div class="media-app-icon" style="background-color: ${chessApp.iconBg}; color: ${chessApp.iconColor};">
                ${getGlyphSvg(chessApp.iconGlyph)}
              </div>
              <div class="media-text-wrap">
                <span class="media-title">${chessApp.name}</span>
                <span class="media-category">${chessApp.category} &bull; ${chessApp.rating.toFixed(1)} ★</span>
              </div>
            </div>
          </div>

          <div class="media-card" onclick="devstore.selectApp('${devTermApp.id}')">
            <div class="media-thumbnail-wrapper">
              <div style="width:100%; height:100%; background: linear-gradient(135deg, #093028, #237a57); display:flex; align-items:center; justify-content:center; color:#fff; font-size:24px; font-weight:700; letter-spacing:1px;">DEVTERM PRO TERMINAL</div>
              <div class="media-play-icon">${ICONS.play}</div>
            </div>
            <div class="media-info-row">
              <div class="media-app-icon" style="background-color: ${devTermApp.iconBg}; color: ${devTermApp.iconColor};">
                ${getGlyphSvg(devTermApp.iconGlyph)}
              </div>
              <div class="media-text-wrap">
                <span class="media-title">${devTermApp.name}</span>
                <span class="media-category">${devTermApp.category} &bull; ${devTermApp.rating.toFixed(1)} ★</span>
              </div>
            </div>
          </div>

          <div class="media-card" onclick="devstore.selectApp('${calcApp.id}')">
            <div class="media-thumbnail-wrapper">
              <div style="width:100%; height:100%; background: linear-gradient(135deg, #4b1248, #f0c27b); display:flex; align-items:center; justify-content:center; color:#fff; font-size:24px; font-weight:700; letter-spacing:1px;">AETHER SCIENTIFIC CALC</div>
              <div class="media-play-icon">${ICONS.play}</div>
            </div>
            <div class="media-info-row">
              <div class="media-app-icon" style="background-color: ${calcApp.iconBg}; color: ${calcApp.iconColor};">
                ${getGlyphSvg(calcApp.iconGlyph)}
              </div>
              <div class="media-text-wrap">
                <span class="media-title">${calcApp.name}</span>
                <span class="media-category">${calcApp.category} &bull; ${calcApp.rating.toFixed(1)} ★</span>
              </div>
            </div>
        </div>
      </section>



      <!-- Section 2: Top Rated Applications (Google Play Compact Grid) -->
      <section class="section-container">
        <div class="section-header">
          <div class="section-title-wrap">
            <h2 class="section-title">Top Rated Applications</h2>
            <span class="section-subtitle">Recommended for you based on ratings</span>
          </div>
          <button class="section-arrow-btn" aria-label="Browse all apps" onclick="devstore.setCategory('all')">
            ${ICONS.arrowRight}
          </button>
        </div>
        <div class="app-grid">
          ${apps.slice(0, 4).map(app => this.generateAppCardHtml(app)).join('')}
        </div>
      </section>

      <!-- Section 3: Popular Dev & Creative Tools -->
      <section class="section-container">
        <div class="section-header">
          <div class="section-title-wrap">
            <h2 class="section-title">Developer & Creative Tools</h2>
            <span class="section-subtitle">Essential utilities for builders</span>
          </div>
          <button class="section-arrow-btn" aria-label="Browse developer tools" onclick="devstore.setCategory('developer')">
            ${ICONS.arrowRight}
          </button>
        </div>
        <div class="app-grid">
          ${apps.slice(4, 8).map(app => this.generateAppCardHtml(app)).join('')}
        </div>
      </section>
    `;

    // Bind card clicks
    this.dom.mainContent.querySelectorAll('.app-card').forEach(card => {
      card.addEventListener('click', () => {
        const appId = card.getAttribute('data-app-id');
        this.selectApp(appId);
      });
    });
  }

  generateAppCardHtml(app) {
    return `
      <article class="app-card" data-app-id="${app.id}" tabindex="0" role="button" aria-label="View ${this.escapeHtml(app.name)}">
        <div class="app-card-icon" style="background-color: ${app.iconBg}; color: ${app.iconColor};">
          ${getGlyphSvg(app.iconGlyph)}
        </div>
        <div class="app-card-details">
          <h3 class="app-card-title">${this.escapeHtml(app.name)}</h3>
          <span class="app-card-dev">${this.escapeHtml(app.developer)}</span>
          <span class="app-card-rating">
            <span>${app.rating ? app.rating.toFixed(1) : '4.8'}</span>
            <span class="star-glyph">★</span>
            <span style="margin-left: 4px; color: #80868b;">(${app.reviewCount || 1000})</span>
          </span>
        </div>
      </article>
    `;
  }

  renderSearchResults(query, category, platform) {
    const results = this.searchEngine.search(query, { category, platform });

    if (results.length === 0) {
      this.renderEmptyState(query);
      return;
    }

    const queryLabel = query ? `for "<strong>${this.escapeHtml(query)}</strong>"` : '';

    this.dom.mainContent.innerHTML = `
      <div class="search-results-summary">
        <div class="search-results-query">
          Results ${queryLabel} &bull; ${results.length} ${results.length === 1 ? 'application' : 'applications'} found
        </div>
        <button class="clear-filter-btn" id="reset-all-filters-btn">Clear search</button>
      </div>

      <div class="app-grid">
        ${results.map(app => this.generateAppCardHtml(app)).join('')}
      </div>
    `;

    // Bind card clicks
    this.dom.mainContent.querySelectorAll('.app-card').forEach(card => {
      card.addEventListener('click', () => {
        const appId = card.getAttribute('data-app-id');
        this.selectApp(appId);
      });
    });

    const resetBtn = document.getElementById('reset-all-filters-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.clearSearch());
    }
  }

  renderEmptyState(query) {
    const recommendations = this.searchEngine.getRecommendations(null, 4);

    this.dom.mainContent.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">
          ${ICONS.search}
        </div>
        <h2 class="empty-state-title">
          No results for "${this.escapeHtml(query)}"
        </h2>
        <p class="empty-state-desc">
          Check your spelling or try searching for keywords like "chess", "task", or "calc".
        </p>
        <button class="hero-install-btn" id="empty-clear-btn" style="margin: 0 auto;">
          Browse All Apps
        </button>
      </div>

      <section class="section-container">
        <div class="section-header">
          <div class="section-title-wrap">
            <h2 class="section-title">Popular applications</h2>
            <span class="section-subtitle">Recommended by DevStore</span>
          </div>
        </div>
        <div class="app-grid">
          ${recommendations.map(app => this.generateAppCardHtml(app)).join('')}
        </div>
      </section>
    `;

    const clearBtn = document.getElementById('empty-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearSearch());
    }

    this.dom.mainContent.querySelectorAll('.app-card').forEach(card => {
      card.addEventListener('click', () => {
        const appId = card.getAttribute('data-app-id');
        this.selectApp(appId);
      });
    });
  }

  getReadablePlatform(platform) {
    const p = (platform || 'windows').toLowerCase();
    if (p === 'windows') return 'Windows';
    if (p === 'android') return 'Android';
    if (p === 'web') return 'Web Browser';
    return 'Your Device';
  }

  // --------------------------------------------------------------------------
  // Detail View Rendering (Google Play High-Fidelity Parity)
  // --------------------------------------------------------------------------
  renderDetailView(appId) {
    const app = this.searchEngine.getAppById(appId);

    if (!app) {
      this.dom.detailView.innerHTML = `
        <div class="empty-state">
          <h2 class="empty-state-title">Application Not Found</h2>
          <p class="empty-state-desc">The requested application does not exist.</p>
          <button class="hero-install-btn" id="detail-back-home-btn">Return to Store</button>
        </div>
      `;
      document.getElementById('detail-back-home-btn').addEventListener('click', () => this.backToCatalog());
      return;
    }

    const screenshots = app.screenshots || [];
    const isInstalled = this.user && this.user.installedApps && this.user.installedApps.includes(app.id);
    const reviews = app.reviews || [];
    const distribution = app.distribution || { 5: 75, 4: 15, 3: 6, 2: 2, 1: 2 };
    const similarApps = this.searchEngine.getRecommendations(app.category, 4).filter(a => a.id !== app.id).slice(0, 3);

    this.dom.detailView.innerHTML = `
      <div class="detail-back-bar">
        <button class="detail-back-btn" id="detail-back-btn" aria-label="Go back to store">
          ${ICONS.back} <span>Back to store</span>
        </button>
      </div>

      <!-- Detail Header: Desktop 2-Column Split Matching Google Play Reference -->
      <div class="detail-header">
        <div class="detail-header-info">
          <h1 class="detail-app-title">${this.escapeHtml(app.name)}</h1>
          <div class="detail-app-dev" onclick="devstore.submitSearch('${this.escapeHtml(app.developer)}')">
            <span>${this.escapeHtml(app.developer)}</span>
            <span title="Verified Publisher">${ICONS.verified}</span>
          </div>

          <div class="detail-metrics-row">
            <div class="metric-item">
              <span class="metric-val">
                <span>${app.rating ? app.rating.toFixed(1) : '4.8'}</span>
                <span class="star-glyph">★</span>
              </span>
              <span class="metric-lbl">${(app.reviewCount || 1000).toLocaleString()} reviews</span>
            </div>
            <div class="metric-divider" aria-hidden="true"></div>
            <div class="metric-item">
              <span class="metric-val">${app.downloads ? '50K+' : '10K+'}</span>
              <span class="metric-lbl">Downloads</span>
            </div>
            <div class="metric-divider" aria-hidden="true"></div>
            <div class="metric-item">
              <span class="metric-val">${app.contentRating || 'Rated for 3+'}</span>
              <span class="metric-lbl">Content rating</span>
            </div>
          </div>

          <div class="detail-cta-row" id="detail-cta-row">
            ${isInstalled ? `
              <button class="detail-install-btn installed" id="detail-install-cta" onclick="devstore.launchApp('${app.id}')">
                Open
              </button>
              <button class="detail-action-btn" id="detail-uninstall-btn" onclick="devstore.uninstallApp('${app.id}')">
                Uninstall
              </button>
            ` : `
              <button class="detail-install-btn" id="detail-install-cta" onclick="devstore.startInstallSimulation('${app.id}')">
                Install on ${this.getReadablePlatform(this.state.platform)}
              </button>
            `}
            <button class="detail-share-btn" onclick="devstore.shareApp('${app.id}')">
              ${ICONS.openInNew} <span>Share</span>
            </button>
            <button class="detail-action-btn" id="detail-wishlist-btn" onclick="devstore.toggleWishlist('${app.id}')">
              ${ICONS.playPass} <span>Add to wishlist</span>
            </button>
          </div>
        </div>

        <div class="detail-header-icon-wrap">
          <div class="detail-app-icon" style="background-color: ${app.iconBg}; color: ${app.iconColor};">
            <div style="transform: scale(2.2); display: flex; align-items: center; justify-content: center;">
              ${getGlyphSvg(app.iconGlyph)}
            </div>
          </div>
        </div>
      </div>

      <!-- Detail Body Layout: Main Content (68%) + Sidebar (32%) -->
      <div class="detail-main-layout">
        <div class="detail-primary-col">

          <!-- Screenshot & Video Carousel Track -->
          <div class="detail-media-container">
            <div class="detail-media-track" id="detail-media-track">
              <!-- Video Trailer Preview Card -->
              ${this.videoPlayer.renderVideoCardHtml(app, this.escapeHtml)}

              <!-- High-Resolution Screenshot Cards -->
              ${screenshots.map((s, idx) => `
                <div 
                  class="detail-screenshot-card ${s.orientation || 'portrait'}" 
                  onclick="devstore.openScreenshotLightbox('${app.id}', ${idx})"
                  tabindex="0"
                  role="button"
                  aria-label="View screenshot: ${this.escapeHtml(s.title || `Screenshot ${idx + 1}`)}"
                >
                  <div style="width:100%; height:100%; background: linear-gradient(135deg, ${app.iconBg} 0%, #1e293b 100%); display:flex; flex-direction:column; align-items:center; justify-content:center; padding:16px; color:#fff; text-align:center;">
                    <div style="font-size: 32px; margin-bottom: 8px;">
                      ${app.iconGlyph === 'chess' ? '♟️' : app.iconGlyph === 'calculate' ? '🧮' : app.iconGlyph === 'terminal' ? '💻' : '📱'}
                    </div>
                    <div style="font-size: 13px; font-weight: 600; line-height: 1.3;">
                      ${this.escapeHtml(s.title || `Feature ${idx + 1}`)}
                    </div>
                  </div>
                  <div class="screenshot-zoom-badge">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
                  </div>
                </div>
              `).join('')}
            </div>

            <!-- Floating Next Button -->
            <button class="media-track-arrow-btn" aria-label="Scroll media" onclick="document.getElementById('detail-media-track').scrollBy({left: 360, behavior: 'smooth'})">
              ${ICONS.arrowRight}
            </button>
          </div>

          <!-- About this app Section -->
          <div class="detail-about-section">
            <div class="detail-section-header-link">
              <h2 class="detail-section-title">
                <span>About this app</span>
                ${ICONS.arrowRight}
              </h2>
            </div>
            <p class="detail-about-text">
              ${this.escapeHtml(app.description || app.tagline || '')}
            </p>

            ${app.features && app.features.length > 0 ? `
              <ul class="detail-features-list">
                ${app.features.map(f => `<li class="detail-feature-item">${this.escapeHtml(f)}</li>`).join('')}
              </ul>
            ` : ''}

            <div class="detail-tags-row">
              <span class="detail-tag-chip">${this.escapeHtml(app.category || 'Utilities')}</span>
              <span class="detail-tag-chip">Free & Open Source</span>
              <span class="detail-tag-chip">Version ${this.escapeHtml(app.version || '1.0.0')}</span>
              <span class="detail-tag-chip">${this.escapeHtml(app.size || '15 MB')}</span>
              <span class="detail-tag-chip">Updated Oct 2026</span>
            </div>
          </div>

          <!-- Data Safety Card (5 Security Pillars Matching Reference) -->
          <div class="detail-safety-card">
            <div class="safety-header">
              ${ICONS.shield}
              <span>Data safety</span>
            </div>
            <p class="safety-desc">
              Safety starts with understanding how developers collect and share your data. Data privacy and security practices may vary based on your use, region, and age. The developer provided this information and may update it over time.
            </p>

            <div class="safety-points-box">
              <div class="safety-point-row">
                <div class="safety-point-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                </div>
                <div class="safety-point-content">
                  <span class="safety-point-title">No data shared with third parties</span>
                  <span class="safety-point-subtitle">The developer says this app doesn't share user data with other companies or organizations</span>
                </div>
              </div>

              <div class="safety-point-row">
                <div class="safety-point-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"></path></svg>
                </div>
                <div class="safety-point-content">
                  <span class="safety-point-title">No data collected</span>
                  <span class="safety-point-subtitle">The developer states that zero telemetry or personal info is collected</span>
                </div>
              </div>

              <div class="safety-point-row">
                <div class="safety-point-icon">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>
                <div class="safety-point-content">
                  <span class="safety-point-title">Data is encrypted in transit</span>
                  <span class="safety-point-subtitle">Your connection to DevStore package repositories is secured over TLS 1.3</span>
                </div>
              </div>

              <div class="safety-point-row">
                <div class="safety-point-icon">
                  ${ICONS.trash}
                </div>
                <div class="safety-point-content">
                  <span class="safety-point-title">You can request that data be deleted</span>
                  <span class="safety-point-subtitle">You have the right to request deletion of any stored reviews or account records</span>
                </div>
              </div>

              <div class="safety-point-row">
                <div class="safety-point-icon">
                  ${ICONS.checkShield}
                </div>
                <div class="safety-point-content">
                  <span class="safety-point-title">Independent source code review</span>
                  <span class="safety-point-subtitle">Open-source repository available. Users should inspect binaries before installing.</span>
                </div>
              </div>
            </div>

            <span class="safety-details-link" onclick="devstore.showDataSafetyDialog('${app.id}')">
              See details
            </span>
          </div>

          <!-- Ratings & Reviews Section (Breakdown + Device Filter Pills + User Reviews) -->
          <div class="ratings-reviews-section">
            <div class="ratings-reviews-header">
              <h2 class="detail-section-title">
                <span>Ratings and reviews</span>
                ${ICONS.arrowRight}
              </h2>
              <span class="reviews-verified-badge">
                Ratings and reviews from community users
              </span>
            </div>

            <!-- Device Review Filter Pills -->
            <div class="review-filter-pills-row">
              <button class="review-filter-pill active" data-device="all" onclick="devstore.filterReviewsByDevice('all')">
                <span>All devices</span>
              </button>
              <button class="review-filter-pill" data-device="phone" onclick="devstore.filterReviewsByDevice('phone')">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                <span>Phone</span>
              </button>
              <button class="review-filter-pill" data-device="desktop" onclick="devstore.filterReviewsByDevice('desktop')">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                <span>Desktop</span>
              </button>
              <button class="review-filter-pill" data-device="tablet" onclick="devstore.filterReviewsByDevice('tablet')">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                <span>Tablet</span>
              </button>
            </div>

            <!-- 5-Star Rating Breakdown Chart -->
            <div class="rating-breakdown-card">
              <div class="rating-score-col">
                <div class="big-rating-number">${app.rating ? app.rating.toFixed(1) : '4.8'}</div>
                <div class="big-rating-stars">
                  <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
                </div>
                <span class="rating-total-count">${(app.reviewCount || 1000).toLocaleString()} reviews</span>
              </div>

              <div class="rating-bars-col">
                ${[5, 4, 3, 2, 1].map(stars => `
                  <div class="rating-bar-row">
                    <span class="bar-star-num">${stars}</span>
                    <div class="rating-bar-track">
                      <div class="rating-bar-fill" style="width: ${distribution[stars] || 10}%;"></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- Community Reviews List -->
            <div class="community-reviews-list" id="community-reviews-list">
              ${this.generateReviewsListHtml(reviews)}
            </div>

            <button class="write-review-btn" onclick="devstore.openReviewModal('${app.id}')">
              Write a review
            </button>
          </div>

        </div>

        <!-- Detail Sidebar: Content Rating, App Support & More by Developer -->
        <div class="detail-sidebar-col">
          <!-- Content Rating Box -->
          <div class="sidebar-box-card">
            <div class="content-rating-box">
              <div class="iarc-badge">3+</div>
              <div class="content-rating-info">
                <span class="content-rating-title">${app.contentRating || 'Rated for 3+'}</span>
                <span class="content-rating-sub">Users Interact</span>
                <span class="content-rating-link" onclick="devstore.showContentRatingInfo()">Learn more</span>
              </div>
            </div>
          </div>

          <!-- App Support Accordion -->
          <div class="sidebar-box-card">
            <div class="app-support-header" onclick="devstore.toggleAppSupportAccordion()">
              <span>App support</span>
              <svg id="support-accordion-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </div>
            <div class="app-support-details" id="app-support-details">
              <div class="support-detail-item">
                <span class="support-detail-lbl">Website</span>
                <a href="${app.support ? app.support.website : 'https://devstore.org'}" target="_blank" rel="noopener" class="support-detail-link">
                  ${app.support ? app.support.website : 'https://devstore.org'}
                </a>
              </div>
              <div class="support-detail-item">
                <span class="support-detail-lbl">Support Email</span>
                <a href="mailto:${app.support ? app.support.email : 'support@devstore.org'}" class="support-detail-link">
                  ${app.support ? app.support.email : 'support@devstore.org'}
                </a>
              </div>
              <div class="support-detail-item">
                <span class="support-detail-lbl">Address</span>
                <span>${app.support ? app.support.address : '100 Open Source Way, Tech Park, CA'}</span>
              </div>
              <div class="support-detail-item">
                <span class="support-detail-lbl">Privacy Policy</span>
                <a href="${app.support ? app.support.privacyPolicy : 'https://devstore.org/privacy'}" target="_blank" rel="noopener" class="support-detail-link">
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>

          <!-- More by Developer Section -->
          <div class="sidebar-box-card">
            <div class="detail-section-header-link" onclick="devstore.submitSearch('${this.escapeHtml(app.developer)}')">
              <span style="font-size: 15px; font-weight: 500; color: #202124;">More by ${this.escapeHtml(app.developer)}</span>
              ${ICONS.arrowRight}
            </div>
            <div class="sidebar-apps-list">
              ${similarApps.map(sim => `
                <div class="sidebar-app-item" onclick="devstore.selectApp('${sim.id}')">
                  <div class="sidebar-app-icon" style="background-color: ${sim.iconBg}; color: ${sim.iconColor};">
                    ${getGlyphSvg(sim.iconGlyph)}
                  </div>
                  <div class="sidebar-app-meta">
                    <span class="sidebar-app-name">${this.escapeHtml(sim.name)}</span>
                    <span class="sidebar-app-dev">${this.escapeHtml(sim.developer)}</span>
                    <span class="sidebar-app-rating">${sim.rating.toFixed(1)} ★</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

        </div>
      </div>
    `;

    document.getElementById('detail-back-btn').addEventListener('click', () => this.backToCatalog());
  }

  generateReviewsListHtml(reviews) {
    if (!reviews || reviews.length === 0) {
      return `<p style="font-size: 13.5px; color: #5f6368;">No reviews matching this filter.</p>`;
    }
    return reviews.map(r => `
      <div class="community-review-card">
        <div class="review-author-row">
          <div class="review-author-avatar" style="background-color: ${r.avatar || '#01875f'};">
            ${r.author ? r.author.charAt(0) : 'U'}
          </div>
          <span class="review-author-name">${this.escapeHtml(r.author || 'User')}</span>
        </div>
        <div class="review-meta-row">
          <div class="review-stars-display">
            ${'★'.repeat(r.rating || 5)}
          </div>
          <span class="review-date-text">${this.escapeHtml(r.date || 'Recent')}</span>
          ${r.device ? `<span class="review-device-tag">${this.escapeHtml(r.device)}</span>` : ''}
        </div>
        <p class="review-comment-text">${this.escapeHtml(r.comment || '')}</p>
        <div class="review-helpful-row">
          <span>Was this review helpful?</span>
          <button class="helpful-thumbs-btn" id="helpful-btn-${r.id}" onclick="devstore.voteHelpfulReview('${r.id}')">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
            Yes (<span class="helpful-count">${r.helpfulCount || 0}</span>)
          </button>
          <button class="helpful-thumbs-btn" onclick="devstore.showFeedbackThanks()">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
            No
          </button>
        </div>
      </div>
    `).join('');
  }

  // --------------------------------------------------------------------------
  // Full-Screen Screenshot Lightbox Gallery (Google Play Parity)
  // --------------------------------------------------------------------------
  openScreenshotLightbox(appId, index = 0) {
    this.state.lightbox = { isOpen: true, appId, currentIndex: index };
    this.renderLightbox();
  }

  renderLightbox() {
    const { isOpen, appId, currentIndex } = this.state.lightbox;
    if (!isOpen || !this.dom.screenshotLightboxModal) return;
    const app = this.searchEngine.getAppById(appId);
    if (!app) return;
    const screenshots = app.screenshots || [];
    const total = screenshots.length;
    const current = screenshots[currentIndex] || screenshots[0] || { title: app.name, caption: '' };

    this.dom.screenshotLightboxModal.innerHTML = `
      <div class="lightbox-header-bar">
        <button class="lightbox-back-btn" id="lightbox-back-btn" aria-label="Close screenshot gallery">
          ${ICONS.back}
        </button>
        <div class="lightbox-title-counter">
          ${this.escapeHtml(app.name)} &bull; ${currentIndex + 1} of ${total}
        </div>
        <button class="lightbox-close-btn" id="lightbox-close-x" aria-label="Close">
          &times;
        </button>
      </div>

      <div class="lightbox-stage-container">
        ${total > 1 ? `
          <button class="lightbox-nav-btn prev" id="lightbox-prev-btn" aria-label="Previous screenshot">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"></polyline></svg>
          </button>
        ` : ''}

        <div class="lightbox-main-card">
          <div class="lightbox-display-art" style="background: linear-gradient(135deg, ${app.iconBg} 0%, #0f172a 100%);">
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 48px; gap: 16px;">
              <div style="font-size: 64px;">${app.iconGlyph === 'chess' ? '♟️' : app.iconGlyph === 'calculate' ? '🧮' : app.iconGlyph === 'terminal' ? '💻' : '📱'}</div>
              <div style="font-size: 24px; font-weight: 700; color: #ffffff; text-align: center;">${this.escapeHtml(current.title || app.name)}</div>
              <div style="font-size: 14px; color: #94a3b8; max-width: 480px; text-align: center;">${this.escapeHtml(current.caption || '')}</div>
            </div>
          </div>
        </div>

        ${total > 1 ? `
          <button class="lightbox-nav-btn next" id="lightbox-next-btn" aria-label="Next screenshot">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
          </button>
        ` : ''}
      </div>

      <div class="lightbox-footer-caption">
        <div class="lightbox-caption-title">${this.escapeHtml(current.title || app.name)}</div>
        <div class="lightbox-caption-sub">${this.escapeHtml(current.caption || '')}</div>
      </div>
    `;

    this.dom.screenshotLightboxModal.classList.add('open');

    document.getElementById('lightbox-back-btn').addEventListener('click', () => this.closeScreenshotLightbox());
    document.getElementById('lightbox-close-x').addEventListener('click', () => this.closeScreenshotLightbox());
    const prevBtn = document.getElementById('lightbox-prev-btn');
    if (prevBtn) prevBtn.addEventListener('click', () => this.navigateLightbox(-1));
    const nextBtn = document.getElementById('lightbox-next-btn');
    if (nextBtn) nextBtn.addEventListener('click', () => this.navigateLightbox(1));
  }

  closeScreenshotLightbox() {
    this.state.lightbox.isOpen = false;
    if (this.dom.screenshotLightboxModal) {
      this.dom.screenshotLightboxModal.classList.remove('open');
      this.dom.screenshotLightboxModal.innerHTML = '';
    }
  }

  navigateLightbox(direction) {
    const { appId, currentIndex } = this.state.lightbox;
    const app = this.searchEngine.getAppById(appId);
    if (!app || !app.screenshots || app.screenshots.length === 0) return;
    const total = app.screenshots.length;
    const nextIndex = (currentIndex + direction + total) % total;
    this.state.lightbox.currentIndex = nextIndex;
    this.renderLightbox();
  }

  // --------------------------------------------------------------------------
  // --------------------------------------------------------------------------
  // Video Player Trailer Controls
  // --------------------------------------------------------------------------
  toggleVideoPlay(appId) {
    const app = this.searchEngine.getAppById(appId);
    this.videoPlayer.togglePlay(appId, app);
    this.state.videoState[appId] = this.videoPlayer.getState(appId);
  }

  toggleVideoMute(appId) {
    this.videoPlayer.toggleMute(appId);
    this.state.videoState[appId] = this.videoPlayer.getState(appId);
  }

  // --------------------------------------------------------------------------
  // Genuine Download & Installation Capability Check
  // --------------------------------------------------------------------------
  async startInstallSimulation(appId) {
    const app = this.searchEngine.getAppById(appId);
    if (!app) return;
    const btn = document.getElementById('detail-install-cta');
    const result = await this.downloadManager.attemptDownload(app, this.state.platform, btn);
    if (result && result.success && result.state === 'web-launched') {
      if (this.user) {
        if (!this.user.installedApps) this.user.installedApps = [];
        if (!this.user.installedApps.includes(appId)) {
          this.user.installedApps.push(appId);
          try {
            localStorage.setItem('devstore_user', JSON.stringify(this.user));
          } catch (e) {
            console.warn(e);
          }
        }
      }
    }
  }

  uninstallApp(appId) {
    if (this.user && this.user.installedApps) {
      this.user.installedApps = this.user.installedApps.filter(id => id !== appId);
      try {
        localStorage.setItem('devstore_user', JSON.stringify(this.user));
      } catch (e) {
        console.warn('Failed to persist user updates:', e);
      }
    }
    if (this.state.activeAppId === appId) {
      this.renderDetailView(appId);
    }
    this.renderManageAppsListTab();
    if (this.dom.profilePopover && this.dom.profilePopover.classList.contains('open')) {
      this.renderProfilePopover();
    }
  }

  // --------------------------------------------------------------------------
  // Reviews Filtering, Voting, and Write Review Flow
  // --------------------------------------------------------------------------
  filterReviewsByDevice(device) {
    this.state.reviewDeviceFilter = device;
    const appId = this.state.activeAppId;
    if (!appId) return;
    const app = this.searchEngine.getAppById(appId);
    if (!app) return;
    const listEl = document.getElementById('community-reviews-list');
    if (!listEl) return;

    document.querySelectorAll('.review-filter-pill').forEach(pill => {
      if (pill.getAttribute('data-device') === device) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    const filtered = (app.reviews || []).filter(r => device === 'all' || (r.device && r.device.toLowerCase() === device.toLowerCase()));
    listEl.innerHTML = this.generateReviewsListHtml(filtered);
  }

  voteHelpfulReview(reviewId) {
    const btn = document.getElementById(`helpful-btn-${reviewId}`);
    if (!btn || btn.classList.contains('voted')) return;
    const countSpan = btn.querySelector('.helpful-count');
    let current = parseInt(countSpan.textContent, 10) || 0;
    countSpan.textContent = current + 1;
    btn.classList.add('voted');
  }

  toggleAppSupportAccordion() {
    this.state.supportAccordionOpen = !this.state.supportAccordionOpen;
    const details = document.getElementById('app-support-details');
    const arrow = document.getElementById('support-accordion-arrow');
    if (details) {
      if (this.state.supportAccordionOpen) {
        details.classList.add('open');
        if (arrow) arrow.style.transform = 'rotate(180deg)';
      } else {
        details.classList.remove('open');
        if (arrow) arrow.style.transform = 'rotate(0deg)';
      }
    }
  }

  openReviewModal(appId) {
    const app = this.searchEngine.getAppById(appId);
    if (!app || !this.dom.reviewModal) return;

    this.dom.reviewModal.innerHTML = `
      <div class="modal-dialog">
        <div class="modal-header">
          <h3 class="modal-title">Rate & Review ${this.escapeHtml(app.name)}</h3>
          <button class="modal-close-btn" id="review-close-x">&times;</button>
        </div>
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin: 16px 0;" id="review-star-picker">
          ${[1, 2, 3, 4, 5].map(star => `
            <button class="star-pick-btn" data-star="${star}" style="background: none; border: none; font-size: 32px; cursor: pointer; color: #01875f;">★</button>
          `).join('')}
        </div>
        <div style="margin-bottom: 16px;">
          <label style="font-size: 13px; font-weight: 500; color: #5f6368; display: block; margin-bottom: 6px;">Your Review</label>
          <textarea id="review-comment-input" rows="4" style="width: 100%; border: 1px solid #dadce0; border-radius: 8px; padding: 10px; font-family: inherit; font-size: 14px;" placeholder="Tell other users what you think of this application..."></textarea>
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 8px;">
          <button class="detail-share-btn" id="review-cancel-btn">Cancel</button>
          <button class="detail-install-btn" id="review-submit-btn">Post</button>
        </div>
      </div>
    `;

    this.dom.reviewModal.classList.add('open');

    let selectedRating = 5;
    const stars = this.dom.reviewModal.querySelectorAll('.star-pick-btn');
    const updateStars = (val) => {
      selectedRating = val;
      stars.forEach((s, idx) => {
        s.style.color = idx < val ? '#01875f' : '#dadce0';
      });
    };
    updateStars(5);

    stars.forEach(s => {
      s.addEventListener('click', () => updateStars(parseInt(s.getAttribute('data-star'), 10)));
    });

    const close = () => {
      this.dom.reviewModal.classList.remove('open');
      this.modalManager.registerClose('review-modal');
    };
    this.modalManager.registerOpen('review-modal', this.dom.reviewModal, close);

    document.getElementById('review-close-x')?.addEventListener('click', close);
    document.getElementById('review-cancel-btn')?.addEventListener('click', close);
    document.getElementById('review-submit-btn')?.addEventListener('click', () => {
      const text = document.getElementById('review-comment-input').value.trim();
      if (!text) {
        this.notifications.notify('Please enter your review comment before posting.', 'warning');
        return;
      }
      const newReview = {
        id: `rev-user-${Date.now()}`,
        author: this.user ? this.user.name : 'Community User',
        avatar: this.user ? this.user.avatarBg : '#01875f',
        rating: selectedRating,
        date: 'Recent',
        device: 'Desktop',
        helpfulCount: 0,
        comment: text
      };
      if (!app.reviews) app.reviews = [];
      app.reviews.unshift(newReview);
      close();
      this.notifications.notify('Your review has been posted!', 'success');
      this.renderDetailView(appId);
    });
  }

  shareApp(appId) {
    const url = `${window.location.origin}${window.location.pathname}?id=${appId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    this.notifications.notify(`Link copied to clipboard: ${url}`, 'info');
  }

  toggleWishlist(appId) {
    if (!this.user) {
      this.openSignInModal();
      return;
    }
    if (!this.user.wishlist) this.user.wishlist = [];
    const idx = this.user.wishlist.indexOf(appId);
    const btn = document.getElementById('detail-wishlist-btn');
    if (idx > -1) {
      this.user.wishlist.splice(idx, 1);
      if (btn) btn.innerHTML = `${ICONS.playPass} <span>Add to wishlist</span>`;
      this.notifications.notify('Removed from your wishlist.', 'info');
    } else {
      this.user.wishlist.push(appId);
      if (btn) btn.innerHTML = `${ICONS.checkShield} <span>In wishlist</span>`;
      this.notifications.notify('Saved to your wishlist!', 'success');
    }
    try {
      localStorage.setItem('devstore_user', JSON.stringify(this.user));
    } catch (e) {
      console.warn(e);
    }
  }

  triggerDownload(appId) {
    this.startInstallSimulation(appId);
  }

  // --------------------------------------------------------------------------
  // Google Play Profile Popover & User Authentication (Truthful Demo Profile)
  // --------------------------------------------------------------------------
  renderUserAvatar() {
    if (!this.dom.userAvatarBtn) return;
    if (this.user) {
      this.dom.userAvatarBtn.classList.add('signed-in');
      this.dom.userAvatarBtn.style.background = this.user.avatarBg || 'linear-gradient(135deg, #01875f 0%, #34a853 100%)';
      this.dom.userAvatarBtn.innerHTML = `<span>${this.escapeHtml(this.user.initial || (this.user.name ? this.user.name[0] : 'A'))}</span>`;
      this.dom.userAvatarBtn.setAttribute('aria-label', `DevStore Demo Profile: ${this.user.name} (${this.user.email})`);
    } else {
      this.dom.userAvatarBtn.classList.remove('signed-in');
      this.dom.userAvatarBtn.style.background = '';
      this.dom.userAvatarBtn.innerHTML = ICONS.user;
      this.dom.userAvatarBtn.setAttribute('aria-label', 'Sign in to DevStore');
    }
  }

  toggleProfilePopover() {
    if (!this.user) {
      this.openSignInModal();
      return;
    }
    if (this.dom.profilePopover && this.dom.profilePopover.classList.contains('open')) {
      this.closeProfilePopover();
    } else {
      this.openProfilePopover();
    }
  }

  openProfilePopover() {
    if (!this.user || !this.dom.profilePopover) return;
    this.renderProfilePopover();
    this.dom.profilePopover.classList.add('open');
    if (this.dom.userAvatarBtn) {
      this.dom.userAvatarBtn.setAttribute('aria-expanded', 'true');
    }
  }

  closeProfilePopover() {
    if (!this.dom.profilePopover) return;
    this.dom.profilePopover.classList.remove('open');
    if (this.dom.userAvatarBtn) {
      this.dom.userAvatarBtn.setAttribute('aria-expanded', 'false');
    }
  }

  renderProfilePopover() {
    if (!this.dom.profilePopover || !this.user) return;
    const initial = this.escapeHtml(this.user.initial || (this.user.name ? this.user.name[0] : 'A'));
    const appsCount = this.user.installedApps ? this.user.installedApps.length : 0;

    this.dom.profilePopover.innerHTML = `
      <div class="popover-header-row">
        <span></span>
        <button class="popover-close-btn" id="popover-close-btn" aria-label="Close account menu">
          ${ICONS.close}
        </button>
      </div>

      <div class="popover-user-card">
        <div class="popover-avatar-wrap">
          <div class="popover-avatar-large" style="background:${this.user.avatarBg || 'linear-gradient(135deg, #01875f 0%, #34a853 100%)'}">
            ${initial}
          </div>
          <div class="demo-profile-badge" title="Demo profile - unverified">
            Demo &bull; Unverified
          </div>
        </div>
        <div class="popover-user-name">${this.escapeHtml(this.user.name)}</div>
        <div class="popover-user-email">${this.escapeHtml(this.user.email)} (Demo Account)</div>
        <button class="popover-manage-account-btn" id="popover-manage-account-cta">
          Manage your DevStore Account
        </button>
      </div>

      <div class="popover-divider"></div>

      <div class="popover-menu-list">
        <div class="popover-menu-item" id="popover-item-manage-apps" tabindex="0" role="button">
          <div class="popover-item-left">
            ${ICONS.appsDevice}
            <span>Manage apps &amp; device</span>
          </div>
          <span class="popover-item-badge">${appsCount} installed</span>
        </div>

        <div class="popover-menu-item" id="popover-item-payments" tabindex="0" role="button">
          <div class="popover-item-left">
            ${ICONS.payments}
            <span>Payments &amp; subscriptions</span>
          </div>
        </div>

        <div class="popover-menu-item" id="popover-item-offers" tabindex="0" role="button">
          <div class="popover-item-left">
            ${ICONS.notifications}
            <span>Offers &amp; notifications</span>
          </div>
          <span class="popover-item-badge">2 offers</span>
        </div>

        <div class="popover-menu-item" id="popover-item-pass" tabindex="0" role="button">
          <div class="popover-item-left">
            ${ICONS.playPass}
            <span>Play Pass</span>
          </div>
          <span class="popover-item-badge">${this.user.passActive ? 'Active' : 'Get Pass'}</span>
        </div>

        <div class="popover-menu-item" id="popover-item-settings" tabindex="0" role="button">
          <div class="popover-item-left">
            ${ICONS.settings}
            <span>Settings</span>
          </div>
        </div>

        <div class="popover-menu-item" id="popover-item-help" tabindex="0" role="button">
          <div class="popover-item-left">
            ${ICONS.help}
            <span>Help &amp; feedback</span>
          </div>
        </div>

        <div class="popover-divider"></div>

        <div class="popover-menu-item" id="popover-item-signout" tabindex="0" role="button" style="color:#d93025;">
          <div class="popover-item-left">
            <span style="color:#d93025;">${ICONS.logout}</span>
            <span>Sign out of DevStore</span>
          </div>
        </div>
      </div>

      <div class="popover-divider"></div>

      <div class="popover-footer-links">
        <a href="#privacy" id="popover-link-privacy">Privacy Policy</a>
        <span>&bull;</span>
        <a href="#terms" id="popover-link-terms">Terms of Service</a>
      </div>
    `;

    // Bind Popover events
    document.getElementById('popover-close-btn')?.addEventListener('click', () => this.closeProfilePopover());

    document.getElementById('popover-manage-account-cta')?.addEventListener('click', () => {
      this.notifications.showDialog({
        title: 'DevStore Demo Profile',
        message: `Profile Name: ${this.user.name}\nEmail: ${this.user.email}\nStatus: Local Demo (Unverified)\n\nDevStore runs entirely client-side without a remote authentication server. This account profile is stored locally in your browser session.`
      });
    });

    document.getElementById('popover-item-manage-apps')?.addEventListener('click', () => {
      this.closeProfilePopover();
      this.openManageAppsModal('overview');
    });

    document.getElementById('popover-item-payments')?.addEventListener('click', () => {
      this.notifications.showDialog({
        title: 'Payments & Subscriptions',
        message: 'All software cataloged on DevStore is 100% free and open-source. DevStore does not process credit cards, payments, or subscriptions.'
      });
    });

    document.getElementById('popover-item-offers')?.addEventListener('click', () => {
      this.notifications.notify('DevStore Offers: 2 community software packages available for preview in this catalog.', 'info');
    });

    document.getElementById('popover-item-pass')?.addEventListener('click', () => {
      this.notifications.showDialog({
        title: 'DevStore Pass',
        message: 'DevStore Pass is included free for all users. All cataloged applications are free of third-party advertisements and tracker frameworks.'
      });
    });

    document.getElementById('popover-item-settings')?.addEventListener('click', () => {
      this.notifications.showDialog({
        title: 'DevStore Settings',
        message: 'Client Settings: Static catalog mode active. Automatic background downloads are disabled to protect system integrity.'
      });
    });

    document.getElementById('popover-item-help')?.addEventListener('click', () => {
      this.showHelpInfo();
    });

    document.getElementById('popover-item-signout')?.addEventListener('click', () => {
      this.handleSignOut();
    });

    document.getElementById('popover-link-privacy')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showFooterInfo('privacy');
    });

    document.getElementById('popover-link-terms')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.showFooterInfo('terms');
    });
  }

  // --------------------------------------------------------------------------
  // Accessible Profile Selection Modal Dialog (Replaces prompt/alerts)
  // --------------------------------------------------------------------------
  openSignInModal() {
    this.closeProfilePopover();
    if (!this.dom.signinModal) return;

    this.dom.signinModal.innerHTML = `
      <div class="google-signin-dialog" id="signin-dialog" role="dialog" aria-modal="true" aria-labelledby="signin-heading">
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:12px;">
          <div class="signin-logo-wrap">
            <div class="brand-logo-icon" style="width:28px; height:28px;">
              ${ICONS.devstore}
            </div>
            <span class="brand-title" style="font-size:18px;">DevStore</span>
          </div>
          <button class="popover-close-btn" id="signin-close-x" aria-label="Close sign in dialog">
            ${ICONS.close}
          </button>
        </div>

        <h2 class="signin-heading" id="signin-heading">DevStore Profile Selection</h2>
        <p class="signin-subheading">Select a local demo profile or test account (unverified demo mode)</p>

        <!-- 1-Click Quick Demo Accounts -->
        <div class="signin-demo-accounts">
          <div class="demo-accounts-title">Quick demo profiles (1-click)</div>
          ${DEMO_ACCOUNTS.map((acc, idx) => `
            <div class="demo-account-item" data-account-idx="${idx}" tabindex="0" role="button">
              <div class="demo-account-avatar" style="background:${acc.avatarBg}">
                ${acc.initial}
              </div>
              <div class="demo-account-info">
                <span class="demo-account-name">${this.escapeHtml(acc.name)}</span>
                <span class="demo-account-email">${this.escapeHtml(acc.email)}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Inline Create Account Form Container -->
        <div id="signin-create-form" style="display:none; margin: 12px 0; padding: 12px; background: #f8f9fa; border-radius: 8px; border: 1px solid #dadce0;">
          <label class="signin-label" for="signin-create-name" style="font-size:12px; font-weight:600; color:#3c4043; display:block; margin-bottom:4px;">Full Name</label>
          <input type="text" id="signin-create-name" class="signin-outlined-input" placeholder="e.g. Linus Torvalds" style="margin-bottom:8px;" />
          <button type="button" class="detail-install-btn" id="signin-confirm-create-btn" style="width:100%; padding:8px;">Create Demo Profile</button>
        </div>

        <!-- Floating or Outlined Email / Phone input -->
        <div class="signin-field-group">
          <label class="signin-label" for="signin-email-input">Email address</label>
          <input type="email" id="signin-email-input" class="signin-outlined-input" placeholder="user@devstore.org" autocomplete="email" />
          <button type="button" class="signin-helper-link" id="signin-forgot-btn">Demo accounts guide</button>
        </div>

        <p class="signin-guest-note">
          Notice: Profiles in DevStore are local demonstrations and do not verify remote emails or transmit credentials. <a href="#learn-more" id="signin-learn-more">Learn more</a>
        </p>

        <div class="signin-actions-row">
          <button type="button" class="signin-create-btn" id="signin-create-btn">Create account</button>
          <button type="button" class="signin-next-btn" id="signin-next-btn">Sign in</button>
        </div>
      </div>
    `;

    this.dom.signinModal.classList.add('open');
    this.modalManager.registerOpen('signin-modal', this.dom.signinModal, () => this.closeSignInModal());

    // Bind Sign In events
    document.getElementById('signin-close-x')?.addEventListener('click', () => this.closeSignInModal());

    const demoItems = this.dom.signinModal.querySelectorAll('.demo-account-item');
    demoItems.forEach((el) => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.getAttribute('data-account-idx'), 10);
        if (DEMO_ACCOUNTS[idx]) {
          this.handleSignIn(DEMO_ACCOUNTS[idx]);
        }
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.click();
        }
      });
    });

    const nextBtn = document.getElementById('signin-next-btn');
    const emailInput = document.getElementById('signin-email-input');

    const submitEmail = () => {
      const email = emailInput.value.trim();
      if (!email) {
        this.notifications.notify('Please enter an email address or select a demo profile above.', 'warning');
        emailInput.focus();
        return;
      }
      this.handleSignIn(email);
    };

    nextBtn?.addEventListener('click', submitEmail);
    emailInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitEmail();
      }
    });

    const createForm = document.getElementById('signin-create-form');
    const createBtn = document.getElementById('signin-create-btn');
    const createNameInput = document.getElementById('signin-create-name');
    const confirmCreateBtn = document.getElementById('signin-confirm-create-btn');

    createBtn?.addEventListener('click', () => {
      if (createForm) {
        createForm.style.display = createForm.style.display === 'none' ? 'block' : 'none';
        if (createForm.style.display === 'block') {
          createNameInput?.focus();
        }
      }
    });

    confirmCreateBtn?.addEventListener('click', () => {
      const name = createNameInput ? createNameInput.value.trim() : '';
      if (!name) {
        this.notifications.notify('Please enter your name for the demo profile.', 'warning');
        createNameInput?.focus();
        return;
      }
      const email = `${name.toLowerCase().replace(/\s+/g, '.')}@devstore.org`;
      this.handleSignIn({
        name: name,
        email: email,
        initial: name[0].toUpperCase(),
        avatarBg: 'linear-gradient(135deg, #188038 0%, #34a853 100%)',
        installedApps: ['org.devstore.chess'],
        passActive: true,
        isDemo: true,
        isVerified: false
      });
    });

    document.getElementById('signin-forgot-btn')?.addEventListener('click', () => {
      this.notifications.notify('Select any 1-click quick demo profile above to explore user library features.', 'info');
    });

    document.getElementById('signin-learn-more')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.notifications.showDialog({
        title: 'DevStore Demo Authentication',
        message: 'DevStore operates in a client-side sandbox. All profiles are local demonstrations without external credential validation or identity verification.'
      });
    });

    setTimeout(() => emailInput?.focus(), 50);
  }

  closeSignInModal() {
    if (!this.dom.signinModal) return;
    this.dom.signinModal.classList.remove('open');
    this.modalManager.registerClose('signin-modal');
  }

  handleSignIn(accountOrEmail) {
    if (typeof accountOrEmail === 'object' && accountOrEmail !== null) {
      this.user = { ...accountOrEmail, isDemo: true, isVerified: false };
    } else {
      const email = String(accountOrEmail);
      const matched = DEMO_ACCOUNTS.find(a => a.email.toLowerCase() === email.toLowerCase());
      if (matched) {
        this.user = { ...matched, isDemo: true, isVerified: false };
      } else {
        const localPart = email.split('@')[0] || 'User';
        const formattedName = localPart.split('.')[0];
        const capName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
        this.user = {
          name: capName,
          email: email.includes('@') ? email : `${email}@devstore.org`,
          initial: capName[0] || 'U',
          avatarBg: 'linear-gradient(135deg, #01875f 0%, #34a853 100%)',
          installedApps: ['org.devstore.chess', 'org.devstore.calculator'],
          passActive: true,
          isDemo: true,
          isVerified: false
        };
      }
    }

    try {
      localStorage.setItem('devstore_user', JSON.stringify(this.user));
    } catch (e) {
      console.warn('Failed to persist user to localStorage:', e);
    }

    this.renderUserAvatar();
    this.closeSignInModal();
    this.notifications.notify(`Signed in as ${this.user.name} (Demo Profile)`, 'success');
  }

  handleSignOut() {
    this.user = null;
    try {
      localStorage.removeItem('devstore_user');
    } catch (e) {
      console.warn('Failed to remove user from localStorage:', e);
    }
    this.closeProfilePopover();
    this.renderUserAvatar();
    this.notifications.notify('Signed out of DevStore demo profile.', 'info');
  }

  // --------------------------------------------------------------------------
  // Google Play "Manage apps & device" Modal Dialog (Truthful Demo Status)
  // --------------------------------------------------------------------------
  openManageAppsModal(activeTab = 'overview') {
    if (!this.dom.manageAppsModal || !this.user) return;

    this.dom.manageAppsModal.innerHTML = `
      <div class="manage-apps-dialog" id="manage-apps-dialog" role="dialog" aria-modal="true" aria-labelledby="manage-dialog-title">
        <div class="manage-dialog-header">
          <h3 class="manage-dialog-title" id="manage-dialog-title">Manage apps &amp; device</h3>
          <button class="popover-close-btn" id="manage-close-x" aria-label="Close dialog">
            ${ICONS.close}
          </button>
        </div>

        <div class="manage-tabs-bar" role="tablist">
          <button class="manage-tab-btn ${activeTab === 'overview' ? 'active' : ''}" id="tab-btn-overview" role="tab" aria-selected="${activeTab === 'overview'}">Overview</button>
          <button class="manage-tab-btn ${activeTab === 'manage' ? 'active' : ''}" id="tab-btn-manage" role="tab" aria-selected="${activeTab === 'manage'}">Manage</button>
        </div>

        <div class="manage-dialog-body" id="manage-dialog-body" role="tabpanel">
        </div>
      </div>
    `;

    this.dom.manageAppsModal.classList.add('open');
    this.modalManager.registerOpen('manage-apps-modal', this.dom.manageAppsModal, () => this.closeManageAppsModal());

    const closeBtn = document.getElementById('manage-close-x');
    closeBtn?.addEventListener('click', () => this.closeManageAppsModal());

    const tabOverview = document.getElementById('tab-btn-overview');
    const tabManage = document.getElementById('tab-btn-manage');

    tabOverview?.addEventListener('click', () => {
      tabOverview.classList.add('active');
      tabOverview.setAttribute('aria-selected', 'true');
      tabManage.classList.remove('active');
      tabManage.setAttribute('aria-selected', 'false');
      this.renderManageOverviewTab();
    });

    tabManage?.addEventListener('click', () => {
      tabManage.classList.add('active');
      tabManage.setAttribute('aria-selected', 'true');
      tabOverview.classList.remove('active');
      tabOverview.setAttribute('aria-selected', 'false');
      this.renderManageAppsListTab();
    });

    if (activeTab === 'overview') {
      this.renderManageOverviewTab();
    } else {
      this.renderManageAppsListTab();
    }
  }

  closeManageAppsModal() {
    if (!this.dom.manageAppsModal) return;
    this.dom.manageAppsModal.classList.remove('open');
    this.modalManager.registerClose('manage-apps-modal');
  }

  renderManageOverviewTab() {
    const body = document.getElementById('manage-dialog-body');
    if (!body || !this.user) return;

    const installedCount = this.user.installedApps ? this.user.installedApps.length : 0;
    const usedStorage = (10.2 + (installedCount * 0.4)).toFixed(1);
    const storagePercent = Math.min(100, Math.round((usedStorage / 64) * 100));

    body.innerHTML = `
      <!-- Catalog Integrity & Safety Card -->
      <div class="protect-status-card">
        <div class="protect-icon-circle">
          ${ICONS.checkShield}
        </div>
        <div style="flex:1;">
          <div class="protect-title">Catalog Integrity &amp; Safety (Demo)</div>
          <div class="protect-subtitle">DevStore indexes open-source packages &bull; No active background anti-malware service</div>
        </div>
        <button class="detail-share-btn" style="padding:6px 14px; font-size:13px;" id="protect-scan-btn">
          Inspect
        </button>
      </div>

      <!-- Updates Available Card -->
      <div class="protect-status-card" style="background-color:#ffffff;">
        <div class="protect-icon-circle" style="background-color:#e8f0fe; color:#1a73e8;">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/></svg>
        </div>
        <div style="flex:1;">
          <div class="protect-title">Catalog Version Check</div>
          <div class="protect-subtitle">DevStore Manifest v1.0.0 &bull; Static client repository</div>
        </div>
        <button class="detail-share-btn" style="padding:6px 14px; font-size:13px;" id="updates-check-btn">
          Check
        </button>
      </div>

      <!-- Storage Status Card -->
      <div class="storage-status-card">
        <div class="storage-header">
          <div class="storage-title">Simulated Device Storage</div>
          <span style="font-size:13px; color:#5f6368; font-weight:500;">${usedStorage} GB of 64 GB used</span>
        </div>
        <div class="storage-bar-track">
          <div class="storage-bar-fill" style="width: ${storagePercent}%;"></div>
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
          <span style="font-size:12px; color:#5f6368;">${installedCount} applications in local library</span>
          <button class="signin-helper-link" style="margin:0; font-size:13px;" id="storage-view-apps-btn">View apps</button>
        </div>
      </div>

      <!-- Ratings & Reviews Card -->
      <div class="protect-status-card" style="background-color:#ffffff;">
        <div class="protect-icon-circle" style="background-color:#fef7e0; color:#f9ab00;">
          ${ICONS.star}
        </div>
        <div style="flex:1;">
          <div class="protect-title">Ratings &amp; reviews</div>
          <div class="protect-subtitle">Manage your local session reviews and feedback</div>
        </div>
        <button class="detail-share-btn" style="padding:6px 14px; font-size:13px;" id="reviews-manage-btn">
          Manage
        </button>
      </div>
    `;

    document.getElementById('protect-scan-btn')?.addEventListener('click', () => {
      this.notifications.showDialog({
        title: 'Catalog Integrity & Safety Check',
        message: 'DevStore indexes open-source software and does not run a device-level anti-virus background scanner. Downloaded packages should be verified with SHA-256 checksums and source code audits before running.'
      });
    });

    document.getElementById('updates-check-btn')?.addEventListener('click', () => {
      this.notifications.notify('DevStore Version Check: All applications correspond to static catalog v1.0.0. No remote update server.', 'info');
    });

    document.getElementById('storage-view-apps-btn')?.addEventListener('click', () => {
      const tabManage = document.getElementById('tab-btn-manage');
      tabManage?.click();
    });

    document.getElementById('reviews-manage-btn')?.addEventListener('click', () => {
      this.notifications.notify('You have contributed reviews to the community feedback feed.', 'info');
    });
  }

  renderManageAppsListTab() {
    const body = document.getElementById('manage-dialog-body');
    if (!body || !this.user) return;

    const installedIds = this.user.installedApps || [];
    const installedApps = installedIds
      .map(id => this.searchEngine.getAppById(id))
      .filter(Boolean);

    if (installedApps.length === 0) {
      body.innerHTML = `
        <div class="empty-state" style="padding:32px 16px;">
          <div class="empty-state-title">No Apps in Library</div>
          <div class="empty-state-desc">Explore the catalog to discover games, tools, and developer utilities.</div>
          <button class="detail-install-btn" id="browse-store-btn" style="margin-top:12px;">Browse DevStore</button>
        </div>
      `;
      document.getElementById('browse-store-btn')?.addEventListener('click', () => {
        this.closeManageAppsModal();
      });
      return;
    }

    body.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
        <span style="font-size:14px; font-weight:600; color:#202124;">Installed (${installedApps.length})</span>
        <span style="font-size:12px; color:#5f6368;">Sorted by name</span>
      </div>

      <div class="installed-apps-list">
        ${installedApps.map(app => {
          const glyphSvg = getGlyphSvg(app.iconGlyph || 'devstore');
          return `
            <div class="installed-app-row" data-app-id="${app.id}">
              <div class="installed-app-info">
                <div class="installed-app-icon" style="background:${app.iconBg || '#01875f'}; color:#ffffff;">
                  ${glyphSvg}
                </div>
                <div>
                  <div class="installed-app-title">${this.escapeHtml(app.name)}</div>
                  <div class="installed-app-size">${app.size || '15 MB'} &bull; v${app.version || '1.0.0'}</div>
                </div>
              </div>

              <div style="display:flex; align-items:center; gap:8px;">
                <button class="detail-share-btn app-open-btn" data-app-id="${app.id}" style="padding:6px 14px; font-size:12px;" title="Open app">
                  Open
                </button>
                <button class="popover-close-btn app-uninstall-btn" data-app-id="${app.id}" style="color:#d93025;" aria-label="Remove ${this.escapeHtml(app.name)}" title="Remove app">
                  ${ICONS.trash}
                </button>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Wire Open and Uninstall buttons
    const openBtns = body.querySelectorAll('.app-open-btn');
    openBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const appId = btn.getAttribute('data-app-id');
        this.launchApp(appId);
      });
    });

    const uninstallBtns = body.querySelectorAll('.app-uninstall-btn');
    uninstallBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const appId = btn.getAttribute('data-app-id');
        const app = this.searchEngine.getAppById(appId);
        const appName = app ? app.name : appId;
        this.notifications.showDialog({
          title: `Remove ${appName}`,
          message: `Are you sure you want to remove "${appName}" from your installed library?`,
          confirmText: 'Remove',
          cancelText: 'Cancel',
          onConfirm: () => {
            this.uninstallApp(appId);
            this.notifications.notify(`"${appName}" removed from library.`, 'info');
          }
        });
      });
    });
  }

  // --------------------------------------------------------------------------
  // Accessible Helper Dialogs & Notifications
  // --------------------------------------------------------------------------
  launchApp(appId) {
    const app = this.searchEngine.getAppById(appId);
    if (!app) return;
    const webUrl = app.downloads && app.downloads.web;
    if (webUrl) {
      this.notifications.notify(`Launching web application: ${app.name}`, 'info');
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    } else {
      this.notifications.showDialog({
        title: `Launch ${app.name}`,
        message: `"${app.name}" is a desktop/mobile application package. In this web demo environment, local native application execution is simulated.`
      });
    }
  }

  showHelpInfo() {
    this.notifications.showDialog({
      title: 'Help & Documentation',
      message: 'DevStore is an open-source application catalog browser. Explore categories, filter by platform (Windows, Android, Web), and review genuine software packages.',
      confirmText: 'Got it'
    });
  }

  showFooterInfo(topic) {
    const topics = {
      terms: {
        title: 'Terms of Service',
        message: 'DevStore indexes open-source and freely distributable applications under their respective original licenses. All trademarks and logos belong to their respective owners.'
      },
      privacy: {
        title: 'Privacy Policy',
        message: 'DevStore operates entirely client-side without third-party tracking, advertising identifiers, or server-side telemetry collection.'
      },
      developers: {
        title: 'For Developers',
        message: 'Publishing to DevStore is open. Submit application metadata and manifests via GitHub pull requests to the repository.'
      },
      devices: {
        title: 'Supported Devices',
        message: 'DevStore catalogs packages for Windows PC, Android devices, and modern web browsers.'
      }
    };
    const item = topics[topic] || { title: 'DevStore Information', message: 'Open-source software distribution platform.' };
    this.notifications.showDialog({
      title: item.title,
      message: item.message,
      confirmText: 'Close'
    });
  }

  showDataSafetyDialog(appId) {
    const app = this.searchEngine.getAppById(appId);
    const name = app ? app.name : 'This application';
    this.notifications.showDialog({
      title: `Data Safety: ${name}`,
      message: 'Safety claims on DevStore reflect open-source peer reviews and developer declarations. Because DevStore does not host proprietary signing keys, users are encouraged to verify checksums and source code independently before installation.',
      confirmText: 'Understood'
    });
  }

  showContentRatingInfo() {
    this.notifications.showDialog({
      title: 'Content Rating Information',
      message: 'DevStore displays age ratings and interactive elements based on developer declarations and open-source standards.',
      confirmText: 'Got it'
    });
  }

  showFeedbackThanks() {
    this.notifications.notify('Thank you for your feedback on this review!', 'info');
  }

  escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

