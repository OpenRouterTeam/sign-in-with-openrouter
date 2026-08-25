# Sign In with OpenRouter

Beautiful, framework-agnostic sign-in buttons for [OpenRouter OAuth](https://openrouter.ai/docs/guides/overview/auth/oauth). No client registration, no backend, no secrets.

**[Live Demo & Button Playground](https://openrouterteam.github.io/sign-in-with-openrouter/)**

## Get the Skill

The copy-pasteable OAuth skill (auth module + SignInButton component) lives in the [OpenRouter Skills](https://github.com/OpenRouterTeam/skills) repo:

```
skills/openrouter-oauth/SKILL.md
```

Install it in your AI coding agent:

| Agent | Command |
|-------|---------|
| Claude Code | `/plugin marketplace add OpenRouterTeam/skills` → `/plugin install openrouter@openrouter` |
| Cursor | Settings > Rules > Add Rule > Remote Rule: `OpenRouterTeam/skills` |
| Skills CLI | `npx skills add OpenRouterTeam/skills` |

Or just copy `SKILL.md` directly into your project.

## What's Included

The skill gives you two files to drop into any project:

1. **`lib/openrouter-auth.ts`** — Framework-agnostic PKCE OAuth flow using plain `fetch`. Handles verifier generation, redirect, code exchange, key storage in `localStorage`, and cross-tab sync.

2. **`components/sign-in-button.tsx`** — Styled button with the OpenRouter logo, 7 variants, 4 sizes, and dark mode support.

Works with React, Vue, Svelte, vanilla JS, or any framework.

## Button Variants

| Variant | Description |
|---------|-------------|
| `default` | White bordered button with logo |
| `minimal` | Text-only, underline on hover |
| `branded` | Dark background, white text |
| `icon` | Logo only, square |
| `cta` | Landing page button with scale effect |
| `brand-light` | Light button with the purple (`#7624F4`) brand logo |
| `brand-dark` | Dark button with the lime (`#C8FF00`) brand logo |

## Logo Colors

The logo defaults to `currentColor` (inherits the button's text color). To use the official brand colors, pass `logoMode` to `SignInButton` (or `mode` to `OpenRouterLogo`):

| Mode | Fill | Use on |
|------|------|--------|
| `current` (default) | Inherits text color | Anywhere |
| `light` | `#7624F4` (purple) | Light backgrounds |
| `dark` | `#C8FF00` (lime) | Dark backgrounds |

Standalone assets: `public/openrouter-logo.svg` (currentColor), `public/openrouter-logo-light.svg`, `public/openrouter-logo-dark.svg`.

## How It Works

1. User clicks the sign-in button
2. Browser redirects to `https://openrouter.ai/auth` with a PKCE code challenge
3. User authorizes on OpenRouter
4. OpenRouter redirects back with `?code=`
5. App exchanges the code for an API key via `POST /api/v1/auth/keys`
6. Key is stored in `localStorage` — ready to use with any OpenRouter model

## This Repo

This repo contains the **reference implementation** and **demo web app**:

- `src/lib/` — Auth module with full error handling, SSR safety, cross-tab sync
- `src/components/` — SignInButton with CVA variants, OpenRouterLogo SVG
- `src/hooks/` — React context provider (`OpenRouterAuthProvider`) and `useOpenRouterAuth` hook
- `src/demo/` — Interactive demo deployed to [GitHub Pages](https://openrouterteam.github.io/sign-in-with-openrouter/)

```bash
npm install
npm run dev       # Demo at localhost:5173
npm run build:demo
```

## Security Notes

- API keys are stored in `localStorage` — any JavaScript on the page can access them. This is a known tradeoff for backend-less apps.
- The PKCE code verifier is stored in `sessionStorage` (per-tab, cleared on tab close).
- Consider Content Security Policy and XSS protections for production apps.

## License

MIT
