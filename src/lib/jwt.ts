const ROLE_CLAIMS = ["role", "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];

// Only used to detect a stale role; the backend remains the authority
export function roleInToken(accessToken: string): string | null {
  try {
    const payload = accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const claims = JSON.parse(decodeURIComponent(escape(atob(payload)))) as Record<string, unknown>;
    for (const key of ROLE_CLAIMS) if (typeof claims[key] === "string") return claims[key] as string;
  } catch {
  }
  return null;
}
