/**
 * DevStore Catalog Validator
 * Validates catalog schema, sanitizes fields, enforces URL safety protocols,
 * and provides fallbacks for missing or malformed attributes.
 */

export function isSafeHttpUrl(urlStr) {
  if (typeof urlStr !== 'string' || !urlStr.trim()) return false;
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isSafeRelativePath(pathStr) {
  if (typeof pathStr !== 'string' || !pathStr.trim()) return false;
  // Reject protocol injections and directory traversals
  if (/^[a-zA-Z]+:/.test(pathStr)) return false;
  if (pathStr.includes('..') || pathStr.includes('\0')) return false;
  return true;
}

export function validateCatalog(raw) {
  const errors = [];
  const warnings = [];

  if (!raw || typeof raw !== 'object') {
    return {
      valid: false,
      errors: ['Catalog payload must be a non-null object'],
      warnings,
      sanitizedCatalog: { version: '1.0.0', categories: [], applications: [] }
    };
  }

  const version = typeof raw.version === 'string' ? raw.version : '1.0.0';
  const categories = Array.isArray(raw.categories) ? raw.categories : [];
  const rawApps = Array.isArray(raw.applications) ? raw.applications : [];

  if (!Array.isArray(raw.applications)) {
    errors.push('Catalog missing valid applications array');
  }

  const sanitizedApplications = [];

  for (let i = 0; i < rawApps.length; i++) {
    const item = rawApps[i];
    if (!item || typeof item !== 'object') {
      warnings.push(`App at index ${i} is not a valid object, skipping`);
      continue;
    }

    if (!item.id || typeof item.id !== 'string') {
      warnings.push(`App at index ${i} missing valid string id, skipping`);
      continue;
    }

    const app = {
      id: item.id.trim(),
      name: (typeof item.name === 'string' && item.name.trim()) ? item.name.trim() : 'Untitled Application',
      tagline: typeof item.tagline === 'string' ? item.tagline : '',
      developer: typeof item.developer === 'string' ? item.developer.trim() : 'Independent Developer',
      category: typeof item.category === 'string' ? item.category.toLowerCase().trim() : 'utilities',
      rating: typeof item.rating === 'number' && !isNaN(item.rating) ? Math.min(5, Math.max(0, item.rating)) : 4.5,
      reviewCount: typeof item.reviewCount === 'number' && !isNaN(item.reviewCount) ? Math.max(0, item.reviewCount) : 0,
      iconBg: typeof item.iconBg === 'string' ? item.iconBg : '#0f172a',
      iconColor: typeof item.iconColor === 'string' ? item.iconColor : '#38bdf8',
      iconGlyph: typeof item.iconGlyph === 'string' ? item.iconGlyph : 'devstore',
      version: typeof item.version === 'string' ? item.version : '1.0.0',
      size: typeof item.size === 'string' ? item.size : 'Unknown size',
      platforms: Array.isArray(item.platforms)
        ? item.platforms.filter(p => typeof p === 'string').map(p => p.toLowerCase())
        : ['windows'],
      license: typeof item.license === 'string' ? item.license : 'Open Source',
      description: typeof item.description === 'string' ? item.description : '',
      features: Array.isArray(item.features)
        ? item.features.filter(f => typeof f === 'string')
        : [],
      permissions: Array.isArray(item.permissions)
        ? item.permissions.filter(p => p && typeof p === 'object')
        : [],
      screenshots: Array.isArray(item.screenshots)
        ? item.screenshots.map((s, sIdx) => ({
            title: s && typeof s.title === 'string' ? s.title : `Feature ${sIdx + 1}`,
            caption: s && typeof s.caption === 'string' ? s.caption : '',
            orientation: s && s.orientation === 'landscape' ? 'landscape' : 'portrait',
            src: s && typeof s.src === 'string' && (isSafeHttpUrl(s.src) || isSafeRelativePath(s.src)) ? s.src : null
          }))
        : [],
      reviews: Array.isArray(item.reviews)
        ? item.reviews.map((r, rIdx) => ({
            id: r && r.id ? String(r.id) : `rev-${item.id}-${rIdx}`,
            author: r && typeof r.author === 'string' ? r.author : 'User',
            avatar: r && typeof r.avatar === 'string' ? r.avatar : '#01875f',
            rating: r && typeof r.rating === 'number' ? Math.min(5, Math.max(1, r.rating)) : 5,
            date: r && typeof r.date === 'string' ? r.date : 'Recent',
            device: r && typeof r.device === 'string' ? r.device : 'Desktop',
            helpfulCount: r && typeof r.helpfulCount === 'number' ? Math.max(0, r.helpfulCount) : 0,
            comment: r && typeof r.comment === 'string' ? r.comment : ''
          }))
        : [],
      distribution: (item.distribution && typeof item.distribution === 'object')
        ? {
            '5': typeof item.distribution['5'] === 'number' ? item.distribution['5'] : 70,
            '4': typeof item.distribution['4'] === 'number' ? item.distribution['4'] : 15,
            '3': typeof item.distribution['3'] === 'number' ? item.distribution['3'] : 10,
            '2': typeof item.distribution['2'] === 'number' ? item.distribution['2'] : 3,
            '1': typeof item.distribution['1'] === 'number' ? item.distribution['1'] : 2
          }
        : { '5': 70, '4': 15, '3': 10, '2': 3, '1': 2 },
      video: item.video && typeof item.video === 'object'
        ? {
            title: typeof item.video.title === 'string' ? item.video.title : `${item.name} Trailer`,
            duration: typeof item.video.duration === 'string' ? item.video.duration : '0:45',
            views: typeof item.video.views === 'string' ? item.video.views : '0 views',
            src: typeof item.video.src === 'string' && (isSafeHttpUrl(item.video.src) || isSafeRelativePath(item.video.src))
              ? item.video.src
              : null
          }
        : null,
      contentRating: typeof item.contentRating === 'string' ? item.contentRating : 'Rated for 3+',
      downloads: {},
      support: {
        website: null,
        email: 'support@devstore.org',
        address: 'DevStore Community Project',
        privacyPolicy: null
      }
    };

    // Validate and sanitize downloads
    if (item.downloads && typeof item.downloads === 'object') {
      for (const [platformKey, targetVal] of Object.entries(item.downloads)) {
        if (typeof targetVal === 'string') {
          if (isSafeHttpUrl(targetVal) || isSafeRelativePath(targetVal)) {
            app.downloads[platformKey.toLowerCase()] = targetVal.trim();
          } else {
            warnings.push(`Rejected unsafe download target for app ${item.id} platform ${platformKey}: "${targetVal}"`);
          }
        }
      }
    }

    // Validate and sanitize support
    if (item.support && typeof item.support === 'object') {
      if (typeof item.support.website === 'string' && isSafeHttpUrl(item.support.website)) {
        app.support.website = item.support.website.trim();
      }
      if (typeof item.support.privacyPolicy === 'string' && isSafeHttpUrl(item.support.privacyPolicy)) {
        app.support.privacyPolicy = item.support.privacyPolicy.trim();
      }
      if (typeof item.support.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.support.email.trim())) {
        app.support.email = item.support.email.trim();
      }
      if (typeof item.support.address === 'string') {
        app.support.address = item.support.address.trim();
      }
    }

    sanitizedApplications.push(app);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    sanitizedCatalog: {
      version,
      updatedAt: raw.updatedAt || new Date().toISOString(),
      categories,
      applications: sanitizedApplications
    }
  };
}
