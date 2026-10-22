const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BASE_DIR = __dirname;
const logStream = fs.createWriteStream(path.join(BASE_DIR, 'server.log'), { flags: 'a' });

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { process.stdout.write(line); } catch (_) {}
  try { logStream.write(line); } catch (_) {}
}

process.stdout.on('error', () => {});
process.stderr.on('error', () => {});


const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath === '') reqPath = '/index.html';

  const safePath = path.normalize(path.join(BASE_DIR, reqPath));
  if (!safePath.startsWith(BASE_DIR)) {
    res.writeHead(403);
    res.end('Access Denied');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-cache'
    });

    const stream = fs.createReadStream(safePath);
    stream.on('error', (streamErr) => {
      console.error('Stream error:', streamErr);
      if (!res.headersSent) {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
    });
    stream.pipe(res);
  });
});

server.on('error', (err) => {
  log('HTTP Server Error: ' + (err.stack || err));
});

server.on('clientError', (err, socket) => {
  try {
    if (err.code === 'ECONNRESET' || !socket.writable) {
      socket.destroy();
      return;
    }
    socket.end('HTTP/1.1 400 Bad Request\r\n\r\n');
  } catch (e) {
    try { socket.destroy(); } catch (_) {}
  }
});

server.listen(PORT, '127.0.0.1', () => {
  log(`DevStore static server listening at http://127.0.0.1:${PORT}`);
});

process.on('uncaughtException', (err) => {
  log('Server uncaughtException: ' + (err.stack || err));
});

process.on('unhandledRejection', (err) => {
  log('Server unhandledRejection: ' + (err.stack || err));
});

// Robust keep-alive loop so background tasks don't terminate unexpectedly
setInterval(() => {}, 10000);
