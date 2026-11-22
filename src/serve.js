// 내 컴퓨터에서 블로그를 미리 보는 프로그램 (초안 글 포함)
// 글이나 디자인 파일을 저장하면 자동으로 다시 만든다. 브라우저는 새로고침하면 됨.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './build.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist');
const PORT = Number(process.env.PORT) || 4000;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript',
  '.xml': 'application/xml; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

async function rebuild() {
  try {
    const r = await build({ drafts: true });
    console.log(`[${new Date().toLocaleTimeString()}] 다시 만듦: 글 ${r.posts}개`);
  } catch (e) {
    console.error('만드는 중 오류:', e.message);
  }
}

await rebuild();

let timer;
for (const dir of ['posts', 'pages', 'public', 'src']) {
  fs.watch(path.join(ROOT, dir), { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(rebuild, 150);
  });
}
fs.watch(path.join(ROOT, 'site.config.json'), () => { clearTimeout(timer); timer = setTimeout(rebuild, 150); });

http
  .createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = path.join(OUT, p);
    if (!file.startsWith(OUT)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!fs.existsSync(file)) {
      res.writeHead(404, { 'Content-Type': TYPES['.html'] });
      fs.createReadStream(path.join(OUT, '404.html')).pipe(res);
      return;
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`미리보기: http://localhost:${PORT}  (끄려면 Ctrl+C)`));
