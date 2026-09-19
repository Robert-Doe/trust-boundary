// Small shared helpers used by both the CSP and Trusted Types panes.

/** Generate a fresh random nonce the same way Module 5's server does
 * (crypto.randomBytes(16).toString('base64')) — here via WebCrypto since
 * this all runs client-side with no backend. */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bytesToBase64(bytes);
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/** SHA-256, base64-encoded — the exact source hash format CSP's
 * 'sha256-...' script-src expression expects (matches Module 6). */
export async function sha256Base64(exact: string): Promise<string> {
  const data = new TextEncoder().encode(exact);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToBase64(new Uint8Array(digest));
}

/** Extract the exact byte content of the first inline <script> tag in an
 * HTML fragment that has no src= and no nonce= attribute — i.e. the one a
 * hash-source policy would need to allowlist. Byte-exactness matters: see
 * Module 6's DECISIONS.md ("not one character can differ"). */
export function extractFirstHashableInlineScript(html: string): string | null {
  const re = /<script(?![^>]*\bsrc\s*=)(?![^>]*\bnonce\s*=)[^>]*>([\s\S]*?)<\/script>/i;
  const m = re.exec(html);
  return m ? m[1] : null;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

let uid = 0;
export function nextId(prefix: string): string {
  uid += 1;
  return `${prefix}-${uid}`;
}
