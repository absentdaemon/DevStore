const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const BASE_DIR = path.resolve(__dirname);

function log(msg) {
  const line = `[${new Date().toISOString()}] ${msg}\n`;
  try { process.stdout.write(line); } catch (_) {}
  try { fs.appendFileSync(path.join(BASE_DIR, 'server.log'), line); } catch (_) {}
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
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

function handleRequest(req, res) {
  req.on('error', (err) => {
    log('Request error: ' + err.message);
  });
  res.on('error', (err) => {
    log('Response error: ' + err.message);
  });

  // Only allow GET and HEAD methods for static file server
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {
      'Allow': 'GET, HEAD',
      'Content-Type': 'text/plain; charset=utf-8'
    });
    res.end('405 Method Not Allowed');
    return;
  }

  const rawUrl = req.url || '/';
  const rawPath = rawUrl.split('?')[0];

  let decodedPath;
  try {
    decodedPath = decodeURIComponent(rawPath);
  } catch (_) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }

  // Reject null bytes
  if (decodedPath.includes('\0')) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('400 Bad Request');
    return;
  }

  // Map root or empty to index.html
  if (decodedPath === '/' || decodedPath === '') {
    decodedPath = '/index.html';
  }

  // Robust path resolution and filesystem containment check
  const cleanRelative = decodedPath.replace(/^[/\\]+/, '');
  let resolvedPath = path.resolve(BASE_DIR, cleanRelative);

  const rel = path.relative(BASE_DIR, resolvedPath);
  const isContained = !rel.startsWith('..') && !path.isAbsolute(rel) &&
    (resolvedPath === BASE_DIR || resolvedPath.startsWith(BASE_DIR + path.sep));

  if (!isContained) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(resolvedPath, (err, stats) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    if (stats.isDirectory()) {
      resolvedPath = path.join(resolvedPath, 'index.html');
      fs.stat(resolvedPath, (idxErr, idxStats) => {
        if (idxErr || !idxStats.isFile()) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Not Found');
          return;
        }
        serveFile(resolvedPath, idxStats, req, res);
      });
      return;
    }

    if (!stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
      return;
    }

    serveFile(resolvedPath, stats, req, res);
  });
}

function serveFile(filePath, stats, req, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Length': stats.size,
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff'
  });

  if (req.method === 'HEAD') {
    res.end();
    return;
  }

  const stream = fs.createReadStream(filePath);
  req.on('close', () => {
    stream.destroy();
  });
  stream.on('error', (streamErr) => {
    log('Stream error: ' + streamErr.message);
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('500 Internal Server Error');
    }
  });
  stream.pipe(res);
}

const server = http.createServer(handleRequest);

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

function startServer(port = PORT, host = '0.0.0.0', callback) {
  server.listen(port, host, () => {
    log(`DevStore static server listening at http://127.0.0.1:${port} and http://localhost:${port}`);
    if (callback) callback();
  });
}

let isShuttingDown = false;
function gracefulShutdown(signal) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  log(`Received ${signal}. Shutting down DevStore server gracefully...`);
  server.close(() => {
    log('DevStore server closed.');
    process.exit(0);
  });
  setTimeout(() => {
    log('Forcing server exit after timeout.');
    process.exit(1);
  }, 3000).unref();
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('uncaughtException', (err) => {
  log('Server uncaughtException: ' + (err.stack || err));
});

process.on('unhandledRejection', (err) => {
  log('Server unhandledRejection: ' + (err.stack || err));
});

if (require.main === module) {
  startServer();
}

module.exports = { server, handleRequest, startServer, PORT, BASE_DIR };
