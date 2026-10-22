const fs = require('fs');
const path = require('path');

const catalogPath = path.resolve(__dirname, '../data/catalog.json');
const cat = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

const mockDistributions = {
  'org.devstore.chess': { 5: 82, 4: 12, 3: 4, 2: 1, 1: 1 },
  'org.devstore.calculator': { 5: 91, 4: 7, 3: 1, 2: 0, 1: 1 },
  'org.devstore.chronos': { 5: 75, 4: 16, 3: 6, 2: 2, 1: 1 },
  'org.devstore.mdcanvas': { 5: 71, 4: 19, 3: 7, 2: 2, 1: 1 },
  'org.devstore.weather': { 5: 68, 4: 21, 3: 7, 2: 2, 1: 2 },
  'org.devstore.audiopulse': { 5: 84, 4: 11, 3: 3, 2: 1, 1: 1 },
  'org.devstore.terminal': { 5: 93, 4: 5, 3: 1, 2: 0, 1: 1 },
  'org.devstore.pixelpaint': { 5: 73, 4: 18, 3: 6, 2: 2, 1: 1 }
};

const mockTrailers = {
  'org.devstore.chess': { title: 'Retro Chess Arena - Official Gameplay Trailer', duration: '0:45', views: '145K views' },
  'org.devstore.calculator': { title: 'Aether Calculator - Precision Math Feature Tour', duration: '0:32', views: '89K views' },
  'org.devstore.chronos': { title: 'Chronos Task Manager - Sprint & Kanban Walkthrough', duration: '1:05', views: '62K views' },
  'org.devstore.mdcanvas': { title: 'Markdown Canvas - Live Preview & Mermaid Demo', duration: '0:50', views: '41K views' },
  'org.devstore.weather': { title: 'Weather Pulse - Satellite Doppler Radar Tour', duration: '0:40', views: '110K views' },
  'org.devstore.audiopulse': { title: 'Pixel Pulse Studio - Synthesizer Beat Jam', duration: '1:15', views: '230K views' },
  'org.devstore.terminal': { title: 'DevTerm Pro - GPU Terminal Speed & Multiplexing', duration: '0:58', views: '340K views' },
  'org.devstore.pixelpaint': { title: 'Vector Craft - Drawing Vector Splines & Masks', duration: '1:10', views: '75K views' }
};

const richScreenshots = {
  'org.devstore.chess': [
    { title: 'Grandmaster Chessboard', caption: 'Woodgrain texture board with legal move markers and capture tray', orientation: 'portrait' },
    { title: 'Tactics & Puzzle Trainer', caption: 'Daily tactical puzzle scenarios with evaluation bar and hint mode', orientation: 'portrait' },
    { title: 'Neural Heuristic Engine', caption: 'Deep AI evaluation, opening book statistics, and depth graph', orientation: 'portrait' },
    { title: 'PGN Game Explorer', caption: 'Interactive move history and full notation export', orientation: 'portrait' }
  ],
  'org.devstore.calculator': [
    { title: 'Scientific Pad', caption: 'Complex trigonometry, calculus, and matrix mathematics', orientation: 'portrait' },
    { title: 'Programmer Bitwise Mode', caption: 'Real-time binary, octal, decimal, and hex conversions', orientation: 'portrait' },
    { title: 'Live Unit Converter', caption: 'Over 30 physical, engineering, and currency conversion domains', orientation: 'portrait' },
    { title: 'Calculation History', caption: 'Timestamped calculation tape with one-tap memory reuse', orientation: 'portrait' }
  ],
  'org.devstore.terminal': [
    { title: 'Multiplexed Grid', caption: 'Quad split panes running live build scripts and performance monitors', orientation: 'landscape' },
    { title: 'Powerline Themes', caption: 'Over 20 built-in dark and high-contrast color palettes', orientation: 'landscape' },
    { title: 'SSH Session Vault', caption: 'Encrypted credential storage and key agent integration', orientation: 'landscape' },
    { title: 'GPU Glyph Engine', caption: 'Zero-latency 144Hz font rendering with ligature support', orientation: 'landscape' }
  ]
};

const mockReviews = {
  'org.devstore.chess': [
    { id: 'rev-c1', author: 'Magnus K.', avatar: '#0284c7', rating: 5, date: 'October 18, 2026', device: 'Phone', helpfulCount: 245, comment: 'Outstanding responsive board feel. The offline puzzle mode is top notch! Works smoothly across devices with zero lag.' },
    { id: 'rev-c2', author: 'Elena R.', avatar: '#7c3aed', rating: 5, date: 'October 14, 2026', device: 'Desktop', helpfulCount: 112, comment: 'Crisp visuals, works flawlessly on both my Windows desktop and Android tablet. The PGN export is seamless.' },
    { id: 'rev-c3', author: 'David B.', avatar: '#059669', rating: 4, date: 'October 10, 2026', device: 'Phone', helpfulCount: 48, comment: 'Great AI difficulty progression. Would love an option for custom sound effects in future updates.' }
  ],
  'org.devstore.terminal': [
    { id: 'rev-t1', author: 'Alex N.', avatar: '#059669', rating: 5, date: 'October 16, 2026', device: 'Desktop', helpfulCount: 420, comment: 'The fastest terminal on Windows. Split panes work flawlessly and startup time is virtually instantaneous.' },
    { id: 'rev-t2', author: 'Samantha V.', avatar: '#db2777', rating: 5, date: 'October 12, 2026', device: 'Desktop', helpfulCount: 185, comment: 'Font ligature rendering is gorgeous. Best developer tool on DevStore hands down.' }
  ]
};

cat.applications.forEach(app => {
  app.distribution = mockDistributions[app.id] || { 5: 75, 4: 15, 3: 6, 2: 2, 1: 2 };
  app.video = mockTrailers[app.id] || { title: `${app.name} Showcase`, duration: '0:45', views: '50K views' };
  app.contentRating = app.category === 'developer' ? 'Rated for 12+' : 'Rated for 3+';
  app.support = {
    website: 'https://devstore.org',
    email: 'support@devstore.org',
    address: 'DevStore Open Source Foundation, 100 Hacker Way, Mountain View, CA',
    privacyPolicy: 'https://devstore.org/privacy'
  };
  if (richScreenshots[app.id]) {
    app.screenshots = richScreenshots[app.id];
  }
  if (mockReviews[app.id]) {
    app.reviews = mockReviews[app.id];
  } else {
    app.reviews = [
      { id: `rev-${app.id}-1`, author: 'Verified User', avatar: '#0284c7', rating: 5, date: 'October 15, 2026', device: 'Phone', helpfulCount: 88, comment: `Really solid experience with ${app.name}. Fast, private, and works as advertised.` },
      { id: `rev-${app.id}-2`, author: 'Tech Enthusiast', avatar: '#7c3aed', rating: 5, date: 'October 11, 2026', device: 'Desktop', helpfulCount: 34, comment: 'Very clean interface and zero telemetry is a massive plus.' }
    ];
  }
});

fs.writeFileSync(catalogPath, JSON.stringify(cat, null, 2), 'utf8');
console.log('Catalog enriched successfully!');
