// Zero-dependency Node backend for Kakka Kulichal Kokkavilla
// Run: node server.js   (serves the game at http://localhost:3000)
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const ROOT = path.join(__dirname, '..');
const SCORES_FILE = path.join(__dirname, 'scores.json');

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.mp3': 'audio/mpeg', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml', '.json': 'application/json'
};

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];

  // --- API: save a score ---
  if (url === '/api/scores' && req.method === 'POST') {
    let body = '';
    req.on('data', c => body += c);
    req.on('end', () => {
      try {
        const entry = JSON.parse(body);
        const scores = fs.existsSync(SCORES_FILE)
          ? JSON.parse(fs.readFileSync(SCORES_FILE)) : [];
        scores.push({ ...entry, date: new Date().toISOString() });
        scores.sort((a, b) => b.score - a.score);
        fs.writeFileSync(SCORES_FILE, JSON.stringify(scores.slice(0, 20), null, 2));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true }));
      } catch (e) {
        res.writeHead(400); res.end(JSON.stringify({ ok: false }));
      }
    });
    return;
  }

  // --- API: get top scores ---
  if (url === '/api/scores' && req.method === 'GET') {
    const scores = fs.existsSync(SCORES_FILE)
      ? JSON.parse(fs.readFileSync(SCORES_FILE)) : [];
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(scores));
    return;
  }

  // --- Static files ---
  let filePath = path.join(ROOT, url === '/' ? 'index.html' : decodeURIComponent(url));
  if (!filePath.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath)] || 'application/octet-stream' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`🐦 Kakka Kulichal game running → http://localhost:${PORT}`);
});
