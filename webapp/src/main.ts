import './style.css';
import { initCspTab } from './csp';
import { initTrustedTypesTab } from './trustedTypes';

const app = document.querySelector<HTMLDivElement>('#app')!;

app.innerHTML = `
  <div class="topbar">
    <div class="brand">trust<span class="dot">-</span>boundary</div>
    <nav>
      <a href="https://github.com/Robert-Doe/trust-boundary" target="_blank" rel="noopener">GitHub</a>
      <a href="https://robertdoe.com">← robertdoe.com</a>
    </nav>
  </div>

  <div class="hero">
    <div class="pill">real enforcement, not a mockup</div>
    <h1>Trust Boundary <span class="accent">—</span> CSP &amp; Trusted Types Playground</h1>
    <p class="tagline">Edit a real Content-Security-Policy and an HTML/script snippet, run it inside a sandboxed iframe, and watch the browser's own <code class="inline">securitypolicyviolation</code> events and Trusted Types API decide what executes — the exact mechanics taught in this course's track1-csp-core and track2-trusted-types modules.</p>
  </div>

  <div class="tabs">
    <button class="tab-btn active" data-tab="csp">CSP Playground</button>
    <button class="tab-btn" data-tab="tt">Trusted Types Playground</button>
  </div>

  <main class="demo">
    <div class="panel" id="tab-csp"></div>
    <div class="panel" id="tab-tt" style="display:none;"></div>
  </main>

  <footer>
    Ported from the trust-boundary course (track1-csp-core / track2-trusted-types) —
    every policy and snippet preset here mirrors a real module's server-side mechanism, adapted to run client-only in a sandboxed iframe.
  </footer>
`;

initCspTab(document.querySelector('#tab-csp')!);
initTrustedTypesTab(document.querySelector('#tab-tt')!);

const tabBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('.tab-btn'));
const panels: Record<string, HTMLElement> = {
  csp: document.querySelector('#tab-csp')!,
  tt: document.querySelector('#tab-tt')!,
};

for (const btn of tabBtns) {
  btn.addEventListener('click', () => {
    for (const b of tabBtns) b.classList.remove('active');
    btn.classList.add('active');
    const key = btn.dataset.tab!;
    for (const [k, el] of Object.entries(panels)) {
      el.style.display = k === key ? 'block' : 'none';
    }
  });
}
