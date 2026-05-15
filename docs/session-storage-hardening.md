# Mobile session storage — hardening notes

Research summary for Supabase Auth + Expo (React Native). This is guidance for future implementation; not all items are shipped yet.

## Current behavior (baseline)

- **Supabase JS** persists the session in **AsyncStorage** via the default Expo/React Native client (`mobile/src/lib/supabase.ts`).
- **Auth state** is mirrored in React context (`auth-context`) for UI.
- **Deep links** for OAuth and password recovery use `expo-linking` / `auth-linking` helpers.
- **Post-login redirect** is stored in AsyncStorage for OAuth round-trips (`post-login-redirect-storage`).

## Recommendations (priority order)

### 1. Use platform secure storage for refresh tokens

Supabase v2 supports a custom storage adapter. Prefer **`expo-secure-store`** (or `react-native-keychain`) for the **refresh token** and session JSON, with AsyncStorage only for non-sensitive prefs if needed.

References:

- [Supabase: Auth storage (React Native)](https://supabase.com/docs/reference/javascript/initializing#custom-storage)
- [Expo SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)

**Caveat:** SecureStore has size limits (~2KB on some platforms). Use chunked storage or store only refresh token + minimal metadata if the full session exceeds limits.

### 2. Lock screen and backgrounding

- On **AppState** `background` / `inactive`, consider clearing sensitive in-memory state (query caches with PII).
- Optional: require biometrics to reopen the app when “privacy mode” is enabled (product decision).

### 3. OAuth and magic links

- Validate redirect URLs against an allowlist (`getPasswordRecoveryRedirectUrl`, scheme `bluprnt://`).
- After handling `SIGNED_IN` from a deep link, **strip tokens from the URL** so they are not kept in navigation history.

### 4. Sign-out hygiene

- Call `supabase.auth.signOut()` and clear **SecureStore + AsyncStorage** keys used for redirects and drafts.
- Invalidate TanStack Query caches that hold project/finance data.

### 5. Jailbreak / root (optional)

Commercial apps sometimes detect compromised devices; Supabase does not provide this. Evaluate `expo-device` + policy only if compliance requires it.

## Web parity

Web uses **localStorage** (or cookie-based SSR if added later). For shared machines, document “sign out on shared devices” in help center. HttpOnly cookies are preferable if the web app moves to SSR auth.

## Testing checklist

- [ ] Cold start restores session from secure storage
- [ ] Sign out removes all auth keys
- [ ] Password recovery link works once; replay fails
- [ ] OAuth cancel / error does not leave partial session
- [ ] Airplane mode during refresh shows friendly error (no corrupt session)

## Tracking

When implementing, add unit tests around the storage adapter and a Maestro flow: sign in → kill app → relaunch → still signed in → sign out → relaunch → login screen.
