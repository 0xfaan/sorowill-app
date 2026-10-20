# Dashboard re-fetches all wills on every searchInput change

Fix for issue #684: `filterWills` is called synchronously on every keystroke. With a large wills array this means an expensive filter pass per character typed, and any future change that ties `search` to an upstream fetch would cause a network call on every keystroke.

## #684 - Dashboard re-fetches all wills on every searchInput change

`filterWills` is called inside the render body on every `search` state change:

```tsx
// src/app/dashboard/page.tsx — current behaviour
const activeList = filterWills(baseList, search, statusFilter);
```

Because `search` is updated on every `onChange` event and `filterWills` is a plain function call inside the component body, it runs on every character typed. For large will arrays this is an O(n) scan per keystroke. Any future path that also triggers a network fetch when `search` changes would fire a request on every character.

**Done**
- Wrap the `filterWills` call in `useMemo` so it only re-runs when `baseList`, `search`, or `statusFilter` actually change, not on every unrelated re-render.
- Debounce the `search` input with a local `deferredSearch` value (300 ms) so the filter does not run on every individual keystroke; the displayed input value updates instantly (controlled) but the filter lags behind until the user pauses.
- The debounce is implemented with a `useEffect` + `clearTimeout` pattern — no extra library dependency.
- `filterWills` remains a pure exported function (already tested) so no change to its logic is needed.

**Implementation sketch**

```tsx
// two state values: one for the controlled input, one for the debounced filter
const [search, setSearch] = useState('');
const [deferredSearch, setDeferredSearch] = useState('');

useEffect(() => {
  const id = setTimeout(() => setDeferredSearch(search), 300);
  return () => clearTimeout(id);
}, [search]);

// memoised filter — only recalculates when inputs change
const activeList = useMemo(
  () => filterWills(baseList, deferredSearch, statusFilter),
  [baseList, deferredSearch, statusFilter],
);
```

**Not done in this PR**
- Moving the fetch itself behind a debounce if a server-side search endpoint is added later; this PR only protects the client-side filter path.
- Virtualising the will list for very large datasets (separate concern, separate issue).

## Verification

`npm run typecheck`, `npm run lint`, `npm run build` all pass.

Part of #684
