// 마크다운 글(posts/)을 블로그 페이지(dist/)로 바꾸는 프로그램
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import * as t from './templates.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'dist');

// 앞머리(--- 사이의 제목·날짜 같은 정보)를 읽는다
function parseFrontMatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(':');
    if (i < 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
    } else {
      val = val.replace(/^["']|["']$/g, '');
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
    }
    data[key] = val;
  }
  return { data, body: m[2] };
}

// "09:00~18:00"처럼 물결표(~)로 기간을 적으면 취소선이 되는 것을 막는다.
// 물결표 두 개(~~글자~~)는 그대로 취소선으로 쓸 수 있고, 코드 안은 건드리지 않는다.
function keepTilde(md) {
  return md
    .split(/(```[\s\S]*?```|`[^`\n]*`)/)
    .map((part, i) => (i % 2 ? part : part.replace(/(?<![~\\])~(?!~)/g, '\\~')))
    .join('');
}

// 표를 상자로 감싸 폰에서 옆으로 밀어 볼 수 있게 한다 (모양은 style.css의 .table-scroll)
function wrapTables(html) {
  return html
    .replace(/<table>/g, '<div class="table-scroll" tabindex="0" role="region" aria-label="표, 옆으로 밀어서 보기"><table>')
    .replace(/<\/table>/g, '</table></div>');
}

async function readMarkdownDir(dir) {
  let files = [];
  try { files = await fs.readdir(dir); } catch { return []; }
  const items = [];
  for (const file of files.filter((f) => f.endsWith('.md'))) {
    const raw = await fs.readFile(path.join(dir, file), 'utf8');
    const { data, body } = parseFrontMatter(raw);
    const slug = data.slug || file.replace(/\.md$/, '').replace(/^\d{4}-\d{2}-\d{2}-/, '');
    items.push({ ...data, slug, file, tags: data.tags || [], html: wrapTables(marked.parse(keepTilde(body))), text: body });
  }
  return items;
}

async function copyDir(src, dest) {
  try {
    await fs.cp(src, dest, { recursive: true });
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
  }
}

async function write(rel, content) {
  const file = path.join(OUT, rel);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content);
}

export async function build({ drafts = false } = {}) {
  const config = JSON.parse(await fs.readFile(path.join(ROOT, 'site.config.json'), 'utf8'));
  const base = (process.env.BASE_PATH ?? '').replace(/\/$/, '');
  // GitHub에 올릴 때는 주소를 자동으로 채운다 (.github/workflows/deploy.yml 참고)
  const siteUrl = (process.env.SITE_URL || config.siteUrl).replace(/\/$/, '');
  // '다른 지역 신청하기': 표 정보는 site.config.json, 토큰은 AIRTABLE_TOKEN 환경 변수(.env 또는 GitHub Secrets)에서 읽는다
  const request = config.airtable ? { ...config.airtable, token: process.env.AIRTABLE_TOKEN || '' } : null;
  if (request && !request.token) console.warn('알림: AIRTABLE_TOKEN이 없어 신청 팝업이 저장되지 않습니다 (README 참고)');
  const site = { ...config, siteUrl, base, drafts, request };

  let posts = await readMarkdownDir(path.join(ROOT, 'posts'));
  posts = posts
    .filter((p) => drafts || !p.draft)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const pages = await readMarkdownDir(path.join(ROOT, 'pages'));

  await fs.rm(OUT, { recursive: true, force: true });
  await fs.mkdir(OUT, { recursive: true });
  await copyDir(path.join(ROOT, 'public'), OUT);
  await fs.copyFile(path.join(ROOT, 'src', 'style.css'), path.join(OUT, 'style.css'));
  await fs.copyFile(path.join(ROOT, 'src', 'request.js'), path.join(OUT, 'request.js'));

  await write('index.html', t.home(site, posts));
  for (const post of posts) await write(`posts/${post.slug}/index.html`, t.post(site, post, posts));
  for (const page of pages) await write(`${page.slug}/index.html`, t.page(site, page));

  const tags = new Map();
  for (const p of posts) for (const tag of p.tags) tags.set(tag, [...(tags.get(tag) || []), p]);
  for (const [tag, list] of tags) await write(`tags/${tag}/index.html`, t.tag(site, tag, list));

  await write('404.html', t.notFound(site));
  await write('feed.xml', t.feed(site, posts));
  await write('sitemap.xml', t.sitemap(site, posts, pages, [...tags.keys()]));
  await write('.nojekyll', '');

  return { posts: posts.length, pages: pages.length, tags: tags.size };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const r = await build({ drafts: process.argv.includes('--drafts') });
  console.log(`완료: 글 ${r.posts}개, 페이지 ${r.pages}개, 태그 ${r.tags}개 → dist/`);
}
