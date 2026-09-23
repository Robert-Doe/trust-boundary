// CSP Playground tab, real enforcement, run inside a sandboxed iframe.
//
// Every preset below is lifted directly from a track1-csp-core module's own
// mechanism (see the comment on each), not invented for this demo.
import { runInSandbox, type SandboxEvent } from './sandbox';
import { generateNonce, sha256Base64, extractFirstHashableInlineScript, escapeHtml } from './util';

interface Preset {
  label: string;
  /** Content-Security-Policy string with {{NONCE}}/{{HASH}} placeholders. Empty = no policy at all. */
  policy: string;
  snippetKey: string;
}

const POLICY_PRESETS: Record<string, Preset> = {
  none: {
    label: 'No policy (Module 1 baseline)',
    policy: '',
    snippetKey: 'inlineInjection',
  },
  nonce: {
    label: "Nonce-based script-src (Module 5)",
    policy: "script-src 'self' 'nonce-{{NONCE}}'",
    snippetKey: 'nonceScript',
  },
  hash: {
    label: 'Hash-based script-src (Module 6)',
    policy: "script-src 'self' 'sha256-{{HASH}}'",
    snippetKey: 'hashScript',
  },
  strictDynamic: {
    label: "strict-dynamic propagation (Module 7)",
    policy: "script-src 'self' 'nonce-{{NONCE}}' 'strict-dynamic'",
    snippetKey: 'strictDynamic',
  },
};

const SNIPPET_PRESETS: Record<string, { label: string; html: string }> = {
  inlineInjection: {
    label: 'Inline <script> injection attempt',
    html: `<div id="probe-inline">(pending)</div>
<script>
  document.getElementById('probe-inline').textContent = 'ran, inline script executed unrestricted';
  window.reportProbe('inline-script', true, 'Inline <script> with no nonce/hash executed. This is exactly what a reflected-XSS payload would try to do.');
<\/script>`,
  },
  evalAttempt: {
    label: 'eval() attempt',
    html: `<div id="probe-eval">(pending)</div>
<script nonce="{{NONCE}}">
  try {
    var r = eval('21 + 21');
    window.reportProbe('eval', true, 'eval() executed, result: ' + r + ' (policy allows unsafe-eval, or none was set)');
  } catch (e) {
    window.reportProbe('eval', false, 'eval() threw ' + e.constructor.name + ': ' + e.message);
  }
<\/script>`,
  },
  nonceScript: {
    label: 'Nonce-matched inline script',
    html: `<div id="probe-nonce">(pending)</div>
<script nonce="{{NONCE}}">
  document.getElementById('probe-nonce').textContent = 'ran, nonce matched the policy';
  window.reportProbe('nonce-script', true, 'Inline script whose nonce attribute matches the fresh per-run nonce in the policy executed.');
<\/script>`,
  },
  hashScript: {
    label: 'Hash-matched inline script',
    html: `<div id="probe-hash">(pending)</div>
<script>document.getElementById('probe-hash').textContent = 'ran, this exact byte content was hashed and allowlisted'; window.reportProbe('hash-script', true, 'This inline script\\'s exact byte content was SHA-256 hashed and the digest allowlisted in script-src.');<\/script>`,
  },
  strictDynamic: {
    label: 'strict-dynamic: root + dynamic child + static child',
    html: `<div id="probe-root">(pending)</div>
<div id="probe-static-child">(pending)</div>
<div id="probe-dynamic-child">(pending)</div>

<!-- Parser-inserted, no nonce. Always blocked: inline execution needs
     unsafe-inline/nonce/hash regardless of strict-dynamic; strict-dynamic
     never grants trust to parser-inserted elements. -->
<script>
  document.getElementById('probe-static-child').textContent = 'ran (unexpected)';
  window.reportProbe('static-child', true, 'Static, parser-inserted, non-nonced inline script executed (should NOT happen).');
<\/script>

<!-- The trusted root: nonce matches the policy. -->
<script nonce="{{NONCE}}">
  document.getElementById('probe-root').textContent = 'ran, root nonced script executed';
  window.reportProbe('root-script', true, 'Root nonced script executed.');

  // Non-parser-inserted (createElement + appendChild), NO nonce of its own.
  // Under 'strict-dynamic' this should still run: trust propagates from the
  // already-trusted root script to whatever it dynamically inserts.
  var child = document.createElement('script');
  child.textContent = "document.getElementById('probe-dynamic-child').textContent = 'ran (trust propagated'; window.reportProbe('dynamic-child', true, 'Dynamically-inserted (createElement+appendChild) child script with NO nonce executed) strict-dynamic propagated trust from the root script.');";
  document.body.appendChild(child);
<\/script>`,
  },
};

let currentNonce = generateNonce();

export function initCspTab(root: HTMLElement) {
  root.innerHTML = `
    <div class="two-pane">
      <div class="card">
        <h3>Policy <span class="hint">meta http-equiv content</span></h3>
        <label for="csp-policy-preset">Preset</label>
        <select id="csp-policy-preset">
          ${Object.entries(POLICY_PRESETS).map(([k, p]) => `<option value="${k}">${escapeHtml(p.label)}</option>`).join('')}
          <option value="custom">Custom</option>
        </select>
        <label for="csp-policy-text">Content-Security-Policy</label>
        <textarea id="csp-policy-text" rows="3" spellcheck="false"></textarea>
        <div class="note">Placeholders <code class="inline">{{NONCE}}</code> / <code class="inline">{{HASH}}</code> are substituted with a fresh value each run, exactly like Module 5/6/7's server generating a new nonce or computing a real digest per response.</div>
      </div>
      <div class="card">
        <h3>HTML / script snippet <span class="hint">rendered in &lt;body&gt;</span></h3>
        <label for="csp-snippet-preset">Preset</label>
        <select id="csp-snippet-preset">
          ${Object.entries(SNIPPET_PRESETS).map(([k, p]) => `<option value="${k}">${escapeHtml(p.label)}</option>`).join('')}
        </select>
        <label for="csp-snippet-text">Body HTML</label>
        <textarea id="csp-snippet-text" rows="10" spellcheck="false"></textarea>
      </div>
    </div>
    <div class="btn-row">
      <button class="primary" id="csp-run">Run Test</button>
      <button class="ghost" id="csp-hash-btn">Compute SHA-256 hash from snippet → insert into policy</button>
      <button class="ghost" id="csp-fresh-nonce">New nonce</button>
    </div>
    <div class="output">
      <div class="card">
        <h3>Result <span class="hint">from securitypolicyviolation events + in-page probes</span></h3>
        <div class="output-panel" id="csp-output"><div class="log-line info">Choose a policy + snippet, then Run Test.</div></div>
      </div>
    </div>
    <div class="sandbox-frame-wrap" id="csp-sandbox-host"></div>
  `;

  const policyPresetSel = root.querySelector<HTMLSelectElement>('#csp-policy-preset')!;
  const policyText = root.querySelector<HTMLTextAreaElement>('#csp-policy-text')!;
  const snippetPresetSel = root.querySelector<HTMLSelectElement>('#csp-snippet-preset')!;
  const snippetText = root.querySelector<HTMLTextAreaElement>('#csp-snippet-text')!;
  const runBtn = root.querySelector<HTMLButtonElement>('#csp-run')!;
  const hashBtn = root.querySelector<HTMLButtonElement>('#csp-hash-btn')!;
  const freshNonceBtn = root.querySelector<HTMLButtonElement>('#csp-fresh-nonce')!;
  const output = root.querySelector<HTMLDivElement>('#csp-output')!;
  const sandboxHost = root.querySelector<HTMLDivElement>('#csp-sandbox-host')!;

  function applyPreset(key: string) {
    const p = POLICY_PRESETS[key];
    if (!p) return;
    policyText.value = p.policy;
    snippetPresetSel.value = p.snippetKey;
    snippetText.value = SNIPPET_PRESETS[p.snippetKey].html;
  }

  policyPresetSel.addEventListener('change', () => applyPreset(policyPresetSel.value));
  snippetPresetSel.addEventListener('change', () => {
    snippetText.value = SNIPPET_PRESETS[snippetPresetSel.value].html;
  });
  freshNonceBtn.addEventListener('click', () => {
    currentNonce = generateNonce();
    log([{ kind: 'error', message: `(new nonce generated: ${currentNonce.slice(0, 12)}…)` } as SandboxEvent], true);
  });

  hashBtn.addEventListener('click', async () => {
    const exact = extractFirstHashableInlineScript(snippetText.value);
    if (!exact) {
      output.innerHTML = `<div class="log-line blocked">No inline &lt;script&gt; without src/nonce found in the snippet, hash sourcing only applies to those.</div>`;
      return;
    }
    const digest = await sha256Base64(exact);
    const src = `'sha256-${digest}'`;
    if (/script-src[^;]*/i.test(policyText.value)) {
      policyText.value = policyText.value.replace(/script-src([^;]*)/i, (_m, rest) => `script-src${rest} ${src}`);
    } else {
      policyText.value = (policyText.value ? policyText.value + '; ' : '') + `script-src 'self' ${src}`;
    }
    output.innerHTML = `<div class="log-line allowed">Computed SHA-256 over the exact snippet bytes: <code class="inline">${src}</code>, inserted into the policy.</div>`;
  });

  applyPreset('none');

  runBtn.addEventListener('click', async () => {
    output.innerHTML = '';
    log([{ kind: 'error', message: 'Running…' } as SandboxEvent], true);

    let policy = policyText.value;
    let snippet = snippetText.value;

    if (policy.includes('{{HASH}}')) {
      const exact = extractFirstHashableInlineScript(snippet);
      const digest = exact ? await sha256Base64(exact) : '';
      policy = policy.replaceAll('{{HASH}}', digest);
    }
    policy = policy.replaceAll('{{NONCE}}', currentNonce);
    snippet = snippet.replaceAll('{{NONCE}}', currentNonce);

    const metaCsp = policy.trim()
      ? `<meta http-equiv="Content-Security-Policy" content="${escapeHtml(policy.trim())}">`
      : '';

    sandboxHost.innerHTML = '';
    const handle = runInSandbox(sandboxHost, metaCsp, snippet);
    const collected: SandboxEvent[] = [];
    handle.onEvent((e) => collected.push(e));
    await handle.waitForSettle(700);
    handle.destroy();

    output.innerHTML = '';
    log([
      { kind: 'error', message: `Policy sent: ${policy.trim() || '(none, no <meta> CSP tag at all)'}` } as SandboxEvent,
      ...collected,
    ]);
    renderVerdicts(snippet, collected);
  });

  function log(events: SandboxEvent[], replace = false) {
    if (replace) output.innerHTML = '';
    for (const e of events) {
      const div = document.createElement('div');
      if (e.kind === 'violation') {
        div.className = 'log-line blocked';
        div.innerHTML = `<span class="badge blocked">blocked</span>directive=<b>${escapeHtml(e.effectiveDirective || e.directive)}</b>  blockedURI=${escapeHtml(e.blockedURI)}${e.sample ? `\n  sample: ${escapeHtml(e.sample)}` : ''}`;
      } else if (e.kind === 'probe') {
        div.className = `log-line ${e.ok ? 'allowed' : 'blocked'}`;
        div.innerHTML = `<span class="badge ${e.ok ? 'allowed' : 'blocked'}">${e.ok ? 'allowed' : 'blocked'}</span>[${escapeHtml(e.tag)}] ${escapeHtml(e.message)}`;
      } else if (e.kind === 'error') {
        div.className = 'log-line info';
        div.textContent = e.message;
      } else if (e.kind === 'load') {
        div.className = 'log-line info';
        div.textContent = 'iframe finished loading';
      }
      output.appendChild(div);
    }
  }

  function renderVerdicts(snippet: string, events: SandboxEvent[]) {
    // Infer a verdict for every probe tag the snippet COULD report, even the
    // ones that never got the chance to run because the script itself was
    // blocked before executing.
    const probeTags = Array.from(snippet.matchAll(/reportProbe\('([\w-]+)'/g)).map((m) => m[1]);
    const seen = new Set(events.filter((e) => e.kind === 'probe').map((e) => (e as any).tag));
    const missing = probeTags.filter((t) => !seen.has(t));
    if (missing.length) {
      const div = document.createElement('div');
      div.className = 'log-line blocked';
      div.innerHTML = `<span class="badge blocked">blocked</span>Never ran (script execution itself was blocked): ${missing.map(escapeHtml).join(', ')}`;
      output.appendChild(div);
    }
  }
}
