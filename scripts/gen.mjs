#!/usr/bin/env node
/* Draws the profile's pictures in BENIBIX's own look, light and dark, from the site's data.
     node scripts/gen.mjs <benibix repo>
   Writes assets/*.svg. Every picture is plain SVG with CSS motion (GitHub shows it as an image:
   no scripts, no web fonts), and stops moving under prefers-reduced-motion. */
import fs from 'node:fs';
import path from 'node:path';
import { liveTools, courseCounts } from './tools.mjs';

const repo = path.resolve(process.argv[2] || '../benibix');
const out = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'assets');
fs.mkdirSync(out, { recursive: true });

/* ---------- theme ---------- */
const T = {
  dark: { bg: '#07070a', bg2: '#0c0c12', card: '#0f0f15', card2: '#15151d', ink: '#f5f5f7', ink2: '#a8a8b5', ink3: '#8a8a98', rule: 'rgba(255,255,255,.09)',
    rainbow: ['#ff6b3d', '#ffc72c', '#8fd14f', '#2f7cf6', '#a855f7'], ok: '#4ade80' },
  light: { bg: '#f7f6f3', bg2: '#f0efeb', card: '#ffffff', card2: '#f6f5f1', ink: '#0b0b10', ink2: '#474753', ink3: '#666671', rule: 'rgba(16,18,27,.10)',
    rainbow: ['#d9431c', '#b86e00', '#3b8a17', '#1f5fd6', '#8a3fe0'], ok: '#166534' },
};
const SANS = "Inter, 'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif";
const SERIF = "'Instrument Serif', Georgia, 'Times New Roman', serif";
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
/* A category colour as text on light paper: the same hue, darker. */
const deepen = (hex, k = 0.42) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - k)).toString(16).padStart(2, '0')).join('');
const acc = (hex, th) => (th === 'light' ? deepen(hex) : hex);
const rainbowStops = (c, id, x2 = '100%', y2 = '0%') => `<linearGradient id="${id}" x1="0%" y1="0%" x2="${x2}" y2="${y2}">${[...c, c[0]].map((v, i, a) => `<stop offset="${(i / (a.length - 1) * 100).toFixed(1)}%" stop-color="${v}"/>`).join('')}</linearGradient>`;
const still = '@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }';
const svg = (w, h, body, style = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" fill="none">
<style>text{font-family:${SANS}} .serif{font-family:${SERIF};font-style:italic} ${style} ${still}</style>
${body}
</svg>
`;
const write = (name, th, s) => fs.writeFileSync(path.join(out, `${name}-${th}.svg`), s);

/* ---------- the tools, from the repo (scripts/tools.mjs) ---------- */
const { tools: CARDS, rows: ROWS } = liveTools(repo);
const COUNTS = courseCounts(repo);
const iconOf = id => CARDS.find(t => t.id === id)?.icon || '';
const ACCENTS = [...new Set(CARDS.map(t => t.color))];
const statOf = (id, i = 0) => CARDS.find(t => t.id === id)?.stats[i];

/* ---------- the mark: three bars, the rainbow flowing up through them ---------- */
const mark = (x, y, h, th, id) => {
  const w = h / 4, gap = h / 8, hs = [1, 0.66, 0.85];
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="${h * 3}" gradientUnits="userSpaceOnUse" spreadMethod="repeat">${[...T[th].rainbow, T[th].rainbow[0]].map((c, i, a) => `<stop offset="${(i / (a.length - 1)).toFixed(3)}" stop-color="${c}"/>`).join('')}
    <animateTransform attributeName="gradientTransform" type="translate" from="0 0" to="0 ${-h * 3}" dur="8s" repeatCount="indefinite"/></linearGradient></defs>
  ${hs.map((k, i) => `<rect class="bar b${i}" x="${x + i * (w + gap)}" y="${y + h * (1 - k)}" width="${w}" height="${h * k}" rx="${w / 3.5}" fill="url(#${id})" style="transform-origin:${x + i * (w + gap) + w / 2}px ${y + h}px"/>`).join('')}`;
};
const markStyle = `.bar{animation:bars 3.6s cubic-bezier(.4,0,.2,1) infinite} .b1{animation-delay:.25s} .b2{animation-delay:.5s} @keyframes bars{50%{transform:scaleY(.6)}}`;

/* ---------- hero ---------- */
function hero(th) {
  const c = T[th], W = 1200, H = 420;
  const words = ['data pipelines', 'LLM agents', 'forecasts', 'dashboards', 'browser tools'];
  const per = 2.4, cycle = per * words.length;
  const wordCss = words.map((_, i) => `.w${i}{animation:word ${cycle}s ${-(cycle - i * per)}s infinite}`).join(' ');
  const pctIn = (100 / words.length).toFixed(2);
  // The wall: the 13 live tools as tiles, each lighting up in turn, like the site's home.
  const cols = 5, size = 74, gapW = 14, wx = 700, wy = 62;
  const tiles = CARDS.map((t, i) => {
    const col = i % cols, row = Math.floor(i / cols), x = wx + col * (size + gapW) + (row % 2) * 22, y = wy + row * (size + gapW);
    const a = acc(t.color, th);
    return `<g class="tile" style="animation-delay:${(i * 0.42).toFixed(2)}s;transform-origin:${x + size / 2}px ${y + size / 2}px">
      <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="18" fill="${c.card}" stroke="${c.rule}"/>
      <rect class="glow" x="${x}" y="${y}" width="${size}" height="${size}" rx="18" fill="${t.color}" fill-opacity=".16" stroke="${t.color}" stroke-opacity=".55" style="animation-delay:${(i * 0.42).toFixed(2)}s"/>
      <g transform="translate(${x + size / 2 - 15} ${y + size / 2 - 15}) scale(1.25)" stroke="${a}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round">${iconOf(t.id)}</g>
    </g>`;
  }).join('\n');
  const body = `<defs>${rainbowStops(c.rainbow, 'rb')}
    <radialGradient id="g1"><stop offset="0" stop-color="${c.rainbow[3]}" stop-opacity="${th === 'dark' ? '.30' : '.14'}"/><stop offset="1" stop-color="${c.rainbow[3]}" stop-opacity="0"/></radialGradient>
    <radialGradient id="g2"><stop offset="0" stop-color="${c.rainbow[4]}" stop-opacity="${th === 'dark' ? '.26' : '.12'}"/><stop offset="1" stop-color="${c.rainbow[4]}" stop-opacity="0"/></radialGradient>
    <radialGradient id="g3"><stop offset="0" stop-color="${c.rainbow[0]}" stop-opacity="${th === 'dark' ? '.22' : '.10'}"/><stop offset="1" stop-color="${c.rainbow[0]}" stop-opacity="0"/></radialGradient>
    <pattern id="dots" width="22" height="22" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r="1" fill="${c.ink}" fill-opacity="${th === 'dark' ? '.07' : '.09'}"/></pattern>
    <clipPath id="frame"><rect width="${W}" height="${H}" rx="24"/></clipPath></defs>
  <g clip-path="url(#frame)">
    <rect width="${W}" height="${H}" fill="${c.bg}"/>
    <rect width="${W}" height="${H}" fill="url(#dots)"/>
    <ellipse class="drift d1" cx="930" cy="120" rx="360" ry="260" fill="url(#g1)"/>
    <ellipse class="drift d2" cx="1080" cy="380" rx="320" ry="220" fill="url(#g2)"/>
    <ellipse class="drift d3" cx="180" cy="420" rx="380" ry="200" fill="url(#g3)"/>
    ${tiles}
    <rect x="0" y="${H - 3}" width="${W}" height="3" fill="url(#rb)" class="flow"/>
  </g>
  <rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="23.5" stroke="${c.rule}"/>
  ${mark(64, 58, 30, th, 'mk')}
  <text x="112" y="84" font-size="20" font-weight="800" letter-spacing="-.4" fill="${c.ink}">BENIBIX</text>
  <text x="208" y="83" font-size="14" fill="${c.ink3}">benibix.com</text>
  <text x="62" y="186" font-size="72" font-weight="800" letter-spacing="-2.6" fill="${c.ink}">Behnia Zarei</text>
  <text x="64" y="240" font-size="40" class="serif" fill="url(#rb)">Software for data and AI.</text>
  <text x="64" y="302" font-size="24" fill="${c.ink2}" textLength="84" lengthAdjust="spacingAndGlyphs">I build</text>
  <g font-size="24" font-weight="800" letter-spacing="-.4">${words.map((w, i) => `<text class="word w${i}" x="160" y="302" fill="${acc(ACCENTS[i % ACCENTS.length], th)}">${esc(w)}</text>`).join('')}</g>
  <g font-size="16" fill="${c.ink3}">
    <circle cx="70" cy="359" r="4.5" fill="${c.ok}" class="pulse" style="transform-origin:70px 359px"/>
    <text x="84" y="364">Vienna · 10+ years · ${CARDS.length} live tools · ${COUNTS.lessons} lessons in ${COUNTS.courses} courses</text>
  </g>`;
  const style = `${markStyle} ${wordCss}
    .word{opacity:0} @media (prefers-reduced-motion: reduce){.w0{opacity:1 !important}} @keyframes word{0%{opacity:0;transform:translateY(12px)} 3%{opacity:1;transform:none} ${pctIn - 3}%{opacity:1;transform:none} ${pctIn}%{opacity:0;transform:translateY(-12px)} 100%{opacity:0}}
    .glow{opacity:0;animation:glow ${(CARDS.length * 0.42).toFixed(2)}s ease-in-out infinite} @keyframes glow{0%,100%{opacity:0} 6%{opacity:1} 22%{opacity:0}}
    .tile{animation:lift ${(CARDS.length * 0.42).toFixed(2)}s ease-in-out infinite} @keyframes lift{0%,100%{transform:none} 6%{transform:translateY(-4px)} 22%{transform:none}}
    .drift{animation:drift 18s ease-in-out infinite alternate} .d2{animation-duration:23s} .d3{animation-duration:27s} @keyframes drift{to{transform:translate(-60px,30px)}}
    .pulse{animation:pulse 2.4s ease-in-out infinite} @keyframes pulse{50%{transform:scale(1.6);opacity:.45}}
    .flow{animation:flow 6s linear infinite} @keyframes flow{50%{opacity:.55}}`;
  return svg(W, H, body, style);
}

/* ---------- a section title ---------- */
function heading(kicker, title, th, width = 1200) {
  const c = T[th];
  const body = `<defs>${rainbowStops(c.rainbow, 'rb')}</defs>
  <rect x="0" y="22" width="34" height="3" rx="1.5" fill="url(#rb)"/>
  <text x="46" y="28" font-size="14" font-weight="700" letter-spacing="2" fill="${c.ink3}">${esc(kicker.toUpperCase())}</text>
  <text x="0" y="76" font-size="38" font-weight="800" letter-spacing="-1.2" fill="${c.ink}">${esc(title[0])}<tspan class="serif" font-weight="400" fill="url(#rb)"> ${esc(title[1])}</tspan></text>`;
  return svg(width, 96, body);
}

/* ---------- what I work on: six stages, three by three, data moving through ---------- */
function flow(th) {
  const c = T[th], W = 1200, cols = 3, cw = 384, ch = 176, gx = (W - cols * cw) / (cols - 1), gy = 20;
  const areas = [
    ['Data engineering', 'Pipelines that run every night', 'with nobody watching.', '#20c997'],
    ['Analytics & BI', 'KPIs defined once, and reports', 'a manager reads at a glance.', '#ffc233'],
    ['Machine learning', 'Forecasts and scores the', 'business can check.', '#2fd4ee'],
    ['AI & LLM engineering', 'RAG, agents that call real tools,', 'evals that keep answers right.', '#e0805c'],
    ['Software & automation', 'Complete apps, tested on every', 'build, and the scripts around them.', '#a577ff'],
    ['Design & interfaces', 'One design system, light and', 'dark, from icons to motion.', '#d864ff'],
  ];
  const H = 2 * ch + gy + 44;
  const rows = [0, 1].map(r => { const y = r * (ch + gy) + 40; return `<path d="M ${cw / 2} ${y} H ${W - cw / 2}" stroke="${c.rule}" stroke-width="2"/><path d="M ${cw / 2} ${y} H ${W - cw / 2}" stroke="url(#rb)" stroke-width="2.5" stroke-dasharray="6 14" class="move"/>`; }).join('');
  const body = `<defs>${rainbowStops(c.rainbow, 'rb')}</defs>
  ${rows}
  ${areas.map(([t, l1, l2, col], i) => {
    const x = (i % cols) * (cw + gx), y = Math.floor(i / cols) * (ch + gy), a = acc(col, th), cx = x + cw / 2, cy = y + 40;
    return `<rect x="${x + .75}" y="${y + .75}" width="${cw - 1.5}" height="${ch - 1.5}" rx="18" fill="${c.card}" stroke="${c.rule}" stroke-width="1.5"/>
      <rect x="${x + 18}" y="${y}" width="${cw - 36}" height="3" rx="1.5" fill="${col}"/>
      <text x="${x + 26}" y="${y + 50}" font-size="15" font-weight="700" letter-spacing="1.5" fill="${a}">0${i + 1}</text>
      <circle cx="${x + cw - 40}" cy="${cy}" r="14" fill="${c.card}" stroke="${a}" stroke-width="2"/>
      <circle cx="${x + cw - 40}" cy="${cy}" r="5.5" fill="${col}" class="dot" style="transform-origin:${x + cw - 40}px ${cy}px;animation-delay:${i * 0.5}s"/>
      <text x="${x + 26}" y="${y + 92}" font-size="25" font-weight="800" letter-spacing="-.6" fill="${c.ink}">${esc(t)}</text>
      <text font-size="18" fill="${c.ink2}"><tspan x="${x + 26}" y="${y + 128}">${esc(l1)}</tspan><tspan x="${x + 26}" y="${y + 152}">${esc(l2)}</tspan></text>`;
  }).join('\n')}
  <text x="0" y="${H - 8}" font-size="17" fill="${c.ink3}">From raw data to the screen people read it on, and the AI in between. Claude Code and MCP are where I go deepest.</text>`;
  const style = `.move{animation:move 1.6s linear infinite} @keyframes move{to{stroke-dashoffset:-40}}
    .dot{animation:dot 3s ease-in-out infinite} @keyframes dot{0%,100%{transform:scale(1)} 10%{transform:scale(1.7)} 25%{transform:scale(1)}}`;
  return svg(W, H, body, style);
}

/* ---------- the tools by category: a header per row, then one linked picture per tool ---------- */
const PAD = 8; // every tile and header carries half the gap on each side, so pictures can sit edge to edge
function rowHead(row, th) {
  const c = T[th], W = 1200, H = 62;
  let x0 = 0;
  const segs = row.head.map(([cat, group, share]) => {
    const w = W * share, t = CARDS.find(k => k.cat === cat), a = acc(t.color, th);
    const n = row.tools.filter(t => t.cat === cat).length;
    const x = x0 + PAD; x0 += w;
    return `<rect x="${x}" y="${H - 10}" width="${w - 2 * PAD}" height="3" rx="1.5" fill="${t.color}" class="grow" style="transform-origin:${x}px 0"/>
      <rect x="${x + 2}" y="${H - 38}" width="12" height="12" rx="3.5" fill="${t.color}"/>
      <text x="${x + 24}" y="${H - 24}">${group ? `<tspan font-size="24" font-weight="800" letter-spacing="-.5" fill="${c.ink}">${esc(group)}</tspan><tspan dx="10" font-size="13" font-weight="800" letter-spacing="1.6" fill="${a}">${esc(cat.toUpperCase())}</tspan>` : `<tspan font-size="24" font-weight="800" letter-spacing="-.5" fill="${c.ink}">${esc(cat)}</tspan>`}</text>
      <text x="${x + w - 2 * PAD - 2}" y="${H - 24}" text-anchor="end" font-size="15" font-weight="700" fill="${c.ink3}">${n} live</text>`;
  }).join('\n');
  return svg(W, H, segs, '.grow{animation:grow 1.4s cubic-bezier(.2,.7,.2,1) both} @keyframes grow{from{transform:scaleX(.15)}}');
}
function tile(t, th, i, wide) {
  const c = T[th], a = acc(t.color, th);
  const W = wide ? 600 : 400, iw = W - 2 * PAD, ih = Math.round(iw * 0.625), H = ih + 2 * PAD, x = PAD, y = PAD;
  const shot = 'data:image/webp;base64,' + fs.readFileSync(path.join(repo, 'public/cards', `${t.id}${th === 'light' ? '-light' : ''}.webp`)).toString('base64');
  const big = wide, band = big ? 110 : 96, delay = (i * 0.62).toFixed(2), round = (CARDS.length * 0.62).toFixed(2);
  const lines = !big && t.lines.length > 1 ? t.lines : [t.name];
  const nameY = y + ih - 46;
  const body = `<defs><linearGradient id="fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${c.bg}" stop-opacity="0"/><stop offset=".45" stop-color="${c.bg}" stop-opacity=".84"/><stop offset="1" stop-color="${c.bg}" stop-opacity=".97"/></linearGradient>
    <clipPath id="cp"><rect x="${x}" y="${y}" width="${iw}" height="${ih}" rx="16"/></clipPath></defs>
  <g class="tile" style="transform-origin:${W / 2}px ${H / 2}px">
    <g clip-path="url(#cp)">
      <image href="${shot}" x="${x}" y="${y}" width="${iw}" height="${ih}" preserveAspectRatio="xMidYMin slice"/>
      <rect x="${x}" y="${y + ih - band - 40}" width="${iw}" height="${band + 40}" fill="url(#fade)"/>
      <rect x="${x}" y="${y}" width="${iw}" height="${ih}" fill="${t.color}" class="tint"/>
    </g>
    <rect x="${x + 1}" y="${y + 1}" width="${iw - 2}" height="${ih - 2}" rx="15" stroke="${c.rule}" stroke-width="1.5"/>
    <rect x="${x + 1}" y="${y + 1}" width="${iw - 2}" height="${ih - 2}" rx="15" stroke="${t.color}" stroke-width="2.5" class="ring"/>
    <text font-size="${big ? 26 : 21}" font-weight="800" letter-spacing="-.5" fill="${c.ink}">${lines.map((l, li) => `<tspan x="${x + 18}" y="${nameY - (lines.length - 1 - li) * 24}">${esc(l)}</tspan>`).join('')}</text>
    <text x="${x + 18}" y="${y + ih - 18}"><tspan font-size="${big ? 24 : 20}" font-weight="800" letter-spacing="-.5" fill="${a}">${esc(t.n)}</tspan><tspan dx="7" font-size="${big ? 16 : 14}" fill="${c.ink2}">${esc(t.label)}</tspan></text>
    <text x="${x + iw - 18}" y="${y + ih - 18}" text-anchor="end" font-size="${big ? 17 : 15}" font-weight="800" fill="${a}">Open <tspan class="chev">›</tspan></text>
  </g>`;
  const style = `.ring{opacity:0;animation:ring ${round}s ${delay}s ease-in-out infinite} @keyframes ring{0%,100%{opacity:0} 4%{opacity:1} 11%{opacity:1} 16%{opacity:0}}
    .tint{opacity:0;animation:tint ${round}s ${delay}s ease-in-out infinite} @keyframes tint{0%,100%{opacity:0} 4%{opacity:${th === 'dark' ? '.10' : '.07'}} 11%{opacity:${th === 'dark' ? '.10' : '.07'}} 16%{opacity:0}}
    .tile{animation:lift ${round}s ${delay}s ease-in-out infinite} @keyframes lift{0%,100%{transform:none} 4%{transform:translateY(-3px)} 11%{transform:translateY(-3px)} 16%{transform:none}}`;
  return svg(W, H, body, style);
}

/* ---------- the numbers ---------- */
function numbers(th) {
  const c = T[th], W = 1200, H = 150;
  const kpi = statOf('kpi-atlas'), ic = statOf('icon-studio');
  const n = [[String(CARDS.length), 'live tools'], [String(COUNTS.lessons), `lessons in ${COUNTS.courses} courses`],
    ...(kpi ? [[kpi.n, 'KPIs in KPI Atlas']] : []), ...(ic ? [[ic.n, 'icons in Icon Studio']] : []), ['0', 'trackers']];
  const cw = W / n.length;
  const body = `<defs>${rainbowStops(c.rainbow, 'rb')}</defs>
  <rect x=".75" y=".75" width="${W - 1.5}" height="${H - 1.5}" rx="20" fill="${c.card}" stroke="${c.rule}" stroke-width="1.5"/>
  ${n.map(([v, l], i) => `<g>
    ${i ? `<rect x="${i * cw}" y="34" width="1" height="${H - 68}" fill="${c.rule}"/>` : ''}
    <text x="${i * cw + cw / 2}" y="78" text-anchor="middle" font-size="40" font-weight="800" letter-spacing="-1.4" fill="${i === n.length - 1 ? 'url(#rb)' : c.ink}">${esc(v)}</text>
    <text x="${i * cw + cw / 2}" y="108" text-anchor="middle" font-size="16" fill="${c.ink3}">${esc(l)}</text></g>`).join('')}
  <rect x="${W / 2 - 60}" y="${H - 3}" width="120" height="3" rx="1.5" fill="url(#rb)" class="slide"/>`;
  const style = `.slide{animation:slide 7s ease-in-out infinite alternate} @keyframes slide{from{transform:translateX(-420px)} to{transform:translateX(420px)}}`;
  return svg(W, H, body, style);
}

/* ---------- how I build ---------- */
function principles(th) {
  const c = T[th], W = 1200, H = 236;
  const p = [
    ['Researched first', 'A tool about another', 'product names the version', 'it was checked against.', '#2f7cf6'],
    ['Tested on every build', 'Every tool has its own', 'tests, every page a weight', 'budget, checked each build.', '#20c997'],
    ['Private by default', 'No account, no cookies,', 'no trackers. What you type', 'stays in your browser.', '#ffc233'],
    ['Taught, not just shipped', 'A course for every tool,', 'release notes for every', 'change.', '#ff5fa8'],
  ];
  const cw = (W - 3 * 16) / 4;
  const body = p.map(([t, a, b, d, col], i) => {
    const x = i * (cw + 16);
    return `<rect x="${x + .75}" y=".75" width="${cw - 1.5}" height="${H - 1.5}" rx="18" fill="${c.card}" stroke="${c.rule}" stroke-width="1.5"/>
    <text x="${x + 24}" y="52" font-size="34" class="serif" fill="${acc(col, th)}">0${i + 1}</text>
    <text x="${x + 24}" y="96" font-size="21" font-weight="800" letter-spacing="-.4" fill="${c.ink}">${esc(t)}</text>
    <text font-size="17" fill="${c.ink2}"><tspan x="${x + 24}" y="134">${esc(a)}</tspan><tspan x="${x + 24}" y="160">${esc(b)}</tspan><tspan x="${x + 24}" y="186">${esc(d)}</tspan></text>`;
  }).join('\n');
  return svg(W, H, body);
}

/* ---------- a link button ---------- */
function button(label, th, primary) {
  const c = T[th], W = 196, H = 52;
  const body = `<defs>${rainbowStops(c.rainbow, 'rb')}</defs>
  <rect x="1" y="1" width="${W - 2}" height="${H - 2}" rx="13" fill="${primary ? c.ink : c.card}" stroke="${primary ? 'url(#rb)' : c.rule}" stroke-width="${primary ? 2 : 1.5}"/>
  <text x="${W / 2 - 6}" y="32" text-anchor="middle" font-size="16" font-weight="700" fill="${primary ? c.bg : c.ink}">${esc(label)}</text>
  <text x="${W - 26}" y="33" font-size="18" font-weight="700" fill="${primary ? c.bg : c.ink3}" class="chev">›</text>`;
  return svg(W, H, body, '.chev{animation:nudge 1.8s ease-in-out infinite} @keyframes nudge{50%{transform:translateX(4px)}}');
}

/* ---------- write everything ---------- */
const BUTTONS = [['tools', 'Open the tools', true], ['courses', 'Courses'], ['about', 'About me'], ['linkedin', 'LinkedIn'], ['youtube', 'YouTube']];
for (const th of ['dark', 'light']) {
  write('hero', th, hero(th));
  write('h-work', th, heading('What I work on', ['Six disciplines,', 'one way of working.'], th));
  write('h-tools', th, heading('BENIBIX', ['13 free tools,', 'in your browser.'], th));
  write('h-build', th, heading('How I build', ['The parts', 'nobody sees.'], th));
  write('work', th, flow(th));
  write('numbers', th, numbers(th));
  write('build', th, principles(th));
  let k = 0;
  for (const row of ROWS) {
    write(`row-${row.id}`, th, rowHead(row, th));
    for (const t of row.tools) write(`tile-${t.slug}`, th, tile(t, th, k++, row.tools.length < 3));
  }
  for (const [id, label, primary] of BUTTONS) write(`btn-${id}`, th, button(label, th, primary));
}
/* ---------- the README ---------- */
const pic = (name, alt, href, width) => {
  const p = `<picture><source media="(prefers-color-scheme: dark)" srcset="assets/${name}-dark.svg"><img alt="${esc(alt)}" src="assets/${name}-light.svg"${width ? ` width="${width}"` : ''}></picture>`;
  return href ? `<a href="${href}">${p}</a>` : p;
};
const LINKS = { tools: 'https://tools.benibix.com', courses: 'https://tools.benibix.com/tutorials/', about: 'https://benibix.com/about/', linkedin: 'https://www.linkedin.com/in/behnia-zarei', youtube: 'https://www.youtube.com/@benibix' };
// One snake for both themes: a dark panel and the rainbow (scripts/snake-colours.py, in the workflow).
const snake = `<img alt="My GitHub contributions, eaten by a rainbow snake" src="assets/github-snake.svg" width="100%">`;
const readme = `<div align="center">

${pic('hero', `Behnia Zarei. Software for data and AI. I build data pipelines, LLM agents, forecasts, dashboards and browser tools. Vienna, 10+ years, ${CARDS.length} live tools on BENIBIX.`, 'https://benibix.com')}
<br><br>
${BUTTONS.map(([id, label]) => pic(`btn-${id}`, label, LINKS[id], '18.5%')).join('\n')}
<br><br>
${pic('h-work', 'What I work on: six disciplines, one way of working.')}
${pic('work', 'Data engineering, analytics and BI, machine learning, AI and LLM engineering, software and automation, design and interfaces.')}
<br><br>
${pic('h-tools', `BENIBIX: ${CARDS.length} free tools, in your browser.`, LINKS.tools)}
${pic('numbers', `${CARDS.length} live tools, ${COUNTS.lessons} lessons in ${COUNTS.courses} courses, no trackers.`)}
<br><br>
${ROWS.map(row => `${pic(`row-${row.id}`, row.head.map(([cat, group]) => group ? `${cat}: ${group}` : cat).join(' and '))}<br>
${row.tools.map(t => pic(`tile-${t.slug}`, `${t.name}: ${t.pitch}`, t.url, row.tools.length < 3 ? '50%' : '33.3%')).join('')}`).join('\n<br><br>\n')}
<br><br>
${pic('h-build', 'How I build: the parts nobody sees.')}
${pic('build', 'Researched first. Tested on every build. Private by default. Taught, not just shipped.')}
<br><br>
${snake}

<sub>Found a bug or have an idea for a tool? <a href="https://github.com/behnia137/benibix-feedback/issues">Open an issue</a>, I read every one. These pictures are drawn by <code>scripts/gen.mjs</code> from the site's own data.</sub>

</div>
`;
fs.writeFileSync(path.join(out, '..', 'README.md'), readme);
console.log(`wrote ${fs.readdirSync(out).length} files to ${out}, and README.md`);
