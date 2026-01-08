# AUTH KNOWLEDGE BASE

**Generated:** 2026-01-07T22:44:30-04:00
**Commit:** d864af6
**Branch:** hello/lif-111-sync-fork-with-upstream-code-yeongyuoh-my-opencode-397

---

## OVERVIEW
Google Antigravity OAuth 2.0 with PKCE flow for secure OpenCode agent authentication.

## WHERE TO LOOK

| File | Role |
|------|------|
| `antigravity/oauth.ts` | Main flow controller; PKCE logic; ephemeral server |
| `antigravity/tokens.ts` | Token storage, expiration tracking, persistence |
| `antigravity/fetch.ts` | Auth-wrapped fetch with automatic 401 token refresh |
| `antigravity/plugin.ts` | OpenCode plugin lifecycle integration |
| `antigravity/request.ts` | Protocol-specific request builders |
| `antigravity/constants.ts` | Client IDs, Google API URIs, timeouts |

## AUTH FLOW

1. **Preparation**: Generate random `code_verifier` and S256 `code_challenge`
2. **Listener**: Boot ephemeral local HTTP server for OOB redirect
3. **Challenge**: Open browser to `accounts.google.com` with state and challenge
4. **Exchange**: Capture `code` → Exchange for tokens at `oauth2.googleapis.com`
5. **Persistence**: Store access/refresh tokens; close local listener
6. **Usage**: Call Antigravity APIs via `cloudcode-pa.googleapis.com` with Bearer headers

## PATTERNS

- **PKCE Enforcement**: Mandatory `code_challenge` for all authentication
- **Strict Timeouts**: 5-minute hard limit on callback server lifespan
- **CSRF Protection**: Unique `state` validation per request
- **Encoding**: Unified `base64URL` encoding for challenge/verifier
- **Retry Logic**: `fetch.ts` handles transparent token rotation on expiration
- **Minimal Footprint**: Ephemeral servers use random ports, bound to `127.0.0.1`
