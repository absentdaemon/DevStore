/**
 * DevStore Download & Installation Manager
 * Verifies real download artifact availability and platform support.
 * Never falsely marks an app as installed when artifacts are missing or fail.
 */

export class DownloadManager {
  constructor(notificationSystem) {
    this.notifications = notificationSystem;
  }

  /**
   * Validates if the selected platform is supported by the application.
   */
  checkPlatformSupport(app, platform) {
    if (!app) return { supported: false, reason: 'Application not found' };
    const platforms = (app.platforms || []).map(p => p.toLowerCase());
    const target = (platform || 'all').toLowerCase();

    if (target === 'all' || platforms.includes(target) || platforms.includes('all')) {
      return { supported: true };
    }

    const readablePlatforms = platforms.map(p => {
      if (p === 'windows') return 'Windows PC';
      if (p === 'android') return 'Android (Phone/Tablet)';
      if (p === 'web') return 'Web Browser';
      return p;
    }).join(', ');

    return {
      supported: false,
      reason: `Unavailable on ${target === 'windows' ? 'Windows PC' : target === 'android' ? 'Android' : target}. Supported on: ${readablePlatforms || 'None'}.`
    };
  }

  /**
   * Resolves the appropriate download target for the given platform.
   */
  resolveTarget(app, platform) {
    if (!app || !app.downloads) return null;
    const targetPlatform = (platform || 'all').toLowerCase();

    if (targetPlatform !== 'all' && app.downloads[targetPlatform]) {
      return { platform: targetPlatform, target: app.downloads[targetPlatform] };
    }

    // Default preference order when 'all' is selected: windows, android, web
    const prefs = ['windows', 'android', 'web'];
    for (const p of prefs) {
      if (app.downloads[p]) {
        return { platform: p, target: app.downloads[p] };
      }
    }

    const firstKey = Object.keys(app.downloads)[0];
    if (firstKey) {
      return { platform: firstKey, target: app.downloads[firstKey] };
    }

    return null;
  }

  /**
   * Checks download capability, tests server availability, and reports genuine state.
   */
  async attemptDownload(app, currentPlatform, btnElement) {
    // 1. Platform support check
    const platformCheck = this.checkPlatformSupport(app, currentPlatform);
    if (!platformCheck.supported) {
      this.notifications.notify(platformCheck.reason, 'warning', 5000);
      if (btnElement) {
        btnElement.classList.add('unavailable');
        btnElement.textContent = 'Unavailable on this device';
        setTimeout(() => {
          btnElement.classList.remove('unavailable');
          btnElement.textContent = 'Install';
        }, 3000);
      }
      return { success: false, state: 'unsupported-platform' };
    }

    // 2. Resolve artifact target
    const resolved = this.resolveTarget(app, currentPlatform);
    if (!resolved || !resolved.target) {
      this.notifications.notify(
        `No download package is configured for "${app.name}" on this platform.`,
        'error',
        5000
      );
      return { success: false, state: 'no-artifact' };
    }

    const { target, platform } = resolved;

    // 3. Handle Web application launch
    if (target.startsWith('http://') || target.startsWith('https://')) {
      this.notifications.notify(`Launching web application: ${target}`, 'info', 3000);
      window.open(target, '_blank', 'noopener,noreferrer');
      return { success: true, state: 'web-launched' };
    }

    // 4. Test local binary availability via real HTTP request
    if (btnElement) {
      btnElement.classList.add('installing');
      btnElement.innerHTML = `<div class="install-spinner"></div> <span>Checking package...</span>`;
    }

    try {
      const response = await fetch(target, { method: 'HEAD' });
      
      if (!response.ok) {
        // Genuine state: File is missing / 404
        throw new Error(`Package binary not found on server (HTTP ${response.status})`);
      }

      // If file actually exists:
      this.notifications.notify(
        `Artifact verified: Downloading "${app.name}" (${target})...`,
        'success',
        4000
      );

      const a = document.createElement('a');
      a.href = target;
      a.download = target.split('/').pop() || `${app.id}.pkg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      if (btnElement) {
        btnElement.classList.remove('installing');
        btnElement.textContent = 'Download Started';
      }

      return { success: true, state: 'download-started', target };
    } catch (err) {
      // Report the genuine state! Never mark installed on failure!
      console.warn(`Download check failed for ${app.id}:`, err.message);
      this.notifications.notify(
        `Download Artifact Unavailable: "${target}" is not mirrored on this repository server. The genuine binary cannot be installed.`,
        'error',
        6000
      );

      if (btnElement) {
        btnElement.classList.remove('installing');
        btnElement.classList.add('error-state');
        btnElement.textContent = 'Artifact Unavailable';
        setTimeout(() => {
          btnElement.classList.remove('error-state');
          btnElement.textContent = 'Install';
        }, 3500);
      }

      return { success: false, state: 'artifact-missing', error: err.message };
    }
  }
}
