/**
 * DevStore In-Memory Search Engine
 * High-performance client-side tokenizing, ranking, autocomplete, and facet filtering.
 */

export class SearchEngine {
  constructor() {
    this.catalog = [];
    this.index = new Map();
  }

  /**
   * Indexes the catalog applications for rapid retrieval.
   * @param {Array} applications - Array of application objects from catalog.json
   */
  loadCatalog(applications) {
    this.catalog = Array.isArray(applications) ? applications : [];
    this.index.clear();

    for (const app of this.catalog) {
      const tokens = this._extractTokens(app);
      this.index.set(app.id, {
        app,
        tokens,
        normalizedName: (app.name || '').toLowerCase(),
        normalizedDev: (app.developer || '').toLowerCase(),
        normalizedTagline: (app.tagline || '').toLowerCase(),
        normalizedDesc: (app.description || '').toLowerCase(),
        category: (app.category || '').toLowerCase(),
        platforms: (app.platforms || []).map(p => p.toLowerCase())
      });
    }
  }

  /**
   * Generates autocomplete suggestions as the user types.
   * @param {string} rawQuery - Current text in search input
   * @param {number} limit - Maximum suggestions to return
   * @returns {Array} - List of suggestions with highlighted text and metadata
   */
  getSuggestions(rawQuery, limit = 6) {
    const query = (rawQuery || '').trim().toLowerCase();
    if (query.length < 1) return [];

    const suggestions = [];


    for (const item of this.index.values()) {
      const { app, normalizedName, normalizedDev, normalizedTagline, category } = item;
      let score = 0;
      let matchType = null;

      if (normalizedName === query) {
        score = 100;
        matchType = 'exact-name';
      } else if (normalizedName.startsWith(query)) {
        score = 80;
        matchType = 'prefix-name';
      } else if (normalizedName.includes(query)) {
        score = 60;
        matchType = 'substring-name';
      } else if (normalizedDev.startsWith(query) || normalizedDev.includes(query)) {
        score = 40;
        matchType = 'developer';
      } else if (normalizedTagline.includes(query)) {
        score = 30;
        matchType = 'tagline';
      } else if (category.startsWith(query)) {
        score = 25;
        matchType = 'category';
      }

      if (score > 0) {
        suggestions.push({
          id: app.id,
          name: app.name,
          developer: app.developer,
          category: app.category,
          rating: app.rating,
          iconBg: app.iconBg,
          iconColor: app.iconColor,
          iconGlyph: app.iconGlyph,
          score,
          matchType
        });
      }
    }

    // Sort descending by score, then by app rating
    suggestions.sort((a, b) => b.score - a.score || b.rating - a.rating);

    return suggestions.slice(0, limit);
  }

  /**
   * Alias for getSuggestions to support autocomplete naming convention.
   */
  autocomplete(rawQuery, limit = 6) {
    return this.getSuggestions(rawQuery, limit);
  }

  /**

   * Executes a full search query across the catalog with facet filters.
   * @param {string} rawQuery - Search query string
   * @param {Object} filters - Optional filters: { category, platform }
   * @returns {Array} - Sorted array of matching application items
   */
  search(rawQuery = '', filters = {}) {
    const query = (rawQuery || '').trim().toLowerCase();
    const targetCategory = (filters.category || 'all').toLowerCase();
    const targetPlatform = (filters.platform || 'all').toLowerCase();

    const queryTokens = query.split(/\s+/).filter(t => t.length > 0);

    const results = [];

    for (const item of this.index.values()) {
      const { app, normalizedName, normalizedDev, normalizedTagline, normalizedDesc, category, platforms } = item;

      // Category filter check
      if (targetCategory !== 'all' && category !== targetCategory) {
        continue;
      }

      // Platform filter check
      if (targetPlatform !== 'all' && !platforms.includes(targetPlatform)) {
        continue;
      }

      // If query is empty, it's a category/catalog browsing match
      if (queryTokens.length === 0) {
        results.push({ app, score: app.rating || 0 });
        continue;
      }

      let score = 0;

      // Check full query match
      if (normalizedName === query) score += 120;
      else if (normalizedName.startsWith(query)) score += 80;
      else if (normalizedName.includes(query)) score += 50;

      if (normalizedDev.includes(query)) score += 35;
      if (category.includes(query)) score += 30;
      if (normalizedTagline.includes(query)) score += 25;
      if (normalizedDesc.includes(query)) score += 15;

      // Token-level scoring
      let matchedTokens = 0;
      for (const token of queryTokens) {
        if (normalizedName.includes(token)) {
          score += 25;
          matchedTokens++;
        } else if (normalizedDev.includes(token)) {
          score += 15;
          matchedTokens++;
        } else if (normalizedTagline.includes(token) || normalizedDesc.includes(token)) {
          score += 10;
          matchedTokens++;
        }
      }

      if (score > 0) {
        // Boost by app rating
        score += (app.rating || 0) * 2;
        results.push({ app, score });
      }
    }

    // Sort descending by score
    results.sort((a, b) => b.score - a.score);

    return results.map(r => r.app);
  }

  /**
   * Retrieves recommended alternative applications when a query has no matches.
   * @param {string} excludeId - Application ID to exclude
   * @param {number} limit - Maximum number of recommendations
   * @returns {Array} - Recommended apps sorted by rating
   */
  getRecommendations(excludeId = null, limit = 4) {
    return this.catalog
      .filter(app => !excludeId || app.id !== excludeId)
      .sort((a, b) => (b.rating || 0) - (a.rating || 0) || (b.reviewCount || 0) - (a.reviewCount || 0))
      .slice(0, limit);
  }

  /**
   * Retrieves a single application by ID.
   * @param {string} id - App ID (e.g. org.devstore.chess)
   * @returns {Object|null}
   */
  getAppById(id) {
    if (!id) return null;
    const item = this.index.get(id);
    return item ? item.app : null;
  }

  /**
   * Internal helper to extract searchable tokens.
   */
  _extractTokens(app) {
    const raw = `${app.name} ${app.developer} ${app.tagline} ${app.category} ${(app.features || []).join(' ')} ${(app.platforms || []).join(' ')}`;
    return raw.toLowerCase().split(/[\s,.-]+/).filter(t => t.length > 1);
  }
}
