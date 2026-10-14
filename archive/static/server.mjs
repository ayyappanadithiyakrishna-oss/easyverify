import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('.', import.meta.url));
const port = Number(process.env.PORT || 4173);
const mime = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml'};
http.createServer(async (req,res) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  if (!['GET','HEAD'].includes(req.method)) {res.writeHead(405);return res.end('Method not allowed');}
  try {
    const url = new URL(req.url,'http://localhost');
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === '/') pathname = '/index.html';
    // Serve only application assets, never repository metadata or submission notes.
    if (!(pathname === '/index.html' || pathname === '/styles.css' || /^\/(src|support|public)\/[\w./-]+$/.test(pathname))) throw new Error('Not found');
    const target = path.resolve(root, '.' + pathname);
    if (!target.startsWith(root) || pathname.split('/').some(s => s.startsWith('.'))) throw new Error('Not found');
    const bytes = await readFile(target);
    res.writeHead(200,{'Content-Type':mime[path.extname(target)] || 'application/octet-stream','Cache-Control':'no-cache'});
    res.end(req.method === 'HEAD' ? undefined : bytes);
  } catch {res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
}).listen(port,'127.0.0.1', () => console.log(`EasyVerify is ready at http://localhost:${port}`));
