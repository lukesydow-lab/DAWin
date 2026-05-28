/**
 * server/jwt.ts
 *
 * JWT sign/verify utilities using `jose` (HS256).
 *
 * Secret: read from JWT_SECRET env var; falls back to a dev default with a
 * console warning so the server still starts locally without configuration.
 *
 * Expiry:
 *   - Regular users: 8 hours
 *   - Guests (isGuest: true): 72 hours (longer window to avoid session loss
 *     for anonymous collaborators who cannot re-authenticate)
 */

import { SignJWT, jwtVerify } from "jose";
import type { JwtClaims } from "./types.js";

// ---------------------------------------------------------------------------
// Extended claims — types.ts is read-only so we extend locally.
// displayName is embedded in the JWT so WS handler can resolve it without a
// DB lookup on connect. Optional: tokens minted before this field was added
// will return undefined; callers should default to 'Unknown'.
// ---------------------------------------------------------------------------

export interface JwtClaimsWithDisplay extends JwtClaims {
  displayName?: string;
}

// ---------------------------------------------------------------------------
// Secret resolution
// ---------------------------------------------------------------------------

const DEV_FALLBACK_SECRET = "dawin-dev-secret-change-in-prod";

function getSecret(): Uint8Array {
  const raw = process.env["JWT_SECRET"];
  if (!raw) {
    console.warn(
      "[jwt] WARNING: JWT_SECRET env var is not set. " +
        "Using insecure dev fallback. Set JWT_SECRET before deploying."
    );
    return new TextEncoder().encode(DEV_FALLBACK_SECRET);
  }
  return new TextEncoder().encode(raw);
}

// Resolve once at module load — the secret is stable for the server lifetime.
const SECRET = getSecret();

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Sign a JWT for the given claims.
 * `iat` and `exp` are set by jose — do not pass them in `claims`.
 * `displayName` is optional but should be passed when available so the WS handler
 * can resolve it without a DB lookup on connect.
 */
export async function signToken(
  claims: Omit<JwtClaimsWithDisplay, "iat" | "exp">
): Promise<string> {
  const expiry = claims.isGuest ? "72h" : "8h";

  return new SignJWT({
    sub: claims.sub,
    sessionId: claims.sessionId,
    role: claims.role,
    color: claims.color,
    isGuest: claims.isGuest,
    ...(claims.displayName !== undefined ? { displayName: claims.displayName } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiry)
    .sign(SECRET);
}

/**
 * Verify a JWT and return the decoded claims (including optional displayName).
 * Throws if the token is invalid, expired, or has an unexpected algorithm.
 * Callers are responsible for handling the thrown error (e.g., return 401).
 */
export async function verifyToken(token: string): Promise<JwtClaimsWithDisplay> {
  const { payload } = await jwtVerify(token, SECRET, {
    algorithms: ["HS256"],
  });

  // jose puts custom claims at the top level of payload alongside iat/exp/sub.
  return {
    sub: payload["sub"] as string,
    sessionId: payload["sessionId"] as string,
    role: payload["role"] as JwtClaims["role"],
    color: payload["color"] as string,
    isGuest: Boolean(payload["isGuest"]),
    iat: payload["iat"] as number,
    exp: payload["exp"] as number,
    ...(typeof payload["displayName"] === "string"
      ? { displayName: payload["displayName"] }
      : {}),
  };
}
