// Bud the buddy: a violet blob with googly eyes and drawn limbs.
// It shows feelings with its face and pose but never speaks.
//
// buddy({ mood, pose, legs }) → SVG string (viewBox 0 0 240 240)
//   mood: happy | proud | tired | worried | sick | chill | sleepy | curious
//   pose: wave | hold | stand | cheer | hug

const INK = '#1A1230';
const BODY = 'var(--buddy, #6C4CF5)';

const BLOB = 'M118 30c30-2 58 12 72 38 14 25 13 56-1 80-15 26-44 42-74 41-31-1-60-19-72-46-12-26-8-58 10-80 15-19 38-32 65-33z';

function eyes(mood) {
  const open = (lx, ly, rx, ry, px = 3, py = 2) => `
    <ellipse cx="${lx}" cy="${ly}" rx="21" ry="24" fill="#fff"/><ellipse cx="${rx}" cy="${ry}" rx="21" ry="24" fill="#fff"/>
    <circle cx="${lx + px}" cy="${ly + py}" r="10.5" fill="${INK}"/><circle cx="${rx + px}" cy="${ry + py}" r="10.5" fill="${INK}"/>
    <circle cx="${lx + px + 3}" cy="${ly + py - 3}" r="2.6" fill="#fff"/><circle cx="${rx + px + 3}" cy="${ry + py - 3}" r="2.6" fill="#fff"/>`;
  const arcs = (d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>`;
  switch (mood) {
    case 'proud':
      return arcs('M78 86q12-14 24 0M128 82q12-14 24 0');
    case 'chill':
      return arcs('M78 88q12 10 24 0M128 84q12 10 24 0');
    case 'sleepy':
      return arcs('M78 90q12 8 24 0M128 86q12 8 24 0');
    case 'tired':
      // heavy lids over open eyes
      return open(90, 88, 140, 84, 2, 5) + `<path d="M68 88a22 24 0 0 1 44 0zM118 84a22 24 0 0 1 44 0z" fill="${BODY}"/>
        <path d="M69 88h42M119 84h42" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`;
    case 'worried':
      return open(90, 90, 140, 86, 0, 3) + `<path d="M72 66l28-9M158 62l-28-9" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/>`;
    case 'sick':
      return open(90, 90, 140, 86, -1, 4) + `<path d="M74 82q16-6 32 2M124 78q16-6 32 2" fill="none" stroke="${INK}" stroke-width="4.5" stroke-linecap="round"/>`;
    case 'curious':
      return open(90, 86, 140, 82, 6, -3);
    default:
      return open(90, 86, 140, 82, 3, 1);
  }
}

function mouth(mood) {
  const s = (d, w = 6) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round"/>`;
  switch (mood) {
    case 'proud': return `<path d="M96 116q22 28 46-2z" fill="${INK}"/><path d="M106 124q12 8 26 0" fill="none" stroke="#F7A8DA" stroke-width="6" stroke-linecap="round"/>`;
    case 'tired': return s('M104 124q14-5 28 0', 5.5);
    case 'worried': return `<ellipse cx="118" cy="126" rx="8" ry="10" fill="${INK}"/>`;
    case 'sick': return s('M104 126q7-6 14 0t14 0', 5);
    case 'sleepy': return `<ellipse cx="118" cy="124" rx="6" ry="7" fill="${INK}"/>`;
    case 'chill': return s('M100 116q18 18 36 0');
    case 'curious': return s('M108 120q10 8 22 2');
    default: return s('M98 114q20 22 42 0');
  }
}

function extras(mood) {
  switch (mood) {
    case 'proud': return `<g fill="#FFD45C"><path d="M196 40l5 11 11 5-11 5-5 11-5-11-11-5 11-5z"/><path d="M40 52l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/></g>`;
    case 'tired': case 'sleepy': return `<g fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M184 34h14l-14 16h14"/><path d="M206 12h10l-10 12h10"/></g>`;
    case 'worried': return `<path d="M176 60c6 9 9 14 9 19a9 9 0 0 1-18 0c0-5 3-10 9-19z" fill="#8CD3F5" stroke="${INK}" stroke-width="3.5"/>`;
    case 'sick': return `<g><rect x="132" y="118" width="46" height="9" rx="4.5" transform="rotate(-18 132 122)" fill="#fff" stroke="${INK}" stroke-width="3.5"/><circle cx="176" cy="108" r="6" fill="#FF6B5B" stroke="${INK}" stroke-width="3.5"/></g>
      <ellipse cx="74" cy="110" rx="10" ry="6" fill="#F7A8DA" opacity=".9"/><ellipse cx="160" cy="104" rx="10" ry="6" fill="#F7A8DA" opacity=".9"/>`;
    case 'chill': return `<path d="M120 32c0-10 2-18 6-24" fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round"/><path d="M126 10c8-10 22-10 28-2-10 2-18 4-28 2zM124 16c-8-8-20-8-26-1 9 3 17 3 26 1z" fill="#5EE6B5" stroke="${INK}" stroke-width="3.5" stroke-linejoin="round"/>`;
    default: return `<ellipse cx="72" cy="112" rx="9" ry="5.5" fill="#F7A8DA" opacity=".75"/><ellipse cx="164" cy="106" rx="9" ry="5.5" fill="#F7A8DA" opacity=".75"/>`;
  }
}

const hand = (x, y, rot) => `<g transform="translate(${x} ${y}) rotate(${rot})"><path d="M0 0c-6-8-4-15 1-15M0 0c-1-10 3-16 8-14M0 0c4-8 11-11 14-6" fill="none" stroke="${INK}" stroke-width="5.5" stroke-linecap="round"/></g>`;

function limbs(pose, legs) {
  const st = `fill="none" stroke="${INK}" stroke-width="6.5" stroke-linecap="round" stroke-linejoin="round"`;
  const L = legs ? `<path d="M100 186v30h-14M142 184v32h14" ${st}/>` : '';
  switch (pose) {
    case 'hold':
      // both arms reach down over the top edge of what is below
      return `<path d="M52 134c-22 12-30 40-26 70" ${st}/><path d="M186 128c22 10 32 38 28 72" ${st}/>`
        + `<path d="M26 204c-6 6-9 14-6 20M26 204c0 8 2 15 7 19M26 204c6 4 9 12 9 18" ${st}/>`
        + `<path d="M214 200c-6 6-9 14-6 20M214 200c0 8 2 15 7 19M214 200c6 4 9 12 9 18" ${st}/>` + L;
    case 'cheer':
      return `<path d="M52 120c-18-8-26-30-20-52" ${st}/><path d="M188 112c18-8 24-30 18-52" ${st}/>` + hand(32, 66, 180) + hand(206, 58, 175) + L;
    case 'hug':
      return L;
    case 'stand':
      return `<path d="M50 132c-16 12-20 30-16 46M188 126c16 12 20 30 16 46" ${st}/>` + hand(34, 178, -10) + hand(204, 172, 10) + L;
    case 'wave':
    default:
      return `<path d="M52 132c-16 12-20 30-16 46" ${st}/>${hand(36, 178, -10)}<path d="M188 110c16-10 22-30 16-50" ${st}/>`
        + `<g class="wave-hand">${hand(204, 58, 170)}</g>` + L;
  }
}

export function buddy({ mood = 'happy', pose = 'wave', legs = true, cls = '' } = {}) {
  return `<svg class="buddy ${cls}" data-mood="${mood}" viewBox="-10 0 260 250" aria-hidden="true">
    ${limbs(pose, legs)}
    <path d="${BLOB}" fill="${BODY}"/>
    <path d="M70 60c10-14 26-22 44-24" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="7" stroke-linecap="round"/>
    ${eyes(mood)}${mouth(mood)}${extras(mood)}
    ${pose === 'hug' ? `<path d="M40 128c8 26 40 38 74 30M196 120c-4 28-36 42-70 36" fill="none" stroke="${INK}" stroke-width="6.5" stroke-linecap="round"/>` : ''}
  </svg>`;
}

/** pick a mood from what is going on today (no words — just a face) */
export function moodFrom({ sick, vacation, off, payday, sleepMin, sleepGoalMin, streak, tightMoney } = {}) {
  if (sick) return 'sick';
  if (payday) return 'proud';
  if (vacation || off) return 'chill';
  if (sleepMin && sleepGoalMin && sleepMin < sleepGoalMin - 90) return 'tired';
  if (tightMoney || streak >= 7) return 'worried';
  return 'happy';
}
