import "../demo.css";
import { SignInButton } from "@/components/sign-in-button";
import {
  OpenRouterAuthProvider,
  useOpenRouterAuth,
} from "@/hooks/use-openrouter-auth";
import { CodeBlock } from "./CodeBlock";

const VARIANTS = ["default", "minimal", "branded", "icon", "cta"] as const;

const OAUTH_DOCS_URL = "https://openrouter.ai/docs/guides/overview/auth/oauth";
const GITHUB_URL = "https://github.com/openrouterteam/sign-in-with-openrouter";

type SkillTab = "oauth" | "sdk";

const SKILL_OAUTH = `# Sign In with OpenRouter — OAuth API

Implement OpenRouter OAuth (PKCE) with a beautiful sign-in button.
No client registration, no backend, no secrets required.

## Auth Module

Drop this file into your project to handle the full OAuth PKCE flow:

\`\`\`typescript
// lib/openrouter-auth.ts
const STORAGE_KEY = "openrouter_api_key";
const VERIFIER_KEY = "openrouter_code_verifier";

type AuthListener = () => void;
const listeners = new Set<AuthListener>();

export function onAuthChange(fn: AuthListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

// Sync auth state across tabs
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) notifyListeners();
  });
}

export function getApiKey(): string | null {
  return typeof window !== "undefined"
    ? localStorage.getItem(STORAGE_KEY)
    : null;
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key);
  notifyListeners();
}

export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
  notifyListeners();
}

export function hasOAuthCallbackPending(): boolean {
  return typeof window !== "undefined"
    && sessionStorage.getItem(VERIFIER_KEY) !== null;
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
}

async function computeS256Challenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
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
  window.location.href = \\\`https://openrouter.ai/auth?\\\${params}\\\`;
}

export async function handleOAuthCallback(code: string): Promise<void> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("Missing code verifier");
  sessionStorage.removeItem(VERIFIER_KEY);
  const res = await fetch("https://openrouter.ai/api/v1/auth/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      code_verifier: verifier,
      code_challenge_method: "S256",
    }),
  });
  if (!res.ok) throw new Error(\\\`Key exchange failed (\\\${res.status})\\\`);
  const { key } = await res.json();
  setApiKey(key);
}
\`\`\`

## SignInButton Component

\`\`\`tsx
// components/sign-in-button.tsx
import { initiateOAuth } from "./lib/openrouter-auth";

// OpenRouter logo SVG
function OpenRouterLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512"
      fill="currentColor" stroke="currentColor">
      <path d="M3 248.945C18 248.945 76 236 106 219C136 202 136 202 198 158C276.497 102.293 332 120.945 423 120.945" strokeWidth="90"/>
      <path d="M511 121.5L357.25 210.268L357.25 32.7324L511 121.5Z"/>
      <path d="M0 249C15 249 73 261.945 103 278.945C133 295.945 133 295.945 195 339.945C273.497 395.652 329 377 420 377" strokeWidth="90"/>
      <path d="M508 376.445L354.25 287.678L354.25 465.213L508 376.445Z"/>
    </svg>
  );
}

interface SignInButtonProps {
  variant?: "default" | "minimal" | "branded" | "icon" | "cta";
  size?: "sm" | "default" | "lg" | "xl";
  label?: string;
  showLogo?: boolean;
  logoPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function SignInButton({
  variant = "default",
  size = "default",
  label,
  showLogo = true,
  logoPosition = "left",
  loading = false,
  disabled = false,
  onClick,
}: SignInButtonProps) {
  const handleClick = onClick ?? (() => initiateOAuth());
  const isIcon = variant === "icon";
  const text = label ?? (isIcon ? undefined : "Sign in with OpenRouter");

  // Size classes
  const sizeClass = {
    sm: "h-8 px-3 text-xs",
    default: "h-10 px-5 text-sm",
    lg: "h-12 px-8 text-base",
    xl: "h-14 px-10 text-lg",
  }[size];

  // Variant classes (Tailwind)
  const variantClass = {
    default: "rounded-lg border border-neutral-300 bg-white text-neutral-900 shadow-sm hover:bg-neutral-50",
    minimal: "text-neutral-700 underline-offset-4 hover:underline",
    branded: "rounded-lg bg-neutral-900 text-white shadow hover:bg-neutral-800",
    icon: "rounded-lg border border-neutral-300 bg-white text-neutral-900 shadow-sm hover:bg-neutral-50 aspect-square",
    cta: "rounded-xl bg-neutral-900 text-white shadow-lg hover:bg-neutral-800 hover:scale-[1.02] active:scale-[0.98]",
  }[variant];

  const logoSize = size === "sm" ? 14 : size === "xl" ? 20 : 16;

  return (
    <button
      className={\\\`inline-flex items-center justify-center gap-2 font-medium transition-all cursor-pointer disabled:opacity-50 \\\${sizeClass} \\\${variantClass}\\\`}
      disabled={disabled || loading}
      onClick={handleClick}
    >
      {loading ? "..." : (
        <>
          {logoPosition === "left" && showLogo && <OpenRouterLogo size={logoSize} />}
          {text && <span>{text}</span>}
          {logoPosition === "right" && showLogo && <OpenRouterLogo size={logoSize} />}
        </>
      )}
    </button>
  );
}
\`\`\`

## Quick Start

\`\`\`tsx
// App.tsx
import { SignInButton } from "./components/sign-in-button";
import { getApiKey, clearApiKey, handleOAuthCallback, hasOAuthCallbackPending } from "./lib/openrouter-auth";
import { useEffect, useState } from "react";

function App() {
  const [apiKey, setApiKey] = useState(getApiKey());

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code && hasOAuthCallbackPending()) {
      handleOAuthCallback(code).then(() => {
        window.history.replaceState({}, "", window.location.pathname);
        setApiKey(getApiKey());
      });
    }
  }, []);

  if (apiKey) {
    return (
      <div>
        <p>Authenticated: {apiKey.slice(0, 12)}...</p>
        <button onClick={() => { clearApiKey(); setApiKey(null); }}>Sign out</button>
      </div>
    );
  }

  return <SignInButton />;
}
\`\`\`

## Button Variants

| Variant   | Description                              |
|-----------|------------------------------------------|
| \`default\` | White bordered button with logo          |
| \`minimal\` | Text-only link, underline on hover       |
| \`branded\` | Dark background, white text              |
| \`icon\`    | Logo only, square aspect ratio           |
| \`cta\`     | Landing page button with scale animation |

## Button Props

| Prop           | Type                                      | Default                      |
|----------------|-------------------------------------------|------------------------------|
| \`variant\`      | \`default · minimal · branded · icon · cta\` | \`default\`                    |
| \`size\`         | \`sm · default · lg · xl\`                   | \`default\`                    |
| \`label\`        | \`string\`                                   | \`"Sign in with OpenRouter"\` |
| \`showLogo\`     | \`boolean\`                                  | \`true\`                       |
| \`logoPosition\` | \`left · right\`                             | \`left\`                       |
| \`loading\`      | \`boolean\`                                  | \`false\`                      |
| \`disabled\`     | \`boolean\`                                  | \`false\`                      |
| \`onClick\`      | \`function\`                                 | auto-wired to OAuth          |

## Using the API Key

\`\`\`typescript
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": \\\`Bearer \\\${apiKey}\\\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "openai/gpt-4o-mini",
    messages: [{ role: "user", content: "Hello!" }],
  }),
});
\`\`\``;

const SKILL_SDK = `# Sign In with OpenRouter — TypeScript SDK

Use the \`@openrouter/sdk\` for OAuth and completions with full type safety, plus a beautiful sign-in button.

## Install

\`\`\`bash
npm install @openrouter/sdk
\`\`\`

## Auth Module

\`\`\`typescript
// lib/openrouter-auth.ts
const STORAGE_KEY = "openrouter_api_key";
const VERIFIER_KEY = "openrouter_code_verifier";

type AuthListener = () => void;
const listeners = new Set<AuthListener>();

export function onAuthChange(fn: AuthListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === STORAGE_KEY) notifyListeners();
  });
}

export function getApiKey(): string | null {
  return typeof window !== "undefined"
    ? localStorage.getItem(STORAGE_KEY)
    : null;
}

export function setApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key);
  notifyListeners();
}

export function clearApiKey(): void {
  localStorage.removeItem(STORAGE_KEY);
  notifyListeners();
}

export function hasOAuthCallbackPending(): boolean {
  return typeof window !== "undefined"
    && sessionStorage.getItem(VERIFIER_KEY) !== null;
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
}

async function computeS256Challenge(verifier: string): Promise<string> {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\\+/g, "-").replace(/\\//g, "_").replace(/=+$/, "");
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
  window.location.href = \\\`https://openrouter.ai/auth?\\\${params}\\\`;
}

export async function handleOAuthCallback(code: string): Promise<void> {
  const verifier = sessionStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("Missing code verifier");
  sessionStorage.removeItem(VERIFIER_KEY);
  const res = await fetch("https://openrouter.ai/api/v1/auth/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      code_verifier: verifier,
      code_challenge_method: "S256",
    }),
  });
  if (!res.ok) throw new Error(\\\`Key exchange failed (\\\${res.status})\\\`);
  const { key } = await res.json();
  setApiKey(key);
}
\`\`\`

## SignInButton Component

\`\`\`tsx
// components/sign-in-button.tsx
import { initiateOAuth } from "./lib/openrouter-auth";

function OpenRouterLogo({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512"
      fill="currentColor" stroke="currentColor">
      <path d="M3 248.945C18 248.945 76 236 106 219C136 202 136 202 198 158C276.497 102.293 332 120.945 423 120.945" strokeWidth="90"/>
      <path d="M511 121.5L357.25 210.268L357.25 32.7324L511 121.5Z"/>
      <path d="M0 249C15 249 73 261.945 103 278.945C133 295.945 133 295.945 195 339.945C273.497 395.652 329 377 420 377" strokeWidth="90"/>
      <path d="M508 376.445L354.25 287.678L354.25 465.213L508 376.445Z"/>
    </svg>
  );
}

interface SignInButtonProps {
  variant?: "default" | "minimal" | "branded" | "icon" | "cta";
  size?: "sm" | "default" | "lg" | "xl";
  label?: string;
  showLogo?: boolean;
  logoPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
}

export function SignInButton({
  variant = "default",
  size = "default",
  label,
  showLogo = true,
  logoPosition = "left",
  loading = false,
  disabled = false,
  onClick,
}: SignInButtonProps) {
  const handleClick = onClick ?? (() => initiateOAuth());
  const isIcon = variant === "icon";
  const text = label ?? (isIcon ? undefined : "Sign in with OpenRouter");

  const sizeClass = {
    sm: "h-8 px-3 text-xs",
    default: "h-10 px-5 text-sm",
    lg: "h-12 px-8 text-base",
    xl: "h-14 px-10 text-lg",
  }[size];

  const variantClass = {
    default: "rounded-lg border border-neutral-300 bg-white text-neutral-900 shadow-sm hover:bg-neutral-50",
    minimal: "text-neutral-700 underline-offset-4 hover:underline",
    branded: "rounded-lg bg-neutral-900 text-white shadow hover:bg-neutral-800",
    icon: "rounded-lg border border-neutral-300 bg-white text-neutral-900 shadow-sm hover:bg-neutral-50 aspect-square",
    cta: "rounded-xl bg-neutral-900 text-white shadow-lg hover:bg-neutral-800 hover:scale-[1.02] active:scale-[0.98]",
  }[variant];

  const logoSize = size === "sm" ? 14 : size === "xl" ? 20 : 16;

  return (
    <button
      className={\\\`inline-flex items-center justify-center gap-2 font-medium transition-all cursor-pointer disabled:opacity-50 \\\${sizeClass} \\\${variantClass}\\\`}
      disabled={disabled || loading}
      onClick={handleClick}
    >
      {loading ? "..." : (
        <>
          {logoPosition === "left" && showLogo && <OpenRouterLogo size={logoSize} />}
          {text && <span>{text}</span>}
          {logoPosition === "right" && showLogo && <OpenRouterLogo size={logoSize} />}
        </>
      )}
    </button>
  );
}
\`\`\`

## Quick Start

\`\`\`tsx
// App.tsx
import { SignInButton } from "./components/sign-in-button";
import { getApiKey, clearApiKey, handleOAuthCallback, hasOAuthCallbackPending } from "./lib/openrouter-auth";
import { useEffect, useState } from "react";

function App() {
  const [apiKey, setApiKey] = useState(getApiKey());

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");
    if (code && hasOAuthCallbackPending()) {
      handleOAuthCallback(code).then(() => {
        window.history.replaceState({}, "", window.location.pathname);
        setApiKey(getApiKey());
      });
    }
  }, []);

  if (apiKey) {
    return (
      <div>
        <p>Authenticated: {apiKey.slice(0, 12)}...</p>
        <button onClick={() => { clearApiKey(); setApiKey(null); }}>Sign out</button>
      </div>
    );
  }

  return <SignInButton />;
}
\`\`\`

## Calling Models with the SDK

\`\`\`typescript
import OpenRouter from "@openrouter/sdk";

const client = new OpenRouter({ apiKey });

const result = client.callModel({
  model: "openai/gpt-4o-mini",
  input: "Hello!",
});

const text = await result.getText();
console.log(text);
\`\`\`

## Streaming

\`\`\`typescript
const result = client.callModel({
  model: "openai/gpt-4o-mini",
  input: "Write a short poem about the ocean.",
});

for await (const delta of result.getTextStream()) {
  process.stdout.write(delta);
}
\`\`\`

## Button Variants

| Variant   | Description                              |
|-----------|------------------------------------------|
| \`default\` | White bordered button with logo          |
| \`minimal\` | Text-only link, underline on hover       |
| \`branded\` | Dark background, white text              |
| \`icon\`    | Logo only, square aspect ratio           |
| \`cta\`     | Landing page button with scale animation |

## Button Props

| Prop           | Type                                      | Default                      |
|----------------|-------------------------------------------|------------------------------|
| \`variant\`      | \`default · minimal · branded · icon · cta\` | \`default\`                    |
| \`size\`         | \`sm · default · lg · xl\`                   | \`default\`                    |
| \`label\`        | \`string\`                                   | \`"Sign in with OpenRouter"\` |
| \`showLogo\`     | \`boolean\`                                  | \`true\`                       |
| \`logoPosition\` | \`left · right\`                             | \`left\`                       |
| \`loading\`      | \`boolean\`                                  | \`false\`                      |
| \`disabled\`     | \`boolean\`                                  | \`false\`                      |
| \`onClick\`      | \`function\`                                 | auto-wired to OAuth          |`;

function HeroAction() {
  const { isAuthenticated, apiKey, signOut } = useOpenRouterAuth();

  if (isAuthenticated) {
    return (
      <div className="auth-status">
        <span className="auth-key">
          Authenticated: {apiKey?.slice(0, 12)}...
        </span>
        <button onClick={signOut} className="sign-out-btn">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="hero-button">
      <SignInButton variant="branded" size="xl" />
    </div>
  );
}

function MarkdownViewer({ content }: { content: string }) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code blocks
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <CodeBlock key={elements.length} code={codeLines.join("\n")} lang={lang || "text"} />
      );
      continue;
    }

    // Tables
    if (line.includes("|") && line.trim().startsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim().startsWith("|")) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) {
        const headerCells = tableLines[0].split("|").filter(c => c.trim()).map(c => c.trim());
        const bodyRows = tableLines.slice(2); // skip header + separator
        elements.push(
          <div key={elements.length} className="md-table-wrap">
            <table className="md-table">
              <thead>
                <tr>
                  {headerCells.map((cell, ci) => <th key={ci}>{renderInline(cell)}</th>)}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((row, ri) => {
                  const cells = row.split("|").filter(c => c.trim()).map(c => c.trim());
                  return (
                    <tr key={ri}>
                      {cells.map((cell, ci) => <td key={ci}>{renderInline(cell)}</td>)}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }
      continue;
    }

    // Headings
    if (line.startsWith("# ")) {
      elements.push(<h1 key={elements.length} className="md-h1">{line.slice(2)}</h1>);
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h2 key={elements.length} className="md-h2">{line.slice(3)}</h2>);
      i++;
      continue;
    }
    if (line.startsWith("### ")) {
      elements.push(<h3 key={elements.length} className="md-h3">{line.slice(4)}</h3>);
      i++;
      continue;
    }

    // Horizontal rule (lines like `---`)
    if (/^-{3,}$/.test(line.trim())) {
      elements.push(<hr key={elements.length} className="md-hr" />);
      i++;
      continue;
    }

    // Empty line
    if (line.trim() === "") {
      i++;
      continue;
    }

    // Paragraph
    elements.push(<p key={elements.length} className="md-p">{renderInline(line)}</p>);
    i++;
  }

  return <>{elements}</>;
}

function renderInline(text: string): React.ReactNode {
  // Handle inline code
  const parts: React.ReactNode[] = [];
  const regex = /`([^`]+)`/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(<code key={match.index} className="md-inline-code">{match[1]}</code>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length === 1 ? parts[0] : <>{parts}</>;
}

function DemoContent() {
  const [activeTab, setActiveTab] = React.useState<SkillTab>("oauth");
  const activeContent = activeTab === "oauth" ? SKILL_OAUTH : SKILL_SDK;

  return (
    <div className="demo-container">
      <header className="demo-header">
        <h1>Sign In with OpenRouter</h1>
        <p>
          Beautiful, framework-agnostic buttons for{" "}
          <a href={OAUTH_DOCS_URL} className="header-link" target="_blank" rel="noopener noreferrer">
            OpenRouter OAuth
          </a>
        </p>
        <HeroAction />
      </header>

      <section id="skill" className="demo-section">
        <h2>Skill</h2>
        <div className="skill-tabs">
          <button
            className={`skill-tab${activeTab === "oauth" ? " skill-tab--active" : ""}`}
            onClick={() => setActiveTab("oauth")}
            type="button"
          >
            API (fetch)
          </button>
          <button
            className={`skill-tab${activeTab === "sdk" ? " skill-tab--active" : ""}`}
            onClick={() => setActiveTab("sdk")}
            type="button"
          >
            SDK
          </button>
        </div>
        <div className="skill-viewer">
          <SkillCopyButton content={activeContent} />
          <div className="skill-content">
            <MarkdownViewer content={activeContent} />
          </div>
        </div>
      </section>

      <section className="demo-section">
        <h2>Variants</h2>
        <div className="demo-grid">
          {VARIANTS.map((variant) => (
            <div key={variant} className="demo-card">
              <span className="demo-label">{variant}</span>
              <SignInButton variant={variant} />
              <CodeBlock
                code={`<SignInButton variant="${variant}" />`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="demo-section">
        <h2>Options</h2>
        <div className="demo-grid">
          <div className="demo-card">
            <span className="demo-label">Custom label</span>
            <SignInButton label="Connect OpenRouter" />
          </div>
          <div className="demo-card">
            <span className="demo-label">Logo right</span>
            <SignInButton logoPosition="right" />
          </div>
          <div className="demo-card">
            <span className="demo-label">No logo</span>
            <SignInButton showLogo={false} />
          </div>
          <div className="demo-card">
            <span className="demo-label">Loading</span>
            <SignInButton loading />
          </div>
          <div className="demo-card">
            <span className="demo-label">Disabled</span>
            <SignInButton disabled />
          </div>
        </div>
      </section>

      <footer className="demo-footer">
        <a href={OAUTH_DOCS_URL} target="_blank" rel="noopener noreferrer">
          OpenRouter OAuth Docs
        </a>
        <span className="footer-sep">&middot;</span>
        <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
          GitHub
        </a>
      </footer>
    </div>
  );
}

function SkillCopyButton({ content }: { content: string }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button onClick={handleCopy} className="skill-copy-btn" type="button">
      {copied ? "Copied!" : "Copy Skill"}
    </button>
  );
}

import React from "react";

export function App() {
  return (
    <OpenRouterAuthProvider>
      <DemoContent />
    </OpenRouterAuthProvider>
  );
}
