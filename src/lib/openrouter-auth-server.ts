/**
 * Server-side key exchange for OpenRouter OAuth (Node.js).
 * Use this in API routes / server actions to exchange the auth code for a key.
 */
export async function exchangeCodeForKey(
  code: string,
  codeVerifier: string
): Promise<string> {
  const res = await fetch("https://openrouter.ai/api/v1/auth/keys", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code,
      code_verifier: codeVerifier,
      code_challenge_method: "S256",
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Key exchange failed (${res.status}): ${text}`);
  }

  const { key } = await res.json();
  return key;
}

/**
 * Get the authenticated user's email from OpenRouter.
 *
 * @experimental This endpoint is undocumented and may change.
 * TODO: Confirm the exact endpoint with the OpenRouter team.
 */
export async function getUserEmail(apiKey: string): Promise<string | null> {
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
