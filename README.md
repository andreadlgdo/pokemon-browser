# Pokémon Explorer

A web app for browsing Pokémon using [PokéAPI](https://pokeapi.co/docs/v2). Built with Vue 3 and TypeScript.

## Tech stack

* Vue 3 and TypeScript
* Vite
* Vue Router
* Pinia
* Nuxt UI and Tailwind CSS

## Run locally

Make sure you have Node.js and npm installed. Then run:

```sh
npm install
npm run dev
```

Open the local URL shown in the terminal.

## Checks

```sh
npm run type-check
npm run lint
npm run build
```

## State management

All shared state lives in a single Pinia store, `src/stores/pokemonStore.ts`, written in setup style so it mirrors the `<script setup>` components: `ref` is state, `computed` is a getter, and plain functions are actions.

One store is used rather than several because the list and detail page share the same cache. Splitting them would mean two stores reaching into each other, which is harder to reason about than one cohesive module.

Separate stores would make sense once unrelated domains appear, such as authentication or user-owned teams.

### What is stored

| State                                        | Why it lives here                                                                                                                       |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `allPokemon`                                 | The full name catalog, fetched once. PokéAPI has no partial-search endpoint, so search has to run against the whole list on the client. |
| `types`                                      | Options for the type filter, fetched once alongside the catalog.                                                                        |
| `typeIndex`                                  | Cache keyed by type name. Switching back to a type already visited costs no request.                                                    |
| `detailsByName`                              | Cache keyed by Pokémon name, shared by the grid thumbnails and the detail page. Opening a Pokémon already seen in the list is instant.  |
| `searchQuery`, `selectedType`, `currentPage` | The query the user has expressed. Every visible list is derived from these three values.                                                |

`currentPage` belongs here rather than in the component because three actions write to it: `setPage` on navigation, and `setSearch` and `setType`, which reset it to 1.

Without that reset, the user could be on page 12, narrow the results to three matches, and see an empty grid.

### What is not stored

Lists that can be calculated from other values are not stored in state. The store keeps only the **sources of truth**, such as the catalog, the user's search query, and the selected type. The results shown on screen are derived from those values through getters.

For example, storing `filteredPokemon` as a `ref` would mean maintaining two related pieces of state manually:

```ts
const filtered = ref<PokemonRef[]>([])

function setSearch(q: string) {
  searchQuery.value = q
  filtered.value = recompute()
}
```

In this case, `searchQuery` contains the filter and `filtered` contains the result of applying it. The problem is that both values must be kept in sync manually.

The filtered result can also change for several reasons: the search query changes, the selected type changes, or a new catalog arrives after `bootstrap()`. Each of those cases would require remembering to recompute `filtered`.

If that recomputation is forgotten, the application does not crash or show an error; it simply displays stale data.

That is why `filteredPokemon` is defined as a derived value instead:

```ts
const filteredPokemon = computed(() =>
  catalog.value.filter((p) =>
    p.name.includes(searchQuery.value),
  ),
)
```

This way, there is a single source of truth. Whenever one of its dependencies changes, Vue automatically recalculates the result.

In addition, `computed` caches the result and only recalculates it when one of its dependencies changes, so the filtering logic is not executed unnecessarily on every render.

### Derivation order

The getters form a chain, with each one narrowing the previous result:

```text
catalog          the full Pokédex, or the selected type's list when a filter is active
filteredPokemon  of those, the names matching the search text
totalPages       how many pages that result adds up to
paginatedItems   the twenty rows for the current page
```

Slicing the page is deliberately the last step. Search has to traverse the whole set, and pagination is a consequence of the result, never an input to it.

`totalPages` sits before `paginatedItems` for the same reason: a search with three matches is one page, not sixty-five.

Reversing those two steps — slicing twenty rows and then searching within them — is a common mistake because it fails silently. It compiles, raises no error, and a quick demo can look correct.

For example, searching for `pika` may work if Pikachu happens to be on the currently visible page. The problem only appears when the matching Pokémon is outside those visible rows.

### Async state

There is one status per region of the UI that renders independently, so a failure is contained where it happened:

| Status              | Region                     | On failure                                                                                     |
| ------------------- | -------------------------- | ---------------------------------------------------------------------------------------------- |
| `bootstrapStatus`   | The list view as a whole   | Blocking message. Without the catalog there is no search, no filter, and no pages.             |
| `pageDetailsStatus` | The card grid              | Cards still render from the catalog names with a placeholder image, plus a non-blocking retry. |
| `detailStatus`      | The `/pokemon/:name` route | Full-view not-found or retry, isolated from the list.                                          |

`bootstrapStatus` reaches `ready` and stays there, which lets `bootstrap()` return early instead of refetching the catalog.

`pageDetailsStatus` returns to `idle` on success because loading thumbnails is a completed task rather than a permanent state of that region. Moving to another page starts the process again.

Errors use two slots, `error` and `detailError`, split along the route boundary. A 404 on a detail page must not turn the list red, and a failed thumbnail request must not take down the toolbar.

### Race conditions

A race condition appears when multiple asynchronous operations can finish in a different order from the one in which they started and write to the same value.

Search does not have this problem because it is completely synchronous. Filtering runs against a catalog that is already in memory, so there are no pending requests or responses that can arrive out of order.

Data requests can finish in a different order, but each response writes to its own cache entry:

```ts
detailsByName[name]
typeIndex[type]
```

Because the caches are keyed, a late response only updates the entry that belongs to it and cannot overwrite another Pokémon or type.

Keeping that result is still useful because it may already be cached if the user comes back to it later.

The potential problem is with the **UI status values**, because each region has only one shared status, such as `detailStatus` or `pageDetailsStatus`.

For example:

1. The user opens Bulbasaur.
2. `detailStatus` becomes `loading`.
3. Before the request finishes, the user opens Charizard.
4. A new request for Charizard starts.
5. The older Bulbasaur request finishes afterwards.

If the older request were allowed to update `detailStatus`, it could change the state of a screen that no longer represents Bulbasaur.

The UI could end up showing an error, a spinner, or a `ready` state caused by a request that no longer matches what the user is viewing.

To prevent this, `loadPokemonDetail` and `ensurePageDetails` use a token that identifies the most recent execution:

```ts
const token = ++detailToken

// ...await the request...

if (token !== detailToken) return

detailStatus.value = 'ready'
```

Each new execution increments the counter. When a request finishes, it checks whether its local token still matches the current one.

If it does not, a newer call has taken control and the older execution is no longer allowed to update the UI status.

The cache write happens before this check, while the status update happens afterwards. This means a late response can still contribute useful data to the cache, but it can no longer affect the state of the current screen.

The tokens are not reactive or exported because they are only an internal mechanism for deciding which asynchronous operation is allowed to update the status.

## Error handling

### Error flow

When something fails, the error moves through four layers, each with a single responsibility:

```text
fetch rejects or res.ok === false

  → pokemonApi.ts throws HttpError(status) or propagates TypeError / AbortError

  → mapApiError(e) converts unknown into AppError { kind, message, retryable }

  → the store action saves the error in the appropriate slot and sets its region status to 'error'

  → the component reads status + error and decides what to render
```

The service layer knows nothing about the UI; it only throws or rejects.

`mapApiError` knows nothing about Pinia; it only classifies errors.

The store does not decide whether an error should appear as a red or yellow alert. It only stores the `AppError` and updates the status for the affected UI region.

The component does not decide whether a 404 is retryable. It simply reads `error.retryable`.

This separation also makes `mapApiError` easy to test in isolation: it is a pure function that receives an `unknown` value and returns an `AppError`.

### Error taxonomy

All errors are normalized into six possible `kind` values. The UI never needs to inspect HTTP status codes directly; it works with `kind` and `retryable` instead.

| `kind`       | Source                                            | Retryable? | User-facing message                                |
| ------------ | ------------------------------------------------- | ---------- | -------------------------------------------------- |
| `not_found`  | `HttpError(404)`                                  | **No**     | "We couldn't find that Pokémon."                   |
| `rate_limit` | `HttpError(429)`                                  | **Yes**    | "Too many requests. Wait a moment and try again."  |
| `server`     | `HttpError(>= 500)`                               | **Yes**    | "The Pokémon API is having problems. Try again."   |
| `timeout`    | `AbortError` from the 8-second timeout            | **Yes**    | "The request took too long. Try again."            |
| `network`    | `TypeError` such as offline, DNS or CORS failures | **Yes**    | "No connection. Check your network and try again." |
| `unknown`    | Anything else                                     | **No**     | "Something went wrong."                            |

Classification relies on `instanceof`, never on matching error message strings. Messages may vary between browsers, while the error type is a more reliable signal.

`retryable` and the message are kept consistent: if `retryable` is `false`, the message does not ask the user to try again because the UI will not display a retry action.

### Permanent vs transient failures

Not every failure should be handled in the same way. The main question is: **can retrying realistically change the result?**

On the detail route (`/pokemon/:name`), a 404 is a valid outcome. The Pokémon name comes directly from the URL, so a user may navigate to something like `/pokemon/does-not-exist`. In that case, `not_found` displays `"Pokémon not found"` without a retry button because repeating the same request would produce the same result.

In the list, a 404 would be unusual because Pokémon names come from PokéAPI's own catalog. Grid-detail failures are therefore expected to be mostly transient errors such as network failures, timeouts, rate limits, or server errors.

Thumbnail failures are treated as non-blocking. Cards can still render from the catalog using the Pokémon name and a placeholder, while search and type filtering remain available.

### Severity by UI region

The **status** tells the application *where* the failure happened. The **error** describes *what* happened.

These are separate concerns, which allows the same `AppErrorState` component to be reused with different levels of severity.

| Region          | Status              | Error slot    | UI treatment                                                                                        | Blocks interaction?                                                        |
| --------------- | ------------------- | ------------- | --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| List bootstrap  | `bootstrapStatus`   | `error`       | Blocking `AppErrorState` + `"Try again"` → `bootstrap()`                                            | **Yes.** Without the catalog there is no search, filtering, or pagination. |
| Grid thumbnails | `pageDetailsStatus` | `error`       | Inline `AppErrorState` + retry → `ensurePageDetails()`                                              | **No.** Filters stay available and cards render with placeholders.         |
| Detail view     | `detailStatus`      | `detailError` | 404 → message without retry. Transient failure → blocking error + retry → `loadPokemonDetail(name)` | **Yes**, but only for that route.                                          |

Bootstrap and thumbnail loading share the `error` slot because thumbnail requests only start after bootstrap succeeds. They cannot independently represent competing errors on screen.

Detail errors use a separate `detailError` slot so failures do not cross route boundaries: an error in the list must not appear on the detail page, and vice versa.

`AppErrorState` contains no business logic. It receives an already classified `AppError` and uses `error.retryable` only to decide whether the retry button should be rendered.

### Where each responsibility lives

| Piece                       | File                           | Responsibility                                                                                |
| --------------------------- | ------------------------------ | --------------------------------------------------------------------------------------------- |
| `HttpError`                 | `services/pokemonApi.ts`       | Preserves the HTTP status because `fetch` does not reject automatically for 4xx/5xx responses |
| `AppError` + `AppErrorKind` | `types/error.ts`               | Defines the error shape consumed by the UI                                                    |
| `mapApiError`               | `utils/mapApiError.ts`         | Pure normalization function: `unknown` → `AppError`                                           |
| Status + error slots        | `stores/pokemonStore.ts`       | Each action updates the status for its own UI region                                          |
| Presentation                | `components/AppErrorState.vue` | Renders the error and emits `retry`                                                           |

## Testing

Tests focus on pure logic with the highest regression value:

- `mapApiError` — error classification (`kind` + `retryable`)
- Store derivation — search runs over the full catalog before pagination,
  and filters reset `currentPage` to 1

Not covered on purpose: visual components (logic lives in the store), router navigation (verified manually), and live API calls (would need fetch mocks; out of scope for the time box).
