# Deprecated / alternate pages (not served)

Nothing in this folder is a Vite build input, so none of it is deployed to querent.ai or staging.querent.ai.
Note: the GitHub repo itself is public, so these files can still be read on GitHub.

## Files

- `menu-v1-priced.html`: the services page as it was on 2026-11-26 (staging `fc4cf27`), with per-offer price ranges.
  Archived because those prices were placeholders and didn't reflect current market rates. Kept in case parts of
  this version are needed later.
- `va-v1-single-offer.html`: the AI Virtual Assistants page as it was before the v0.5 two-option redesign
  (staging `00fbdae`): a single VA + automations bundle and the "standard VA agency" comparison table.

## Notes for the querent.ai site

- **Offer stack will change.** The live services page now shows complexity and "good fit for" tags instead of prices.
  The services themselves and how they're bundled are expected to be reworked; revisit `menu.html` (and the
  homepage solutions tabs, nav and footer service links) when that happens.
- **Alternate process timeline.** The numbered-circle timeline with the glowing active node (staging `b89f657`,
  `index.html`, `.proc2-marker` / `.proc2-line`) is the backup option to the current week-bar timeline. Restore it from
  that commit if you want to compare the two.
