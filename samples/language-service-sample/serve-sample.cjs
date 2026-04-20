// Minimal static file server for the Monaco sample (no extra deps)

const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../../');
const port = process.env.PORT ? Number(process.env.PORT) : 8080;

const mime = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.mjs': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.map': 'application/json; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
};

function send(res, status, body, headers = {}) {
    res.writeHead(status, {'Content-Length': Buffer.byteLength(body), ...headers});
    res.end(body);
}

const server = http.createServer((req, res) => {
    const rawUrl = req.url || '/';
    let urlPath;
    try {
        urlPath = decodeURIComponent(rawUrl);
    } catch (e) {
        return send(res, 400, 'Bad Request');
    }
    
    // Strip query string
    const queryIndex = urlPath.indexOf('?');
    if (queryIndex !== -1) {
        urlPath = urlPath.substring(0, queryIndex);
    }

    if (urlPath === '/' || urlPath === '/index.html') {
        urlPath = 'samples/language-service-sample/index.html';
    } else if (urlPath === '/styles.css' || urlPath === '/app.js' || urlPath === '/examples.js') {
        // Serve sample-specific files from the sample folder
        urlPath = 'samples/language-service-sample' + urlPath;
    }

    const relativePath = urlPath.replace(/^\/+/, '');
    const filePath = path.resolve(root, relativePath);
    const relativeToRoot = path.relative(root, filePath);
    if (relativeToRoot.startsWith('..') || path.isAbsolute(relativeToRoot)) {
        return send(res, 403, 'Forbidden');
    }

    fs.stat(filePath, (err, stat) => {
        if (err) {
            return send(res, 404, 'Not found');
        }
        if (stat.isDirectory()) {
            return send(res, 403, 'Forbidden');
        }
        const ext = path.extname(filePath).toLowerCase();
        const type = mime[ext] || 'application/octet-stream';
        fs.readFile(filePath, (err2, data) => {
            if (err2) return send(res, 500, 'Server error');
            res.writeHead(200, {'Content-Type': type, 'Content-Length': data.length});
            res.end(data);
        });
    });
});

server.listen(port, () => {
    console.log(`[expreszo] Sample server running at http://localhost:${port}`);
});
