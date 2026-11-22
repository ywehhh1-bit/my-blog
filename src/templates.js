// 블로그 화면의 HTML 틀
const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const u = (site, p) => `${site.base}${p}`;

function formatDate(d) {
  if (!d) return '';
  const [y, m, day] = String(d).split('-');
  return `${y}. ${Number(m)}. ${Number(day)}.`;
}

// 한국어는 1분에 약 500자를 읽는다고 보고 계산
function readingTime(text) {
  const chars = text.replace(/\s+/g, '').length;
  return Math.max(1, Math.round(chars / 500));
}

// '다른 지역 신청하기' 팝업 (동작은 src/request.js)
function requestDialog(site) {
  // </script> 같은 글자가 들어가도 스크립트가 끊기지 않도록 '<'를 바꿔 둔다
  const config = JSON.stringify(site.request).replace(/</g, '\\u003c');
  return `<dialog class="req-dialog" id="requestDialog" aria-labelledby="reqTitle">
  <div class="req-inner">
    <div class="req-head">
      <div>
        <h2 id="reqTitle">다른 지역 신청하기</h2>
        <p>보고 싶은 지역을 알려 주시면 조사해서 글로 정리할게요.</p>
      </div>
      <button type="button" class="req-close" id="closeRequest" aria-label="닫기">×</button>
    </div>
    <form class="req-form" id="requestForm" novalidate>
      <label class="req-field">닉네임
        <input name="nickname" required maxlength="30" autocomplete="nickname">
      </label>
      <label class="req-field">이메일 <small>글이 올라가면 알려 드릴게요</small>
        <input name="email" type="email" required maxlength="100" autocomplete="email">
      </label>
      <label class="req-field">지역 이름
        <input name="region" required maxlength="50" placeholder="예: 속초, 전주, 제주 서귀포">
      </label>
      <label class="req-field">원하는 내용
        <textarea name="request" required maxlength="1000" placeholder="예: 아이와 갈 만한 무료 장소, 당일치기 맛집 코스"></textarea>
      </label>
      <p class="req-status" id="requestStatus" role="status"></p>
      <button type="submit" class="req-submit" id="requestSubmit">신청하기</button>
    </form>
    <div class="req-done" id="requestDone" hidden>
      <h3>신청이 접수됐어요</h3>
      <p>보내 주신 지역을 확인한 뒤 글로 정리할게요.</p>
      <button type="button" class="req-submit" id="doneClose">닫기</button>
    </div>
  </div>
</dialog>
<script>window.REQUEST_CONFIG = ${config};</script>
<script src="${u(site, '/request.js')}"></script>`;
}

function layout(site, { title, description, body, path = '/', image }) {
  const pageTitle = title ? `${esc(title)} | ${esc(site.title)}` : esc(site.title);
  const desc = esc(description || site.description);
  const canonical = `${site.siteUrl}${path}`;
  return `<!doctype html>
<html lang="${site.lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${pageTitle}</title>
<meta name="description" content="${desc}">
<link rel="canonical" href="${esc(canonical)}">
<meta property="og:title" content="${esc(title || site.title)}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="${path.startsWith('/posts/') ? 'article' : 'website'}">
<meta property="og:url" content="${esc(canonical)}">
${(image || site.image) ? `<meta property="og:image" content="${esc(site.siteUrl + (image || site.image))}">` : ''}
<link rel="alternate" type="application/rss+xml" title="${esc(site.title)}" href="${u(site, '/feed.xml')}">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">
<link rel="stylesheet" href="${u(site, '/style.css')}">
</head>
<body>
<a class="skip" href="#main">본문으로 건너뛰기</a>
<header class="site-header">
  <div class="container header-inner">
    <a class="brand" href="${u(site, '/')}">${esc(site.title)}</a>
    <div class="header-right">
      <nav class="nav" aria-label="주요 메뉴">
        <a href="${u(site, '/')}">전체 글</a>
        <a href="${u(site, '/about/')}">소개</a>
      </nav>
      ${site.request ? '<button type="button" class="request-btn" id="openRequest">다른 지역 신청하기</button>' : ''}
    </div>
  </div>
</header>
${site.drafts ? '<div class="draft-banner">미리보기 모드: 초안(draft) 글도 보입니다</div>' : ''}
<main id="main">
${body}
</main>
<footer class="site-footer">
  <div class="container footer-inner">
    <span>© ${new Date().getFullYear()} ${esc(site.title)}</span>
    <a href="${u(site, '/feed.xml')}">RSS</a>
  </div>
</footer>
${site.request ? requestDialog(site) : ''}
</body>
</html>
`;
}

const tagLinks = (site, tags) =>
  tags.length
    ? `<ul class="tags">${tags.map((tg) => `<li><a href="${u(site, `/tags/${encodeURIComponent(tg)}/`)}">#${esc(tg)}</a></li>`).join('')}</ul>`
    : '';

const meta = (p) =>
  `<p class="meta"><time datetime="${esc(p.date)}">${formatDate(p.date)}</time><span aria-hidden="true">·</span>${readingTime(p.text)}분 분량${p.draft ? '<span class="badge">초안</span>' : ''}</p>`;

function cover(site, p, cls) {
  if (p.cover) return `<img class="${cls}" src="${u(site, p.cover)}" alt="${esc(p.coverAlt || '')}" loading="lazy">`;
  return `<div class="${cls} cover-blank" aria-hidden="true"><span>${esc(p.category || p.tags[0] || '')}</span></div>`;
}

function card(site, p) {
  return `<article class="card">
  <a class="card-link" href="${u(site, `/posts/${p.slug}/`)}">
    ${cover(site, p, 'card-cover')}
    <h3>${esc(p.title)}</h3>
  </a>
  ${p.description ? `<p class="card-desc">${esc(p.description)}</p>` : ''}
  ${meta(p)}
</article>`;
}

export function home(site, posts) {
  const hero = site.image
    ? `<figure class="container hero"><img src="${u(site, site.image)}" alt="${esc(site.imageAlt || '')}"></figure>`
    : '';
  let body;
  if (!posts.length) {
    body = `<section class="container empty"><h1>${esc(site.title)}</h1><p>아직 올라온 글이 없어요. 첫 글을 준비하고 있습니다.</p></section>`;
  } else {
    const [first, ...rest] = posts;
    body = `<section class="container intro">
  <p class="eyebrow">${esc(site.description)}</p>
</section>
<section class="container feature">
  <a class="feature-link" href="${u(site, `/posts/${first.slug}/`)}">
    ${cover(site, first, 'feature-cover')}
    <div class="feature-text">
      <p class="eyebrow">최신 글</p>
      <h1>${esc(first.title)}</h1>
      ${first.description ? `<p class="lede">${esc(first.description)}</p>` : ''}
    </div>
  </a>
  ${meta(first)}
</section>
${rest.length ? `<section class="container">
  <h2 class="section-title">지난 글</h2>
  <div class="grid">${rest.map((p) => card(site, p)).join('')}</div>
</section>` : ''}`;
  }
  return layout(site, { body: hero + body, path: '/' });
}

export function post(site, p, posts) {
  const i = posts.indexOf(p);
  const newer = posts[i - 1];
  const older = posts[i + 1];
  const body = `<article class="post">
  <header class="container narrow post-header">
    ${p.category ? `<p class="eyebrow">${esc(p.category)}</p>` : ''}
    <h1>${esc(p.title)}</h1>
    ${p.description ? `<p class="lede">${esc(p.description)}</p>` : ''}
    ${meta(p)}
  </header>
  ${p.cover ? `<figure class="container post-cover"><img src="${u(site, p.cover)}" alt="${esc(p.coverAlt || '')}"></figure>` : ''}
  <div class="container narrow prose">
${p.html}
  </div>
  <footer class="container narrow post-footer">
    ${tagLinks(site, p.tags)}
    <nav class="pager" aria-label="다른 글">
      ${older ? `<a class="prev" href="${u(site, `/posts/${older.slug}/`)}"><small>이전 글</small>${esc(older.title)}</a>` : '<span></span>'}
      ${newer ? `<a class="next" href="${u(site, `/posts/${newer.slug}/`)}"><small>다음 글</small>${esc(newer.title)}</a>` : '<span></span>'}
    </nav>
  </footer>
</article>`;
  return layout(site, { title: p.title, description: p.description, body, path: `/posts/${p.slug}/`, image: p.cover });
}

export function page(site, p) {
  const body = `<article class="post">
  <header class="container narrow post-header"><h1>${esc(p.title)}</h1></header>
  <div class="container narrow prose">
${p.html}
  </div>
</article>`;
  return layout(site, { title: p.title, description: p.description, body, path: `/${p.slug}/` });
}

export function tag(site, name, list) {
  const body = `<section class="container">
  <p class="eyebrow">태그</p>
  <h1 class="page-title">#${esc(name)}</h1>
  <div class="grid">${list.map((p) => card(site, p)).join('')}</div>
</section>`;
  return layout(site, { title: `#${name}`, body, path: `/tags/${encodeURIComponent(name)}/` });
}

export function notFound(site) {
  const body = `<section class="container empty"><h1>페이지를 찾을 수 없어요</h1><p><a href="${u(site, '/')}">첫 화면으로 가기</a></p></section>`;
  return layout(site, { title: '페이지 없음', body, path: '/404.html' });
}

export function feed(site, posts) {
  const items = posts
    .map(
      (p) => `<item>
<title>${esc(p.title)}</title>
<link>${esc(`${site.siteUrl}/posts/${p.slug}/`)}</link>
<guid>${esc(`${site.siteUrl}/posts/${p.slug}/`)}</guid>
<pubDate>${new Date(p.date).toUTCString()}</pubDate>
<description>${esc(p.description || '')}</description>
</item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"><channel>
<title>${esc(site.title)}</title>
<link>${esc(site.siteUrl)}</link>
<description>${esc(site.description)}</description>
<language>${site.lang}</language>
${items}
</channel></rss>
`;
}

export function sitemap(site, posts, pages, tags) {
  const urls = ['/', ...posts.map((p) => `/posts/${p.slug}/`), ...pages.map((p) => `/${p.slug}/`), ...tags.map((tg) => `/tags/${encodeURIComponent(tg)}/`)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((x) => `<url><loc>${esc(site.siteUrl + x)}</loc></url>`).join('\n')}
</urlset>
`;
}
