type QueryValue = string | string[] | undefined;

type RequestLike = {
  query?: Record<string, QueryValue>;
  url?: string;
};

type ResponseLike = {
  setHeader(name: string, value: string): void;
  status(code: number): ResponseLike;
  send(body: string): void;
};

type Voxel = {
  x: number;
  y: number;
  z: number;
  w?: number;
  d?: number;
  h?: number;
  tone: string;
};

type Lang = 'zh-TW' | 'en' | 'ja' | 'ko';

type Copy = {
  box: string;
  merit: string;
  bug: string;
  label: (count: number) => string;
};

const COS = 0.8660254038;
const SIN = 0.5;
const SCALE = 12;
const HALF_H = 6;
const ZS = 10;
const OX = 128;
const OY = 152;
const BOX_OX = 316;
const BOX_OY = 160;

const COPY: Record<Lang, Copy> = {
  'zh-TW': {
    box: '功德箱',
    merit: '+1 功德',
    bug: '-1 Bug',
    label: (count) => `今日全球工程師已累積功德：${count}`
  },
  en: {
    box: 'MERIT',
    merit: '+1 Merit',
    bug: '-1 Bug',
    label: (count) => `Engineers worldwide earned merit today: ${count}`
  },
  ja: {
    box: '功徳箱',
    merit: '+1 徳',
    bug: '-1 バグ',
    label: (count) => `本日エンジニアが積んだ功徳: ${count}`
  },
  ko: {
    box: '공덕함',
    merit: '+1 Merit',
    bug: '-1 Bug',
    label: (count) => `오늘 전 세계 엔지니어의 공덕: ${count}`
  }
};

const esc = (value: string) => value.replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch] || ch));

const screen = (x: number, y: number, z: number, ox: number, oy: number) => ({
  x: Math.round(ox + (x - y) * COS * SCALE),
  y: Math.round(oy + (x + y) * SIN * SCALE - z * ZS)
});

const poly = (points: { x: number; y: number }[], cls: string) => `<polygon class="${cls}" points="${points.map((p) => `${p.x},${p.y}`).join(' ')}"/>`;

const cube = ({ x, y, z, w = 1, d = 1, h = 1, tone }: Voxel, ox: number, oy: number) => {
  const a = screen(x, y, z, ox, oy);
  const b = screen(x + w, y, z, ox, oy);
  const c = screen(x + w, y + d, z, ox, oy);
  const e = screen(x, y + d, z, ox, oy);
  const a2 = screen(x, y, z + h, ox, oy);
  const b2 = screen(x + w, y, z + h, ox, oy);
  const c2 = screen(x + w, y + d, z + h, ox, oy);
  const e2 = screen(x, y + d, z + h, ox, oy);
  return [
    poly([a2, b2, c2, e2], `${tone}t`),
    poly([e2, a2, a, e], `${tone}l`),
    poly([b2, c2, c, b], `${tone}r`)
  ].join('');
};

const mergeRows = (pattern: string[], px: number, py: number, color: string, size = 4, cls = '') => {
  const out: string[] = [];
  for (let y = 0; y < pattern.length; y += 1) {
    let start = -1;
    const row = `${pattern[y]}.`;
    for (let x = 0; x < row.length; x += 1) {
      if (row[x] === '#') {
        if (start < 0) start = x;
      } else if (start >= 0) {
        out.push(`<rect${cls ? ` class="${cls}"` : ''} x="${px + start * size}" y="${py + y * size}" width="${(x - start) * size}" height="${size}" fill="${color}"/>`);
        start = -1;
      }
    }
  }
  return out.join('');
};

const meritValue = (input: QueryValue) => {
  const raw = Array.isArray(input) ? input[0] : input;
  const num = Number.parseInt(raw || '1024', 10);
  if (Number.isNaN(num) || num < 0) return 1024;
  return Math.min(num, 999999999);
};

const langValue = (input: QueryValue): Lang => {
  const raw = (Array.isArray(input) ? input[0] : input || 'zh-TW').toLowerCase();
  if (raw === 'en') return 'en';
  if (raw === 'ja' || raw === 'jp' || raw === 'ja-jp') return 'ja';
  if (raw === 'ko' || raw === 'ko-kr') return 'ko';
  return 'zh-TW';
};

const incenseBurner = () => {
  const parts: string[] = [];
  [0, 1, 2].forEach((i) => parts.push(cube({ x: 1.2 + i * 1.8, y: 5.2, z: 0, w: 0.5, d: 0.5, h: 1.1, tone: 'd' }, OX, OY)));
  parts.push(cube({ x: 0.6, y: 3.9, z: 1.1, w: 5.2, d: 1.8, h: 0.9, tone: 'b' }, OX, OY));
  parts.push(cube({ x: 1.1, y: 2.8, z: 2, w: 4.3, d: 3.4, h: 1.9, tone: 'd' }, OX, OY));
  parts.push(cube({ x: 1.7, y: 2.2, z: 4.3, w: 3.1, d: 2.4, h: 1.1, tone: 'b' }, OX, OY));
  parts.push(`<g transform="translate(122 118)">${mergeRows(['.###.','#...#','#.#.#','#...#','.###.'],0,0,'#f4d45a',4)}</g>`);
  return parts.join('');
};

const incense = () => {
  const stems = [0, 1, 2].map((i) => `<rect x="${137 + i * 10}" y="92" width="3" height="42" rx="1" fill="#7b1e1e"/>`).join('');
  const embers = [0, 1, 2].map((i) => `<rect class="glow ember" x="${136 + i * 10}" y="88" width="5" height="5" fill="#ff9c3a"/>`).join('');
  const smoke = [
    { x: 136, dx: 8, delay: '0s' },
    { x: 146, dx: -7, delay: '1.4s' },
    { x: 156, dx: 6, delay: '2.2s' }
  ].map((item) => `<g transform="translate(${item.x} 84)"><rect class="sm" width="4" height="4"/><rect class="sm" x="4" y="-8" width="4" height="4"/><animateTransform attributeName="transform" type="translate" values="${item.x} 84;${item.x + item.dx} 58;${item.x} 32" dur="3.6s" begin="${item.delay}" repeatCount="indefinite"/><animate attributeName="opacity" values=".8;.4;0" dur="3.6s" begin="${item.delay}" repeatCount="indefinite"/></g>`).join('');
  return stems + embers + smoke;
};

const meritBox = (copy: Copy) => `${cube({ x: 0, y: 0, z: 0, w: 5.8, d: 3.6, h: 3.2, tone: 'r' }, BOX_OX, BOX_OY)}<rect x="322" y="118" width="40" height="4" fill="#2d160f" rx="2"/><text x="342" y="156" class="k" text-anchor="middle">${esc(copy.box)}</text>`;

const floating = (copy: Copy) => `<g class="glow"><text x="332" y="110" class="f a">${esc(copy.merit)}</text><text x="338" y="122" class="f b">${esc(copy.bug)}</text></g>`;

const scene = (meritCount: number, lang: Lang) => {
  const copy = COPY[lang];
  const label = esc(copy.label(meritCount));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="450" height="250" viewBox="0 0 450 250" aria-label="CompileBless merit counter ${meritCount}"><style>:root{color-scheme:light dark}.bt{fill:#6f8b6d}.bl{fill:#4f6750}.br{fill:#344a35}.dt{fill:#7aa27c}.dl{fill:#5b7d5d}.dr{fill:#3d5d40}.rt{fill:#b63f2d}.rl{fill:#8f2b22}.rr{fill:#6f1b18}.k{fill:#f4d45a;font:700 13px monospace}.t{fill:#55351e;font:700 15px monospace}.u{fill:#8a5b2a;font:700 12px monospace}.f{fill:#76f28d;font:700 11px monospace;opacity:0}.sm{fill:#b7bdc1}.g{filter:drop-shadow(0 0 0 transparent)}.a{animation:ra 3.2s linear infinite}.b{animation:rb 3.2s linear 1.6s infinite}.ember{animation:fl 1.4s ease-in-out infinite}@keyframes fl{50%{opacity:.65}}@keyframes ra{15%{opacity:.72}to{opacity:0;transform:translate(-10px,-34px) scale(.78)}}@keyframes rb{20%{opacity:.68}to{opacity:0;transform:translate(8px,-30px) scale(.74)}}@media (prefers-color-scheme:dark){.t{fill:#ffd88a}.u,.k{fill:#e0bb72}.g{filter:drop-shadow(0 0 4px rgba(120,255,180,.28))}.ember{filter:drop-shadow(0 0 5px rgba(255,163,58,.6))}.sm{fill:#c7d2d9}.bt{fill:#7b9f7d}.bl{fill:#5f7f61}.br{fill:#466048}.rt{fill:#c6523d}.rl{fill:#a33629}.rr{fill:#7d211d}}</style><g class="g" shape-rendering="crispEdges">${incenseBurner()}${incense()}${meritBox(copy)}${floating(copy)}</g><text class="t g" x="225" y="224" text-anchor="middle">${label}</text></svg>`;
};

export default function handler(req: RequestLike, res: ResponseLike) {
  const url = new URL(req.url || 'http://local');
  const meritCount = meritValue(req.query?.meritCount ?? url.searchParams.get('meritCount') ?? undefined);
  const lang = langValue(req.query?.lang ?? url.searchParams.get('lang') ?? undefined);
  res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(scene(meritCount, lang));
}