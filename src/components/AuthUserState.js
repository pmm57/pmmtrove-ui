
// UNAUTHENTICATED
//   └─ Login/Signup          -> UNVERIFIED
// UNVERIFIED
//   ├─ Login/Signup (0 IDs)  -> TROVE_ID_REQUIRED
//   ├─ Login/Signup (1 ID)   -> VERIFYING_TROVE_ID
//   └─ Login/Signup (>1 IDs) -> TROVE_ID_SELECTION_REQUIRED
// TROVE_ID_REQUIRED
//   └─ User linked account   -> VERIFYING_TROVE_ID
// TROVE_ID_SELECTION_REQUIRED
//   └─ User selected ID      -> VERIFYING_TROVE_ID
// VERIFYING_TROVE_ID
//   └─ Trove ID verified      -> FIRST_LOAD
//   └─ Verification failed    -> UNVERIFIED
// FIRST_LOAD
//   └─ Lists complete        -> READY
// READY
//   ├─ Refresh Lists         -> REFRESH_LOAD
//   └─ Change User           -> TROVE_ID_SELECTION_REQUIRED
// REFRESH_LOAD
//   └─ Lists complete        -> READY
export const AuthUserState = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  UNVERIFIED: 'UNVERIFIED',
  TROVE_ID_REQUIRED: 'TROVE_ID_REQUIRED',   // No Trove IDs linked to this Auth0 user
  TROVE_ID_SELECTION_REQUIRED: 'TROVE_ID_SELECTION_REQUIRED',   // Multiple Trove IDs available during initial login
  VERIFYING_TROVE_ID: 'VERIFYING_TROVE_ID',
  FIRST_LOAD: 'FIRST_LOAD',  // Initial loading of lists for the selected Trove ID
  READY: 'READY',    // All data loaded
  REFRESH_LOAD: 'REFRESH_LOAD' // User-initiated reload
}