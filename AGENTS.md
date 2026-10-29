<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture
- All demo data lives in `src/lib/data.ts` and flows through one client store (`src/lib/store.tsx`, persisted to localStorage) so every page shares the same state; no backend yet.
- Business rules (assignment, dispatch, priority) are pure functions in `src/lib/logic.ts`, tested in `src/test/logic.test.ts`.
- Maps use Leaflet loaded dynamically inside `src/components/GeoMap.tsx` (SSR-safe) with keyless Esri imagery.
