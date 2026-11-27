// Live tweakers: exploration tools for the colour and font sections.
// They change the open page only. The official palette and fonts are always the default; nothing is saved.
(() => {
  // ---------- OKLCH math ----------
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const gam = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
  const toLin = (L, C, h) => {
    const a = C * Math.cos((h * Math.PI) / 180), b = C * Math.sin((h * Math.PI) / 180);
    const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
    const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
    const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
    return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  };
  const inGamut = (v) => v.every((x) => x >= -0.0005 && x <= 1.0005);
  const rgb = (L, C, h) => {
    let c = C;
    while (c > 0 && !inGamut(toLin(L, c, h))) c -= 0.004;
    return toLin(L, Math.max(c, 0), h).map((x) => Math.min(1, Math.max(0, x)));
  };
  const hex = (l) => '#' + l.map((x) => Math.round(gam(x) * 255).toString(16).padStart(2, '0')).join('');
  const fromHex = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => lin(v / 255)); };
  const toOklch = ([r, g, b]) => {
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
    const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
    const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
    return [L, Math.hypot(a, bb), ((Math.atan2(bb, a) * 180) / Math.PI + 360) % 360];
  };
  const lum = (l) => 0.2126 * l[0] + 0.7152 * l[1] + 0.0722 * l[2];
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  // Move lightness in one direction until the colour reaches the contrast target against bg.
  const ensure = (L, C, h, bg, min, dir) => {
    let l = L;
    while (l > 0.02 && l < 0.99 && ratio(rgb(l, C, h), bg) < min) l += dir * 0.005;
    return rgb(l, C, h);
  };
  const o = (L, C, h, a) => `oklch(${L.toFixed(3)} ${C.toFixed(3)} ${h.toFixed(1)}${a == null ? '' : ' / ' + a})`;
  const trip = (l) => l.map((x) => Math.round(gam(x) * 255)).join(' ');

  const OFFICIAL = {
    /* 1. Buttons */
    '--col-btn-bg': '#0D1B38', '--col-btn-grad': '#1D4ED8', '--col-btn-hover': '#1D4ED8', '--col-btn-txt': '#FFFFFF', '--col-btn-dark-bg': '#152C5B', '--col-btn-line': '#0D1B38',
    /* 2. Backgrounds, Gradients & Ambient Shading */
    '--col-bg-light': '#F4F4F2', '--col-bg-light-elev': '#FFFFFF', '--col-bg-light-well': '#EAEAE6',
    '--col-bg-dark': '#0A0B0E', '--col-bg-dark-elev': '#13151A',
    '--col-bg-slab-start': '#0D1B38', '--col-bg-slab-end': '#152C5B',
    '--col-bg-dark-grad-end': '#0D1B38', '--col-bg-light-wash': '#E8EEFA',
    '--col-bg-shade-1': '#2563EB', '--col-bg-shade-2': '#06B6D4', '--col-bg-shade-3': '#93C5FD',
    /* 3. Text, Header & Text Gradients */
    '--col-txt-light': '#0A0B0E', '--col-txt-light-dim': '#5A5F69', '--col-txt-light-mute': '#8A8F99',
    '--col-txt-dark': '#ECEEF2', '--col-txt-dark-dim': '#94A3B8', '--col-txt-dark-mute': '#64748B',
    '--col-nav-brand': '#0D1B38', '--col-nav-link': '#5A6275', '--col-nav-active': '#0D1B38',
    '--col-txt-accent-light': '#152C5B', '--col-txt-accent-dark': '#60A5FA',
    '--col-txt-grad-start': '#152C5B', '--col-txt-grad-end': '#2563EB', '--col-txt-mark': '#60A5FA',
    /* 4. Cards & Card Gradients */
    '--col-card-light': '#E8EEFA', '--col-card-light-grad': '#2563EB',
    '--col-card-dark': '#111C38', '--col-card-dark-grad': '#0B1226', '--col-card-dark-glow': '#2563EB',
    /* 5. Pills, Chips & Tags */
    '--col-pill-bg': '#F6F8FC', '--col-pill-active-bg': '#0D1B38', '--col-pill-grad': '#2563EB',
    '--col-pill-txt': '#152C5B', '--col-pill-active-txt': '#FFFFFF', '--col-pill-hover-line': '#2563EB',
    /* 6. Loading, Progress & Stage Indicators */
    '--col-stage-fill': '#152C5B', '--col-stage-fill-dark': '#60A5FA', '--col-stage-grad': '#06B6D4',
    '--col-stage-pulse': '#2563EB', '--col-stage-shimmer': '#0A0B0E',
    /* 7. Shadows & Elevation Shading */
    '--col-shadow-light': '#0D1B38', '--col-shadow-dark': '#000000', '--col-shadow-btn': '#0D1B38', '--col-shadow-focus': '#2563EB',
    /* 8. Status & Brand Marks */
    '--col-status-ok': hex(rgb(0.62, 0.16, 150)), '--col-status-warn': hex(rgb(0.68, 0.16, 70)), '--col-status-err': '#B42318',
    '--col-mark-primary': '#1D4ED8', '--col-mark-secondary': '#06B6D4', '--col-mark-ring': '#0A0B0E',
  };
  const NAMES = Object.keys(OFFICIAL);
  const sheet = document.createElement('style');
  sheet.id = 'q-tweak-color';
  document.head.appendChild(sheet);
  const state = {};
  let btnGradOn = false;
  let pillGradOn = false;
  let stageGradOn = false;
  let currentAnchorHex = null;
  let extra = '';
  let hue = null;
  let calTints = null;
  const hexTrip = (hx) => {
    const n = parseInt(String(hx || '#000000').slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(' ');
  };

  // ---------- derivation from one anchor ----------
  function derive(anchorHex) {
    const [aL, aC, h] = toOklch(fromHex(anchorHex));
    hue = h;
    calTints = null;
    const C = Math.max(aC, 0.05), tc = Math.min(0.012, C * 0.08), white = [1, 1, 1];
    const bg = rgb(0.965, tc, h), night = rgb(0.14, Math.min(0.03, C * 0.2), h);
    const blue600 = ensure(Math.min(0.62, Math.max(0.45, aL)), C, h, white, 4.5, -1);
    const bL = toOklch(blue600)[0];
    const cyanH = (h + 310) % 360;
    const blue700 = ensure(bL - 0.07, C, h, white, 4.5, -1);
    const navy900 = ensure(0.25, C * 0.55, h, white, 7, -1);
    const navy800 = ensure(0.32, C * 0.6, h, white, 4.5, -1);
    const blue400 = ensure(0.72, C * 0.85, h, night, 4.5, 1);
    const blue300 = ensure(0.84, C * 0.5, h, night, 4.5, 1);
    const cyan500 = rgb(0.72, C * 0.8, cyanH);
    const cardLightRgb = rgb(0.945, Math.min(0.03, C * 0.25), h);
    const cardDarkStartRgb = rgb(0.22, C * 0.5, h);
    const cardDarkEndRgb = rgb(0.17, C * 0.45, h);
    const inkRgb = ensure(0.17, tc * 1.5, h, bg, 12, -1);
    const inkDimRgb = ensure(0.46, tc * 2, h, bg, 4.5, -1);
    const inkMuteRgb = ensure(0.62, tc * 2, h, bg, 3, -1);
    const night2Rgb = rgb(0.19, Math.min(0.03, C * 0.2), h);
    const onNightRgb = rgb(0.94, tc, h);
    const onNightDimRgb = ensure(0.74, tc * 3, h, night, 4.5, 1);
    const onNightMuteRgb = ensure(0.6, tc * 3, h, night, 3, 1);
    const d = {
      '--col-btn-bg': navy900, '--col-btn-grad': blue700, '--col-btn-hover': blue700, '--col-btn-txt': white, '--col-btn-dark-bg': navy800, '--col-btn-line': navy900,
      '--col-bg-light': bg, '--col-bg-light-elev': white, '--col-bg-light-well': rgb(0.93, tc * 1.3, h),
      '--col-bg-dark': night, '--col-bg-dark-elev': night2Rgb,
      '--col-bg-slab-start': navy900, '--col-bg-slab-end': navy800,
      '--col-bg-dark-grad-end': navy900, '--col-bg-light-wash': cardLightRgb,
      '--col-bg-shade-1': blue600, '--col-bg-shade-2': cyan500, '--col-bg-shade-3': blue300,
      '--col-txt-light': inkRgb, '--col-txt-light-dim': inkDimRgb, '--col-txt-light-mute': inkMuteRgb,
      '--col-txt-dark': onNightRgb, '--col-txt-dark-dim': onNightDimRgb, '--col-txt-dark-mute': onNightMuteRgb,
      '--col-nav-brand': navy900, '--col-nav-link': inkDimRgb, '--col-nav-active': navy900,
      '--col-txt-accent-light': navy800, '--col-txt-accent-dark': blue400,
      '--col-txt-grad-start': navy800, '--col-txt-grad-end': blue600, '--col-txt-mark': blue400,
      '--col-card-light': cardLightRgb, '--col-card-light-grad': blue600,
      '--col-card-dark': cardDarkStartRgb, '--col-card-dark-grad': cardDarkEndRgb, '--col-card-dark-glow': blue600,
      '--col-pill-bg': rgb(0.97, Math.min(0.018, C * 0.12), h), '--col-pill-active-bg': navy900, '--col-pill-grad': blue600,
      '--col-pill-txt': navy800, '--col-pill-active-txt': white, '--col-pill-hover-line': blue600,
      '--col-stage-fill': navy800, '--col-stage-fill-dark': blue400, '--col-stage-grad': cyan500,
      '--col-stage-pulse': blue600, '--col-stage-shimmer': night,
      '--col-shadow-light': navy900, '--col-shadow-dark': [0, 0, 0], '--col-shadow-btn': navy900, '--col-shadow-focus': blue600,
      '--col-mark-primary': blue700, '--col-mark-secondary': cyan500, '--col-mark-ring': night,
    };
    const out = {};
    for (const k of Object.keys(d)) out[k] = hex(d[k]);
    calTints = { '--cal-bg-muted': hex(rgb(0.972, Math.min(0.02, C * 0.1), h)), '--cal-bg-emphasis': hex(rgb(0.94, Math.min(0.03, C * 0.14), h)), '--cal-border': hex(rgb(0.9, Math.min(0.035, C * 0.17), h)), '--cal-border-emphasis': hex(rgb(0.82, Math.min(0.06, C * 0.3), h)) };
    const panelBase = out['--col-card-light'];
    extra = `--accent-soft: ${o(0.17, 0.01, h, 0.08)}; --line: ${o(0.2, 0.01, h, 0.1)}; --line-strong: ${o(0.2, 0.01, h, 0.18)};
      --field-line: ${o(bL, C, h, 0.18)}; --field-ring: 0 0 0 3px ${o(bL, C, h, 0.18)};
      --hairline-on-night: ${o(0.82, C * 0.4, h, 0.14)}; --hairline-on-night-strong: ${o(0.82, C * 0.4, h, 0.24)};
      --btn-dark-line: ${o(0.82, C * 0.4, h, 0.32)}; --tile-dark-bg: ${o(bL, C, h, 0.14)}; --tile-dark-line: ${o(0.82, C * 0.4, h, 0.18)};
      --halo-core: ${o(bL, C, h, 0.3)}; --halo-mid: ${o(bL, C, h, 0.1)}; --wash-bottom: ${o(0.92, C * 0.2, h, 0.6)};
      --blob-blue: ${trip(blue600)}; --blob-cyan: ${trip(cyan500)}; --blob-navy: ${trip(navy900)}; --blob-ice: ${trip(blue300)};
      --ds-tint: ${panelBase};`;
    return out;
  }

  function computedOverrides() {
    const out = {};
    /* 1. Buttons (strictly isolated) */
    if (btnGradOn) {
      const gradLight = `linear-gradient(135deg, ${current('--col-btn-bg')} 0%, ${current('--col-btn-grad')} 100%)`;
      const gradDark = `linear-gradient(135deg, ${current('--col-btn-dark-bg')} 0%, ${current('--col-btn-grad')} 100%)`;
      out['--col-btn-bg'] = gradLight;
      out['--col-btn-dark-bg'] = gradDark;
      out['--btn-bg'] = gradLight;
      out['--btn-dark-bg'] = gradDark;
    } else {
      if (state['--col-btn-bg']) out['--btn-bg'] = state['--col-btn-bg'];
      if (state['--col-btn-dark-bg']) out['--btn-dark-bg'] = state['--col-btn-dark-bg'];
    }
    if (state['--col-btn-line']) out['--btn-line'] = state['--col-btn-line'];
    else if (state['--col-btn-bg']) { out['--col-btn-line'] = state['--col-btn-bg']; out['--btn-line'] = state['--col-btn-bg']; }
    if (state['--col-btn-hover']) out['--btn-hover'] = state['--col-btn-hover'];
    if (state['--col-btn-txt']) out['--btn-ink'] = state['--col-btn-txt'];

    /* 2. Backgrounds & Ambient Shading */
    if (state['--col-bg-light']) out['--bg'] = state['--col-bg-light'];
    if (state['--col-bg-light-elev']) out['--bg-elev'] = state['--col-bg-light-elev'];
    if (state['--col-bg-light-well']) out['--bg-elev-2'] = state['--col-bg-light-well'];
    if (state['--col-bg-dark']) { out['--night'] = state['--col-bg-dark']; out['--col-bg-dark-grad-start'] = state['--col-bg-dark']; out['--rgb-bg-dark'] = hexTrip(state['--col-bg-dark']); }
    if (state['--col-bg-dark-elev']) out['--night-2'] = state['--col-bg-dark-elev'];
    if (state['--col-bg-slab-end']) out['--rgb-bg-slab-end'] = hexTrip(state['--col-bg-slab-end']);
    if (state['--col-bg-shade-1']) { out['--rgb-bg-shade-1'] = hexTrip(state['--col-bg-shade-1']); out['--blob-blue'] = hexTrip(state['--col-bg-shade-1']); }
    if (state['--col-bg-shade-2']) { out['--rgb-bg-shade-2'] = hexTrip(state['--col-bg-shade-2']); out['--blob-cyan'] = hexTrip(state['--col-bg-shade-2']); }
    if (state['--col-bg-shade-3']) { out['--rgb-bg-shade-3'] = hexTrip(state['--col-bg-shade-3']); out['--blob-ice'] = hexTrip(state['--col-bg-shade-3']); }

    /* 3. Text & Highlights */
    if (state['--col-txt-light']) out['--ink'] = state['--col-txt-light'];
    if (state['--col-txt-light-dim']) out['--ink-dim'] = state['--col-txt-light-dim'];
    if (state['--col-txt-light-mute']) out['--ink-mute'] = state['--col-txt-light-mute'];
    if (state['--col-txt-dark']) out['--on-night'] = state['--col-txt-dark'];
    if (state['--col-txt-dark-dim']) out['--on-night-dim'] = state['--col-txt-dark-dim'];
    if (state['--col-txt-dark-mute']) out['--on-night-mute'] = state['--col-txt-dark-mute'];
    if (state['--col-txt-mark']) out['--rgb-txt-mark'] = hexTrip(state['--col-txt-mark']);
    if (state['--col-txt-accent-dark']) out['--col-txt-accent-dark-soft'] = state['--col-txt-accent-dark'];

    /* 4. Cards & Card Gradients */
    if (state['--col-card-light'] || state['--col-card-light-grad']) {
      const glow = hexTrip(current('--col-card-light-grad'));
      out['--rgb-card-light-grad'] = glow;
      out['--col-card-light-line'] = `rgb(${glow} / 0.18)`;
      out['--panel-light'] = `radial-gradient(ellipse 60% 70% at 85% 0%, rgb(${glow} / 0.16), transparent 70%), ${current('--col-card-light')}`;
      out['--panel-light-line'] = `rgb(${glow} / 0.18)`;
      out['--ds-tint'] = current('--col-card-light');
    }
    if (state['--col-card-dark'] || state['--col-card-dark-grad'] || state['--col-card-dark-glow']) {
      const glow = hexTrip(current('--col-card-dark-glow'));
      out['--rgb-card-dark-glow'] = glow;
      out['--panel-dark'] = `radial-gradient(ellipse 70% 80% at 100% 0%, rgb(${glow} / 0.22), transparent 70%), linear-gradient(160deg, ${current('--col-card-dark')} 0%, ${current('--col-card-dark-grad')} 100%)`;
    }

    /* 5. Pills, Chips & Tags */
    if (pillGradOn) {
      const pGrad = `linear-gradient(135deg, ${current('--col-pill-active-bg')} 0%, ${current('--col-pill-grad')} 100%)`;
      out['--col-pill-active-bg'] = pGrad;
      out['--pill-on-bg'] = pGrad;
    } else if (state['--col-pill-active-bg']) {
      out['--pill-on-bg'] = state['--col-pill-active-bg'];
    }
    if (state['--col-pill-bg']) out['--pill-bg'] = state['--col-pill-bg'];
    if (state['--col-pill-active-txt']) out['--pill-on-ink'] = state['--col-pill-active-txt'];
    if (state['--col-pill-hover-line']) {
      const prgb = hexTrip(state['--col-pill-hover-line']);
      out['--rgb-pill-accent'] = prgb;
      out['--col-pill-line'] = `rgb(${prgb} / 0.20)`;
      out['--pill-line'] = `rgb(${prgb} / 0.20)`;
      out['--pill-hover-line'] = state['--col-pill-hover-line'];
    }

    /* 6. Loading, Progress & Stage Indicators */
    if (stageGradOn) {
      out['--col-stage-fill'] = `linear-gradient(90deg, ${current('--col-stage-fill')} 0%, ${current('--col-stage-grad')} 100%)`;
      out['--col-stage-fill-dark'] = `linear-gradient(90deg, ${current('--col-stage-fill-dark')} 0%, ${current('--col-stage-grad')} 100%)`;
    }
    if (state['--col-stage-shimmer']) out['--rgb-stage-shimmer'] = hexTrip(state['--col-stage-shimmer']);

    /* 7. Shadows & Elevation Shading */
    if (state['--col-shadow-light']) out['--rgb-shadow-light'] = hexTrip(state['--col-shadow-light']);
    if (state['--col-shadow-dark']) out['--rgb-shadow-dark'] = hexTrip(state['--col-shadow-dark']);
    if (state['--col-shadow-btn']) out['--rgb-shadow-btn'] = hexTrip(state['--col-shadow-btn']);
    if (state['--col-shadow-focus']) {
      const frgb = hexTrip(state['--col-shadow-focus']);
      out['--rgb-shadow-focus'] = frgb;
      out['--field-ring'] = `0 0 0 3px rgb(${frgb} / 0.18)`;
    }

    /* 8. Status & Brand Marks */
    if (state['--col-status-ok']) out['--ok'] = state['--col-status-ok'];
    if (state['--col-status-warn']) out['--warn'] = state['--col-status-warn'];
    if (state['--col-status-err']) out['--danger'] = state['--col-status-err'];
    if (state['--col-mark-primary']) out['--mark-primary'] = state['--col-mark-primary'];
    if (state['--col-mark-secondary']) out['--mark-secondary'] = state['--col-mark-secondary'];
    if (state['--col-mark-ring']) out['--mark-ring'] = state['--col-mark-ring'];

    return out;
  }

  function render() {
    const props = NAMES.filter((n) => state[n]).map((n) => `${n}: ${state[n]};`).join(' ');
    const comp = computedOverrides();
    const compProps = Object.entries(comp).map(([k, v]) => `${k}: ${v};`).join(' ');
    let dark = '';
    if (hue !== null && extra) {
      dark = `[data-q-theme="dark"] { --bg-elev: ${o(0.2, 0.02, hue, 0.85)}; --bg-elev-2: ${o(0.24, 0.03, hue)}; --ground-bg: radial-gradient(ellipse 55% 60% at 86% 18%, ${o(0.5, 0.15, hue, 0.24)}, transparent 70%), radial-gradient(ellipse 48% 55% at 14% 84%, ${o(0.7, 0.1, (hue + 310) % 360, 0.12)}, transparent 70%), var(--night); }`;
    }
    sheet.textContent = `:root { ${extra} ${props} ${compProps} } ${dark}`;
    if (typeof renderEdgeSheet === 'function' && (edgeCount() || iconStroke !== null)) renderEdgeSheet();
    updatePickers();
    updateReport();
    push();
    updateNow();
  }

  // ---------- colour UI (grouped toggle configurator with strict category isolation) ----------
  const grid = document.getElementById('q-picks');
  const report = document.getElementById('q-report');
  const anchor = document.getElementById('q-anchor');
  const picks = {};
  const hexTags = {};
  const gradToggles = {};
  let source = 'Official Querent';
  const manual = new Set();

  const COLOR_GROUPS = [
    {
      id: 'buttons',
      title: 'Primary buttons',
      desc: 'Action button fill, optional gradient blend, hover highlight, border, and label text',
      open: true,
      dots: ['--col-btn-bg', '--col-btn-grad', '--col-btn-hover', '--col-btn-txt'],
      items: [
        { key: '--col-btn-bg', name: 'Primary button fill', desc: 'Main fill color for primary action buttons only' },
        { key: '--col-btn-grad', name: 'Button gradient', desc: 'Optional second stop blended across primary buttons', gradFlag: 'btn' },
        { key: '--col-btn-hover', name: 'Button highlight', desc: 'Hover and active fill color on primary buttons' },
        { key: '--col-btn-txt', name: 'Button text', desc: 'Label and icon color inside primary buttons' },
        { key: '--col-btn-dark-bg', name: 'Button on dark', desc: 'Primary button fill on dark slabs and footers' },
        { key: '--col-btn-line', name: 'Button border', desc: 'Outline stroke around light-surface buttons' },
      ],
    },
    {
      id: 'light-surface',
      title: 'Light background and text',
      desc: 'Light canvas surfaces paired side by side with the reading text drawn on them',
      open: true,
      dots: ['--col-bg-light', '--col-bg-light-elev', '--col-txt-light', '--col-txt-light-dim'],
      preview: 'light',
      pair: [
        {
          title: 'Light background',
          tag: 'Surface layer',
          items: [
            { key: '--col-bg-light', name: 'Page background', desc: 'Main light canvas behind page sections' },
            { key: '--col-bg-light-elev', name: 'Elevated surface', desc: 'White fields, nav dropdowns, and raised inner blocks' },
            { key: '--col-bg-light-well', name: 'Subtle well', desc: 'Recessed containers and soft section dividers' },
          ],
        },
        {
          title: 'Text on light',
          tag: 'Connected text layer',
          items: [
            { key: '--col-txt-light', name: 'Primary text', desc: 'Headlines and main reading copy on light' },
            { key: '--col-txt-light-dim', name: 'Secondary text', desc: 'Supporting paragraphs and subheadings' },
            { key: '--col-txt-light-mute', name: 'Muted text', desc: 'Placeholders, hints, and small captions' },
          ],
        },
      ],
    },
    {
      id: 'dark-surface',
      title: 'Dark background and text',
      desc: 'Dark band surfaces paired side by side with the light text layers drawn on them',
      open: true,
      dots: ['--col-bg-dark', '--col-bg-dark-elev', '--col-txt-dark', '--col-txt-dark-dim'],
      preview: 'dark',
      pair: [
        {
          title: 'Dark background',
          tag: 'Surface layer',
          items: [
            { key: '--col-bg-dark', name: 'Dark band ground', desc: 'Inverted slabs, FAQ band, and footer base' },
            { key: '--col-bg-dark-elev', name: 'Dark elevated surface', desc: 'Raised dark containers and inner panels' },
          ],
        },
        {
          title: 'Text on dark',
          tag: 'Connected text layer',
          items: [
            { key: '--col-txt-dark', name: 'Primary text', desc: 'Headlines and main copy on dark bands' },
            { key: '--col-txt-dark-dim', name: 'Secondary text', desc: 'Links and body copy on dark bands' },
            { key: '--col-txt-dark-mute', name: 'Muted text', desc: 'Footnotes and metadata on dark bands' },
          ],
        },
      ],
    },
    {
      id: 'header-text',
      title: 'Header, accent text and text gradients',
      desc: 'Navigation wordmark, emphasized headings, gradient text, and marker highlights',
      open: true,
      dots: ['--col-nav-brand', '--col-txt-accent-light', '--col-txt-grad-end', '--col-txt-mark'],
      pair: [
        {
          title: 'Header and accent text',
          tag: 'Navigation and emphasis',
          items: [
            { key: '--col-nav-brand', name: 'Header brand wordmark', desc: 'Querent logo text and menu icon in top bar' },
            { key: '--col-nav-link', name: 'Navigation links', desc: 'Default link text inside the top navigation' },
            { key: '--col-nav-active', name: 'Navigation active state', desc: 'Hovered and active nav link text and underline' },
            { key: '--col-txt-accent-light', name: 'Accent text on light', desc: 'Typed hero phrase, process titles, and light accents' },
            { key: '--col-txt-accent-dark', name: 'Accent text on dark', desc: 'Highlighted headlines and stats on dark bands' },
          ],
        },
        {
          title: 'Text gradients and highlights',
          tag: 'Gradient fill and sweep',
          items: [
            { key: '--col-txt-grad-start', name: 'Text gradient start', desc: 'Leading color for gradient headlines and underlines' },
            { key: '--col-txt-grad-end', name: 'Text gradient end', desc: 'Trailing color for gradient headlines and underlines' },
            { key: '--col-txt-mark', name: 'Marker highlight wash', desc: 'Animated highlight sweep behind emphasized words' },
          ],
        },
      ],
    },
    {
      id: 'cards',
      title: 'Cards and card gradients',
      desc: 'Main fill color and gradient tone for light panels and dark feature cards',
      open: true,
      dots: ['--col-card-light', '--col-card-light-grad', '--col-card-dark', '--col-card-dark-grad'],
      pair: [
        {
          title: 'Light card',
          tag: 'Panel fill and glow',
          preview: 'card-light',
          items: [
            { key: '--col-card-light', name: 'Light card main color', desc: 'Base fill tint for light panels and cards' },
            { key: '--col-card-light-grad', name: 'Light card gradient', desc: 'Soft radial accent wash across light cards' },
          ],
        },
        {
          title: 'Dark card',
          tag: 'Panel fill and fade',
          preview: 'card-dark',
          items: [
            { key: '--col-card-dark', name: 'Dark card main color', desc: 'Top base fill for dark feature cards' },
            { key: '--col-card-dark-grad', name: 'Dark card gradient', desc: 'Deep bottom gradient fade on dark cards' },
            { key: '--col-card-dark-glow', name: 'Dark card radial glow', desc: 'Top-corner ambient accent light on dark cards' },
          ],
        },
      ],
    },
    {
      id: 'bg-gradients',
      title: 'Background gradients and shading',
      desc: 'Hero split slab gradient, dark section fades, and drifting ambient mesh shading',
      open: false,
      dots: ['--col-bg-slab-start', '--col-bg-slab-end', '--col-bg-shade-1', '--col-bg-shade-2'],
      pair: [
        {
          title: 'Section and slab gradients',
          tag: 'Band backgrounds',
          items: [
            { key: '--col-bg-slab-start', name: 'Hero slab gradient start', desc: 'Left color stop of the hero metrics slab' },
            { key: '--col-bg-slab-end', name: 'Hero slab gradient end', desc: 'Right color stop of the hero metrics slab' },
            { key: '--col-bg-dark-grad-end', name: 'Dark slab bottom fade', desc: 'Lower gradient stop on dark showcase bands' },
            { key: '--col-bg-light-wash', name: 'Light section wash', desc: 'Soft lower tint on process and CTA sections' },
          ],
        },
        {
          title: 'Ambient background shading',
          tag: 'Drifting mesh glows',
          items: [
            { key: '--col-bg-shade-1', name: 'Primary ambient shade', desc: 'Main radial glow across hero and dark bands' },
            { key: '--col-bg-shade-2', name: 'Secondary ambient shade', desc: 'Partner radial glow across page backgrounds' },
            { key: '--col-bg-shade-3', name: 'Soft highlight shade', desc: 'Light ice glow and subtle dark-band hairlines' },
          ],
        },
      ],
    },
    {
      id: 'pills',
      title: 'Pills, chips and tags',
      desc: 'FAQ question chips, calendar dates, booking selectors, and service fit tags',
      open: false,
      dots: ['--col-pill-bg', '--col-pill-active-bg', '--col-pill-grad', '--col-pill-txt'],
      items: [
        { key: '--col-pill-bg', name: 'Pill fill (idle)', desc: 'Background fill for unselected chips and tags' },
        { key: '--col-pill-active-bg', name: 'Pill active fill', desc: 'Selected fill for active chips, dates, and tags' },
        { key: '--col-pill-grad', name: 'Pill gradient', desc: 'Optional second stop blended across active pills', gradFlag: 'pill' },
        { key: '--col-pill-txt', name: 'Pill text', desc: 'Label color inside unselected chips and tags' },
        { key: '--col-pill-active-txt', name: 'Pill active text', desc: 'Label color inside selected pills and dates' },
        { key: '--col-pill-hover-line', name: 'Pill border and hover', desc: 'Border and hover accent around chips and tags' },
      ],
    },
    {
      id: 'stages',
      title: 'Loading and progress stages',
      desc: 'Timeline bars, tab loading sweeps, complexity meters, typing dots, and shimmers',
      open: false,
      dots: ['--col-stage-fill', '--col-stage-fill-dark', '--col-stage-grad', '--col-stage-pulse'],
      items: [
        { key: '--col-stage-fill', name: 'Stage fill on light', desc: 'Active phase bars and complexity meters on light' },
        { key: '--col-stage-fill-dark', name: 'Stage fill on dark', desc: 'Tab loading underline and slide progress on dark' },
        { key: '--col-stage-grad', name: 'Stage gradient', desc: 'Optional second stop across active progress bars', gradFlag: 'stage' },
        { key: '--col-stage-pulse', name: 'Typing and live pulse', desc: 'Chat typing dots, blinking carets, and live dots' },
        { key: '--col-stage-shimmer', name: 'Skeleton shimmer', desc: 'Loading placeholder sweep tint on booking forms' },
      ],
    },
    {
      id: 'shadows',
      title: 'Shadows and elevation shading',
      desc: 'Drop shadow tints and focus halos separated from button and card fills',
      open: false,
      dots: ['--col-shadow-light', '--col-shadow-dark', '--col-shadow-btn', '--col-shadow-focus'],
      items: [
        { key: '--col-shadow-light', name: 'Card and panel shadow', desc: 'Drop shadow tint under light cards and header' },
        { key: '--col-shadow-dark', name: 'Dark surface shadow', desc: 'Deep elevation shadow under dark panels' },
        { key: '--col-shadow-btn', name: 'Button shadow', desc: 'Drop shadow tint beneath primary CTA buttons' },
        { key: '--col-shadow-focus', name: 'Focus ring and halo', desc: 'Keyboard focus outlines and active field rings' },
      ],
    },
    {
      id: 'status-marks',
      title: 'Status and brand marks',
      desc: 'Semantic status indicators paired with independent logo mark facet colors',
      open: false,
      dots: ['--col-status-ok', '--col-status-warn', '--col-mark-primary', '--col-mark-secondary'],
      pair: [
        {
          title: 'Status indicators',
          tag: 'Feedback states',
          items: [
            { key: '--col-status-ok', name: 'Success', desc: 'Completed and verified status dots' },
            { key: '--col-status-warn', name: 'Warning', desc: 'Pending and attention indicators' },
            { key: '--col-status-err', name: 'Error', desc: 'Validation and failure alerts' },
          ],
        },
        {
          title: 'Brand marks',
          tag: 'Logo and favicon facets',
          items: [
            { key: '--col-mark-primary', name: 'Logo primary facet', desc: 'Main facet of the Querent mark and favicon' },
            { key: '--col-mark-secondary', name: 'Logo secondary facet', desc: 'Accent facet of the Querent mark' },
            { key: '--col-mark-ring', name: 'Logo inner ring', desc: 'Inner Q ring of the flat logo mark' },
          ],
        },
      ],
    },
  ];

  const getGradFlag = (f) => (f === 'btn' ? btnGradOn : (f === 'pill' ? pillGradOn : stageGradOn));
  const setGradFlag = (f, val) => {
    if (f === 'btn') btnGradOn = val;
    else if (f === 'pill') pillGradOn = val;
    else if (f === 'stage') stageGradOn = val;
  };
  const groupKeys = (g) => (g.pair ? g.pair.flatMap((col) => col.items.map((it) => it.key)) : g.items.map((it) => it.key));
  const groupRefs = [];

  function makePickerRow(item) {
    const label = document.createElement('label');
    label.className = 'q-pick';
    const input = document.createElement('input');
    input.type = 'color';
    input.value = OFFICIAL[item.key].toLowerCase();
    input.setAttribute('aria-label', item.name + ': ' + item.desc);
    const info = document.createElement('span');
    info.className = 'q-pick__label';
    const b = document.createElement('b');
    b.textContent = item.name;
    const desc = document.createElement('span');
    desc.textContent = item.desc;
    info.append(b, desc);
    const hx = document.createElement('span');
    hx.className = 'q-pick__hex';
    hx.textContent = OFFICIAL[item.key].toUpperCase();
    const onPick = () => {
      state[item.key] = input.value;
      manual.add(item.key);
      if (item.gradFlag) {
        setGradFlag(item.gradFlag, true);
        if (gradToggles[item.gradFlag]) gradToggles[item.gradFlag].checked = true;
      }
      render();
    };
    input.addEventListener('input', onPick);
    input.addEventListener('change', onPick);
    label.append(input, info);
    if (item.gradFlag) {
      const tog = document.createElement('label');
      tog.className = 'q-pick__toggle';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = getGradFlag(item.gradFlag);
      cb.setAttribute('aria-label', 'Enable ' + item.name.toLowerCase());
      cb.addEventListener('click', (e) => e.stopPropagation());
      cb.addEventListener('change', () => {
        setGradFlag(item.gradFlag, cb.checked);
        if (cb.checked) manual.add(item.key);
        else manual.delete(item.key);
        render();
      });
      tog.addEventListener('click', (e) => e.stopPropagation());
      tog.append(cb, document.createTextNode('On'));
      gradToggles[item.gradFlag] = cb;
      label.append(tog);
    }
    label.append(hx);
    picks[item.key] = input;
    hexTags[item.key] = hx;
    return label;
  }

  function makePreviewStrip(kind) {
    if (kind === 'light') {
      const box = document.createElement('div');
      box.className = 'q-cprev q-cprev--light';
      box.innerHTML =
        '<span class="q-cprev__h">Primary headline</span>' +
        '<span class="q-cprev__p">Secondary body copy</span>' +
        '<span class="q-cprev__m">Muted hint</span>';
      return box;
    }
    if (kind === 'dark') {
      const box = document.createElement('div');
      box.className = 'q-cprev q-cprev--dark';
      box.innerHTML =
        '<span class="q-cprev__h">Primary headline</span>' +
        '<span class="q-cprev__p">Secondary body copy</span>' +
        '<span class="q-cprev__m">Muted label</span>';
      return box;
    }
    if (kind === 'card-light') {
      const box = document.createElement('div');
      box.className = 'q-cprev-card q-cprev-card--light';
      box.innerHTML = '<b>Light card preview</b><span>Main color + top radial gradient</span>';
      return box;
    }
    if (kind === 'card-dark') {
      const box = document.createElement('div');
      box.className = 'q-cprev-card q-cprev-card--dark';
      box.innerHTML = '<b>Dark card preview</b><span>Main color + deep gradient fade</span>';
      return box;
    }
    return null;
  }

  if (grid) {
    COLOR_GROUPS.forEach((g) => {
      const det = document.createElement('details');
      det.className = 'q-cgrp';
      det.dataset.colorGroup = g.id;
      if (g.open) det.open = true;

      const sum = document.createElement('summary');
      sum.className = 'q-cgrp__head';

      const left = document.createElement('span');
      left.className = 'q-cgrp__left';
      left.innerHTML = '<svg class="q-cgrp__chev" viewBox="0 0 24 24" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>';
      const meta = document.createElement('span');
      meta.className = 'q-cgrp__meta';
      const title = document.createElement('span');
      title.className = 'q-cgrp__title';
      title.textContent = g.title;
      const desc = document.createElement('span');
      desc.className = 'q-cgrp__desc';
      desc.textContent = g.desc;
      meta.append(title, desc);
      left.append(meta);

      const right = document.createElement('span');
      right.className = 'q-cgrp__right';
      const dots = document.createElement('span');
      dots.className = 'q-cgrp__dots';
      dots.setAttribute('aria-hidden', 'true');
      const dotEls = g.dots.map((k) => {
        const dot = document.createElement('i');
        dot.style.background = OFFICIAL[k];
        dots.appendChild(dot);
        return { key: k, el: dot };
      });
      const resetG = document.createElement('button');
      resetG.type = 'button';
      resetG.className = 'q-cgrp__reset';
      resetG.textContent = 'Reset';
      resetG.hidden = true;
      resetG.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const keys = groupKeys(g);
        keys.forEach((k) => {
          delete state[k];
          manual.delete(k);
        });
        if (g.id === 'buttons') { btnGradOn = false; if (gradToggles.btn) gradToggles.btn.checked = false; }
        if (g.id === 'pills') { pillGradOn = false; if (gradToggles.pill) gradToggles.pill.checked = false; }
        if (g.id === 'stages') { stageGradOn = false; if (gradToggles.stage) gradToggles.stage.checked = false; }
        render();
      });
      right.append(dots, resetG);
      sum.append(left, right);

      const body = document.createElement('div');
      body.className = 'q-cgrp__body';
      if (g.preview) {
        const stripEl = makePreviewStrip(g.preview);
        if (stripEl) body.appendChild(stripEl);
      }
      if (g.pair) {
        const pair = document.createElement('div');
        pair.className = 'q-cpair';
        g.pair.forEach((col) => {
          const box = document.createElement('div');
          box.className = 'q-ccol';
          const head = document.createElement('div');
          head.className = 'q-ccol__head';
          const ct = document.createElement('span');
          ct.className = 'q-ccol__title';
          ct.textContent = col.title;
          const tg = document.createElement('span');
          tg.className = 'q-ccol__tag';
          tg.textContent = col.tag;
          head.append(ct, tg);
          box.appendChild(head);
          if (col.preview) {
            const cprev = makePreviewStrip(col.preview);
            if (cprev) box.appendChild(cprev);
          }
          const list = document.createElement('div');
          list.className = 'q-ccol__list';
          col.items.forEach((it) => list.appendChild(makePickerRow(it)));
          box.appendChild(list);
          pair.appendChild(box);
        });
        body.appendChild(pair);
      } else {
        const row = document.createElement('div');
        row.className = 'q-pick-grid';
        g.items.forEach((it) => row.appendChild(makePickerRow(it)));
        body.appendChild(row);
      }

      det.append(sum, body);
      grid.appendChild(det);
      groupRefs.push({ id: g.id, keys: groupKeys(g), dotEls, resetBtn: resetG, det });
    });

    document.querySelectorAll('[data-color-toggle-all]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const open = btn.dataset.colorToggleAll === 'open';
        groupRefs.forEach((r) => { r.det.open = open; });
      });
    });
  }

  const current = (n) => state[n] || OFFICIAL[n];
  function updatePickers() {
    NAMES.forEach((n) => {
      const val = current(n);
      if (picks[n]) picks[n].value = val.toLowerCase();
      if (hexTags[n]) hexTags[n].textContent = val.toUpperCase();
    });
    if (gradToggles.btn) gradToggles.btn.checked = btnGradOn;
    if (gradToggles.pill) gradToggles.pill.checked = pillGradOn;
    if (gradToggles.stage) gradToggles.stage.checked = stageGradOn;
    groupRefs.forEach((r) => {
      r.dotEls.forEach((d) => { d.el.style.background = current(d.key); });
      const edited = r.keys.some((k) => manual.has(k)) ||
        (r.id === 'buttons' && btnGradOn) ||
        (r.id === 'pills' && pillGradOn) ||
        (r.id === 'stages' && stageGradOn);
      r.resetBtn.hidden = !edited;
    });
  }
  function updateReport() {
    if (!report) return;
    const c = (n) => fromHex(current(n));
    const rows = [
      ['Primary text on light', c('--col-txt-light'), c('--col-bg-light'), 4.5],
      ['Secondary text on light', c('--col-txt-light-dim'), c('--col-bg-light'), 4.5],
      ['Muted text on light', c('--col-txt-light-mute'), c('--col-bg-light'), 3],
      ['Button text on button', c('--col-btn-txt'), c('--col-btn-bg'), 4.5],
      ['Primary text on dark', c('--col-txt-dark'), c('--col-bg-dark'), 4.5],
      ['Accent on dark', c('--col-txt-accent-dark'), c('--col-bg-dark'), 4.5],
    ];
    report.innerHTML = '';
    rows.forEach(([name, a, b, min]) => {
      const r = ratio(a, b), ok = r >= min;
      [name, r.toFixed(1) + ':1', ok ? 'pass ' + min : 'below ' + min].forEach((t, i) => {
        const s = document.createElement('span');
        if (i && !ok) s.className = 'is-fail';
        s.textContent = t;
        report.appendChild(s);
      });
    });
  }
  const presets = document.querySelectorAll('.q-preset:not([data-type-preset]):not([data-shape-preset])');
  const official = document.querySelector('[data-preset="official"]');
  const unpress = (except) => document.querySelectorAll('.q-preset:not([data-type-preset]):not([data-shape-preset])').forEach((b) => b.setAttribute('aria-pressed', String(b === except)));
  function applyAnchor(hx, name) { Object.keys(state).forEach((k) => delete state[k]); manual.clear(); currentAnchorHex = hx; source = name; Object.assign(state, derive(hx)); render(); }
  function clearColorState() {
    Object.keys(state).forEach((k) => delete state[k]);
    manual.clear();
    btnGradOn = false;
    pillGradOn = false;
    stageGradOn = false;
    currentAnchorHex = null;
    source = 'Official Querent';
    calTints = null;
    extra = '';
    hue = null;
    sheet.textContent = '';
    if (anchor) anchor.value = '#2563eb';
    unpress(official);
    updatePickers();
    updateReport();
  }
  function reset() {
    clearColorState();
    push();
    updateNow();
  }
  // Mini palette on each preset: page, highlight, accent, button, partner.
  const strip = (cols) => cols.map((c) => '<i style="background:' + c + '"></i>').join('');
  const preview = (hx) => { const e = extra, hh = hue; const d = derive(hx); extra = e; hue = hh; return [d['--col-bg-light'], d['--col-bg-shade-3'], d['--col-bg-shade-1'], d['--col-btn-bg'], d['--col-bg-shade-2']]; };
  presets.forEach((b) => {
    const sw = b.querySelector('.q-preset__sw');
    if (b === official) {
      if (sw) sw.innerHTML = strip([OFFICIAL['--col-bg-light'], OFFICIAL['--col-bg-shade-3'], OFFICIAL['--col-bg-shade-1'], OFFICIAL['--col-btn-bg'], OFFICIAL['--col-bg-shade-2']]);
      return;
    }
    const hx = hex(rgb(0.58, 0.19, Number(b.dataset.anchorH)));
    if (sw) sw.innerHTML = strip(preview(hx));
    b.addEventListener('click', () => { unpress(b); if (anchor) anchor.value = hx; applyAnchor(hx, (b.dataset.name || b.textContent.trim() || 'Custom') + ' anchor'); });
  });
  if (official) official.addEventListener('click', reset);
  if (anchor) anchor.addEventListener('input', () => { unpress(null); applyAnchor(anchor.value, 'Custom anchor'); });
  document.querySelectorAll('[data-color-reset]').forEach((b) => b.addEventListener('click', reset));
  updateReport();

  // ---------- custom palettes: one primary colour in, full set out, then fine tune ----------
  const presetRow = official && official.parentElement;
  const STORE_KEY = 'q-custom-palettes';
  const readSaved = () => {
    try { return JSON.parse(localStorage.getItem(STORE_KEY) || '[]').filter((p) => p && typeof p.name === 'string' && /^#[0-9a-f]{6}$/i.test(p.hex)); } catch { return []; }
  };
  function addSaved(p) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'q-preset';
    b.dataset.custom = p.name;
    b.setAttribute('aria-pressed', 'false');
    const sw = document.createElement('span');
    sw.className = 'q-preset__sw';
    sw.innerHTML = strip(preview(p.hex));
    const label = document.createElement('span');
    label.className = 'q-preset__name';
    label.textContent = p.name;
    b.append(sw, label);
    b.addEventListener('click', () => { unpress(b); if (anchor) anchor.value = p.hex; applyAnchor(p.hex, p.name); });
    presetRow.insertBefore(b, presetRow.querySelector('[data-custom-new]'));
    return b;
  }
  if (presetRow) {
    const make = document.createElement('button');
    make.type = 'button';
    make.className = 'q-preset';
    make.dataset.customNew = '';
    make.innerHTML = '<span class="q-preset__name">Customize</span>';
    presetRow.appendChild(make);
    readSaved().forEach(addSaved);

    const dlg = document.createElement('dialog');
    dlg.setAttribute('aria-labelledby', 'q-custom-title');
    dlg.style.cssText = 'width:min(360px,calc(100vw - 32px));padding:24px;border:1px solid var(--line-strong,#ccc);border-radius:var(--r-card,16px);background:var(--bg-elev,#fff);color:var(--ink,#111)';
    dlg.innerHTML = '<form method="dialog" style="display:grid;gap:16px">' +
      '<h3 id="q-custom-title" style="margin:0">Custom palette</h3>' +
      '<label style="display:grid;gap:6px">Primary colour<input type="color" name="hex" value="#2563eb" style="width:100%;height:44px"></label>' +
      '<label style="display:grid;gap:6px">Palette name<input type="text" name="title" required maxlength="24" style="min-height:44px;padding:0 12px"></label>' +
      '<div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" class="q-btn q-btn--ghost q-btn--sm" data-cancel>Cancel</button><button type="submit" class="q-btn q-btn--primary q-btn--sm">Generate</button></div></form>';
    document.body.appendChild(dlg);
    const form = dlg.querySelector('form');
    make.addEventListener('click', () => { form.reset(); dlg.showModal(); });
    dlg.querySelector('[data-cancel]').addEventListener('click', () => dlg.close());
    dlg.addEventListener('keydown', (e) => { if (e.key === 'Escape') e.stopPropagation(); });
    form.addEventListener('submit', () => {
      const p = { name: form.elements.title.value.trim() || 'Custom', hex: form.elements.hex.value };
      const saved = readSaved().filter((x) => x.name !== p.name).concat(p);
      try { localStorage.setItem(STORE_KEY, JSON.stringify(saved)); } catch { /* ignore */ }
      presetRow.querySelectorAll('[data-custom]').forEach((x) => { if (x.dataset.custom === p.name) x.remove(); });
      const b = addSaved(p);
      unpress(b);
      if (anchor) anchor.value = p.hex;
      applyAnchor(p.hex, p.name);
    });
  }

  // ---------- logo variant switcher ----------
  const LOGO_LABELS = {
    flat: 'Flat mark',
    line: 'Line mark',
    wordmark: 'Wordmark',
    monogram: 'Monogram',
    icon: 'Icon only',
    lockup: 'Lockup',
    stacked: 'Stacked',
  };
  let logoVariant = 'flat';
  const logoOpts = document.querySelectorAll('.q-logo-opt[data-logo]');
  function setLogoVariant(v, silent) {
    logoVariant = Object.prototype.hasOwnProperty.call(LOGO_LABELS, v) ? v : 'flat';
    logoOpts.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.logo === logoVariant)));
    if (!silent) {
      syncLogo();
      updateNow();
    }
  }
  logoOpts.forEach((b) => b.addEventListener('click', () => setLogoVariant(b.dataset.logo)));

  // ---------- current selection summary (top of the page) ----------
  const nowSw = document.getElementById('now-swatches');
  const nowPal = document.getElementById('now-palette');
  const nowOther = document.getElementById('now-other');
  const nowLogo = document.getElementById('now-logo');
  const nowTypePreset = document.getElementById('now-type-preset');
  const nowShape = document.getElementById('now-shape');
  function updateNow() {
    if (nowSw) nowSw.innerHTML = strip(['--col-bg-light', '--col-txt-light', '--col-bg-shade-1', '--col-btn-bg', '--col-bg-shade-3', '--col-bg-shade-2'].map(current));
    if (nowPal) nowPal.textContent = manual.size && source === 'Official Querent' ? 'Official with edits' : source;
    if (nowLogo) nowLogo.textContent = LOGO_LABELS[logoVariant] || 'Flat mark';
    if (nowOther) {
      const parts = [];
      if (manual.size) parts.push(manual.size + (manual.size === 1 ? ' colour edit' : ' colour edits'));
      const n = edgeCount() + (iconStroke !== null ? 1 : 0);
      if (n) parts.push(n + (n === 1 ? ' shape edit' : ' shape edits'));
      const t = Object.keys(typeVars).length;
      if (t) parts.push(t + (t === 1 ? ' type edit' : ' type edits'));
      nowOther.textContent = parts.length ? parts.join(', ') : 'None';
    }
    if (nowTypePreset) {
      nowTypePreset.textContent = typePreset === 'custom' ? 'Custom' : (TYPE_PRESETS[typePreset] ? TYPE_PRESETS[typePreset].label : 'Sleek');
    }
    if (nowShape) {
      nowShape.textContent = shapePreset === 'custom' ? 'Custom' : (SHAPE_PRESETS[shapePreset] ? SHAPE_PRESETS[shapePreset].label : 'Default');
    }
    ROLES.forEach((role) => {
      const el = document.getElementById('now-' + role);
      const s = sel[role];
      if (!el || !s || !FONTS[role][Number(s.value)]) return;
      const [name, , fb] = FONTS[role][Number(s.value)];
      el.textContent = name;
      el.style.fontFamily = "'" + name + "', " + fb;
    });
  }
  document.querySelectorAll('[data-jump]').forEach((b) => b.addEventListener('click', () => {
    const target = document.getElementById(b.dataset.jump);
    if (!target) return;
    const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
    const focus = document.getElementById(b.dataset.focus);
    if (focus) setTimeout(() => { const f = focus.matches('input,select,button') ? focus : focus.querySelector('input'); if (f) f.focus({ preventScroll: true }); }, calm ? 0 : 600);
  }));

  // ---------- fonts & typography (curated 2-font pool, Google Fonts only) ----------
  const FONTS = {
    display: [
      ['Bricolage Grotesque', '400;500;600;700;800', 'sans-serif'],
      ['Instrument Serif', '400', 'serif'],
      ['Syne', '400;500;600;700;800', 'sans-serif'],
      ['Fraunces', '400;500;600;700;800', 'serif'],
      ['Archivo', '400;500;600;700;800', 'sans-serif'],
      ['Newsreader', '400;500;600;700', 'serif'],
    ],
    body: [
      ['Source Sans 3', '400;500;600;700', 'sans-serif'],
      ['IBM Plex Sans', '400;500;600;700', 'sans-serif'],
      ['Work Sans', '400;500;600;700;800', 'sans-serif'],
      ['Lora', '400;500;600;700', 'serif'],
      ['Public Sans', '400;500;600;700;800', 'sans-serif'],
      ['Manrope', '400;500;600;700;800', 'sans-serif'],
    ],
  };
  const TYPE_PRESETS = {
    sleek: { label: 'Sleek', display: 'Bricolage Grotesque', body: 'Source Sans 3' },
    editorial: { label: 'Editorial', display: 'Instrument Serif', body: 'IBM Plex Sans' },
    stylized: { label: 'Stylized', display: 'Syne', body: 'Work Sans' },
    classic: { label: 'Classic', display: 'Fraunces', body: 'Lora' },
    technical: { label: 'Technical', display: 'Archivo', body: 'Public Sans' },
    studio: { label: 'Studio', display: 'Newsreader', body: 'Manrope' },
  };
  const fsheet = document.createElement('style');
  fsheet.id = 'q-tweak-type';
  document.head.appendChild(fsheet);
  const loaded = new Set();
  const load = (name, weights) => {
    if (loaded.has(name)) return;
    loaded.add(name);
    const enc = encodeURIComponent(name).replace(/%20/g, '+');
    if (document.head.querySelector('link[href*="' + enc + '"]')) return;
    const l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=' + enc + ':wght@' + weights + '&display=swap';
    document.head.appendChild(l);
  };
  load(FONTS.display[0][0], FONTS.display[0][1]);
  load(FONTS.body[0][0], FONTS.body[0][1]);

  const sel = {};
  const ROLES = ['display', 'body'];
  let typePreset = 'sleek';
  const typePresetBtns = document.querySelectorAll('#q-type-presets [data-type-preset]');
  const typeVars = {};
  const SITE_TYPE_VARS = ['--t-size-head', '--t-size-body', '--t-align', '--t-pad-top', '--t-pad-bottom', '--t-pad-left', '--t-leading', '--t-tracking'];

  function syncTypePresetButtons() {
    typePresetBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.typePreset === typePreset)));
  }
  function detectTypePreset() {
    const dName = sel.display ? FONTS.display[Number(sel.display.value)][0] : FONTS.display[0][0];
    const bName = sel.body ? FONTS.body[Number(sel.body.value)][0] : FONTS.body[0][0];
    const hit = Object.keys(TYPE_PRESETS).find((k) => TYPE_PRESETS[k].display === dName && TYPE_PRESETS[k].body === bName);
    typePreset = hit || 'custom';
    syncTypePresetButtons();
  }

  ROLES.forEach((role) => {
    const el = document.getElementById('q-font-' + role);
    if (!el) return;
    sel[role] = el;
    FONTS[role].forEach(([n], i) => {
      const op = document.createElement('option');
      op.value = String(i);
      op.textContent = i === 0 ? n + ' (default)' : n;
      el.appendChild(op);
    });
    el.addEventListener('change', () => {
      detectTypePreset();
      applyFonts();
    });
  });

  typePresetBtns.forEach((b) => {
    b.addEventListener('click', () => {
      const key = b.dataset.typePreset;
      const p = TYPE_PRESETS[key];
      if (!p) return;
      const dIdx = FONTS.display.findIndex(([n]) => n === p.display);
      const bIdx = FONTS.body.findIndex(([n]) => n === p.body);
      if (sel.display && dIdx >= 0) sel.display.value = String(dIdx);
      if (sel.body && bIdx >= 0) sel.body.value = String(bIdx);
      typePreset = key;
      syncTypePresetButtons();
      applyFonts();
    });
  });

  // Populate numeric & currency typography specimens dynamically (zero static mock currency in HTML).
  const typeNum = document.getElementById('q-type-num');
  if (typeNum) typeNum.textContent = '148,420';
  const typeCur = document.getElementById('q-type-cur');
  if (typeCur) typeCur.textContent = '$42,500';

  function renderTypeSheet() {
    const parts = [];
    ROLES.forEach((role) => {
      if (!sel[role] || Number(sel[role].value) === 0) return;
      const [n, w, fb] = FONTS[role][Number(sel[role].value)];
      load(n, w);
      parts.push('--font-' + role + ": '" + n + "', " + fb + ';');
      if (role === 'body') parts.push("--font-sans: '" + n + "', " + fb + ';');
    });
    Object.keys(typeVars).forEach((k) => {
      parts.push(k + ': ' + typeVars[k] + ';');
    });
    fsheet.textContent = parts.length ? ':root { ' + parts.join(' ') + ' }' : '';
  }
  function applyFonts() {
    renderTypeSheet();
    push();
    updateNow();
  }

  // ---------- typography modal controls ----------
  function setCtlOutput(el, text) {
    if (!el) return;
    const out = (el.id && document.querySelector('output[for="' + el.id + '"]')) ||
      (el.parentElement && el.parentElement.querySelector('output')) ||
      (el.closest && el.closest('.q-ctl, .q-modal__field, .q-field-row, label') && el.closest('.q-ctl, .q-modal__field, .q-field-row, label').querySelector('output'));
    if (out) out.textContent = text;
  }
  const TYPE_MODAL_CTLS = [
    { id: 'qt-head-scale', css: '--t-size-head', def: '1', fmt: (v) => String(v), out: (v) => Number(v).toFixed(2).replace(/\.00$/, '') + 'x' },
    { id: 'qt-body-size', css: '--t-size-body', def: '16', fmt: (v) => v + 'px', out: (v) => v + 'px' },
    { id: 'qt-pad-top', css: '--t-pad-top', def: '0', fmt: (v) => v + 'px', out: (v) => v + 'px' },
    { id: 'qt-pad-bottom', css: '--t-pad-bottom', def: '0', fmt: (v) => v + 'px', out: (v) => v + 'px' },
    { id: 'qt-pad-left', css: '--t-pad-left', def: '0', fmt: (v) => v + 'px', out: (v) => v + 'px' },
    { id: 'qt-leading', css: '--t-leading', def: '1.6', fmt: (v) => String(v), out: (v) => String(v) },
    { id: 'qt-tracking', css: '--t-tracking', def: '0', fmt: (v) => v + 'em', out: (v) => v + 'em' },
    { id: 'qt-clamp', css: '--t-card-clamp', def: '0', fmt: (v) => (v === '0' || v === 'none' || v === '' ? 'none' : String(v)), out: (v) => (v === '0' || v === 'none' || v === '' ? 'Off' : v + ' lines') },
  ];
  const qtDefaults = {};
  TYPE_MODAL_CTLS.forEach((cfg) => {
    const el = document.getElementById(cfg.id);
    if (!el) return;
    qtDefaults[cfg.id] = el.value !== '' ? el.value : cfg.def;
    setCtlOutput(el, cfg.out(qtDefaults[cfg.id]));
    const onChange = () => {
      if (el.value === qtDefaults[cfg.id]) delete typeVars[cfg.css];
      else typeVars[cfg.css] = cfg.fmt(el.value);
      setCtlOutput(el, cfg.out(el.value));
      applyFonts();
    };
    el.addEventListener('input', onChange);
    el.addEventListener('change', onChange);
  });
  const alignBtns = document.querySelectorAll('#q-modal-type [data-t-align], [data-t-align]');
  let alignDefault = 'left';
  alignBtns.forEach((b) => {
    if (b.getAttribute('aria-pressed') === 'true') alignDefault = b.dataset.tAlign || 'left';
  });
  alignBtns.forEach((b) => {
    b.addEventListener('click', () => {
      const v = b.dataset.tAlign || 'left';
      alignBtns.forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      if (v === alignDefault) delete typeVars['--t-align'];
      else typeVars['--t-align'] = v;
      applyFonts();
    });
  });

  function clearTypeState() {
    Object.values(sel).forEach((el) => { el.value = '0'; });
    typePreset = 'sleek';
    syncTypePresetButtons();
    Object.keys(typeVars).forEach((k) => delete typeVars[k]);
    TYPE_MODAL_CTLS.forEach((cfg) => {
      const el = document.getElementById(cfg.id);
      if (!el) return;
      el.value = qtDefaults[cfg.id];
      setCtlOutput(el, cfg.out(el.value));
    });
    alignBtns.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.tAlign || 'left') === alignDefault)));
    renderTypeSheet();
  }
  document.querySelectorAll('[data-type-reset]').forEach((b) => b.addEventListener('click', () => {
    Object.keys(typeVars).forEach((k) => delete typeVars[k]);
    TYPE_MODAL_CTLS.forEach((cfg) => {
      const el = document.getElementById(cfg.id);
      if (!el) return;
      el.value = qtDefaults[cfg.id];
      setCtlOutput(el, cfg.out(el.value));
    });
    alignBtns.forEach((b2) => b2.setAttribute('aria-pressed', String((b2.dataset.tAlign || 'left') === alignDefault)));
    applyFonts();
  }));
  document.querySelectorAll('[data-font-reset]').forEach((b) => b.addEventListener('click', () => {
    Object.values(sel).forEach((el) => { el.value = '0'; });
    typePreset = 'sleek';
    syncTypePresetButtons();
    applyFonts();
  }));

  // ---------- edge & shape language tweaker: 8 categorized facets, presets, geometry, blur, surface & icon stroke ----------
  const FAMS = {
    'main-card': { label: 'Main card', r: '--r-main-card', alias: 'card', aliasR: '--r-card', k: 0, pad: 32, gap: 16, padMax: 64, edge: 0, blur: 0 },
    'side-card': { label: 'Side card', r: '--r-side-card', alias: 'panel', aliasR: '--r-panel', k: 1, pad: 24, gap: 16, padMax: 64, edge: 0, blur: 0 },
    'accent-card': { label: 'Accent card', r: '--r-accent-card', k: 1, pad: 24, gap: 16, padMax: 64, edge: 0, blur: 0 },
    toast: { label: 'Toast', r: '--r-toast', k: 1, pad: 14, gap: 12, padMax: 48, edge: 0, blur: 0 },
    field: { label: 'Field', r: '--r-input', k: 1, pad: 16, gap: 16, padMax: 64, edge: 0, blur: 0 },
    button: { label: 'Button', r: '--r-btn', pill: true, k: 1, pad: 12, gap: 12, padMax: 64, edge: 0, blur: 0 },
    chip: { label: 'Chip', r: '--r-chip', pill: true, k: 0, pad: 8, gap: 12, padMax: 64, edge: 0, blur: 0 },
    slab: { label: 'Slab', r: '--r-band', k: 0, pad: 96, gap: 16, padMax: 160, edge: 0, blur: 0 },
  };
  const SHAPE_PRESETS = {
    default: { label: 'Default', stroke: null, edge: null },
    sharp: {
      label: 'Sharp',
      stroke: 1.5,
      edge: {
        'main-card': { r: 0, k: 0, blur: 0 }, 'side-card': { r: 0, k: 0, blur: 0 }, 'accent-card': { r: 0, k: 0, blur: 0 },
        toast: { r: 0, k: 0, blur: 0 }, field: { r: 0, k: 0 }, button: { r: 0, k: 0 }, chip: { r: 0, k: 0 }, slab: { r: 0, k: 0 },
      },
    },
    sleek: {
      label: 'Sleek',
      stroke: 1.5,
      edge: {
        'main-card': { r: 14, k: 0.6, blur: 20 }, 'side-card': { r: 18, k: 0.6, blur: 20 }, 'accent-card': { r: 16, k: 0.6, blur: 20 },
        toast: { r: 14, k: 0.8, blur: 35 }, field: { r: 14, k: 0.6 }, button: { r: 14, k: 0.6 }, chip: { r: 14, k: 0.6 }, slab: { r: 18, k: 0.6 },
      },
    },
    soft: {
      label: 'Soft',
      stroke: 2,
      edge: {
        'main-card': { r: 28, k: 1.4, blur: 35 }, 'side-card': { r: 34, k: 1.4, blur: 35 }, 'accent-card': { r: 30, k: 1.4, blur: 35 },
        toast: { r: 24, k: 1.2, blur: 50 }, field: { r: 28, k: 1.4 }, button: { r: 32, k: 1.4 }, chip: { r: 32, k: 1.4 }, slab: { r: 36, k: 1.4 },
      },
    },
    pill: {
      label: 'Pill',
      stroke: 2,
      edge: {
        'main-card': { r: 40, k: 1, blur: 25 }, 'side-card': { r: 44, k: 1, blur: 25 }, 'accent-card': { r: 40, k: 1, blur: 25 },
        toast: { r: 40, k: 1, blur: 40 }, field: { r: 40, k: 1 }, button: { r: 40, k: 1 }, chip: { r: 40, k: 1 }, slab: { r: 48, k: 1 },
      },
    },
  };
  const OUT = { default: 'Default', accent: 'Accent', highlight: 'Highlight', ink: 'Ink', navy: 'Navy' };
  const OUTTOK = { accent: '--col-bg-shade-1', highlight: '--col-bg-shade-3', ink: '--col-txt-light', navy: '--col-btn-bg' };
  const SURF = { default: 'Default', raised: 'Raised', tint: 'Subtle tint', accent: 'Accent', dark: 'Dark' };
  const edge = {};
  let famSel = 'main-card';
  let shapePreset = 'default';
  let iconStroke = null;
  const edgeSheet = document.createElement('style');
  edgeSheet.id = 'q-tweak-edge';
  document.head.appendChild(edgeSheet);
  Object.keys(FAMS).forEach((f) => {
    const F = FAMS[f];
    const cs = getComputedStyle(document.documentElement);
    let v = parseFloat(cs.getPropertyValue(F.r));
    if (Number.isNaN(v) && F.aliasR) v = parseFloat(cs.getPropertyValue(F.aliasR));
    F.dr = F.pill ? 40 : (Number.isNaN(v) ? (F.alias === 'panel' ? 30 : 22) : v);
  });
  const shapePresetBtns = document.querySelectorAll('#q-shape-presets [data-shape-preset]');
  const strokeEl = document.getElementById('qs-icon-stroke');
  const strokeDefault = strokeEl && strokeEl.value !== '' ? strokeEl.value : '1.75';
  if (strokeEl) {
    setCtlOutput(strokeEl, strokeEl.value + 'px');
    strokeEl.addEventListener('input', () => {
      const v = Number(strokeEl.value);
      iconStroke = String(v) === String(Number(strokeDefault)) && edgeCount() === 0 ? null : v;
      setCtlOutput(strokeEl, v + 'px');
      shapePreset = edgeCount() === 0 && iconStroke === null ? 'default' : 'custom';
      syncShapePresetButtons();
      applyEdge();
    });
  }
  function syncShapePresetButtons() {
    shapePresetBtns.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.shapePreset === shapePreset)));
  }
  function surfValue(kind) {
    if (kind === 'raised') return current('--col-bg-light-elev');
    if (kind === 'tint') return current('--col-card-light');
    if (kind === 'accent') return current('--col-bg-shade-1');
    if (kind === 'dark') return current('--col-bg-dark');
    return '';
  }
  function emitFacet(v, f, alias, prop, val) {
    v[prop + f] = val;
    if (alias) v[prop + alias] = val;
  }
  function edgeVars() {
    const v = {};
    Object.keys(edge).forEach((f) => {
      const e = edge[f], F = FAMS[f];
      if (!F) return;
      if (e.r !== undefined) {
        const rv = F.pill && e.r >= 40 ? '999px' : e.r + 'px';
        v[F.r] = rv;
        if (F.aliasR) v[F.aliasR] = rv;
      }
      if (e.edge !== undefined) emitFacet(v, f, F.alias, '--edge-', e.edge + 'px');
      if (e.k !== undefined) emitFacet(v, f, F.alias, '--shk-', String(e.k));
      if (e.bw !== undefined) emitFacet(v, f, F.alias, '--bw-', e.bw + 'px');
      if (e.bc && e.bc !== 'default') emitFacet(v, f, F.alias, '--bc-', current(OUTTOK[e.bc]));
      if (e.blur !== undefined) emitFacet(v, f, F.alias, '--blur-', (e.blur * 0.24).toFixed(1) + 'px');
      if (e.surf && e.surf !== 'default') emitFacet(v, f, F.alias, '--surf-', surfValue(e.surf));
      if (e.pad !== undefined) emitFacet(v, f, F.alias, '--pad-', e.pad + 'px');
      if (e.gap !== undefined) emitFacet(v, f, F.alias, '--gap-', e.gap + 'px');
    });
    if (iconStroke !== null) v['--icon-stroke'] = String(iconStroke);
    return v;
  }
  const edgeCount = () => Object.values(edge).reduce((n, e) => n + Object.keys(e).length, 0);
  function renderEdgeSheet() {
    const v = edgeVars();
    edgeSheet.textContent = Object.keys(v).length ? ':root { ' + Object.entries(v).map(([k, x]) => k + ': ' + x + ';').join(' ') + ' }' : '';
  }
  function applyEdge() {
    renderEdgeSheet();
    push();
    updateNow();
  }
  const famBoxes = Array.from(document.querySelectorAll('[data-q-fam], #q-fam, #q-modal-fam'));
  function syncFamButtons() {
    famBoxes.forEach((box) => {
      box.querySelectorAll('.q-chip[data-fam]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.fam === famSel)));
    });
  }
  function buildFamButtons(container) {
    container.innerHTML = '';
    Object.keys(FAMS).forEach((f) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'q-chip';
      b.dataset.fam = f;
      b.textContent = FAMS[f].label;
      b.setAttribute('aria-pressed', String(f === famSel));
      b.addEventListener('click', () => {
        famSel = f;
        syncFamButtons();
        renderCtls();
      });
      container.appendChild(b);
    });
  }
  function renderCtls() {
    const box = document.getElementById('q-ctls');
    if (!box) return;
    const f = famSel, F = FAMS[f];
    box.innerHTML = '';
    if (!famBoxes.length) {
      const tabs = document.createElement('div');
      tabs.className = 'q-fam';
      tabs.setAttribute('role', 'group');
      tabs.setAttribute('aria-label', 'Element facet');
      buildFamButtons(tabs);
      box.appendChild(tabs);
    }
    const get = (k, d) => (edge[f] && edge[f][k] !== undefined ? edge[f][k] : d);
    const set = (k, v) => {
      (edge[f] = edge[f] || {})[k] = v;
      shapePreset = 'custom';
      syncShapePresetButtons();
      applyEdge();
    };
    const clear = (k) => {
      if (edge[f]) {
        delete edge[f][k];
        if (!Object.keys(edge[f]).length) delete edge[f];
      }
      shapePreset = edgeCount() === 0 && iconStroke === null ? 'default' : 'custom';
      syncShapePresetButtons();
      applyEdge();
      renderCtls();
    };
    const mk = (tag, cls, text) => { const x = document.createElement(tag); if (cls) x.className = cls; if (text) x.textContent = text; return x; };
    const resetBtn = (k) => { const b = mk('button', 'q-ctl__reset', 'Reset'); b.type = 'button'; b.addEventListener('click', () => clear(k)); return b; };
    const range = (label, key, min, max, step, def, fmt) => {
      const row = mk('div', 'q-ctl');
      const r = mk('input');
      r.type = 'range'; r.min = min; r.max = max; r.step = step; r.value = get(key, def); r.setAttribute('aria-label', F.label + ' ' + label);
      const o = mk('output', '', fmt(Number(r.value)));
      r.addEventListener('input', () => { o.textContent = fmt(Number(r.value)); set(key, Number(r.value)); });
      row.append(mk('span', '', label), r, o, resetBtn(key));
      box.appendChild(row);
    };
    const selectRow = (label, key, map) => {
      const row = mk('div', 'q-ctl');
      const sel2 = mk('select', 'q-select');
      sel2.setAttribute('aria-label', F.label + ' ' + label.toLowerCase());
      Object.keys(map).forEach((k) => { const op = mk('option', '', map[k]); op.value = k; sel2.appendChild(op); });
      sel2.value = get(key, 'default');
      sel2.addEventListener('change', () => { if (sel2.value === 'default') clear(key); else set(key, sel2.value); });
      row.append(mk('span', '', label), sel2, resetBtn(key));
      box.appendChild(row);
    };
    range('Corner radius', 'r', 0, F.pill ? 40 : 48, 1, F.dr, (v) => (F.pill && v >= 40 ? 'Pill' : v + 'px'));
    range('Distance from edges', 'edge', 0, 48, 1, F.edge, (v) => v + 'px');
    const sh = mk('div', 'q-ctl');
    const pre = mk('div', 'q-ctl__presets');
    [['None', 0], ['Soft', 0.6], ['Medium', 1.2], ['Strong', 2.2]].forEach(([n, v]) => {
      const b = mk('button', 'q-chip', n);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(Math.abs(get('k', F.k) - v) < 0.05));
      b.addEventListener('click', () => { set('k', v); renderCtls(); });
      pre.appendChild(b);
    });
    sh.append(mk('span', '', 'Shadow'), pre);
    box.appendChild(sh);
    range('Shadow strength', 'k', 0, 3, 0.1, F.k, (v) => v.toFixed(1));
    range('Outline width', 'bw', 0, 4, 0.5, 1, (v) => v + 'px');
    selectRow('Outline colour', 'bc', OUT);
    range('Blur', 'blur', 0, 100, 1, F.blur, (v) => v + '%');
    selectRow('Coloration', 'surf', SURF);
    range('Inner padding', 'pad', 0, F.padMax, 1, F.pad, (v) => v + 'px');
    range('Outer spacing', 'gap', 0, 64, 1, F.gap, (v) => v + 'px');
  }
  famBoxes.forEach((box) => buildFamButtons(box));
  renderCtls();
  shapePresetBtns.forEach((b) => {
    b.addEventListener('click', () => {
      const key = b.dataset.shapePreset;
      const p = SHAPE_PRESETS[key];
      if (!p) return;
      Object.keys(edge).forEach((k) => delete edge[k]);
      if (p.edge) {
        Object.keys(p.edge).forEach((fam) => { edge[fam] = Object.assign({}, p.edge[fam]); });
      }
      iconStroke = p.stroke;
      if (strokeEl) {
        strokeEl.value = p.stroke !== null ? String(p.stroke) : strokeDefault;
        setCtlOutput(strokeEl, strokeEl.value + 'px');
      }
      shapePreset = key;
      syncShapePresetButtons();
      renderCtls();
      applyEdge();
    });
  });
  function clearShapeState() {
    Object.keys(edge).forEach((k) => delete edge[k]);
    iconStroke = null;
    if (strokeEl) {
      strokeEl.value = strokeDefault;
      setCtlOutput(strokeEl, strokeEl.value + 'px');
    }
    famSel = 'main-card';
    shapePreset = 'default';
    syncFamButtons();
    syncShapePresetButtons();
    renderEdgeSheet();
    renderCtls();
  }
  function resetEdges() {
    clearShapeState();
    push();
    updateNow();
  }
  document.querySelectorAll('[data-shape-reset]').forEach((b) => b.addEventListener('click', resetEdges));

  // ---------- live preview bridge: send the current tweaks to the website frames ----------
  // The site accepts only whitelisted custom properties and Google Fonts family names from this origin.
  const SITE_ORIGIN = (location.port === '8134') ? 'http://localhost:5173' : location.origin;
  const frames = () => Array.from(document.querySelectorAll('iframe[data-site]'));
  frames().forEach((f) => {
    f.dataset.origin = SITE_ORIGIN;
    f.dataset.src = SITE_ORIGIN + '/';
  });
  if (location.port !== '8134') {
    const kindEl = document.querySelector('.ds-link__kind');
    const linkEl = document.querySelector('.ds-link__url');
    const copyBtn = document.querySelector('.ds-link__copy');
    const dsUrl = location.origin + '/design-system/preview/index.html';
    if (kindEl) kindEl.textContent = 'Live';
    if (linkEl) { linkEl.textContent = location.host; linkEl.setAttribute('href', dsUrl); }
    if (copyBtn) copyBtn.dataset.copy = dsUrl;
  }
  let lastMsg = { type: 'qs-ds-reset' };
  const parseExtra = () => {
    const out = {};
    for (const m of extra.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)) out[m[1]] = m[2].trim();
    return out;
  };
  function siteVars() {
    const v = {};
    // Forward every edited semantic role token directly to its isolated site variable (zero primitive cross-bleed).
    NAMES.forEach((n) => {
      if (state[n]) v[n] = state[n];
    });
    const live = computedOverrides();
    Object.keys(live).forEach((n) => { v[n] = live[n]; });
    Object.assign(v, edgeVars());
    SITE_TYPE_VARS.forEach((n) => { if (typeVars[n] !== undefined) v[n] = typeVars[n]; });
    if (calTints) Object.assign(v, calTints);
    if (state['--col-pill-active-bg']) v['--cal-brand'] = state['--col-pill-active-bg'];
    if (state['--col-btn-bg']) v['--cal-brand-emphasis'] = state['--col-btn-bg'];
    const comp = parseExtra();
    ['--field-line', '--btn-dark-line', '--accent-soft', '--line', '--line-strong'].forEach((n) => { if (comp[n] && !v[n]) v[n] = comp[n]; });
    return v;
  }
  function siteFonts() {
    const f = {};
    ROLES.forEach((role) => { if (sel[role] && Number(sel[role].value) !== 0) f[role] = FONTS[role][Number(sel[role].value)][0]; });
    return f;
  }
  // Tweakable copy of the flat mark (same paths as the official vector) + concept variants. Used for ribbon logo, #now-logo-preview, hub and favicon.
  const MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none"><path d="M90 15.8 Q100 10 110 15.8 L168 49.2 Q178 55 178 66.5 L178 133.5 Q178 145 168 150.8 L110 184.2 Q100 190 90 184.2 L32 150.8 Q22 145 22 133.5 L22 66.5 Q22 55 32 49.2 Z" fill="@A"/><path d="M90 15.8 Q100 10 110 15.8 L168 49.2 Q178 55 178 66.5 L178 133.5 Q178 145 168 150.8 L138 168 L32 49.2 Z" fill="@C"/><path d="M93 48 Q100 44 107 48 L143 69 Q150 73 150 81 L150 119 Q150 127 143 131 L107 152 Q100 156 93 152 L57 131 Q50 127 50 119 L50 81 Q50 73 57 69 Z" fill="@K"/><path d="M95 74.8 Q100 72 105 74.8 L121 84.2 Q126 87 126 92.5 L126 107.5 Q126 113 121 115.8 L105 125.2 Q100 128 95 125.2 L79 115.8 Q74 113 74 107.5 L74 92.5 Q74 87 79 84.2 Z" fill="@A"/><path d="M95 74.8 Q100 72 105 74.8 L121 84.2 Q126 87 126 92.5 L126 107.5 L79 84.2 Z" fill="@C"/><path d="M118 117 L127 111 L152 141 L141 148 Z" fill="@C"/><path d="M108 123 L120 116 L146 149 Q148 152 144 152 L127 152 Q124 152 122 149 Z" fill="@K"/></svg>';
  const LOGO_SVGS = {
    flat: MARK,
    line: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><polygon points="50,6 91,27.5 91,72.5 50,94 9,72.5 9,27.5" stroke="@C" stroke-width="6" stroke-linejoin="round"/><text x="50" y="68" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="52" fill="@A">Q</text></svg>',
    wordmark: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 230 60" fill="none"><text x="4" y="46" font-family="system-ui,sans-serif" font-weight="700" font-size="46" letter-spacing="-1.5" fill="@T"><tspan fill="@C">Q</tspan>uerent</text></svg>',
    monogram: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none"><rect width="64" height="64" rx="16" fill="@A"/><text x="32" y="47" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="800" font-size="44" fill="#FFFFFF">Q</text></svg>',
    icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" fill="none"><polygon points="50,6 91,27.5 91,72.5 50,94 9,72.5 9,27.5" stroke="@A" stroke-width="7" stroke-linejoin="round" stroke-linecap="round"/><circle cx="48" cy="47" r="17" stroke="@C" stroke-width="7"/><path d="M52 52 L69 71" stroke="@C" stroke-width="7" stroke-linecap="round"/></svg>',
    lockup: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 64" fill="none"><polygon points="32,4 58,18 58,46 32,60 6,46 6,18" stroke="@A" stroke-width="4.5" stroke-linejoin="round"/><circle cx="31" cy="30" r="10.5" stroke="@C" stroke-width="4.5"/><path d="M33 33 L44 45" stroke="@C" stroke-width="4.5" stroke-linecap="round"/><text x="72" y="45" font-family="system-ui,sans-serif" font-weight="700" font-size="42" letter-spacing="-1.5" fill="@T">Querent</text></svg>',
    stacked: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120" fill="none"><polygon points="80,6 112,24 112,60 80,78 48,60 48,24" stroke="@A" stroke-width="5.5" stroke-linejoin="round"/><circle cx="78" cy="40" r="13" stroke="@C" stroke-width="5.5"/><path d="M81 44 L95 59" stroke="@C" stroke-width="5.5" stroke-linecap="round"/><text x="80" y="109" text-anchor="middle" font-family="system-ui,sans-serif" font-weight="700" font-size="30" letter-spacing="-1" fill="@T">Querent</text></svg>',
  };
  const renderLogoSvg = (variant, a, c, k, onDark) => (LOGO_SVGS[variant] || MARK)
    .replace(/@A/g, a)
    .replace(/@C/g, c)
    .replace(/@K/g, k)
    .replace(/@T/g, onDark ? '#ECEEF2' : k);

  function syncLogo() {
    const tweaked = Boolean(state['--col-mark-primary'] || state['--col-mark-secondary'] || state['--col-mark-ring']);
    const a = current('--col-mark-primary'), c = current('--col-mark-secondary'), k = current('--col-mark-ring');
    const flatUri = tweaked ? 'data:image/svg+xml,' + encodeURIComponent(renderLogoSvg('flat', a, c, k, true)) : null;
    const active = logoVariant !== 'flat' || tweaked;
    const ribbonSvg = renderLogoSvg(logoVariant, a, c, k, true);
    const ribbonUri = active ? 'data:image/svg+xml,' + encodeURIComponent(ribbonSvg) : null;
    const iconUri = active ? 'data:image/svg+xml,' + encodeURIComponent(renderLogoSvg(logoVariant, a, c, k, false)) : null;

    document.querySelectorAll('.ds-ribbon__logo').forEach((im) => {
      if (ribbonUri) {
        if (!im.hasAttribute('data-q-logo')) im.setAttribute('data-q-logo', im.getAttribute('src'));
        im.setAttribute('src', ribbonUri);
      } else if (im.hasAttribute('data-q-logo')) {
        im.setAttribute('src', im.getAttribute('data-q-logo'));
        im.removeAttribute('data-q-logo');
      }
    });
    document.querySelectorAll('img[src*="querent-logo-flat.svg"], img[data-q-logo]').forEach((im) => {
      if (im.classList.contains('ds-ribbon__logo')) return;
      if (flatUri) {
        if (!im.hasAttribute('data-q-logo')) im.setAttribute('data-q-logo', im.getAttribute('src'));
        im.setAttribute('src', flatUri);
      } else if (im.hasAttribute('data-q-logo')) {
        im.setAttribute('src', im.getAttribute('data-q-logo'));
        im.removeAttribute('data-q-logo');
      }
    });
    document.querySelectorAll('link[rel~="icon"]').forEach((l) => {
      if (iconUri) {
        if (!l.hasAttribute('data-q-icon')) l.setAttribute('data-q-icon', l.getAttribute('href'));
        l.setAttribute('href', iconUri);
      } else if (l.hasAttribute('data-q-icon')) {
        l.setAttribute('href', l.getAttribute('data-q-icon'));
        l.removeAttribute('data-q-icon');
      }
    });
    const nowLogoPreview = document.getElementById('now-logo-preview');
    if (nowLogoPreview) {
      if (nowLogoPreview.tagName === 'IMG') {
        nowLogoPreview.setAttribute('src', 'data:image/svg+xml,' + encodeURIComponent(ribbonSvg));
      } else {
        nowLogoPreview.innerHTML = ribbonSvg;
      }
    }
  }
  const WORKING_KEY = 'qs-ds-working-v1';
  let isBooting = true;
  function saveWorkingState() {
    if (isBooting) return;
    try {
      const hasAny = Object.keys(state).length > 0 || btnGradOn || pillGradOn || stageGradOn ||
        logoVariant !== 'flat' || edgeCount() > 0 || iconStroke !== null ||
        Object.keys(typeVars).length > 0 ||
        (sel.display && Number(sel.display.value) !== 0) ||
        (sel.body && Number(sel.body.value) !== 0);
      if (!hasAny) {
        window.sessionStorage.removeItem(WORKING_KEY);
        window.sessionStorage.removeItem('qs-ds-tweaks');
        return;
      }
      const snap = captureSelection(source, '');
      snap.id = activeSavedId || null;
      window.sessionStorage.setItem(WORKING_KEY, JSON.stringify(snap));
    } catch { /* ignore */ }
  }
  function push() {
    syncLogo();
    const vars = siteVars(), fonts = siteFonts();
    lastMsg = Object.keys(vars).length || Object.keys(fonts).length ? { type: 'qs-ds-tweak', vars, fonts } : { type: 'qs-ds-reset' };
    saveWorkingState();
    frames().forEach((f) => { if (f.dataset.ready && f.contentWindow) f.contentWindow.postMessage(lastMsg, f.dataset.origin); });
    if (embedded && parentOrigin) window.parent.postMessage(lastMsg, parentOrigin);
  }
  syncLogo();
  updateNow();

  // When this page is shown inside the website (slide-in), the left arrow hands control back to it.
  const embedded = window.parent !== window;
  const parentOrigin = (() => {
    try { if (location.ancestorOrigins && location.ancestorOrigins[0]) return location.ancestorOrigins[0]; } catch { /* ignore */ }
    try { return new URL(document.referrer).origin; } catch { return ''; }
  })();
  window.addEventListener('message', (e) => {
    if (!e.data || e.data.type !== 'qs-ds-ready') return;
    frames().forEach((f) => {
      if (e.source === f.contentWindow && e.origin === f.dataset.origin) { f.dataset.ready = '1'; f.contentWindow.postMessage(lastMsg, f.dataset.origin); }
    });
  });

  // ---------- modals (#q-modal-type & #q-modal-shape) ----------
  const body = document.body;
  let prevOverflow = '';
  const openModals = () => Array.from(document.querySelectorAll('#q-modal-type:not([hidden]), #q-modal-shape:not([hidden]), .q-modal:not([hidden]), .ds-modal:not([hidden])'));
  function openModal(modal, opener) {
    if (!modal) return;
    openModals().forEach((m) => { if (m !== modal) closeModal(m, true); });
    modal._opener = opener || document.activeElement;
    modal.hidden = false;
    modal.setAttribute('aria-hidden', 'false');
    if (!body.classList.contains('is-modal-open')) {
      prevOverflow = body.style.overflow;
      body.classList.add('is-modal-open');
      body.style.overflow = 'hidden';
    }
    const focusTarget = modal.querySelector('[data-modal-close], input, select, button, [tabindex]:not([tabindex="-1"])') || modal;
    if (focusTarget === modal && !modal.hasAttribute('tabindex')) modal.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll: true });
  }
  function closeModal(modal, skipFocus) {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    if (!openModals().length) {
      body.classList.remove('is-modal-open');
      body.style.overflow = prevOverflow;
    }
    if (!skipFocus && modal._opener && typeof modal._opener.focus === 'function' && body.contains(modal._opener)) {
      modal._opener.focus({ preventScroll: true });
    }
    modal._opener = null;
  }
  document.querySelectorAll('[data-modal-open]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = String(btn.dataset.modalOpen || '').replace(/^#/, '');
      const modal = id ? document.getElementById(id) : null;
      openModal(modal, btn);
    });
  });
  document.querySelectorAll('[data-modal-close]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = String(btn.dataset.modalClose || '').replace(/^#/, '');
      const modal = (id && document.getElementById(id)) || btn.closest('#q-modal-type, #q-modal-shape, .q-modal, .ds-modal, [role="dialog"]');
      closeModal(modal);
    });
  });
  ['q-modal-type', 'q-modal-shape'].forEach((id) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    modal.addEventListener('click', (e) => {
      if (e.target === modal || e.target.hasAttribute('data-modal-backdrop') || e.target.classList.contains('q-modal__backdrop') || e.target.classList.contains('ds-modal__backdrop')) {
        closeModal(modal);
      }
    });
  });

  // ---------- edge arrows: slide to the website (left) and open the mobile preview (right) ----------
  const site = document.getElementById('ds-site');
  const side = document.getElementById('ds-side');
  const loadFrame = (root) => { const f = root && root.querySelector('iframe[data-site]'); if (f && !f.getAttribute('src')) f.setAttribute('src', f.dataset.src); };
  const setSite = (open) => {
    if (!site) return;
    if (open) loadFrame(site);
    body.classList.toggle('is-site-open', open);
    site.inert = !open;
    site.setAttribute('aria-hidden', String(!open));
    if (!open) { updatePickers(); updateNow(); }
    const target = open ? site.querySelector('[data-site-close]') : document.querySelector('[data-site-open]');
    if (target) target.focus({ preventScroll: true });
  };
  const setSide = (open) => {
    if (!side) return;
    if (open) loadFrame(side);
    body.classList.toggle('is-side-open', open);
    side.inert = !open;
    side.setAttribute('aria-hidden', String(!open));
    const t = document.querySelector('[data-side-toggle]');
    if (t) t.setAttribute('aria-expanded', String(open));
  };
  if (site) site.inert = true;
  if (side) side.inert = true;
  document.querySelectorAll('[data-site-open]').forEach((b) => b.addEventListener('click', () => {
    if (embedded && parentOrigin) window.parent.postMessage({ type: 'qs-ds-close' }, parentOrigin);
    else setSite(true);
  }));
  document.querySelectorAll('[data-site-close]').forEach((b) => b.addEventListener('click', () => setSite(false)));
  document.querySelectorAll('[data-side-toggle]').forEach((b) => b.addEventListener('click', () => setSide(!body.classList.contains('is-side-open'))));
  // Return to default: official logo, palette, typography, and shape here and in every frame.
  function resetAll() {
    clearColorState();
    setLogoVariant('flat', true);
    clearTypeState();
    clearShapeState();
    push();
    updateNow();
  }
  document.querySelectorAll('[data-reset-all]').forEach((b) => b.addEventListener('click', () => { resetAll(); setMenu(false); }));
  // Edge menu: opens beside the arrow, closes on selection, Esc and outside click.
  const menuEl = document.getElementById('ds-menu-site');
  const menuBtn = document.querySelector('[data-menu-toggle]');
  function setMenu(open) {
    if (!menuEl || !menuBtn) return;
    menuEl.classList.toggle('is-open', open);
    menuEl.inert = !open;
    menuBtn.setAttribute('aria-expanded', String(open));
  }
  if (menuBtn) menuBtn.addEventListener('click', () => setMenu(!menuEl.classList.contains('is-open')));
  document.addEventListener('click', (e) => { if (menuEl && menuEl.classList.contains('is-open') && !e.target.closest('.ds-menu, [data-menu-toggle]')) setMenu(false); });
  // Page switcher inside each preview. The new page asks for the current tweaks when it loads.
  document.querySelectorAll('.ds-bar, .ds-menu').forEach((bar) => {
    const root = bar.closest('.ds-site, .ds-side');
    bar.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => {
      const f = root.querySelector('iframe[data-site]');
      if (!f) return;
      bar.querySelectorAll('[data-page]').forEach((x) => x.setAttribute('aria-pressed', String(x === b)));
      f.dataset.ready = '';
      f.setAttribute('src', f.dataset.origin + b.dataset.page);
      if (bar.classList.contains('ds-menu')) setMenu(false);
    }));
  });
  // Page reports (what each frame resolved after applying the tweaks), kept on the frame for checking.
  window.addEventListener('message', (e) => {
    if (!e.data) return;
    if (e.data.type === 'qs-ds-default' && embedded && e.source === window.parent && e.origin === parentOrigin) { resetAll(); return; }
    if (e.data.type !== 'qs-ds-applied') return;
    frames().forEach((f) => { if (e.source === f.contentWindow && e.origin === f.dataset.origin) f.dataset.report = JSON.stringify(e.data); });
  });
  // ---------- saved full-selection presets (shared via /api/staging-presets on Vercel, localStorage fallback) ----------
  const SAVED_KEY = 'q-saved-selections-v1';
  const PRESET_API = (location.port === '8134' ? SITE_ORIGIN : location.origin) + '/api/staging-presets';
  const savedWrap = document.getElementById('ds-saved');
  const savedGrid = document.getElementById('ds-saved-grid');
  const savedStatus = document.getElementById('ds-saved-status');
  const savePresetBtn = document.getElementById('ds-save-preset');
  const copyLinkBtn = document.getElementById('ds-copy-link');
  let savedPresets = [];
  let isSharedStorage = false;
  let activeSavedId = null;

  function readLocalSelections() {
    try {
      const arr = JSON.parse(localStorage.getItem(SAVED_KEY) || '[]');
      return Array.isArray(arr) ? arr.filter((p) => p && typeof p.name === 'string') : [];
    } catch { return []; }
  }
  function writeLocalSelections(list) {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(list)); } catch { /* ignore */ }
  }

  function captureSelection(name, author) {
    const displayName = sel.display && FONTS.display[Number(sel.display.value)] ? FONTS.display[Number(sel.display.value)][0] : FONTS.display[0][0];
    const bodyName = sel.body && FONTS.body[Number(sel.body.value)] ? FONTS.body[Number(sel.body.value)][0] : FONTS.body[0][0];
    const colorState = {};
    NAMES.forEach((k) => { if (state[k]) colorState[k] = state[k]; });
    const edgeCopy = {};
    Object.keys(edge).forEach((f) => { edgeCopy[f] = Object.assign({}, edge[f]); });
    return {
      id: 'p-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6),
      name: String(name || 'Untitled preset').trim().slice(0, 40),
      author: String(author || '').trim().slice(0, 32),
      updatedAt: new Date().toISOString(),
      swatches: ['--col-bg-light', '--col-txt-light', '--col-bg-shade-1', '--col-btn-bg', '--col-bg-shade-3', '--col-bg-shade-2'].map(current),
      logo: logoVariant,
      color: {
        source,
        anchorHex: currentAnchorHex,
        state: colorState,
        manual: Array.from(manual),
        btnGradOn,
        pillGradOn,
        stageGradOn,
      },
      typography: {
        preset: typePreset,
        display: displayName,
        body: bodyName,
        vars: Object.assign({}, typeVars),
      },
      shape: {
        preset: shapePreset,
        iconStroke,
        edge: edgeCopy,
      },
    };
  }

  function applySelection(p) {
    if (!p || typeof p !== 'object') return;
    // 1. Logo
    setLogoVariant(p.logo || 'flat', true);

    // 2. Color
    clearColorState();
    const col = p.color && typeof p.color === 'object' ? p.color : {};
    if (col.anchorHex && /^#[0-9a-f]{6}$/i.test(col.anchorHex)) {
      currentAnchorHex = col.anchorHex;
      Object.assign(state, derive(col.anchorHex));
      if (anchor) anchor.value = col.anchorHex;
    }
    if (col.state && typeof col.state === 'object') {
      Object.keys(col.state).forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(OFFICIAL, k) && /^#[0-9a-f]{6}$/i.test(col.state[k])) {
          state[k] = col.state[k];
        }
      });
    }
    if (Array.isArray(col.manual)) {
      col.manual.forEach((k) => { if (Object.prototype.hasOwnProperty.call(OFFICIAL, k)) manual.add(k); });
    }
    btnGradOn = Boolean(col.btnGradOn);
    pillGradOn = Boolean(col.pillGradOn);
    stageGradOn = Boolean(col.stageGradOn);
    source = col.source || p.name || 'Official Querent';
    unpress(source === 'Official Querent' && !manual.size && !btnGradOn && !pillGradOn && !stageGradOn ? official : null);

    // 3. Typography
    clearTypeState();
    const ty = p.typography && typeof p.typography === 'object' ? p.typography : {};
    if (ty.display && sel.display) {
      const dIdx = FONTS.display.findIndex(([n]) => n === ty.display);
      if (dIdx >= 0) sel.display.value = String(dIdx);
    }
    if (ty.body && sel.body) {
      const bIdx = FONTS.body.findIndex(([n]) => n === ty.body);
      if (bIdx >= 0) sel.body.value = String(bIdx);
    }
    detectTypePreset();
    if (ty.vars && typeof ty.vars === 'object') {
      Object.keys(ty.vars).forEach((k) => { typeVars[k] = ty.vars[k]; });
      TYPE_MODAL_CTLS.forEach((cfg) => {
        const el = document.getElementById(cfg.id);
        if (!el || typeVars[cfg.css] === undefined) return;
        const raw = String(typeVars[cfg.css]).replace(/(px|em)$/i, '');
        el.value = raw === 'none' ? '0' : raw;
        setCtlOutput(el, cfg.out(el.value));
      });
      if (typeVars['--t-align']) {
        alignBtns.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.tAlign || 'left') === typeVars['--t-align'])));
      }
    }
    renderTypeSheet();

    // 4. Shape
    clearShapeState();
    const sh = p.shape && typeof p.shape === 'object' ? p.shape : {};
    if (sh.edge && typeof sh.edge === 'object') {
      Object.keys(sh.edge).forEach((f) => {
        if (FAMS[f] && sh.edge[f] && typeof sh.edge[f] === 'object') edge[f] = Object.assign({}, sh.edge[f]);
      });
    }
    iconStroke = typeof sh.iconStroke === 'number' ? sh.iconStroke : null;
    if (strokeEl) {
      strokeEl.value = iconStroke !== null ? String(iconStroke) : strokeDefault;
      setCtlOutput(strokeEl, strokeEl.value + 'px');
    }
    shapePreset = sh.preset && SHAPE_PRESETS[sh.preset] ? sh.preset : (edgeCount() || iconStroke !== null ? 'custom' : 'default');
    syncShapePresetButtons();
    renderEdgeSheet();
    renderCtls();

    activeSavedId = p.id || null;
    render();
    renderSavedList();
  }

  function renderSavedList() {
    if (!savedWrap || !savedGrid) return;
    if (savedStatus) savedStatus.textContent = isSharedStorage ? 'Shared on staging' : 'Local browser';
    if (!savedPresets.length) {
      savedWrap.hidden = true;
      savedGrid.innerHTML = '';
      return;
    }
    savedWrap.hidden = false;
    savedGrid.innerHTML = '';
    savedPresets.forEach((p) => {
      const card = document.createElement('div');
      card.className = 'ds-saved__card' + (p.id && p.id === activeSavedId ? ' is-active' : '');

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-saved__apply';
      const sw = document.createElement('span');
      sw.className = 'ds-saved__sw';
      const cols = Array.isArray(p.swatches) && p.swatches.length ? p.swatches : ['#F4F4F2', '#0A0B0E', '#2563EB', '#0D1B38', '#93C5FD', '#06B6D4'];
      sw.innerHTML = strip(cols);

      const nm = document.createElement('span');
      nm.className = 'ds-saved__name';
      nm.textContent = p.name;

      const meta = document.createElement('span');
      meta.className = 'ds-saved__meta';
      const parts = [
        LOGO_LABELS[p.logo] || 'Flat mark',
        (p.typography && p.typography.display) ? p.typography.display : 'Bricolage Grotesque',
        (p.shape && p.shape.preset) ? (SHAPE_PRESETS[p.shape.preset] ? SHAPE_PRESETS[p.shape.preset].label : 'Custom') : 'Default',
      ];
      if (p.author) parts.push('by ' + p.author);
      meta.textContent = parts.join(' / ');

      btn.append(sw, nm, meta);
      btn.addEventListener('click', () => applySelection(p));

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'ds-saved__del';
      del.setAttribute('aria-label', 'Delete preset ' + p.name);
      del.textContent = '\u00D7';
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        deleteSavedPreset(p.id);
      });

      card.append(btn, del);
      savedGrid.appendChild(card);
    });
  }

  async function loadSavedPresets() {
    const local = readLocalSelections();
    savedPresets = local;
    renderSavedList();
    try {
      const res = await fetch(PRESET_API, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.shared && Array.isArray(data.presets)) {
        isSharedStorage = true;
        savedPresets = data.presets;
        renderSavedList();
      }
    } catch { /* localhost without API: stay on localStorage */ }
  }

  async function saveCurrentPreset(name, author) {
    const preset = captureSelection(name, author);
    activeSavedId = preset.id;
    try {
      const res = await fetch(PRESET_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preset),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.shared && Array.isArray(data.presets)) {
          isSharedStorage = true;
          savedPresets = data.presets;
          activeSavedId = data.preset ? data.preset.id : preset.id;
          renderSavedList();
          return;
        }
      }
    } catch { /* fall back to localStorage */ }
    const lower = preset.name.toLowerCase();
    savedPresets = [preset, ...readLocalSelections().filter((x) => String(x.name || '').toLowerCase() !== lower)].slice(0, 40);
    writeLocalSelections(savedPresets);
    renderSavedList();
  }

  async function deleteSavedPreset(id) {
    if (!id) return;
    if (activeSavedId === id) activeSavedId = null;
    if (isSharedStorage) {
      try {
        const res = await fetch(PRESET_API + '?id=' + encodeURIComponent(id), { method: 'DELETE' });
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.presets)) {
            savedPresets = data.presets;
            renderSavedList();
            return;
          }
        }
      } catch { /* ignore */ }
    }
    savedPresets = readLocalSelections().filter((x) => x.id !== id);
    writeLocalSelections(savedPresets);
    renderSavedList();
  }

  // Save full selection dialog
  if (savePresetBtn) {
    const saveDlg = document.createElement('dialog');
    saveDlg.setAttribute('aria-labelledby', 'q-save-sel-title');
    saveDlg.style.cssText = 'width:min(400px,calc(100vw - 32px));padding:24px;border:1px solid var(--line-strong,#ccc);border-radius:var(--r-card,16px);background:var(--bg-elev,#fff);color:var(--ink,#111)';
    saveDlg.innerHTML =
      '<form method="dialog" style="display:grid;gap:14px">' +
        '<h3 id="q-save-sel-title" style="margin:0;font-family:var(--font-display)">Save current selection</h3>' +
        '<p id="q-save-sel-summary" style="margin:0;font-size:13px;color:var(--ink-dim)"></p>' +
        '<label style="display:grid;gap:6px;font-size:13px;font-weight:600">Preset name<input type="text" name="name" required maxlength="40" placeholder="e.g. Executive Navy" style="min-height:42px;padding:0 12px;border:1px solid var(--line-strong,#ccc);border-radius:10px;font:inherit"></label>' +
        '<label style="display:grid;gap:6px;font-size:13px;font-weight:600">Saved by (optional)<input type="text" name="author" maxlength="32" placeholder="Your name" style="min-height:42px;padding:0 12px;border:1px solid var(--line-strong,#ccc);border-radius:10px;font:inherit"></label>' +
        '<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">' +
          '<button type="button" class="q-btn q-btn--ghost q-btn--sm" data-save-cancel>Cancel</button>' +
          '<button type="submit" class="q-btn q-btn--primary q-btn--sm">Save preset</button>' +
        '</div>' +
      '</form>';
    document.body.appendChild(saveDlg);
    const saveForm = saveDlg.querySelector('form');
    const summaryEl = saveDlg.querySelector('#q-save-sel-summary');
    savePresetBtn.addEventListener('click', () => {
      saveForm.reset();
      const snap = captureSelection('', '');
      summaryEl.textContent = 'Saves Logo (' + (LOGO_LABELS[snap.logo] || 'Flat mark') + '), Color (' + snap.color.source + '), Typography (' + snap.typography.display + '), and Shape (' + (SHAPE_PRESETS[snap.shape.preset] ? SHAPE_PRESETS[snap.shape.preset].label : 'Custom') + ').';
      saveDlg.showModal();
    });
    saveDlg.querySelector('[data-save-cancel]').addEventListener('click', () => saveDlg.close());
    saveDlg.addEventListener('keydown', (e) => { if (e.key === 'Escape') e.stopPropagation(); });
    saveForm.addEventListener('submit', () => {
      const nm = saveForm.elements.name.value.trim();
      const au = saveForm.elements.author.value.trim();
      if (nm) saveCurrentPreset(nm, au);
    });
  }

  // Shareable URL (?preset=...) for the full Current selection
  const encodePreset = (obj) => {
    const json = JSON.stringify(obj);
    const bytes = new TextEncoder().encode(json);
    let bin = '';
    bytes.forEach((b) => { bin += String.fromCharCode(b); });
    return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };
  const decodePreset = (str) => {
    const pad = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4);
    const bin = atob(pad);
    const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  };

  if (copyLinkBtn) {
    copyLinkBtn.addEventListener('click', () => {
      try {
        const snap = captureSelection(source, '');
        delete snap.id;
        delete snap.updatedAt;
        const url = new URL(location.href);
        url.searchParams.set('preset', encodePreset(snap));
        navigator.clipboard.writeText(url.toString()).then(() => {
          const orig = copyLinkBtn.textContent;
          copyLinkBtn.textContent = 'Copied';
          setTimeout(() => { copyLinkBtn.textContent = orig; }, 1600);
        }).catch(() => {});
      } catch { /* ignore */ }
    });
  }

  document.querySelectorAll('[data-reset-all]').forEach((b) => b.addEventListener('click', () => {
    activeSavedId = null;
    renderSavedList();
  }));

  // Apply ?preset=... from URL if shared; otherwise restore the active session working state (or live site tweaks).
  let restoredFromUrl = false;
  try {
    const sharedParam = new URLSearchParams(location.search).get('preset');
    if (sharedParam) {
      isBooting = false;
      applySelection(decodePreset(sharedParam));
      restoredFromUrl = true;
    }
  } catch { /* ignore invalid shared param */ }

  if (!restoredFromUrl) {
    try {
      const rawWorking = window.sessionStorage.getItem(WORKING_KEY);
      if (rawWorking) {
        const parsed = JSON.parse(rawWorking);
        if (parsed && typeof parsed === 'object') {
          isBooting = false;
          applySelection(parsed);
        }
      } else {
        // Fallback: if site tweaks exist in qs-ds-tweaks from before WORKING_KEY was saved, hydrate matching color tokens.
        const rawSite = window.sessionStorage.getItem('qs-ds-tweaks');
        if (rawSite) {
          const siteData = JSON.parse(rawSite);
          const sv = siteData && siteData.vars && typeof siteData.vars === 'object' ? siteData.vars : null;
          if (sv) {
            const hydrated = {};
            const hydratedManual = [];
            NAMES.forEach((k) => {
              if (typeof sv[k] === 'string' && /^#[0-9a-f]{6}$/i.test(sv[k])) {
                hydrated[k] = sv[k];
                hydratedManual.push(k);
              }
            });
            if (hydratedManual.length) {
              isBooting = false;
              applySelection({
                color: {
                  source: 'Official Querent',
                  state: hydrated,
                  manual: hydratedManual,
                  btnGradOn: typeof sv['--btn-bg'] === 'string' && sv['--btn-bg'].indexOf('linear-gradient') === 0,
                  pillGradOn: typeof sv['--pill-on-bg'] === 'string' && sv['--pill-on-bg'].indexOf('linear-gradient') === 0,
                  stageGradOn: typeof sv['--col-stage-fill'] === 'string' && sv['--col-stage-fill'].indexOf('linear-gradient') === 0,
                },
              });
            }
          }
        }
      }
    } catch { /* ignore */ }
  }
  isBooting = false;

  loadSavedPresets();

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const modals = openModals();
    if (modals.length) { closeModal(modals[modals.length - 1]); return; }
    if (menuEl && menuEl.classList.contains('is-open')) { setMenu(false); return; }
    if (body.classList.contains('is-site-open')) setSite(false);
    else if (body.classList.contains('is-side-open')) setSide(false);
  });
})();
