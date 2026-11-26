// Design system page behaviour: directory built from the page's own headings, copy links,
// and the current section shown on the directory button. No dependencies.
(() => {
  const trigger = document.querySelector('.ds-dir__trigger');
  const panel = document.getElementById('ds-dir-panel');
  const current = document.querySelector('.ds-dir__current');
  const text = (el) => (el ? el.textContent.replace(/\s+/g, ' ').trim() : '');

  // 1. Build the directory from [data-ds-tier], [data-ds-section] and [data-ds-sub].
  const sections = [];
  document.querySelectorAll('[data-ds-tier], [data-ds-section]').forEach((el) => {
    if (el.hasAttribute('data-ds-tier')) {
      const label = text(el.querySelector('.ds-tier__label'));
      const title = text(el.querySelector('.ds-tier__title'));
      const row = document.createElement('div');
      row.className = 'ds-dir__tier';
      row.textContent = label ? `${label} ${title}` : title;
      panel.appendChild(row);
      return;
    }
    const num = text(el.querySelector('.ds-num'));
    const title = text(el.querySelector('.ds-section__title')).replace(num, '').trim();
    const link = document.createElement('a');
    link.className = 'ds-dir__link';
    link.href = `#${el.id}`;
    link.innerHTML = '<span class="ds-dir__num"></span><span></span>';
    link.children[0].textContent = num;
    link.children[1].textContent = title;
    panel.appendChild(link);
    sections.push({ el, link, label: `${num} ${title}`.trim() });

    el.querySelectorAll('[data-ds-sub]').forEach((sub) => {
      const subLink = document.createElement('a');
      subLink.className = 'ds-dir__link ds-dir__link--sub';
      subLink.href = `#${sub.id}`;
      subLink.textContent = text(sub.querySelector('.ds-sub__band'));
      panel.appendChild(subLink);
    });
  });

  // 2. Open and close.
  const setOpen = (open) => {
    trigger.setAttribute('aria-expanded', String(open));
    panel.hidden = !open;
  };
  trigger.addEventListener('click', () => setOpen(panel.hidden));
  panel.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
  document.addEventListener('click', (e) => { if (!e.target.closest('.ds-dir')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !panel.hidden) { setOpen(false); trigger.focus(); }
  });

  // 3. Show the section in view on the trigger.
  if ('IntersectionObserver' in window && sections.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const hit = sections.find((s) => s.el === entry.target);
        if (!hit) return;
        current.textContent = hit.label;
        sections.forEach((s) => {
          if (s === hit) s.link.setAttribute('aria-current', 'true');
          else s.link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-30% 0px -60% 0px' });
    sections.forEach((s) => io.observe(s.el));
  }

  // 4. Copy buttons.
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const original = btn.textContent;
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        btn.textContent = 'Copied';
      } catch {
        btn.textContent = 'Failed';
      }
      setTimeout(() => { btn.textContent = original; }, 1400);
    });
  });
})();

// Preview motion specimens: entrance chips get per-chip direction, distance, delay and easing; replay buttons restart a demo.
(() => {
  const rand = (a, b) => a + Math.random() * (b - a);
  const DIRS = [[0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
  const EASES = ['--ease-out', '--ease-spring', '--ease-soft', '--ease-in-out'];
  const LABELS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  document.querySelectorAll('[data-fly]').forEach((box) => {
    const build = () => {
      box.innerHTML = '';
      DIRS.forEach((d, i) => {
        const k = d[0] && d[1] ? 0.7071 : 1;
        const dist = rand(110, 220);
        const chip = document.createElement('div');
        chip.className = 'q-fly__chip';
        chip.textContent = LABELS[i];
        chip.style.cssText = `--fx:${(d[0] * k * dist).toFixed(0)}px;--fy:${(d[1] * k * dist).toFixed(0)}px;--fr:${((Math.random() < 0.5 ? -1 : 1) * rand(10, 42)).toFixed(0)}deg;--d:${rand(780, 1180).toFixed(0)}ms;--e:var(${EASES[i % 4]});--l:${rand(0, 380).toFixed(0)}ms;--p:${rand(3.2, 7.4).toFixed(1)}s;--ix:${rand(-5, 5).toFixed(1)}px;--iy:${rand(-6, 6).toFixed(1)}px;--ir:${rand(-3, 3).toFixed(1)}deg`;
        box.appendChild(chip);
      });
    };
    build();
    box._build = build;
  });
  document.querySelectorAll('[data-replay]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = document.getElementById(btn.dataset.replay);
      if (!target) return;
      if (target._build) target._build();
      target.classList.add('is-replay');
      void target.offsetWidth;
      target.classList.remove('is-replay');
      if (target.classList.contains('q-reveal')) { target.classList.remove('is-on'); void target.offsetWidth; target.classList.add('is-on'); }
    });
  });
  document.querySelectorAll('.q-reveal').forEach((r) => {
    if (!('IntersectionObserver' in window)) { r.classList.add('is-on'); return; }
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { r.classList.add('is-on'); io.disconnect(); } }), { threshold: 0.3 });
    io.observe(r);
  });
})();
