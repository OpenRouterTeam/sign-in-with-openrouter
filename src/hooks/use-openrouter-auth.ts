import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import React from "react";
import {
  getApiKey,
  setApiKey as storeApiKey,
  clearApiKey,
  onAuthChange,
  initiateOAuth,
  handleOAuthCallback,
  hasOAuthCallbackPending,
} from "@/lib/openrouter-auth";
import { SignInButtonAuthContext } from "@/components/sign-in-button";

export interface OpenRouterAuthContext {
  apiKey: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (callbackUrl?: string) => Promise<void>;
  signOut: () => void;
  error: string | null;
}

const AuthContext = createContext<OpenRouterAuthContext | null>(null);

export function OpenRouterAuthProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useState<string | null>(getApiKey());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callbackProcessed = useRef(false);

  // Listen for auth changes (including from other tabs via storage events)
  useEffect(() => {
    return onAuthChange(() => {
      setApiKey(getApiKey());
    });
  }, []);

  // Handle OAuth callback on mount
  useEffect(() => {
    // Guard against StrictMode double-mount
    if (callbackProcessed.current) return;

    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    // Only process ?code= if we initiated an OAuth flow (verifier exists)
    if (code && hasOAuthCallbackPending()) {
      callbackProcessed.current = true;
      setIsLoading(true);
      handleOAuthCallback(code)
        .then(() => {
          // Clean the URL
          const url = new URL(window.location.href);
          url.searchParams.delete("code");
          window.history.replaceState({}, "", url.toString());
          setApiKey(getApiKey());
        })
        .catch((err) => {
          setError(err.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, []);

  const signIn = useCallback(async (callbackUrl?: string) => {
    setError(null);
    await initiateOAuth(callbackUrl);
  }, []);

  const signOut = useCallback(() => {
    clearApiKey();
    setApiKey(null);
    setError(null);
  }, []);

  const authValue = {
    apiKey,
    isAuthenticated: apiKey !== null,
    isLoading,
    signIn,
    signOut,
    error,
  };

  // Provide auth context to both useOpenRouterAuth consumers and auto-wired SignInButtons
  return React.createElement(
    AuthContext.Provider,
    { value: authValue },
    React.createElement(
      SignInButtonAuthContext.Provider,
      { value: { signIn, isLoading } },
      children
    )
  );
}

export function useOpenRouterAuth(): OpenRouterAuthContext {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error(
      "useOpenRouterAuth must be used within <OpenRouterAuthProvider>"
    );
  }
  return ctx;
}
