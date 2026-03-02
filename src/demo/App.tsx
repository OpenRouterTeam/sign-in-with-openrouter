import "../demo.css";
import { SignInButton } from "@/components/sign-in-button";
import {
  OpenRouterAuthProvider,
  useOpenRouterAuth,
} from "@/hooks/use-openrouter-auth";
import { CodeBlock } from "./CodeBlock";

const VARIANTS = ["default", "minimal", "branded", "icon", "cta"] as const;

const OAUTH_DOCS_URL = "https://openrouter.ai/docs/features/oauth";
const GITHUB_URL = "https://github.com/openrouterteam/sign-in-with-openrouter";

const SKILL_CONTENT = `# Sign In with OpenRouter — Claude Code Skill

Implement OpenRouter OAuth authentication in any project.
No client registration, no backend, no secrets required.

## Install

\`\`\`bash
npm install sign-in-with-openrouter
\`\`\`

## Quick Start

\`\`\`tsx
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
    return <button onClick={signOut}>Sign out</button>;
  }

  return <SignInButton />;
}
\`\`\`

## Button Customization

### Variants

| Variant   | Description                              |
|-----------|------------------------------------------|
| \`default\` | White bordered button with logo          |
| \`minimal\` | Text-only link, underline on hover       |
| \`branded\` | Dark background, white text              |
| \`icon\`    | Logo only, square aspect ratio           |
| \`cta\`     | Landing page button with scale animation |

### Sizes

\`sm\` · \`default\` · \`lg\` · \`xl\`

### Props

| Prop           | Type                                      | Default                      |
|----------------|-------------------------------------------|------------------------------|
| \`variant\`      | \`default · minimal · branded · icon · cta\` | \`default\`                    |
| \`size\`         | \`sm · default · lg · xl\`                   | \`default\`                    |
| \`label\`        | \`string\`                                   | \`"Sign in with OpenRouter"\` |
| \`showLogo\`     | \`boolean\`                                  | \`true\`                       |
| \`logoPosition\` | \`left · right\`                             | \`left\`                       |
| \`loading\`      | \`boolean\`                                  | auto from auth state         |
| \`onClick\`      | \`function\`                                 | auto-wired to \`signIn()\`     |

### Examples

\`\`\`tsx
{/* Variants */}
<SignInButton variant="branded" />
<SignInButton variant="cta" size="xl" />
<SignInButton variant="icon" />

{/* Custom label */}
<SignInButton label="Connect OpenRouter" />

{/* Logo on the right */}
<SignInButton logoPosition="right" />

{/* No logo */}
<SignInButton showLogo={false} />

{/* Custom click handler */}
<SignInButton onClick={() => signIn("/custom-callback")} />
\`\`\`

## Auth Hook

\`\`\`tsx
const {
  apiKey,          // string | null
  isAuthenticated, // boolean
  isLoading,       // boolean — true during OAuth exchange
  signIn,          // (callbackUrl?: string) => Promise<void>
  signOut,         // () => void
  error,           // string | null
} = useOpenRouterAuth();
\`\`\`

## Using the API Key

\`\`\`tsx
const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
  method: "POST",
  headers: {
    "Authorization": \`Bearer \${apiKey}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: "openai/gpt-4o-mini",
    messages: [{ role: "user", content: "Hello!" }],
  }),
});
\`\`\``;

function AuthStatus() {
  const { isAuthenticated, apiKey, signOut } = useOpenRouterAuth();

  if (!isAuthenticated) return null;

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
  return (
    <div className="demo-container">
      <header className="demo-header">
        <h1>Sign In with OpenRouter</h1>
        <p>
          Beautiful, copy-pasteable React buttons for{" "}
          <a href={OAUTH_DOCS_URL} className="header-link" target="_blank" rel="noopener noreferrer">
            OpenRouter OAuth
          </a>
        </p>
        <AuthStatus />
      </header>

      <section id="skill" className="demo-section">
        <h2>Skill</h2>
        <div className="skill-viewer">
          <SkillCopyButton content={SKILL_CONTENT} />
          <div className="skill-content">
            <MarkdownViewer content={SKILL_CONTENT} />
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
