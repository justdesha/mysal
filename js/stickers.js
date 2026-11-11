// Chunky two-tone icons for tiles, chips and list rows.
// Main shape uses currentColor, cut-outs use var(--cut) (the background they sit on).
const C = 'var(--cut, #fff)';
const ST = {
  shift: `<path d="M17 13V9a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v4" fill="none" stroke="currentColor" stroke-width="4.5"/><rect x="4" y="13" width="40" height="28" rx="7"/><rect x="4" y="24" width="40" height="3.6" fill="${C}"/><rect x="20" y="21" width="8" height="9" rx="2"/>`,
  moon: `<path d="M30 5a19 19 0 1 0 14 29A16 16 0 0 1 30 5z"/><circle cx="20" cy="22" r="3" fill="${C}"/><circle cx="27" cy="33" r="2.2" fill="${C}"/><path d="M38 7l1.6 3.4L43 12l-3.4 1.6L38 17l-1.6-3.4L33 12l3.4-1.6z"/>`,
  bed: `<rect x="3" y="20" width="42" height="16" rx="5"/><rect x="3" y="10" width="7" height="32" rx="3.5"/><rect x="13" y="13" width="12" height="9" rx="4.5" fill="${C}"/><rect x="41" y="30" width="5" height="12" rx="2.5"/>`,
  coin: `<circle cx="24" cy="24" r="20"/><circle cx="24" cy="24" r="14" fill="none" stroke="${C}" stroke-width="2.6"/><path d="M28.5 18.5c-1-1.6-2.6-2.4-4.6-2.4-2.7 0-4.6 1.4-4.6 3.5 0 4.8 9.6 2.6 9.6 7.3 0 2.2-2 3.6-4.8 3.6-2.2 0-4-1-5-2.6M24 13v3M24 31v3" fill="none" stroke="${C}" stroke-width="3" stroke-linecap="round"/>`,
  wallet: `<path d="M8 12h28a4 4 0 0 1 4 4v1H8a3 3 0 0 1 0-6z"/><rect x="4" y="15" width="40" height="27" rx="7"/><rect x="28" y="24" width="16" height="10" rx="5" fill="${C}"/><circle cx="34" cy="29" r="2.4"/>`,
  bag: `<path d="M8 15h32l-3 28H11z"/><path d="M16 17v-4a8 8 0 0 1 16 0v4" fill="none" stroke="currentColor" stroke-width="4.2" stroke-linecap="round"/><circle cx="17" cy="23" r="2.4" fill="${C}"/><circle cx="31" cy="23" r="2.4" fill="${C}"/>`,
  gift: `<rect x="5" y="16" width="38" height="9" rx="3"/><rect x="8" y="25" width="32" height="18" rx="3"/><rect x="21" y="16" width="6" height="27" fill="${C}"/><path d="M24 16c-3-6-12-9-12-3 0 3 6 3 12 3zM24 16c3-6 12-9 12-3 0 3-6 3-12 3z" fill="none" stroke="currentColor" stroke-width="3.6" stroke-linejoin="round"/>`,
  bell: `<path d="M24 5a13 13 0 0 0-13 13v9l-5 7h36l-5-7v-9A13 13 0 0 0 24 5z"/><path d="M18 38a6 6 0 0 0 12 0z"/><path d="M17 17a7 7 0 0 1 5-6" fill="none" stroke="${C}" stroke-width="3" stroke-linecap="round"/>`,
  cal: `<rect x="4" y="8" width="40" height="36" rx="9"/><rect x="4" y="17" width="40" height="3.5" fill="${C}"/><rect x="13" y="3" width="5" height="11" rx="2.5"/><rect x="30" y="3" width="5" height="11" rx="2.5"/><circle cx="16" cy="29" r="3" fill="${C}"/><circle cx="24" cy="29" r="3" fill="${C}"/><circle cx="32" cy="29" r="3" fill="${C}"/><circle cx="16" cy="37" r="3" fill="${C}"/>`,
  clock: `<circle cx="24" cy="24" r="20"/><path d="M24 13v12l8 5" fill="none" stroke="${C}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  heart: `<path d="M24 42S5 31 5 17.5a9.5 9.5 0 0 1 19-3.5 9.5 9.5 0 0 1 19 3.5C43 31 24 42 24 42z"/><path d="M13 15a4.5 4.5 0 0 1 4-3" fill="none" stroke="${C}" stroke-width="3" stroke-linecap="round"/>`,
  bolt: `<path d="M28 3 8.5 27.5h12.5L18 45l21.5-26.5H27z"/>`,
  thermo: `<path d="M18 9a6 6 0 0 1 12 0v18a10 10 0 1 1-12 0z"/><circle cx="24" cy="35" r="5" fill="${C}"/><rect x="22.5" y="13" width="3" height="20" rx="1.5" fill="${C}"/><path d="M34 12h6M34 19h4" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>`,
  sun: `<circle cx="24" cy="24" r="10"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M9.9 9.9l4.2 4.2M33.9 33.9l4.2 4.2M9.9 38.1l4.2-4.2M33.9 14.1l4.2-4.2" stroke="currentColor" stroke-width="4.4" stroke-linecap="round"/>`,
  leaf: `<path d="M8 40C8 18 21 7 42 6c0 22-12 34-33 34z"/><path d="M10 38c8-9 15-15 24-21" fill="none" stroke="${C}" stroke-width="3.2" stroke-linecap="round"/>`,
  sofa: `<path d="M10 20V15a5 5 0 0 1 5-5h18a5 5 0 0 1 5 5v5"/><rect x="3" y="20" width="9" height="16" rx="4.5"/><rect x="36" y="20" width="9" height="16" rx="4.5"/><rect x="10" y="25" width="28" height="11"/><rect x="7" y="36" width="5" height="6" rx="2"/><rect x="36" y="36" width="5" height="6" rx="2"/>`,
  chart: `<rect x="5" y="24" width="9" height="19" rx="3"/><rect x="19.5" y="8" width="9" height="35" rx="3"/><rect x="34" y="17" width="9" height="26" rx="3"/>`,
  magic: `<rect x="3" y="27" width="34" height="7" rx="3.5" transform="rotate(-42 20 30)"/><path d="M33 4l2 5 5 2-5 2-2 5-2-5-5-2 5-2zM42 20l1.4 3 3 1.4-3 1.4-1.4 3-1.4-3-3-1.4 3-1.4zM15 5l1.2 2.6 2.6 1.2-2.6 1.2L15 12.6l-1.2-2.6L11.2 8.8l2.6-1.2z"/>`,
  globe: `<circle cx="24" cy="24" r="20"/><path d="M4 24h40M24 4c-7 7-7 33 0 40M24 4c7 7 7 33 0 40" fill="none" stroke="${C}" stroke-width="2.8"/>`,
  palette: `<path d="M24 4C12 4 4 13 4 24s9 20 19 20c3 0 4-2 4-4 0-3-3-4-3-6 0-2 2-4 4-4h6c6 0 10-4 10-10C44 11 35 4 24 4z"/><circle cx="14" cy="22" r="3.4" fill="${C}"/><circle cx="20" cy="13" r="3.4" fill="${C}"/><circle cx="31" cy="14" r="3.4" fill="${C}"/>`,
  chat: `<path d="M8 6.5h32a4.5 4.5 0 0 1 4.5 4.5v18a4.5 4.5 0 0 1-4.5 4.5H20l-9.5 8.5v-8.5H8A4.5 4.5 0 0 1 3.5 29V11A4.5 4.5 0 0 1 8 6.5z"/><circle cx="15" cy="20" r="2.8" fill="${C}"/><circle cx="24" cy="20" r="2.8" fill="${C}"/><circle cx="33" cy="20" r="2.8" fill="${C}"/>`,
  doc: `<path d="M10 3h19l10 10v29a3 3 0 0 1-3 3H10a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3z"/><path d="M29 3v10h10" fill="${C}" opacity=".5"/><rect x="13" y="22" width="20" height="3.4" rx="1.7" fill="${C}"/><rect x="13" y="30" width="14" height="3.4" rx="1.7" fill="${C}"/>`,
  box: `<path d="M24 3 43 13v22L24 45 5 35V13z"/><path d="M5 13l19 10 19-10M24 23v22" fill="none" stroke="${C}" stroke-width="3" stroke-linejoin="round"/>`,
  target: `<circle cx="24" cy="24" r="20"/><circle cx="24" cy="24" r="12.5" fill="${C}"/><circle cx="24" cy="24" r="6.5"/>`,
  me: `<circle cx="24" cy="15" r="10"/><path d="M5 44c2-10 10-16 19-16s17 6 19 16z"/><circle cx="20" cy="14" r="1.8" fill="${C}"/><circle cx="28" cy="14" r="1.8" fill="${C}"/>`,
  spark: `<path d="M24 3l5 13.5L43 21l-14 5-5 19-5-19-14-5 14-4.5z"/>`,
  repeat: `<path d="M8 22v-2a10 10 0 0 1 10-10h18l-5-5M40 26v2a10 10 0 0 1-10 10H12l5 5" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`,
  warn: `<path d="M24 4c2 0 3 1 4 3l16 30c2 4 0 7-4 7H8c-4 0-6-3-4-7L20 7c1-2 2-3 4-3z"/><rect x="21.5" y="16" width="5" height="14" rx="2.5" fill="${C}"/><circle cx="24" cy="36" r="3" fill="${C}"/>`,
  plane: `<path d="M44 5 4 21.5l14.5 5L22 42l7-10 10 7.5z"/><path d="M18.5 26.5 36 12" stroke="${C}" stroke-width="3" stroke-linecap="round"/>`,
  shield: `<path d="M24 3 41 9v13c0 11-7 19-17 23C14 41 7 33 7 22V9z"/><path d="M16 23l6 6 11-12" fill="none" stroke="${C}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`
};
export const stk = (n, cls = '') => `<svg class="stk ${cls}" viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">${ST[n] || ST.spark}</svg>`;
/** icon in a soft colored chip */
export const chipIc = (n, tone = 'lilac') => `<span class="ic-chip t-${tone}">${stk(n)}</span>`;
