// Trusted Types Playground tab, real enforcement, run inside a sandboxed
// iframe. Mirrors track2-trusted-types: Module 16 (policy factory), Module
// 17 (createHTML rule), Module 18 (innerHTML/outerHTML/insertAdjacentHTML
// sink guard incl. duck-typed fakes), and Module 20 (policy name allowlist
// via the `trusted-types` CSP directive).
import { runInSandbox, type SandboxEvent } from './sandbox';
import { generateNonce, escapeHtml } from './util';

type PolicyKind = 'none' | 'passthrough' | 'sanitize';

const POLICY_SETUP: Record<PolicyKind, string> = {
  none: `// No trustedTypes.createPolicy() call anywhere on this page.
window.reportProbe('policy-setup', true, 'No policy was defined, __ttPolicy stays null.');`,
  passthrough: `try {
  window.__ttPolicy = trustedTypes.createPolicy('{{POLICY_NAME}}', {
    createHTML: function (input) { return input; } // no transform, this is about TYPE, not content (Module 18)
  });
  window.reportProbe('policy-setup', true, 'trustedTypes.createPolicy("{{POLICY_NAME}}", { createHTML: passthrough }) succeeded.');
} catch (e) {
  window.reportProbe('policy-setup', false, 'createPolicy() threw ' + e.constructor.name + ': ' + e.message);
}`,
  sanitize: `try {
  window.__ttPolicy = trustedTypes.createPolicy('{{POLICY_NAME}}', {
    // Deliberately naive, strips <script> tags only, for demo purposes.
    // Module 24's real sanitizer capstone goes considerably further.
    createHTML: function (input) { return input.replace(/<script[^>]*>[\\s\\S]*?<\\/script>/gi, ''); }
  });
  window.reportProbe('policy-setup', true, 'trustedTypes.createPolicy("{{POLICY_NAME}}", { createHTML: strips <script> tags }) succeeded.');
} catch (e) {
  window.reportProbe('policy-setup', false, 'createPolicy() threw ' + e.constructor.name + ': ' + e.message);
}`,
};

function buildBodyHtml(nonce: string, policyKind: PolicyKind, policyName: string): string {
  const setup = POLICY_SETUP[policyKind].replaceAll('{{POLICY_NAME}}', policyName);
  return `<div id="tt-target">(sink target, not visible; its resulting HTML is reported via postMessage)</div>
<script nonce="${nonce}">
  window.__ttPolicy = null;
  ${setup}

  window.addEventListener('message', function (ev) {
    if (!ev.data || ev.data.cmd !== 'run-sink') return;
    var kind = ev.data.kind;
    var el = document.getElementById('tt-target');
    try {
      if (kind === 'raw') {
        el.innerHTML = '<b>raw string, never touched a policy</b>';
      } else if (kind === 'policy') {
        if (!window.__ttPolicy) throw new Error('no Trusted Types policy is defined on this page');
        el.innerHTML = window.__ttPolicy.createHTML('<b>hello</b> <script>window.__xss = true<\\/script>, via policy.createHTML()');
      } else if (kind === 'fake') {
        var fake = { toString: function () { return '<b>fake, produced via .toString()</b>'; } };
        el.innerHTML = fake; // NOT created via any policy, just LOOKS right when stringified
      } else if (kind === 'policy-name') {
        trustedTypes.createPolicy(ev.data.name, { createHTML: function (s) { return s; } });
        window.reportProbe('policy-name', true, 'createPolicy("' + ev.data.name + '") SUCCEEDED (unexpected if the trusted-types allowlist should have blocked this name).');
        return;
      }
      window.reportProbe('sink-' + kind, true, 'innerHTML assignment SUCCEEDED, resulting innerHTML: ' + el.innerHTML);
    } catch (e) {
      window.reportProbe('sink-' + kind, false, 'THREW ' + e.constructor.name + ': ' + e.message);
    }
  });
<\/script>`;
}

export function initTrustedTypesTab(root: HTMLElement) {
  root.innerHTML = `
    <div class="two-pane">
      <div class="card">
        <h3>Policy <span class="hint">applied via CSP + trustedTypes.createPolicy</span></h3>
        <label for="tt-policy-kind">createHTML rule</label>
        <select id="tt-policy-kind">
          <option value="none">No policy defined (Module 16, Proof A/D baseline)</option>
          <option value="passthrough" selected>Passthrough, return input unchanged (Module 16/18)</option>
          <option value="sanitize">Sanitizing, strips &lt;script&gt; tags (Module 24-style)</option>
        </select>
        <label for="tt-policy-name">Policy name</label>
        <textarea id="tt-policy-name" rows="1" spellcheck="false">app-policy</textarea>
        <label style="display:flex;align-items:center;gap:8px;margin-top:10px;text-transform:none;font-size:13px;color:var(--text);">
          <input type="checkbox" id="tt-allowlist-toggle" style="width:auto;margin:0;" />
          Restrict createPolicy() to allowed names via the <code class="inline">trusted-types</code> CSP directive
        </label>
        <div id="tt-allowlist-row" style="display:none;margin-top:8px;">
          <label for="tt-allowlist-name">Allowed policy name (trusted-types directive value)</label>
          <textarea id="tt-allowlist-name" rows="1" spellcheck="false">app-policy</textarea>
        </div>
        <div class="btn-row">
          <button class="primary" id="tt-apply">Apply Policy &amp; Load Sandbox</button>
        </div>
        <div class="note" id="tt-csp-preview"></div>
      </div>
      <div class="card">
        <h3>Sink attempts <span class="hint">sent into the running sandbox</span></h3>
        <div class="btn-row" style="margin-top:0;">
          <button class="ghost" id="tt-raw" disabled>Raw string → innerHTML</button>
          <button class="ghost" id="tt-policy" disabled>policy.createHTML(...) → innerHTML</button>
          <button class="ghost" id="tt-fake" disabled>Duck-typed fake (.toString()) → innerHTML</button>
          <button class="ghost" id="tt-policy-name-btn" disabled>Try createPolicy('rogue-name')</button>
        </div>
        <div class="note">Load the sandbox first. Each button posts a command into the already-running iframe, the same policy instance handles every attempt, proving policies aren't re-checked per call, just enforced per sink (Module 16, Proof D).</div>
      </div>
    </div>
    <div class="output">
      <div class="card">
        <h3>Result</h3>
        <div class="output-panel" id="tt-output"><div class="log-line info">Apply a policy to load the sandbox, then try a sink.</div></div>
      </div>
    </div>
    <div class="sandbox-frame-wrap" id="tt-sandbox-host"></div>
  `;

  const kindSel = root.querySelector<HTMLSelectElement>('#tt-policy-kind')!;
  const nameInput = root.querySelector<HTMLTextAreaElement>('#tt-policy-name')!;
  const allowlistToggle = root.querySelector<HTMLInputElement>('#tt-allowlist-toggle')!;
  const allowlistRow = root.querySelector<HTMLDivElement>('#tt-allowlist-row')!;
  const allowlistName = root.querySelector<HTMLTextAreaElement>('#tt-allowlist-name')!;
  const applyBtn = root.querySelector<HTMLButtonElement>('#tt-apply')!;
  const cspPreview = root.querySelector<HTMLDivElement>('#tt-csp-preview')!;
  const output = root.querySelector<HTMLDivElement>('#tt-output')!;
  const sandboxHost = root.querySelector<HTMLDivElement>('#tt-sandbox-host')!;

  const sinkBtns = {
    raw: root.querySelector<HTMLButtonElement>('#tt-raw')!,
    policy: root.querySelector<HTMLButtonElement>('#tt-policy')!,
    fake: root.querySelector<HTMLButtonElement>('#tt-fake')!,
    policyName: root.querySelector<HTMLButtonElement>('#tt-policy-name-btn')!,
  };

  let handle: ReturnType<typeof runInSandbox> | null = null;

  function currentPolicy(): string {
    const nonce = 'PREVIEW';
    let policy = `script-src 'self' 'nonce-${nonce}'; require-trusted-types-for 'script'`;
    if (allowlistToggle.checked) policy += `; trusted-types ${allowlistName.value.trim() || 'app-policy'}`;
    return policy;
  }

  function refreshPreview() {
    allowlistRow.style.display = allowlistToggle.checked ? 'block' : 'none';
    sinkBtns.policyName.disabled = !allowlistToggle.checked || !handle;
    cspPreview.textContent = `Content-Security-Policy: ${currentPolicy()}`;
  }

  allowlistToggle.addEventListener('change', refreshPreview);
  kindSel.addEventListener('change', refreshPreview);
  refreshPreview();

  function log(e: SandboxEvent) {
    const div = document.createElement('div');
    if (e.kind === 'violation') {
      div.className = 'log-line blocked';
      div.innerHTML = `<span class="badge blocked">csp blocked</span>directive=<b>${escapeHtml(e.effectiveDirective || e.directive)}</b> blockedURI=${escapeHtml(e.blockedURI)}${e.sample ? `\n  sample: ${escapeHtml(e.sample)}` : ''}`;
    } else if (e.kind === 'probe') {
      div.className = `log-line ${e.ok ? 'allowed' : 'blocked'}`;
      div.innerHTML = `<span class="badge ${e.ok ? 'allowed' : 'blocked'}">${e.ok ? 'succeeded' : 'threw / rejected'}</span>[${escapeHtml(e.tag)}] ${escapeHtml(e.message)}`;
    } else if (e.kind === 'error') {
      div.className = 'log-line info';
      div.textContent = e.message;
    } else if (e.kind === 'load') {
      div.className = 'log-line info';
      div.textContent = 'Sandbox loaded and ready.';
    }
    output.appendChild(div);
  }

  applyBtn.addEventListener('click', () => {
    handle?.destroy();
    output.innerHTML = '';
    sandboxHost.innerHTML = '';

    const nonce = generateNonce();
    let policy = `script-src 'self' 'nonce-${nonce}'; require-trusted-types-for 'script'`;
    if (allowlistToggle.checked) policy += `; trusted-types ${allowlistName.value.trim() || 'app-policy'}`;
    cspPreview.textContent = `Content-Security-Policy: ${policy}`;

    const metaCsp = `<meta http-equiv="Content-Security-Policy" content="${escapeHtml(policy)}">`;
    const body = buildBodyHtml(nonce, kindSel.value as PolicyKind, nameInput.value.trim() || 'app-policy');

    handle = runInSandbox(sandboxHost, metaCsp, body);
    handle.onEvent(log);

    for (const b of Object.values(sinkBtns)) b.disabled = true;
    handle.waitForSettle(500).then(() => {
      sinkBtns.raw.disabled = false;
      sinkBtns.policy.disabled = false;
      sinkBtns.fake.disabled = false;
      sinkBtns.policyName.disabled = !allowlistToggle.checked;
    });
  });

  sinkBtns.raw.addEventListener('click', () => handle?.postCommand({ cmd: 'run-sink', kind: 'raw' }));
  sinkBtns.policy.addEventListener('click', () => handle?.postCommand({ cmd: 'run-sink', kind: 'policy' }));
  sinkBtns.fake.addEventListener('click', () => handle?.postCommand({ cmd: 'run-sink', kind: 'fake' }));
  sinkBtns.policyName.addEventListener('click', () =>
    handle?.postCommand({ cmd: 'run-sink', kind: 'policy-name', name: 'rogue-name-' + Math.random().toString(36).slice(2, 7) })
  );
}
