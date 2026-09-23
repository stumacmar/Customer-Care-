# Tests

Run the app first (`npm run build && npx vite preview --port 4173 --strictPort`),
then `node tests/rename.mjs`.

**These tests live in the repository on purpose.** An earlier suite — fourteen
Playwright files, a randomised simulation harness, the video recording and
narration pipeline and the picture-guide generator — was kept in a scratch
directory outside git and was lost when that directory was cleared. Nothing
that is needed to verify or rebuild this app should live outside this repo
again. See "Phase 5.8" in the root README.

- `rename.mjs` — the product name on every surface, the access code and its
  rotation, and that browser storage keys are untouched so no user loses
  their records.
