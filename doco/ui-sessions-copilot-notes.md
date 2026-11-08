# UI Session Notes for Copilot

## Current objective

Document how a newly opened browser tab determines whether a server session exists, discovers its associated Trove user ID, and hydrates that tab's independent Pinia state. Implemented: after the backend health check succeeds and the Auth0 user is loaded, `HomeView.vue` calls `GET /session/status` and adopts the existing session instead of overwriting it; existing verification and SSE delivery then hydrate the tab.

The server endpoint is being built in parallel; the UI is coded against the contract below.

## Architecture and decisions

- Each tab creates its own Vue/Pinia runtime (`src/main.js`); Pinia state is in-memory and is not shared between tabs. The new tab must load its own state.
- Auth0 is configured with `cacheLocation: "localstorage"` in `src/main.js`, but that persists Auth0's cache, not Pinia. Browser cookies may also be sent with requests when `credentials: "include"` is specified. The frontend does not read a session ID directly.
- `src/components/DoFetch.js` is the shared fetch helper. It uses `VITE_SERVER_URL`, performs `fetch`, parses JSON for most callers, and returns `false` for failed/non-200 requests. It does not automatically add `credentials`; session-dependent callers specify it in their options.
- `src/App.vue` calls `/check` while waiting for backend readiness. `/check` is a health/startup check, not a session-validity check.
- `src/views/HomeView.vue` obtains the authenticated account's linked Trove IDs, selects or asks the user to select one, and verifies the selected ID with `/troveUser`.
- `src/App.vue` listens for user-specific SSE events and applies them to that tab's Pinia store. This is the data-hydration mechanism; a successful session check alone does not populate Pinia.
- Do not call `/reset-session` when a session-status check succeeds. That endpoint resets the server session and clears local user/navigation state; it is used for explicit logout in `src/components/ResetUser.js` and `src/components/NavBar.vue`.

## Current API contracts and flow

1. **Backend readiness — current**
   - `GET /check` with `credentials: "include"`.
   - Frontend expects readiness/status fields including `response`, `startupStatus`, `auraStatus`, `arrayMinedStatus`, `arrayMetadataTypes`, and `startupErrors`.
   - This endpoint does not establish that the current user's session exists.

2. **Linked Trove IDs — current**
   - `POST /` with JSON `{ authUserName }`, JSON headers, and `credentials: "include"`.
   - Frontend expects an array of linked Trove ID records and stores it in `userData.authUserTroveIds`.
   - Zero linked IDs routes to Manage; one is selected automatically; multiple require user selection.

3. **Trove user verification — current**
   - `POST /troveUser` with JSON `{ UserId, refresh }` and `credentials: "include"`.
   - Frontend expects a response containing `troveDetails` and `newLogon`; it assigns `troveDetails` to the local Pinia store.
   - The frontend interprets `newLogon: false` as an existing server session and sets a reload flag; `newLogon: true` starts the first-load state. This interpretation is based on frontend code/comments; confirm precise backend semantics.
   - The backend implementation is not in this UI workspace, so the exact server-side session lookup and authorization behavior are unknown.

4. **List refresh — current**
   - `refreshUserLists()` in `src/views/HomeView.vue` requires `userData.troveDetails.troveUserId` to already be populated.
   - It clears the local Trove cache, sets `refresh: true`, and calls `verifyTroveUser(true)`, which posts to `/troveUser`.
   - It does not itself populate Pinia from the HTTP response beyond assigning `troveDetails`; server-sent events deliver list/article data.

5. **SSE hydration — current**
   - `src/App.vue` opens a credentialed `EventSource` once `troveDetails.troveUserId` is available. The stream path includes that ID.
   - `sseUserLists` updates list/cache data and marks `userListsReady`; `sseUserListArticles` updates article data. These handlers mutate the current tab's Pinia store.
   - A reload event can clear the local cache before applying the server snapshot.

## Session status contract (implemented in the UI)

`GET /session/status` (credentials included, no body) returns `{ valid, authUserName, troveUserId }`, with nulls when not valid. The server inspects the browser-supplied cookie; the UI never sends or exposes a raw session ID. `HomeView.vue` `adoptServerSession` calls it from the `user` watcher once the Auth0 user is loaded (the router view only renders after `/check` is ready). The account identifier is the Auth0 `nickname` in `userData.authorisedUser`.

Behaviour:

1. Request failure or non-200: error state only (recorded by `useDoFetch`). State is never cleared, `/reset-session` is not called, and it is not treated as "no session". The startup flow stops.
2. `valid: false`: existing flow (`POST /` linked IDs, picker, `/troveUser`).
3. `valid` and `authUserName !== authorisedUser` (exact, case-sensitive, no normalisation): silently call `resetUser()` (`/reset-session`), restore `authorisedUser` and `UNVERIFIED`, then run the existing flow.
4. `valid`, names match, `troveUserId` set: set it as the selected Trove user, call `/troveUser { UserId }` (matches the session), skip the picker, and let SSE hydrate. `POST /` is skipped, so `authUserTroveIds` is not loaded on this path.
5. `valid`, names match, `troveUserId` null: existing flow.

`/reset-session` is kept for explicit logout and the mismatch case only. The server must still validate that the Trove ID belongs to the authenticated account; the UI does not rely on status alone as authorization.

## Important trade-offs and open questions

- Session status does not hydrate Pinia by itself; `/troveUser` plus SSE does.
- Confirm with the backend owner: session cookie scope and attributes, expiration/renewal, and `/troveUser` `newLogon` semantics.
- Confirm CORS permits credentialed requests if UI and API are cross-origin.
- Adopting skips `POST /`, so `authUserTroveIds` (Manage view, Change User button) is not populated on that path; decide whether to load it separately without touching the session.
- Test two tabs with the same and different users/Trove IDs, including logout/reset and SSE reconnects.

## Relevant files

- `src/main.js` — creates a Pinia instance per app/tab and configures Auth0 local-storage cache.
- `src/App.vue` — `/check` readiness flow and SSE handlers that hydrate Pinia.
- `src/views/HomeView.vue` — linked-ID lookup, Trove verification, `newLogon` handling, and `refreshUserLists()`.
- `src/components/DoFetch.js` — shared HTTP helper and error/JSON behavior.
- `src/components/ResetUser.js` — `/reset-session` call and local store clearing.
- `src/components/NavBar.vue` — logout calls `resetUser()`.
- `src/components/AuthUserState.js` — authentication/loading state names.
- `src/stores/userdata.js` — per-tab user and Trove data state and clearing helpers.
- `doco/ui-copilot-notes.md` — broader notes on multi-tab behavior and authentication.

## Files modified for this task

- Modified `src/views/HomeView.vue` (session adoption) and both notes files.
