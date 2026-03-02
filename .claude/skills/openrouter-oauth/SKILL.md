---
name: openrouter-oauth
description: Implement "Sign In with OpenRouter" authentication using PKCE OAuth flow. No client registration needed.
---

# Sign In with OpenRouter

Implement OpenRouter OAuth (PKCE) authentication in the user's project.

## OAuth Flow

1. Generate `code_verifier` (random string) + `code_challenge` (SHA-256 base64url of verifier)
2. Redirect user to: `https://openrouter.ai/auth?callback_url=<CALLBACK>&code_challenge=<CHALLENGE>&code_challenge_method=S256`
3. User authenticates on OpenRouter, gets redirected back with `?code=<CODE>`
4. POST `https://openrouter.ai/api/v1/auth/keys` with `{ code, code_verifier, code_challenge_method: "S256" }` → `{ key }`
5. Use `key` as `Authorization: Bearer <key>` for OpenRouter API calls

No client ID or client secret needed.

## Implementation Templates

### React + Vite

Create `src/lib/openrouter-auth.ts`:

```typescript
const STORAGE_KEY = "openrouter_api_key";
const VERIFIER_KEY = "openrouter_code_verifier";

export function getApiKey(): string | null {
  return localStorage.getItem(STORAGE_KEY);
}

export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function computeS256Challenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function initiateOAuth(callbackUrl?: string): Promise<void> {
  const verifier = generateCodeVerifier();
  sessionStorage.setItem(VERIFIER_KEY, verifier);
  const challenge = await computeS256Challenge(verifier);
  const url = callbackUrl ?? window.location.origin + window.location.pathname;
  const params = new URLSearchParams({
    callback_url: url,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });
  window.location.href = `https://openrouter.ai/auth?${params.toString()}`;
}

export async function handleOAuthCallback(code: string): Promise<string> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("Missing code verifier");
  sessionStorage.removeItem(VERIFIER_KEY);

  const res = await fetch("https://openrouter.ai/api/v1/auth/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: "S256" }),
  });

  if (!res.ok) throw new Error(`Key exchange failed: ${res.status}`);
  const { key } = await res.json();
  localStorage.setItem(STORAGE_KEY, key);
  return key;
}
```

Then handle the callback in your app component:

```typescript
useEffect(() => {
  const code = new URLSearchParams(window.location.search).get("code");
  if (code) {
    handleOAuthCallback(code).then(() => {
      window.history.replaceState({}, "", window.location.pathname);
    });
  }
}, []);
```

### Next.js (App Router)

Create `app/api/openrouter/callback/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { code, code_verifier } = await req.json();

  const res = await fetch("https://openrouter.ai/api/v1/auth/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, code_verifier, code_challenge_method: "S256" }),
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Key exchange failed" }, { status: res.status });
  }

  const { key } = await res.json();
  return NextResponse.json({ key });
}
```

### Plain HTML

```html
<button id="sign-in-btn">Sign In with OpenRouter</button>
<script>
  const VERIFIER_KEY = "openrouter_code_verifier";

  function generateVerifier() {
    const arr = new Uint8Array(32);
    crypto.getRandomValues(arr);
    return btoa(String.fromCharCode(...arr))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  async function computeChallenge(verifier) {
    const data = new TextEncoder().encode(verifier);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  document.getElementById("sign-in-btn").onclick = async () => {
    const verifier = generateVerifier();
    sessionStorage.setItem(VERIFIER_KEY, verifier);
    const challenge = await computeChallenge(verifier);
    const params = new URLSearchParams({
      callback_url: location.origin + location.pathname,
      code_challenge: challenge,
      code_challenge_method: "S256",
    });
    location.href = "https://openrouter.ai/auth?" + params;
  };

  // Handle callback
  const code = new URLSearchParams(location.search).get("code");
  if (code) {
    const verifier = sessionStorage.getItem(VERIFIER_KEY);
    fetch("https://openrouter.ai/api/v1/auth/keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code, code_verifier: verifier, code_challenge_method: "S256" }),
    })
      .then(r => r.json())
      .then(({ key }) => {
        localStorage.setItem("openrouter_api_key", key);
        history.replaceState({}, "", location.pathname);
      });
  }
</script>
```

## Button Variants (CSS Fallback)

For projects not using Tailwind, use this CSS for the sign-in button:

```css
.openrouter-sign-in {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-size: 14px;
  font-weight: 500;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

/* Default: white bordered */
.openrouter-sign-in--default {
  background: white;
  color: #171717;
  border: 1px solid #d4d4d4;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.openrouter-sign-in--default:hover { background: #fafafa; border-color: #a3a3a3; }

/* Branded: dark bg */
.openrouter-sign-in--branded {
  background: #171717;
  color: white;
  border: none;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}
.openrouter-sign-in--branded:hover { background: #262626; }

/* Minimal: text only */
.openrouter-sign-in--minimal {
  background: transparent;
  color: #404040;
  border: none;
  padding: 4px 0;
  text-decoration-line: underline;
  text-underline-offset: 4px;
  text-decoration-color: transparent;
}
.openrouter-sign-in--minimal:hover { text-decoration-color: currentColor; }

/* CTA: large */
.openrouter-sign-in--cta {
  background: #171717;
  color: white;
  border: none;
  padding: 14px 32px;
  font-size: 18px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
.openrouter-sign-in--cta:hover { transform: scale(1.02); }
.openrouter-sign-in--cta:active { transform: scale(0.98); }
```

## User Email (Experimental)

```typescript
// TODO: This endpoint is undocumented and may change
async function getUserEmail(apiKey: string): Promise<string | null> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/auth/user", {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.email ?? null;
  } catch {
    return null;
  }
}
```
