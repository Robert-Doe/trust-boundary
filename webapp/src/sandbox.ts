// Builds and runs a fully-sandboxed <iframe> that hosts the user's
// CSP-meta-tag + HTML/script snippet, and relays what happened back out via
// postMessage, because a `sandbox="allow-scripts"` iframe with NO
// `allow-same-origin` has an opaque origin, the parent page cannot reach
// into it directly (by design, see the SAFETY CONSTRAINT this app was
// built under). postMessage is the one channel that still works across
// that boundary.

export type SandboxEvent =
  | { kind: 'violation'; directive: string; effectiveDirective: string; blockedURI: string; sample: string }
  | { kind: 'error'; message: string }
  | { kind: 'probe'; tag: string; ok: boolean; message: string }
  | { kind: 'load' };

// This boilerplate is injected BEFORE the <meta> CSP tag in every srcdoc we
// build. That placement is deliberate and mirrors Module 9
// (09_meta_vs_header)'s own "Proof A": a <script> that appears earlier in
// the document than the <meta http-equiv="Content-Security-Policy"> tag
// runs completely unrestricted, because no policy is active yet at the
// point the parser reaches it. We exploit that same ordering fact to
// guarantee our violation/probe reporter always attaches, no matter how
// strict the policy the user is testing turns out to be.
const REPORTER_BOILERPLATE = `<script>
(function(){
  function post(msg){ try { parent.postMessage(msg, '*'); } catch (e) {} }
  document.addEventListener('securitypolicyviolation', function(e){
    post({
      kind: 'violation',
      directive: e.violatedDirective,
      effectiveDirective: e.effectiveDirective,
      blockedURI: e.blockedURI,
      sample: e.sample || ''
    });
  });
  window.addEventListener('error', function(e){
    post({ kind: 'error', message: String(e.message || (e.error && e.error.message) || e) });
  }, true);
  // Snippets call this themselves to report an observable outcome, the same
  // way the course's own modules write into a #result element and set its
  // className to "allowed"/"blocked".
  window.reportProbe = function(tag, ok, message){
    post({ kind: 'probe', tag: tag, ok: !!ok, message: message || '' });
  };
  window.addEventListener('load', function(){ post({ kind: 'load' }); });
})();
<\/script>`;

export interface SandboxHandle {
  iframe: HTMLIFrameElement;
  events: SandboxEvent[];
  onEvent: (cb: (e: SandboxEvent) => void) => void;
  postCommand: (data: unknown) => void;
  waitForSettle: (ms?: number) => Promise<void>;
  destroy: () => void;
}

/**
 * metaCsp: the full `<meta http-equiv="Content-Security-Policy" content="...">`
 *          tag, or '' to omit it entirely (the "no policy" baseline).
 * bodyHtml: arbitrary HTML/script placed in <body>, AFTER the meta tag,
 *           so it is genuinely subject to whatever policy was supplied.
 */
export function runInSandbox(container: HTMLElement, metaCsp: string, bodyHtml: string): SandboxHandle {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-scripts'); // NOTE: no allow-same-origin
  iframe.style.width = '100%';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.display = 'none';

  const srcdoc = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
${REPORTER_BOILERPLATE}
${metaCsp}
</head>
<body>
${bodyHtml}
</body>
</html>`;

  iframe.srcdoc = srcdoc;
  container.appendChild(iframe);

  const events: SandboxEvent[] = [];
  const listeners: Array<(e: SandboxEvent) => void> = [];

  function handleMessage(ev: MessageEvent) {
    if (ev.source !== iframe.contentWindow) return;
    const data = ev.data as SandboxEvent;
    if (!data || typeof data !== 'object' || !('kind' in data)) return;
    events.push(data);
    for (const l of listeners) l(data);
  }
  window.addEventListener('message', handleMessage);

  return {
    iframe,
    events,
    onEvent(cb) {
      listeners.push(cb);
    },
    postCommand(data) {
      iframe.contentWindow?.postMessage(data, '*');
    },
    waitForSettle(ms = 700) {
      return new Promise((resolve) => {
        let settled = false;
        const done = () => {
          if (settled) return;
          settled = true;
          setTimeout(resolve, 60); // let a final microtask/violation event flush
        };
        const off = (e: SandboxEvent) => {
          if (e.kind === 'load') done();
        };
        listeners.push(off);
        setTimeout(done, ms);
      });
    },
    destroy() {
      window.removeEventListener('message', handleMessage);
      iframe.remove();
    },
  };
}
