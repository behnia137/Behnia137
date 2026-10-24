/* The live BENIBIX sites (content/legal/sites/<app>.json with "live": true), each with one count
   read from the repo, in the order of SITE_URLS. A site that goes live needs its line here and its
   shots (scripts/shoot.mjs). */
import fs from 'node:fs';
import path from 'node:path';

export const SITE_URLS = {
  company: 'https://benibix.com/',
  tools: 'https://tools.benibix.com/',
  insights: 'https://data.benibix.com/',
  design: 'https://design.benibix.com/',
  extensions: 'https://extensions.benibix.com/',
};

export function liveSites(repo, tools, counts) {
  const read = f => fs.readFileSync(path.join(repo, f), 'utf8');
  const dirs = d => fs.readdirSync(path.join(repo, d), { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name);
  const ins = read('data/insights.ts'), certs = ins.slice(ins.indexOf('export const CERTIFICATIONS'), ins.indexOf('export const OPEN_COURSES'));
  const exts = dirs('extensions').map(d => path.join('extensions', d, 'extension.json')).filter(f => fs.existsSync(path.join(repo, f))).map(f => JSON.parse(read(f)));
  const shown = exts.filter(e => e.status === 'soon' || e.status === 'live'), out = shown.filter(e => e.status === 'live').length;
  const all = {
    company: { name: 'About me', n: '10+', label: 'years in software, data and AI' },
    tools: { name: 'Tools and courses', n: String(tools.length), label: `live tools, ${counts.lessons} lessons` },
    insights: { name: 'Azure, Fabric and Power BI', n: String((certs.match(/\bcode: '/g) || []).length), label: `certifications, ${dirs('content/insights').length} open courses` },
    design: { name: 'Web design and UI/UX', n: String((read('data/design-styles.ts').match(/\bslug: '/g) || []).length), label: 'styles, each a whole site' },
    extensions: { name: 'Browser extensions', n: String(out || shown.length), label: out ? 'for Chrome and Firefox' : 'for Chrome and Firefox, coming soon' },
  };
  return Object.entries(SITE_URLS).filter(([id]) => JSON.parse(read(`content/legal/sites/${id}.json`)).live).map(([id, url]) => ({ id, url, host: new URL(url).host, ...all[id] }));
}
