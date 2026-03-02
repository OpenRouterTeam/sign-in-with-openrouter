// Components
export { SignInButton, signInButtonVariants } from "./components/sign-in-button";
export type { SignInButtonProps } from "./components/sign-in-button";
export { OpenRouterLogo } from "./components/openrouter-logo";

// Auth
export {
  initiateOAuth,
  handleOAuthCallback,
  getApiKey,
  setApiKey,
  clearApiKey,
  onAuthChange,
  hasOAuthCallbackPending,
  getUserEmail,
} from "./lib/openrouter-auth";

// Server auth
export {
  exchangeCodeForKey,
  getUserEmail as getUserEmailServer,
} from "./lib/openrouter-auth-server";

// Hooks
export { OpenRouterAuthProvider, useOpenRouterAuth } from "./hooks/use-openrouter-auth";
export type { OpenRouterAuthContext } from "./hooks/use-openrouter-auth";
