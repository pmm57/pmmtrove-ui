# Copilot Notes

## Current objective

Document the app's authentication and server-session behavior across browser tabs, and identify whether multiple tabs should be allowed. The current guidance is to allow them unless testing reveals a conflict; consider synchronization or a warning before blocking tabs.

## Architecture and design patterns

- Vue 3 app with Pinia state. `main.js` creates the Pinia instance; user data in `stores/userdata.js` is in-memory app state, so a newly opened tab gets a separate, initially empty store.
- Auth0 is enabled when `VITE_ON_RENDER` or `VITE_FORCE_AUTH` is `true`. Auth0 is configured with refresh tokens and `cacheLocation: "localstorage"`, allowing same-origin tabs to share its local authentication cache. Mock auth state is held in module-level Vue refs and is not shared between tabs.
- `components/DoFetch.js` is the shared fetch wrapper. It constructs `Request(serverUrl + inUrl, options)` and calls `fetch`; it does not add `credentials` automatically. Call sites generally pass `credentials: "include"` explicitly. Keep this option on authenticated/session-dependent calls.
- The app uses a server-managed session (the server is outside the inspected frontend workspace). If its session ID is delivered as a cookie, the browser—not JavaScript—sends that cookie to matching requests, subject to cookie scope and browser policy. `credentials: "include"` enables credential sending for cross-origin fetches as well; the server must also permit credentialed CORS requests.
- `App.vue` opens an `EventSource` for the selected Trove user with `{ withCredentials: true }`. Server-sent events hydrate each tab's local data independently.

## API and startup flow

- On startup, `HomeView.vue` watches the authenticated `user`. When available, it calls `POST /` with JSON `{ authUserName }`, `Accept`/`Content-Type: application/json`, and `credentials: "include"` to obtain linked Trove IDs.
- If exactly one linked ID exists, it is verified automatically. If there are multiple, the user selects one; if none, the user is sent to Manage to link one.
- Verification calls `POST /troveUser` with JSON `{ UserId, refresh }` and credentials included. The frontend expects a response containing `troveDetails` and `newLogon`.
- `newLogon: false` is treated as an existing server session; the frontend expects server reload events to populate this tab. `newLogon: true` starts the initial-load flow.
- `App.vue` listens for user-specific SSE events and populates the Pinia store. The stream URL includes the selected Trove user ID and is opened with credentials.
- `POST /reset-session` (from `components/ResetUser.js`) resets the server session; logout also clears local user and navigation state. Changing Trove user calls `POST /clearTroveUser` with the auth username and old Trove user ID before verifying the new selection.
- `useDoFetch` parses JSON for most callers, but returns `false` on errors/non-200 responses and has an allowlist of callers whose successful response is not parsed as JSON. It records errors in the Pinia error store.

## Multi-tab behavior and trade-offs

- A new tab has separate Pinia/UI state, but same-origin Auth0 local-storage state and browser cookies are shared. It can therefore recognize the user and make its own startup verification calls; it does not copy the first tab's state.
- Tabs may share a server session while holding different selected-user and data state. Logging out/resetting the session or switching the selected Trove user in one tab may affect requests from another. The inspected frontend does not show cross-tab Pinia synchronization or an explicit one-tab guard.
- Do not conclude that concurrent tabs are safe or unsafe based on the frontend alone. The server implementation and cookie attributes were not inspected. Blocking tabs is not currently justified; test cross-tab session behavior first. If conflicts occur, prefer explicit synchronization or a warning unless the backend contract requires single-tab use.

## Files examined / modified

- Examined: `src/components/DoFetch.js`, `src/components/AuthUserState.js`, `src/components/ResetUser.js`, `src/auth/index.js`, `src/auth/mockAuth.js`, `src/auth/authMode.js`, `src/main.js`, `src/App.vue`, `src/router/index.js`, `src/views/HomeView.vue`, `src/stores/userdata.js`.
- Modified in this documentation task: `docs/copilot-notes.md` (created; no prior notes file or `docs` directory existed).
- No application code was changed during the session.

## Open issues and pending work

- Confirm backend session semantics, whether the session ID is a cookie, cookie `Domain`/`Path`/`SameSite`/`Secure` attributes, and credentialed CORS configuration.
- Test two tabs with the same and different selected Trove users, including startup/reload, simultaneous requests, user switching, logout, and reset. Verify how SSE updates and reconnects in both tabs.
- Decide whether to implement cross-tab state/session notifications, a user-facing warning, or a single-tab restriction based on those results.
- `useDoFetch` relies on every relevant caller to set credentials. Consider a future audit to ensure all session-dependent calls and error paths follow the intended contract; do not assume the wrapper enforces this today.
