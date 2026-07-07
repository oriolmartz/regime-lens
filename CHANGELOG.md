# Changelog

## V9 / 0.9.0 — Git-Ready Edition

- Added backend pytest suite covering data loading, uploaded CSV validation, feature engineering, risk metrics, validation layer and API endpoints.
- Updated smoke test and API version to `0.9.0`.
- Removed generated artifacts from the distributable: `node_modules`, `dist`, `.cache`, bytecode, pytest cache and TypeScript build info.
- Sanitized README and Windows setup docs so no personal local path is exposed.
- Made frontend Docker build reproducible with `package-lock.json` + `npm ci`.
- Upgraded Vite / plugin-react / PostCSS and verified `npm audit --omit=dev` reports zero vulnerabilities.
- Fixed Tailwind typo in timeline regime dots.
- Replaced remaining generic blue transition-matrix heat color with the product accent palette.
- Reduced hero vertical spacing for a tighter first viewport.
- Tightened the most visible TypeScript contracts, especially comparison data and typed tab icons.

Known follow-ups:

- Add real screenshots/GIFs under `assets/screenshots/` after running the UI locally.
- Consider code-splitting the frontend bundle if production performance becomes a priority.
- Move to `strict: true` in TypeScript gradually; current V9 keeps the previous non-strict setting to avoid a broad refactor.
