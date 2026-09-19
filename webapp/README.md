# trust-boundary webapp

An interactive, real-enforcement demo: "Trust Boundary — CSP & Trusted Types
Playground". This ports the actual mechanisms taught across
`track1-csp-core` (CSP directives: no-policy baseline, nonce-based scripts,
hash-based scripts, strict-dynamic propagation) and `track2-trusted-types`
(policy factories, `createHTML` rules, sink guards, policy-name allowlisting)
into a single client-only page — no backend required.

Every test runs for real: the page builds a `<meta http-equiv=
"Content-Security-Policy">` document and loads it into a
`<iframe sandbox="allow-scripts">` (deliberately **without**
`allow-same-origin`) via `srcdoc`, then listens for real
`securitypolicyviolation` events and in-page probe reports relayed out via
`postMessage`. Nothing is faked or simulated — the browser's own CSP/Trusted
Types engine makes every allow/block decision.

## Local development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

Output goes to `dist/`.

## Deploying

Any static host works — this is a pure client-side Vite build.

- **Vercel / Netlify / Cloudflare Pages**: set the project root to `webapp`,
  build command to `npm run build`, output directory to `dist`.
