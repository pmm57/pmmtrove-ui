# Copilot Notes

## Current objective

Document the app's authentication and server-session behavior across browser tabs. Decision: a single active tab per browser (see "Single active tab guard").

## Architecture and design patterns

- Vue 3 app with Pinia state. `main.js` creates the Pinia instance; user data in `stores/userdata.js` is in-memory app state, so a newly opened tab gets a separate, initially empty store.
- Auth0 is enabled when `VITE_ON_RENDER` or `VITE_FORCE_AUTH` is `true`. Auth0 is configured with refresh tokens and `cacheLocation: "localstorage"`, allowing same-origin tabs to share its local authentication cache. Mock auth state is held in module-level Vue refs and is not shared between tabs.
- `components/DoFetch.js` is the shared fetch wrapper. It constructs `Request(serverUrl + inUrl, options)` and calls `fetch`; it does not add `credentials` automatically. Call sites generally pass `credentials: "include"` explicitly. Keep this option on authenticated/session-dependent calls.
- The app uses a server-managed session (the server is outside the inspected frontend workspace). If its session ID is delivered as a cookie, the browser (not JavaScript) sends that cookie to matching requests, subject to cookie scope and browser policy. `credentials: "include"` enables credential sending for cross-origin fetches as well; the server must also permit credentialed CORS requests.
- `App.vue` opens an `EventSource` for the selected Trove user with `{ withCredentials: true }`. Server-sent events hydrate each tab's local data independently.

## API and startup flow

- On startup (after `/check` is ready, since `App.vue` only renders the router view then), `HomeView.vue` watches the authenticated `user`. When available, it first calls `GET /session/status` (credentials included) via `adoptServerSession`; see "Session adoption" below. Only if the session is not adopted does it continue as follows: it calls `POST /` with JSON `{ authUserName }`, `Accept`/`Content-Type: application/json`, and `credentials: "include"` to obtain linked Trove IDs.
- If exactly one linked ID exists, it is verified automatically. If there are multiple, the user selects one; if none, the user is sent to Manage to link one.
- Verification calls `POST /troveUser` with JSON `{ UserId, refresh }` and credentials included. The frontend expects a response containing `troveDetails` and `newLogon`.
- `newLogon: false` is treated as an existing server session; the frontend expects server reload events to populate this tab. `newLogon: true` starts the initial-load flow.
- `App.vue` listens for user-specific SSE events and populates the Pinia store. The stream URL includes the selected Trove user ID and is opened with credentials.
- `POST /reset-session` (from `components/ResetUser.js`) resets the server session; logout also clears local user and navigation state. Changing Trove user calls `POST /clearTroveUser` with the auth username and old Trove user ID before verifying the new selection.
- `useDoFetch` parses JSON for most callers, but returns `false` on errors/non-200 responses and has an allowlist of callers whose successful response is not parsed as JSON. It records errors in the Pinia error store.

## Session adoption (implemented)

`GET /session/status` returns `{ valid, authUserName, troveUserId }` (nulls when not valid). The account identifier compared is the Auth0 `nickname` stored in `userData.authorisedUser`.

- Request failure or non-200: error state only (recorded by `useDoFetch`); no state is cleared, `/reset-session` is not called, and it is not treated as "no session". The startup flow stops.
- `valid: false`: existing flow (`POST /`, picker, `/troveUser`).
- `valid` and `authUserName !== authorisedUser` (exact, case-sensitive): silently call `resetUser()` (`/reset-session`), restore `authorisedUser`/`UNVERIFIED`, then run the existing flow.
- `valid`, names match, `troveUserId` set: load linked IDs via `POST /` (shared `loadLinkedTroveIds`: sets `authUserTroveIds`, enables Home/Manage nav). Request failure is error-only; if the session's Trove user is not in the linked IDs, run the normal flow. Otherwise set it as the selected Trove user, which calls `/troveUser { UserId }`, skips the picker, and SSE hydrates the tab.
- `valid`, names match, `troveUserId` null: existing flow.

`/reset-session` is otherwise used only for explicit logout.

## Single active tab guard (implemented)

Decision: one active tab per browser. Multi-subscriber SSE is intentionally not done, and BroadcastChannel state sync is not required.

- `src/stores/tabguard.js` uses the Web Locks API, lock name `trove-active-tab`. `main.js` runs `startGuard()` before mounting the app, so no server call, SSE or startup flow happens before the decision. It works the same for Auth0 and mock auth, and runs before login.
- Lock granted (`ifAvailable`): the tab is ACTIVE and holds the lock with a never-resolving promise. The browser releases it on tab close or crash, so there are no stale locks.
- Lock not granted: the tab is PASSIVE. `App.vue` shows "Trove is already open in another tab" (no takeover button; the user closes the tab and uses the existing one), `useDoFetch` returns `false` without calling the server, and no SSE or startup flow runs. A queued lock request reloads the tab to activate it if the active tab closes.
- No takeover: stealing the lock ("Use this tab") was considered and intentionally not allowed. A passive tab never becomes active while another tab holds the lock. Edge: reloading the active tab briefly releases the lock, so a waiting passive tab may win it and the reloaded tab becomes passive.
- Fallback: if `navigator.locks` is missing or the page is not a secure context, the guard is skipped (behaviour as before) and this is logged.

## Multi-tab behavior and trade-offs

- A new tab has separate Pinia/UI state, but same-origin Auth0 local-storage state and browser cookies are shared. With the guard, only the active tab talks to the server.
- Without the guard (no Web Locks or insecure context), tabs can share a server session while holding different selected-user and data state, and logout/reset or user switching in one tab may affect another.

## Files examined / modified

- Examined: `src/components/DoFetch.js`, `src/components/AuthUserState.js`, `src/components/ResetUser.js`, `src/auth/index.js`, `src/auth/mockAuth.js`, `src/auth/authMode.js`, `src/main.js`, `src/App.vue`, `src/router/index.js`, `src/views/HomeView.vue`, `src/stores/userdata.js`.
- Modified: `src/views/HomeView.vue` (session adoption), `src/stores/tabguard.js` (new), `src/main.js`, `src/App.vue`, `src/components/DoFetch.js`, `src/components/NavBar.vue` (removed an undefined `storageHandler` reference on unmount), `doco/ui-copilot-notes.md`, `doco/ui-sessions-copilot-notes.md`.

## Open issues and pending work

- Confirm backend session semantics, whether the session ID is a cookie, cookie `Domain`/`Path`/`SameSite`/`Secure` attributes, and credentialed CORS configuration.
- Test the single-active-tab guard manually (see the sessions notes), and tab behaviour when Web Locks is unavailable.
- `useDoFetch` relies on every relevant caller to set credentials. Consider a future audit to ensure all session-dependent calls and error paths follow the intended contract; do not assume the wrapper enforces this today.
