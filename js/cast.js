// The Bud cast: soft gradient shapes with ink-line faces.
// face({ shape, color, mood, hair, size }) → SVG (viewBox 0 0 100 100, drawn edges may spill out a little)
//   shape: circle | squircle | blob | flower | triangle | bolt | pill
//   color: grape | lime | pink | coral | sky | sun | orange | mint
//   mood:  happy | calm | up | sleepy | tense | sad | worried | wink | sick | curious | proud | chill
//   hair:  curl | tuft | brow | sprout | none
// The cast never talks — it only shows a feeling.

const INK = '#141218';
export const GRAD = {
  grape: ['#EFE9FF', '#A68CFF', '#6A45F5'],
  lime: ['#F4FFDC', '#BDF27A', '#6CC93E'],
  pink: ['#FFE9F7', '#FFA3DA', '#E55AB4'],
  coral: ['#FFE3DB', '#FF958A', '#EE4949'],
  sky: ['#E6F5FF', '#93CBFF', '#3D84F2'],
  sun: ['#FFF9D1', '#FFD65E', '#FF9C1A'],
  orange: ['#FFE8D6', '#FFAE73', '#FF762B'],
  mint: ['#E3FFF4', '#86EDC4', '#27BC88']
};
let N = 0;

function flowerPath(r = 41, a = 7, n = 6) {
  let d = '';
  for (let i = 0; i <= 120; i++) {
    const t = (i / 120) * Math.PI * 2, rr = r + a * Math.cos(n * t);
    d += (i ? 'L' : 'M') + (50 + rr * Math.cos(t)).toFixed(1) + ' ' + (50 + rr * Math.sin(t)).toFixed(1);
  }
  return d + 'Z';
}
const SHAPES = {
  circle: { el: (f) => `<circle cx="50" cy="50" r="45" fill="${f}"/>`, ax: 50, ay: 52, k: 1 },
  squircle: { el: (f) => `<rect x="6" y="6" width="88" height="88" rx="32" fill="${f}"/>`, ax: 50, ay: 52, k: 1 },
  blob: { el: (f) => `<path d="M52 5c25 1 42 18 43 42 1 26-17 46-44 48C24 97 5 78 5 52 5 25 26 4 52 5z" fill="${f}"/>`, ax: 50, ay: 52, k: 1 },
  flower: { el: (f) => `<path d="${flowerPath()}" fill="${f}"/>`, ax: 50, ay: 52, k: .9 },
  pill: { el: (f) => `<rect x="14" y="4" width="72" height="92" rx="36" fill="${f}"/>`, ax: 50, ay: 48, k: .95 },
  triangle: { el: (f) => `<path d="M50 9c4 0 7 2 9 6l34 62c5 9-1 18-11 18H18C8 95 2 86 7 77l34-62c2-4 5-6 9-6z" fill="${f}"/>`, ax: 50, ay: 66, k: .78 },
  bolt: { el: (f) => `<path d="M60 5 20 55h27l-8 40 42-52H54z" fill="${f}" stroke="${f}" stroke-width="9" stroke-linejoin="round"/>`, ax: 51, ay: 49, k: .66 }
};

/* ---------- features, drawn around (0,0) ---------- */
const S = (d, w = 5) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const eyeOpen = (x, y, px = 2, py = 1, r = 10) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.12}" fill="#fff"/><circle cx="${x + px}" cy="${y + py}" r="${r * .52}" fill="${INK}"/><circle cx="${x + px + r * .22}" cy="${y + py - r * .25}" r="${r * .17}" fill="#fff"/>`;
const EYES = {
  open: (px, py) => eyeOpen(-13, -6, px, py) + eyeOpen(13, -6, px, py),
  closed: () => S('M-20 -5q7 6 14 0M6 -5q7 6 14 0'),       // relaxed ‿ ‿
  smile: () => S('M-20 -3q7 -8 14 0M6 -3q7 -8 14 0'),      // happy ^ ^
  angry: () => S('M-21 -11l12 6-12 5M21 -11l-12 6 12 5'),  // > <
  half: () => `${eyeOpen(-13, -5, 0, 3, 9)}${eyeOpen(13, -5, 0, 3, 9)}<path d="M-23 -6a10 10 0 0 1 20 0zM3 -6a10 10 0 0 1 20 0z" fill="var(--lid)"/>${S('M-23 -6h20M3 -6h20', 4)}`,
  wink: () => eyeOpen(-13, -6, 2, 1) + S('M6 -4q7 -8 14 0')
};
const MOUTH = {
  smile: () => S('M-11 9q11 11 22 0'),
  big: () => `<path d="M-13 7q13 18 26 0z" fill="${INK}" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/><path d="M-6 13q6 4 12 0" fill="none" stroke="#FF8FC7" stroke-width="4" stroke-linecap="round"/>`,
  o: () => `<ellipse cx="0" cy="12" rx="5" ry="6" fill="${INK}"/>`,
  flat: () => S('M-8 12h16'),
  frown: () => S('M-10 15q10 -9 20 0'),
  zig: () => S('M-11 13l5 -4 5 4 5 -4 5 4', 4.5),
  small: () => S('M-6 11q6 5 12 0')
};
const BROW = {
  worried: () => S('M-22 -21q8 -6 15 -2M22 -21q-8 -6 -15 -2', 4.5),
  tense: () => S('M-22 -22l14 6M22 -22l-14 6', 5),
  sad: () => S('M-21 -18q7 -7 14 -3M21 -18q-7 -7 -14 -3', 4.5)
};
const MOODS = {
  happy: { eyes: 'open', mouth: 'smile', blush: true },
  calm: { eyes: 'closed', mouth: 'smile', blush: true },
  chill: { eyes: 'closed', mouth: 'small' },
  up: { eyes: 'smile', mouth: 'big', blush: true },
  proud: { eyes: 'smile', mouth: 'big', blush: true, x: 'spark' },
  sleepy: { eyes: 'closed', mouth: 'o', x: 'zz' },
  tense: { eyes: 'angry', mouth: 'zig', brow: 'tense' },
  sad: { eyes: 'open', py: 4, px: 0, mouth: 'frown', brow: 'sad' },
  worried: { eyes: 'open', py: 2, px: -1, mouth: 'o', brow: 'worried', x: 'drop' },
  wink: { eyes: 'wink', mouth: 'smile', blush: true },
  sick: { eyes: 'half', mouth: 'flat', x: 'thermo', blush: true },
  curious: { eyes: 'open', px: 3, py: -3, mouth: 'small' }
};

function extras(x) {
  if (x === 'zz') return `<g transform="translate(70 4)">${S('M0 0h9l-9 10h9M14 -10h7l-7 8h7', 3.6)}</g>`;
  if (x === 'drop') return `<path d="M84 20c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12z" fill="#9BD5FF" stroke="${INK}" stroke-width="2.6"/>`;
  if (x === 'spark') return `<g fill="#FFD84D" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"><path d="M86 6l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/><path d="M10 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2z"/></g>`;
  if (x === 'thermo') return `<g transform="rotate(-24 70 70)"><rect x="54" y="66" width="34" height="8" rx="4" fill="#fff" stroke="${INK}" stroke-width="2.8"/><circle cx="88" cy="70" r="5.5" fill="#FF5A57" stroke="${INK}" stroke-width="2.8"/></g>`;
  return '';
}
function hair(h, shape) {
  if (!h || h === 'none' || ['bolt', 'triangle', 'flower'].includes(shape)) return '';
  const st = `fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round"`;
  if (h === 'curl') return `<path d="M10 40C14 12 46 0 72 10c12 5 20 14 22 26 1 6-5 9-9 5-3-4 1-9 6-7" ${st}/>`;
  if (h === 'tuft') return `<path d="M44 8c-2-8 2-13 7-14M54 8c2-7 7-10 12-9" ${st}/>`;
  if (h === 'brow') return `<path d="M4 46C8 22 30 12 52 16" ${st} stroke-width="7"/>`;
  if (h === 'sprout') return `<path d="M50 7V-4" ${st} stroke-width="4"/><path d="M50 -3c5-8 15-8 19-3-7 3-12 4-19 3zM50 0c-5-7-14-7-18-2 7 3 12 3 18 2z" fill="#86EDC4" stroke="${INK}" stroke-width="3" stroke-linejoin="round"/>`;
  return '';
}

export function face({ shape = 'circle', color = 'grape', mood = 'happy', hair: h = 'none', cls = '', title = '' } = {}) {
  const id = 'g' + (++N).toString(36);
  const sh = SHAPES[shape] || SHAPES.circle, M = MOODS[mood] || MOODS.happy, G = GRAD[color] || GRAD.grape;
  const blush = M.blush ? `<ellipse cx="-22" cy="7" rx="6.5" ry="4" fill="#FF7FB8" opacity=".45"/><ellipse cx="22" cy="7" rx="6.5" ry="4" fill="#FF7FB8" opacity=".45"/>` : '';
  return `<svg class="cast ${cls}" viewBox="0 0 100 100" ${title ? `role="img" aria-label="${title}"` : 'aria-hidden="true"'} style="--lid:${G[1]}">
    <defs><radialGradient id="${id}" cx="34%" cy="28%" r="78%"><stop offset="0" stop-color="${G[0]}"/><stop offset=".48" stop-color="${G[1]}"/><stop offset="1" stop-color="${G[2]}"/></radialGradient></defs>
    ${sh.el(`url(#${id})`)}
    <ellipse cx="34" cy="24" rx="13" ry="7" transform="rotate(-24 34 24)" fill="#fff" opacity=".42"/>
    <g transform="translate(${sh.ax} ${sh.ay}) scale(${sh.k})">${blush}${M.brow ? BROW[M.brow]() : ''}${EYES[M.eyes](M.px ?? 2, M.py ?? 1)}${MOUTH[M.mouth]()}</g>
    ${hair(h, shape)}${extras(M.x)}
  </svg>`;
}

/* ---------- the main buddy and the daily moods ---------- */
export const BUD = { shape: 'circle', color: 'grape', hair: 'curl' };
export const bud = (mood = 'happy', cls = '') => face({ ...BUD, mood, cls });

/** how-are-you-today check-in */
export const MOOD_SET = [
  { id: 'up', label: 'Бадьоро', shape: 'bolt', color: 'sun', mood: 'up', tile: 'yellow', score: 3 },
  { id: 'calm', label: 'Спокійно', shape: 'circle', color: 'lime', mood: 'calm', tile: 'green', score: 3 },
  { id: 'tired', label: 'Втомлено', shape: 'blob', color: 'sky', mood: 'sleepy', tile: 'blue', score: 1.5 },
  { id: 'tense', label: 'Напружено', shape: 'triangle', color: 'coral', mood: 'tense', tile: 'coral', score: 1 },
  { id: 'sad', label: 'Сумно', shape: 'flower', color: 'pink', mood: 'sad', tile: 'pink', score: 1 }
];
export const moodById = (id) => MOOD_SET.find((m) => m.id === id);
export const moodFace = (id, cls = '') => { const m = moodById(id); return m ? face({ shape: m.shape, color: m.color, mood: m.mood, cls }) : ''; };

/** a pile of characters, for the first screen and celebrations */
export function cluster(cls = '') {
  const L = [
    { x: -2, y: 18, s: 40, shape: 'circle', color: 'lime', mood: 'calm', hair: 'brow' },
    { x: 54, y: 0, s: 38, shape: 'circle', color: 'grape', mood: 'curious', hair: 'curl' },
    { x: 36, y: 34, s: 28, shape: 'bolt', color: 'sun', mood: 'up' },
    { x: 66, y: 38, s: 36, shape: 'squircle', color: 'orange', mood: 'tense' },
    { x: -8, y: 58, s: 40, shape: 'blob', color: 'sky', mood: 'sleepy' },
    { x: 30, y: 60, s: 36, shape: 'triangle', color: 'coral', mood: 'wink' },
    { x: 68, y: 70, s: 34, shape: 'flower', color: 'pink', mood: 'happy' }
  ];
  return `<div class="cluster ${cls}" aria-hidden="true">${L.map((c, i) => `<span style="left:${c.x}%;top:${c.y}%;width:${c.s}%;--d:${i * 70}ms">${face(c)}</span>`).join('')}</div>`;
}
