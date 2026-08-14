# Unfold frontend architecture

The frontend is a React, TypeScript, Vite, and TanStack Query application.

## Source layout

- `src/app/` contains application composition, theme setup, validation schemas, and route orchestration.
- `src/pages/` contains one component per route-level screen. Experiment and insight pages have domain subfolders.
- `src/components/` contains reusable common UI, the authenticated layout, and focused domain components.
- `src/hooks/` contains reusable query/state hooks such as authentication and the active experiment.
- `src/services/` contains typed auth, experiment, and insight API operations. Pages should use these instead of constructing requests directly.
- `src/api/client.ts` is the single HTTP/CSRF configuration and the only place that reads `VITE_API_BASE_URL`.
- `src/types/` contains shared API and navigation types.
- `src/utils/` contains rendering-independent calculations and export helpers.

## Where new code belongs

- Add a route-level screen under `pages/`, then register it in `app/routes.tsx`.
- Add reusable visual elements under `components/`; avoid importing pages from components.
- Add backend operations to the matching domain service and share response types through `types/`.
- Add a custom hook only when it encapsulates reusable query, state, or lifecycle behavior.
- Keep `app/App.tsx` limited to application-wide setup and providers/layout decisions.

## Verification

```bash
npm test
npm exec -- tsc --noEmit
npm run build
```
