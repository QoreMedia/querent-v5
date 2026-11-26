# STAGING-ONLY: REMOVE BEFORE MERGING/DEPLOYING TO MAIN

The "Design system (staging only)" side panel is a staging tool. It must not reach `main`/production.

Delete exactly this:

1. `public/staging-ds-panel.js` (whole file).
2. In `index.html`, `booking.html`, `menu.html`, `va.html`: the block between
   `<!-- STAGING-ONLY: DESIGN SYSTEM PANEL ... -->` and `<!-- /STAGING-ONLY -->` (one `<script src="/staging-ds-panel.js">` tag).
3. This file (`STAGING-ONLY.md`).

Check: `grep -rn "STAGING-ONLY" . --exclude-dir=node_modules --exclude-dir=dist` must return nothing.

The panel is off by default and only renders on localhost, hosts containing "staging", non-production `*.vercel.app` hosts, or with `?ds-panel=1`. The design system link is the `DESIGN_SYSTEM_URL` constant at the top of `public/staging-ds-panel.js` (not hosted yet; default `http://localhost:8134/`).
