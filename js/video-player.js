/**
 * DevStore Video Trailer Component
 * Operates on actual HTML5 media when a media file is available,
 * or clearly labels and handles non-functional demo trailers truthfully.
 */

export class VideoPlayerController {
  constructor(notificationSystem) {
    this.notifications = notificationSystem;
    this.mediaStates = new Map(); // appId -> { videoEl, isPlaying, isMuted, progress }
  }

  /**
   * Generates the HTML for the video trailer card.
   * If app has a real media source, renders an actual <video> tag.
   * Otherwise, renders a clearly labeled demo poster card.
   */
  renderVideoCardHtml(app, escapeHtml) {
    const video = app.video;
    if (!video) return '';

    const hasMedia = Boolean(video.src);
    const title = escapeHtml(video.title || `${app.name} Trailer`);
    const duration = escapeHtml(video.duration || '0:45');

    if (hasMedia) {
      return `
        <div class="video-preview-card with-media" id="video-card-${app.id}" data-app-id="${app.id}">
          <video 
            id="video-media-${app.id}" 
            class="trailer-video-element" 
            src="${escapeHtml(video.src)}" 
            preload="metadata" 
            playsinline
            aria-label="${title}"
          ></video>
          <div class="video-controls-bar real-controls">
            <div class="video-progress-track" id="video-track-${app.id}">
              <div class="video-progress-fill" id="video-fill-${app.id}"></div>
            </div>
            <button type="button" class="video-ctrl-btn video-play-btn" id="video-play-btn-${app.id}" aria-label="Play video" onclick="event.stopPropagation(); devstore.toggleVideoPlay('${app.id}')">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
            </button>
            <button type="button" class="video-ctrl-btn video-mute-btn" id="video-mute-btn-${app.id}" aria-label="Toggle mute" onclick="event.stopPropagation(); devstore.toggleVideoMute('${app.id}')">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
            </button>
            <span class="video-time-label" id="video-time-${app.id}">0:00 / ${duration}</span>
          </div>
        </div>
      `;
    }

    // Demo / placeholder preview (no media source)
    return `
      <div class="video-preview-card demo-preview" id="video-card-${app.id}" data-app-id="${app.id}" onclick="devstore.toggleVideoPlay('${app.id}')">
        <div class="video-poster-art" style="background: linear-gradient(135deg, ${app.iconBg || '#0f172a'} 0%, #030712 100%);">
          <span class="video-demo-badge">Trailer (Demo Preview &bull; No media attached)</span>
          <div class="video-play-overlay-btn" aria-label="Play trailer (demo)">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </div>
          <div style="margin-top: 12px; font-size: 14px; font-weight: 600; color: #ffffff;">${title}</div>
          <span class="video-duration-badge">${duration}</span>
        </div>
        <div class="video-controls-bar">
          <div class="video-progress-track">
            <div class="video-progress-fill"></div>
          </div>
          <button type="button" class="video-ctrl-btn" aria-label="Play demo trailer" onclick="event.stopPropagation(); devstore.toggleVideoPlay('${app.id}')">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
          </button>
          <button type="button" class="video-ctrl-btn" aria-label="Audio controls (disabled)" onclick="event.stopPropagation(); devstore.toggleVideoMute('${app.id}')">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>
          </button>
          <span style="font-size: 11px; color: #94a3b8; margin-left: 8px;">Demo only</span>
        </div>
      </div>
    `;
  }

  attachVideoListeners(appId) {
    const videoEl = document.getElementById(`video-media-${appId}`);
    if (!videoEl) return;

    const playBtn = document.getElementById(`video-play-btn-${appId}`);
    const muteBtn = document.getElementById(`video-mute-btn-${appId}`);
    const fillEl = document.getElementById(`video-fill-${appId}`);
    const timeEl = document.getElementById(`video-time-${appId}`);

    videoEl.addEventListener('play', () => {
      if (playBtn) {
        playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>';
        playBtn.setAttribute('aria-label', 'Pause video');
      }
    });

    videoEl.addEventListener('pause', () => {
      if (playBtn) {
        playBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
        playBtn.setAttribute('aria-label', 'Play video');
      }
    });

    videoEl.addEventListener('volumechange', () => {
      if (muteBtn) {
        if (videoEl.muted) {
          muteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';
          muteBtn.setAttribute('aria-label', 'Unmute audio');
        } else {
          muteBtn.innerHTML = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>';
          muteBtn.setAttribute('aria-label', 'Mute audio');
        }
      }
    });

    videoEl.addEventListener('timeupdate', () => {
      if (videoEl.duration && fillEl) {
        const pct = (videoEl.currentTime / videoEl.duration) * 100;
        fillEl.style.width = `${pct}%`;
        if (timeEl) {
          const curMin = Math.floor(videoEl.currentTime / 60);
          const curSec = Math.floor(videoEl.currentTime % 60).toString().padStart(2, '0');
          const durMin = Math.floor(videoEl.duration / 60);
          const durSec = Math.floor(videoEl.duration % 60).toString().padStart(2, '0');
          timeEl.textContent = `${curMin}:${curSec} / ${durMin}:${durSec}`;
        }
      }
    });
  }

  togglePlay(appId, app) {
    const videoEl = document.getElementById(`video-media-${appId}`);
    if (videoEl) {
      if (videoEl.paused) {
        videoEl.play().catch(err => {
          this.notifications.notify(`Media playback error: ${err.message}`, 'error');
        });
      } else {
        videoEl.pause();
      }
      return;
    }

    // Demo trailer fallback
    this.notifications.notify(
      `Trailer Preview: No media stream is bundled for "${app ? app.name : appId}". This is a catalog metadata demonstration.`,
      'info'
    );
  }

  toggleMute(appId) {
    const videoEl = document.getElementById(`video-media-${appId}`);
    if (videoEl) {
      videoEl.muted = !videoEl.muted;
      this.notifications.notify(
        videoEl.muted ? 'Video audio muted' : 'Video audio unmuted',
        'info',
        2000
      );
      return;
    }

    this.notifications.notify(
      'Audio controls inactive: No video media is loaded for this demo entry.',
      'warning',
      2500
    );
  }

  getState(appId) {
    const videoEl = document.getElementById(`video-media-${appId}`);
    if (videoEl) {
      return {
        isPlaying: !videoEl.paused,
        isMuted: videoEl.muted,
        progress: videoEl.duration ? (videoEl.currentTime / videoEl.duration) * 100 : 0
      };
    }
    return { isPlaying: false, isMuted: true, progress: 0 };
  }
}

