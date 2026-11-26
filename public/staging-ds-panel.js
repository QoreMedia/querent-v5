/* LOCAL-MOD LM-0002: staging-only design system panel and live preview bridge.
 *
 * <!-- STAGING-ONLY: DESIGN SYSTEM PANEL — REMOVE BEFORE MERGING/DEPLOYING TO MAIN -->
 * Delete this whole file and the matching <script src="/staging-ds-panel.js"> block
 * (marked STAGING-ONLY) in index.html, booking.html, menu.html and va.html.
 * Find everything with:  grep -rn "STAGING-ONLY" .
 * See STAGING-ONLY.md at the repo root.
 * <!-- /STAGING-ONLY -->
 *
 * The panel only renders on localhost / 127.0.0.1, hosts containing "staging",
 * Vercel preview hosts (*.vercel.app that are not in PRODUCTION_HOSTS), or when the
 * URL has ?ds-panel=1. Everywhere else it does nothing (default off).
 *
 * Flow: the edge tab sits flush at the right edge. On a fresh load it needs two clicks
 * (open the panel, then "Open"). Once the design system has been opened in this browser
 * session (sessionStorage flag), the tab opens it in one click. The design system slides in
 * over the page from the right and slides back out from its own left arrow.
 *
 * Live preview bridge: tweaks arrive by postMessage from the design-system origin only, from
 * the design-system frame or from this page's parent. A whitelist of CSS custom properties and
 * Google Fonts family names is applied to :root. Nothing else.
 */
(function () {
  'use strict';

  /* ---- STAGING-ONLY: DESIGN SYSTEM PANEL — REMOVE BEFORE MERGING/DEPLOYING TO MAIN ---- */

  // Hosted alongside the site on staging (/design-system/preview/index.html).
  // Removed before main (see STAGING-ONLY.md).
  var DESIGN_SYSTEM_URL = location.origin + '/design-system/preview/index.html';

  // Production *.vercel.app aliases that must never show the panel. Confirm and extend
  // this list with the real production hostnames (custom domains are already off by default).
  var PRODUCTION_HOSTS = ['querent-v5.vercel.app', 'querent.vercel.app'];

  function shouldShow(hostname, search) {
    hostname = String(hostname || '').toLowerCase();
    if (/(^|[?&])ds-panel=1(&|$)/.test(String(search || ''))) return true;
    if (hostname === 'localhost' || hostname === '127.0.0.1') return true;
    if (hostname.indexOf('staging') !== -1) return true;
    if (/\.vercel\.app$/.test(hostname) && PRODUCTION_HOSTS.indexOf(hostname) === -1) return true;
    return false;
  }

  // Exposed so the gate can be tested directly: __QS_DS_GATE__('example.com', '') -> false
  window.__QS_DS_GATE__ = shouldShow;

  if (!shouldShow(location.hostname, location.search)) return;

  /* ---------- live preview bridge (receives tweaks from the design system) ---------- */
  var DS_ORIGIN = location.origin;
  try { DS_ORIGIN = new URL(DESIGN_SYSTEM_URL).origin; } catch (e) { DS_ORIGIN = location.origin; }
  var ALLOWED_ORIGINS = [DS_ORIGIN, 'http://localhost:8134'];
  function isAllowedOrigin(o) { return Boolean(o) && ALLOWED_ORIGINS.indexOf(o) !== -1; }
  var replyOrigin = (function () {
    try {
      var ref = document.referrer ? new URL(document.referrer).origin : '';
      if (isAllowedOrigin(ref)) return ref;
    } catch (e) { /* ignore */ }
    return DS_ORIGIN;
  })();

  // Only these site custom properties can be set.
  var ALLOWED_VARS = [
    '--bg', '--bg-elev', '--bg-elev-2', '--ink', '--ink-dim', '--ink-mute', '--line', '--line-strong',
    '--accent-soft', '--ok', '--warn',
    '--panel-light', '--panel-light-line', '--panel-dark', '--panel-dark-line',
    '--field-line', '--pill-line', '--pill-hover-line', '--pill-on-bg', '--pill-dark-on-bg',
    '--btn-bg', '--btn-line', '--btn-hover', '--btn-dark-bg', '--btn-dark-line',
    '--p-blue', '--p-blue-d', '--p-navy', '--p-navy-d', '--p-sky',
    '--c-night', '--c-on-night', '--c-slate-400', '--c-slate-500', '--c-blue-300', '--c-blue-400', '--c-blue-600', '--c-blue-700',
    '--c-navy-900', '--c-navy-800', '--c-cyan-500', '--c-cyan-300', '--c-panel-light', '--c-panel-dark-end', '--c-panel-dark-start', '--c-canvas',
    '--c-va-accent', '--c-va-accent-2',
    '--rgb-blue-600', '--rgb-blue-300', '--rgb-blue-700', '--rgb-cyan-500', '--rgb-navy-800', '--rgb-navy-900', '--rgb-night', '--rgb-blue-400', '--rgb-cyan-300'
  ];
  // Edge families (radius, edge distance, shadow strength, outline, blur, surface, padding, spacing), icon stroke, typography settings, and Cal calendar colours.
  var FAMS = ['main-card', 'side-card', 'accent-card', 'toast', 'field', 'button', 'chip', 'slab', 'panel', 'card'];
  ['--r-main-card', '--r-side-card', '--r-accent-card', '--r-toast', '--r-panel', '--r-card', '--r-input', '--r-band', '--r-btn', '--r-chip',
    '--icon-stroke', '--t-size-head', '--t-size-body', '--t-align', '--t-pad-top', '--t-pad-bottom', '--t-pad-left', '--t-leading', '--t-tracking',
    '--cal-brand', '--cal-brand-emphasis', '--cal-bg-muted', '--cal-bg-emphasis', '--cal-border', '--cal-border-emphasis'].forEach(function (n) { ALLOWED_VARS.push(n); });
  FAMS.forEach(function (f) { ['--shk-', '--bw-', '--bc-', '--pad-', '--gap-', '--edge-', '--blur-', '--surf-'].forEach(function (p) { ALLOWED_VARS.push(p + f); }); });
  // Only these 12 curated Google Fonts families can be loaded, with the weights each one ships.
  var FONT_WEIGHTS = {
    'Bricolage Grotesque': '400;500;600;700;800',
    'Instrument Serif': '400',
    'Syne': '400;500;600;700;800',
    'Fraunces': '400;500;600;700;800',
    'Archivo': '400;500;600;700;800',
    'Newsreader': '400;500;600;700',
    'Source Sans 3': '400;500;600;700',
    'IBM Plex Sans': '400;500;600;700',
    'Work Sans': '400;500;600;700;800',
    'Lora': '400;500;600;700',
    'Public Sans': '400;500;600;700;800',
    'Manrope': '400;500;600;700;800'
  };
  var FALLBACK = { display: 'sans-serif', body: 'sans-serif' };
  var SERIF = { 'Instrument Serif': 1, 'Fraunces': 1, 'Newsreader': 1, 'Lora': 1 };
  var COLOR_FNS = ['oklch', 'rgb', 'rgba', 'radial-gradient', 'linear-gradient', 'calc'];

  function safeValue(v) {
    if (typeof v !== 'string' || v.length > 600) return false;
    if (/[;{}<>\\"'@]|url\s*\(|expression|import|javascript/i.test(v)) return false;
    if (!/^[#a-z0-9().,%\s\/+*-]+$/i.test(v)) return false;
    var fns = v.match(/[a-z-]+(?=\()/gi) || [];
    for (var i = 0; i < fns.length; i++) if (COLOR_FNS.indexOf(fns[i].toLowerCase()) === -1) return false;
    return true;
  }

  function validFor(name, v) {
    if (typeof v !== 'string') return false;
    if (/^--(r|pad|gap|bw|edge|blur)-/.test(name)) return /^\d+(\.\d+)?px$/.test(v);
    if (/^--shk-/.test(name)) return /^\d+(\.\d+)?$/.test(v);
    if (name === '--icon-stroke') { var n = parseFloat(v); return /^\d+(\.\d+)?$/.test(v) && n >= 0.5 && n <= 4; }
    if (name === '--t-size-head' || name === '--t-leading') return /^\d+(\.\d+)?$/.test(v);
    if (name === '--t-size-body' || /^--t-pad-(top|bottom|left)$/.test(name)) return /^\d+(\.\d+)?px$/.test(v);
    if (name === '--t-align') return /^(left|center|right)$/.test(v);
    if (name === '--t-tracking') return /^-?\d+(\.\d+)?em$/.test(v);
    if (/^--cal-/.test(name)) return /^#[0-9a-fA-F]{6}$/.test(v);
    return safeValue(v);
  }

  var applied = [];
  var loadedFonts = {};
  var fontStyle = null;
  var FONT_CSS =
    'body *{font-family:var(--qs-font-body,"Source Sans 3",sans-serif) !important}' +
    'h1,h1 *,h2,h2 *,h3,h3 *,h4,h4 *,h5,h5 *,h6,h6 *,.h1,.h2,.h3,.faq-title,.why-now-headline,.cta-h2,.proc2-card-title,.stat-num,.value-num,.value-key{font-family:var(--qs-font-display,"Bricolage Grotesque",sans-serif) !important}';

  // Cal.com booking embed: re-send its UI colours (it lives in an iframe, so page variables cannot reach it).
  var CAL = { '--cal-brand': '#152C5B', '--cal-brand-emphasis': '#0D1B38', '--cal-bg-muted': '#F1F5FC', '--cal-bg-emphasis': '#E6EDF9', '--cal-border': '#D5DEEE', '--cal-border-emphasis': '#B8C6E0' };
  function updateCal(vars) {
    if (typeof window.Cal !== 'function' || !document.getElementById('cal-booking')) return;
    function g(n) { var x = vars && vars[n]; return typeof x === 'string' && /^#[0-9a-fA-F]{6}$/.test(x) ? x : CAL[n]; }
    var brand = g('--cal-brand');
    try {
      window.Cal('ui', {
        theme: 'light', styles: { branding: { brandColor: brand } },
        cssVarsPerTheme: {
          light: { 'cal-brand': brand, 'cal-brand-emphasis': g('--cal-brand-emphasis'), 'cal-brand-text': '#FFFFFF', 'cal-bg': '#FFFFFF', 'cal-bg-muted': g('--cal-bg-muted'), 'cal-bg-emphasis': g('--cal-bg-emphasis'), 'cal-border': g('--cal-border'), 'cal-border-emphasis': g('--cal-border-emphasis'), 'cal-text': '#0A0B0E', 'cal-text-emphasis': '#0A0B0E', 'cal-text-muted': '#5A5F69' },
          dark: { 'cal-brand': brand }
        },
        hideEventTypeDetails: true, hideBranding: true, layout: 'month_view'
      });
    } catch (e) { /* ignore */ }
  }

  // Tweakable copy of the flat mark: same paths as the official vector, colours taken from the palette. Only used while tweaked.
  var MARK = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none"><path d="M90 15.8 Q100 10 110 15.8 L168 49.2 Q178 55 178 66.5 L178 133.5 Q178 145 168 150.8 L110 184.2 Q100 190 90 184.2 L32 150.8 Q22 145 22 133.5 L22 66.5 Q22 55 32 49.2 Z" fill="@A"/><path d="M90 15.8 Q100 10 110 15.8 L168 49.2 Q178 55 178 66.5 L178 133.5 Q178 145 168 150.8 L138 168 L32 49.2 Z" fill="@C"/><path d="M93 48 Q100 44 107 48 L143 69 Q150 73 150 81 L150 119 Q150 127 143 131 L107 152 Q100 156 93 152 L57 131 Q50 127 50 119 L50 81 Q50 73 57 69 Z" fill="@K"/><path d="M95 74.8 Q100 72 105 74.8 L121 84.2 Q126 87 126 92.5 L126 107.5 Q126 113 121 115.8 L105 125.2 Q100 128 95 125.2 L79 115.8 Q74 113 74 107.5 L74 92.5 Q74 87 79 84.2 Z" fill="@A"/><path d="M95 74.8 Q100 72 105 74.8 L121 84.2 Q126 87 126 92.5 L126 107.5 L79 84.2 Z" fill="@C"/><path d="M118 117 L127 111 L152 141 L141 148 Z" fill="@C"/><path d="M108 123 L120 116 L146 149 Q148 152 144 152 L127 152 Q124 152 122 149 Z" fill="@K"/></svg>';
  function swapLogos(cols) {
    var uri = null;
    if (cols) uri = 'data:image/svg+xml,' + encodeURIComponent(MARK.replace(/@A/g, cols.a).replace(/@C/g, cols.c).replace(/@K/g, cols.k));
    var imgs = document.querySelectorAll('img[src*="querent-logo-flat.svg"], img[data-qs-logo]');
    for (var i = 0; i < imgs.length; i++) {
      var im = imgs[i];
      if (uri) { if (!im.hasAttribute('data-qs-logo')) im.setAttribute('data-qs-logo', im.getAttribute('src')); im.setAttribute('src', uri); }
      else if (im.hasAttribute('data-qs-logo')) { im.setAttribute('src', im.getAttribute('data-qs-logo')); im.removeAttribute('data-qs-logo'); }
    }
    var links = document.querySelectorAll('link[rel~="icon"]');
    for (var j = 0; j < links.length; j++) {
      var l = links[j];
      if (uri) { if (!l.hasAttribute('data-qs-icon')) l.setAttribute('data-qs-icon', l.getAttribute('href')); l.setAttribute('type', 'image/svg+xml'); l.setAttribute('href', uri); }
      else if (l.hasAttribute('data-qs-icon')) { l.setAttribute('href', l.getAttribute('data-qs-icon')); l.removeAttribute('data-qs-icon'); }
    }
  }
  function syncMark() {
    var cs = getComputedStyle(document.documentElement), cols = { a: cs.getPropertyValue('--c-blue-700').trim(), c: cs.getPropertyValue('--c-cyan-500').trim(), k: cs.getPropertyValue('--c-night').trim() };
    var ok = applied.length && /^#[0-9a-fA-F]{6}$/.test(cols.a) && /^#[0-9a-fA-F]{6}$/.test(cols.c) && /^#[0-9a-fA-F]{6}$/.test(cols.k);
    swapLogos(ok ? cols : null);
  }

  function clearTweaks() {
    var root = document.documentElement;
    applied.forEach(function (n) { root.style.removeProperty(n); });
    applied = [];
    if (fontStyle && fontStyle.parentNode) fontStyle.parentNode.removeChild(fontStyle);
    fontStyle = null;
  }

  function loadFont(name) {
    if (loadedFonts[name] || !Object.prototype.hasOwnProperty.call(FONT_WEIGHTS, name)) return;
    loadedFonts[name] = true;
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.setAttribute('data-staging-only', 'design-system-font');
    l.href = 'https://fonts.googleapis.com/css2?family=' + encodeURIComponent(name).replace(/%20/g, '+') + ':wght@' + FONT_WEIGHTS[name] + '&display=swap';
    document.head.appendChild(l);
  }

  function applyTweaks(data) {
    clearTweaks();
    var root = document.documentElement;
    var vars = data && typeof data.vars === 'object' && data.vars ? data.vars : {};
    Object.keys(vars).forEach(function (n) {
      if (ALLOWED_VARS.indexOf(n) === -1 || !validFor(n, vars[n])) return;
      root.style.setProperty(n, vars[n]);
      applied.push(n);
    });
    var fonts = data && typeof data.fonts === 'object' && data.fonts ? data.fonts : {};
    var any = false;
    ['display', 'body'].forEach(function (role) {
      var f = fonts[role];
      if (typeof f !== 'string' || !Object.prototype.hasOwnProperty.call(FONT_WEIGHTS, f)) return;
      loadFont(f);
      var fb = SERIF[f] ? 'serif' : FALLBACK[role];
      root.style.setProperty('--qs-font-' + role, '"' + f + '", ' + fb);
      applied.push('--qs-font-' + role);
      any = true;
    });
    if (any) {
      if (!fonts.display) loadFont('Bricolage Grotesque');
      if (!fonts.body) loadFont('Source Sans 3');
      fontStyle = document.createElement('style');
      fontStyle.setAttribute('data-staging-only', 'design-system-fonts');
      fontStyle.textContent = FONT_CSS;
      document.head.appendChild(fontStyle);
    }
  }

  var isTop = window.top === window;
  var overlay = null; // the design-system frame holder (top-level pages only)

  window.addEventListener('message', function (e) {
    if (!isAllowedOrigin(e.origin)) return;
    var d = e.data;
    if (!d || typeof d !== 'object') return;
    var fromParent = !isTop && e.source === window.parent;
    var fromOverlay = isTop && overlay && overlay.frame && e.source === overlay.frame.contentWindow;
    if (!fromParent && !fromOverlay) return;
    if (fromParent) replyOrigin = e.origin;
    if (d.type === 'qs-ds-reset') { clearTweaks(); syncMark(); updateCal(null); report(); }
    else if (d.type === 'qs-ds-tweak') { applyTweaks(d); syncMark(); updateCal(applied.length ? d.vars : null); report(); }
    else if (d.type === 'qs-ds-close' && fromOverlay) overlay.set(false);
  });

  // Tell the design system what this page resolved after applying (lets it confirm every page follows the tweaks).
  function report() {
    if (isTop || !replyOrigin) return;
    setTimeout(function () {
      try {
        var cs = getComputedStyle(document.documentElement);
        var btn = document.querySelector('.btn-primary,.btn,.btn-ghost');
        var head = document.querySelector('h1,h2');
        window.parent.postMessage({
          type: 'qs-ds-applied', page: location.pathname, applied: applied.length,
          blue: cs.getPropertyValue('--c-blue-600').trim(), night: cs.getPropertyValue('--c-night').trim(), canvas: cs.getPropertyValue('--c-canvas').trim(),
          body: getComputedStyle(document.body).backgroundColor, btn: btn ? getComputedStyle(btn).backgroundColor : '',
          head: head ? getComputedStyle(head).fontFamily.slice(0, 40) : ''
        }, replyOrigin);
      } catch (e) { /* ignore */ }
    }, 700);
  }

  // Inside the design-system preview: tell it this page is ready so it can send the current tweaks.
  if (!isTop && replyOrigin) {
    try { window.parent.postMessage({ type: 'qs-ds-ready' }, replyOrigin); } catch (e) { /* ignore */ }
  }

  /* ---------- edge tab and slide-in (top-level pages only) ---------- */
  if (!isTop) return;
  if (document.getElementById('qs-ds-panel')) return;

  var FLAG = 'qs-ds-visited';
  function visited() { try { return window.sessionStorage.getItem(FLAG) === '1'; } catch (e) { return false; } }
  function markVisited() { try { window.sessionStorage.setItem(FLAG, '1'); } catch (e) { /* ignore */ } }

  var EASE = 'cubic-bezier(.22,1,.36,1)';
  var css =
    '#qs-ds-panel{position:static;font:500 13px/1.4 system-ui,-apple-system,Segoe UI,sans-serif;color:#ECEEF2}' +
    '#qs-ds-panel .qs-tab{position:fixed;top:50%;right:0;z-index:2147483000;transform:translateY(-50%);width:36px;height:72px;min-height:44px;' +
    'display:flex;align-items:center;justify-content:center;background:rgba(10,11,14,.92);color:#ECEEF2;margin:0;' +
    'border:1px solid rgba(255,255,255,.12);border-right:0;border-radius:12px 0 0 12px;cursor:pointer;padding:0;' +
    '-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);transition:right .4s ' + EASE + ',background .2s ease}' +
    '#qs-ds-panel .qs-tab:hover{background:#13151A}' +
    '#qs-ds-panel .qs-tab svg{width:18px;height:18px;transition:transform .35s ' + EASE + '}' +
    '#qs-ds-panel.is-open .qs-tab{right:min(220px,calc(100vw - 48px))}' +
    '#qs-ds-panel.is-open .qs-tab svg{transform:rotate(180deg)}' +
    '#qs-ds-panel button:focus-visible,#qs-ds-panel a:focus-visible{outline:2px solid #60A5FA;outline-offset:2px}' +
    '#qs-ds-panel .qs-body{position:fixed;top:50%;right:0;z-index:2147483000;width:min(220px,calc(100vw - 48px));box-sizing:border-box;padding:18px;' +
    'background:rgba(10,11,14,.92);border:1px solid rgba(255,255,255,.12);border-right:0;border-radius:14px 0 0 14px;' +
    '-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);box-shadow:0 18px 40px -20px rgba(0,0,0,.6);' +
    'transform:translate(100%,-50%);opacity:0;visibility:hidden;' +
    'transition:transform .4s ' + EASE + ',opacity .3s ease,visibility 0s linear .4s}' +
    '#qs-ds-panel.is-open .qs-body{transform:translate(0,-50%);opacity:1;visibility:visible;transition:transform .4s ' + EASE + ',opacity .3s ease}' +
    '#qs-ds-panel h2{margin:0 0 4px;font-size:15px;font-weight:700;letter-spacing:-.01em;color:#fff}' +
    '#qs-ds-panel p{margin:0 0 14px;font-size:13px;color:#94A3B8}' +
    '#qs-ds-panel .qs-open{display:flex;align-items:center;justify-content:center;gap:8px;width:100%;min-height:44px;padding:0 14px;box-sizing:border-box;' +
    'background:#152C5B;color:#fff;border:1px solid rgba(147,197,253,.32);border-radius:999px;font-family:inherit;font-weight:600;font-size:14px;line-height:1;cursor:pointer;' +
    'transition:background .2s ease,transform .3s ' + EASE + '}' +
    '#qs-ds-panel .qs-open:hover{background:#1D4ED8;transform:translateY(-1px)}' +
    '#qs-ds-panel .qs-open svg{width:16px;height:16px;transition:transform .3s ' + EASE + '}' +
    '#qs-ds-panel .qs-open:hover svg{transform:translateX(3px)}' +
    '#qs-ds-panel .qs-default{position:fixed;top:calc(50% + 50px);right:0;z-index:2147483000;display:none;min-height:44px;padding:0 12px;margin:0;' +
    'background:rgba(10,11,14,.92);color:#ECEEF2;border:1px solid rgba(255,255,255,.12);border-right:0;border-radius:12px 0 0 12px;' +
    'font-family:inherit;font-weight:600;font-size:12px;cursor:pointer;-webkit-backdrop-filter:blur(12px);backdrop-filter:blur(12px);transition:right .4s ' + EASE + ',background .2s ease}' +
    '#qs-ds-panel .qs-default:hover{background:#13151A}#qs-ds-panel.is-open .qs-default{right:min(220px,calc(100vw - 48px))}' +
    '#qs-ds-panel.has-visited .qs-default{display:block}' +
    '#qs-ds-panel .qs-warn{margin:12px 0 0;font-size:11px;font-weight:500;letter-spacing:.02em;color:#64748B;text-align:center}' +
    '#qs-ds-frame{position:fixed;inset:0;z-index:2147483001;background:#0A0B0E;transform:translateX(100%);visibility:hidden;' +
    'transition:transform .9s ' + EASE + ',visibility 0s linear .9s}' +
    '#qs-ds-frame.is-open{transform:none;visibility:visible;transition:transform .9s ' + EASE + '}' +
    '#qs-ds-frame iframe{display:block;width:100%;height:100%;border:0}' +
    '@media (prefers-reduced-motion:reduce){#qs-ds-panel .qs-body,#qs-ds-panel .qs-tab,#qs-ds-panel .qs-tab svg,#qs-ds-panel .qs-open,#qs-ds-panel .qs-open svg,#qs-ds-frame{transition:none}' +
    '#qs-ds-panel .qs-open:hover,#qs-ds-panel .qs-open:hover svg{transform:none}}';

  var chevron = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>';
  var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>';

  function mount() {
    var style = document.createElement('style');
    style.setAttribute('data-staging-only', 'design-system-panel');
    style.textContent = css;
    document.head.appendChild(style);

    var root = document.createElement('aside');
    root.id = 'qs-ds-panel';
    root.setAttribute('aria-label', 'Design system (staging only)');
    root.innerHTML =
      '<button type="button" class="qs-tab" aria-expanded="false" aria-controls="qs-ds-body" aria-label="Design system (staging only)">' + chevron + '</button>' +
      '<button type="button" class="qs-default" aria-label="Return to default colours and fonts">Default</button>' +
      '<div class="qs-body" id="qs-ds-body">' +
      '<h2>Design system</h2>' +
      '<p>Try colours and fonts live.</p>' +
      '<button type="button" class="qs-open">Open' + arrow + '</button>' +
      '<p class="qs-warn">Remove before main</p>' +
      '</div>';
    document.body.appendChild(root);

    var holder = document.createElement('div');
    holder.id = 'qs-ds-frame';
    holder.setAttribute('aria-hidden', 'true');
    holder.setAttribute('data-staging-only', 'design-system-frame');
    holder.inert = true;
    document.body.appendChild(holder);
    var frame = null;

    var tab = root.querySelector('.qs-tab');
    var openBtn = root.querySelector('.qs-open');

    function setPanel(open) {
      root.classList.toggle('is-open', open);
      tab.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    function setDs(open) {
      if (open && !frame) {
        frame = document.createElement('iframe');
        frame.title = 'Querent design system';
        frame.src = DESIGN_SYSTEM_URL;
        holder.appendChild(frame);
        overlay.frame = frame;
      }
      if (open) { markVisited(); root.classList.add('has-visited'); setPanel(false); }
      holder.classList.toggle('is-open', open);
      holder.inert = !open;
      holder.setAttribute('aria-hidden', open ? 'false' : 'true');
    }
    overlay = { frame: null, set: setDs };

    // Fresh session: two clicks (open the panel, then Open). After the first visit: one click.
    tab.addEventListener('click', function () {
      if (visited()) setDs(true);
      else setPanel(!root.classList.contains('is-open'));
    });
    openBtn.addEventListener('click', function () { setDs(true); });
    if (visited()) root.classList.add('has-visited');
    // Return to default: clear this page and tell the design system (if loaded) to reset everywhere.
    root.querySelector('.qs-default').addEventListener('click', function () {
      clearTweaks(); syncMark(); updateCal(null);
      if (frame && frame.contentWindow && DS_ORIGIN) frame.contentWindow.postMessage({ type: 'qs-ds-default' }, DS_ORIGIN);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      if (holder.classList.contains('is-open')) setDs(false);
      else if (root.classList.contains('is-open')) { setPanel(false); tab.focus(); }
    });
  }

  if (document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);

  /* ---- /STAGING-ONLY ---- */
})();
