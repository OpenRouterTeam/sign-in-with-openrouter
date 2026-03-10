import React from "react";
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
const SKILL_RAW_URL =
  "https://raw.githubusercontent.com/OpenRouterTeam/skills/main/skills/openrouter-oauth/SKILL.md";
const SKILL_GITHUB_URL =
  "https://github.com/OpenRouterTeam/skills/blob/main/skills/openrouter-oauth/SKILL.md";

function stripFrontmatter(md: string): string {
  if (!md.startsWith("---")) return md;
  const end = md.indexOf("---", 3);
  if (end === -1) return md;
  return md.slice(end + 3).trimStart();
}

function useSkillContent() {
  const [content, setContent] = React.useState<string | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    fetch(SKILL_RAW_URL)
      .then((res) => {
        if (!res.ok) throw new Error(`${res.status}`);
        return res.text();
      })
      .then((text) => setContent(stripFrontmatter(text)))
      .catch(() => setError(true));
  }, []);

  return { content, loading: content === null && !error, error };
}


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
  const { content: skillContent, loading: skillLoading, error: skillError } = useSkillContent();

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
        <div className="skill-header">
          <h2>Skill</h2>
          <a href={SKILL_GITHUB_URL} className="skill-github-link" target="_blank" rel="noopener noreferrer">
            View on GitHub
          </a>
        </div>
        <div className="skill-viewer">
          {skillContent && <SkillCopyButton content={skillContent} />}
          <div className="skill-content">
            {skillLoading && <p className="md-p">Loading skill...</p>}
            {skillError && <p className="md-p">Failed to load skill. <a href={SKILL_GITHUB_URL} target="_blank" rel="noopener noreferrer">View on GitHub</a></p>}
            {skillContent && <MarkdownViewer content={skillContent} />}
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

export function App() {
  return (
    <OpenRouterAuthProvider>
      <DemoContent />
    </OpenRouterAuthProvider>
  );
}
