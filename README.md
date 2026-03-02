# Sign In with OpenRouter

Beautiful, drop-in React components for "Sign In with OpenRouter" using PKCE OAuth. No client registration, no backend, no secrets.

## Install

```bash
npm install sign-in-with-openrouter
```

Requires React 18+ and [Tailwind CSS](https://tailwindcss.com/) for styling.

## Quick Start

```tsx
import { SignInButton, OpenRouterAuthProvider, useOpenRouterAuth } from "sign-in-with-openrouter";

function App() {
  return (
    <OpenRouterAuthProvider>
      <MyApp />
    </OpenRouterAuthProvider>
  );
}

function MyApp() {
  const { isAuthenticated, apiKey, signOut } = useOpenRouterAuth();

  if (isAuthenticated) {
    return (
      <div>
        <p>Ready to use OpenRouter! Key: {apiKey?.slice(0, 12)}...</p>
        <button onClick={signOut}>Sign out</button>
      </div>
    );
  }

  // Automatically wired — just drop it in and it works
  return <SignInButton />;
}
```

That's it. The `<SignInButton />` automatically connects to the `OpenRouterAuthProvider` context — no `onClick` wiring needed.

## Features

- **Zero config** — No client ID, no client secret, no OAuth app registration
- **No backend required** — PKCE OAuth runs entirely in the browser
- **Auto-wired button** — `<SignInButton />` just works inside `<OpenRouterAuthProvider>`
- **Multi-tab sync** — Sign in/out in one tab and all tabs update instantly
- **SSR safe** — Works in SSR environments (Next.js, Remix) without crashing
- **React 18 & 19** — Handles StrictMode double-mount correctly
- **TypeScript** — Full type exports including `OpenRouterAuthContext` and `SignInButtonProps`
- **5 button variants** — `default`, `minimal`, `branded`, `icon`, `cta`
- **4 sizes** — `sm`, `default`, `lg`, `xl`
- **Customizable** — Custom labels, logo position, loading states

## Button Variants

| Variant | Description |
|---------|-------------|
| `default` | White bordered button with logo |
| `minimal` | Text-only, underline on hover |
| `branded` | Dark background, white text |
| `icon` | Logo only, square |
| `cta` | Large landing page button with scale effect |

```tsx
<SignInButton variant="default" />
<SignInButton variant="minimal" />
<SignInButton variant="branded" />
<SignInButton variant="icon" />
<SignInButton variant="cta" size="xl" />
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `default \| minimal \| branded \| icon \| cta` | `default` | Button style |
| `size` | `sm \| default \| lg \| xl` | `default` | Button size |
| `label` | `string` | `"Sign in with OpenRouter"` | Button text |
| `showLogo` | `boolean` | `true` | Show OpenRouter logo |
| `logoPosition` | `left \| right` | `left` | Logo position |
| `loading` | `boolean` | auto | Show loading spinner (auto-detected from auth state) |
| `onClick` | `function` | auto | Click handler (auto-wired to `signIn()` when inside provider) |

## Auth Hook

```tsx
const {
  apiKey,          // string | null — the OpenRouter API key
  isAuthenticated, // boolean
  isLoading,       // boolean — true during OAuth callback exchange
  signIn,          // (callbackUrl?: string) => Promise<void>
  signOut,         // () => void
  error,           // string | null
} = useOpenRouterAuth();
```

## Using the API Key

After sign-in, use the key with OpenRouter's OpenAI-compatible API:

```tsx
const { apiKey } = useOpenRouterAuth();

const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "openai/gpt-4o-mini",
    messages: [{ role: "user", content: "Hello!" }],
  }),
});
```

Or with the OpenAI SDK:

```tsx
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: apiKey,
  dangerouslyAllowBrowser: true,
});
```

## Standalone Auth Functions

If you need lower-level control or aren't using React:

```ts
import {
  initiateOAuth,
  handleOAuthCallback,
  getApiKey,
  setApiKey,
  clearApiKey,
  onAuthChange,
} from "sign-in-with-openrouter";

// Start OAuth flow
await initiateOAuth("https://myapp.com/callback");

// Handle the callback (exchange code for key)
const code = new URLSearchParams(window.location.search).get("code");
if (code) await handleOAuthCallback(code);

// Read/manage the stored key
const key = getApiKey();
clearApiKey();

// Listen for auth changes (including from other tabs)
const unsubscribe = onAuthChange(() => {
  console.log("Auth changed:", getApiKey());
});
```

## Server-Side Key Exchange

For apps with a backend (API routes, server actions):

```ts
import { exchangeCodeForKey } from "sign-in-with-openrouter";

// In your API route
const key = await exchangeCodeForKey(code, codeVerifier);
```

## How It Works

OpenRouter supports PKCE OAuth without client registration:

1. Generate a random `code_verifier` and compute its S256 `code_challenge`
2. Redirect to `https://openrouter.ai/auth` with the challenge
3. User authenticates on OpenRouter and is redirected back with `?code=...`
4. Exchange the code + verifier for an API key via `POST /api/v1/auth/keys`
5. Key is stored in `localStorage` and available via `getApiKey()` or `useOpenRouterAuth()`

The `?code=` parameter is only processed when a matching `code_verifier` exists in `sessionStorage`, preventing collisions with other query parameters.

## Security Notes

- API keys are stored in `localStorage` — any JavaScript on the page can access them. This is a known tradeoff for backend-less apps.
- The PKCE code verifier is stored in `sessionStorage` (per-tab, cleared on tab close) for security.
- Consider Content Security Policy and XSS protections for production apps.

## Claude Code Skill

This repo includes a Claude Code skill at `.claude/skills/openrouter-oauth/SKILL.md` with copy-paste implementation templates for React+Vite, Next.js App Router, and plain HTML.

## License

MIT
