// Trigger 2: eval, blocked. Runs as genuine page script on load (see
// Module 3's DECISIONS.md for why we don't rely on a click for this).
try {
  eval('1 + 1');
  document.getElementById('eval-proof').textContent = 'eval result: 2 (should NOT happen)';
} catch (e) {
  document.getElementById('eval-proof').textContent = 'BLOCKED: ' + e.name;
}

// Does the browser even GENERATE a report object internally, separate from
// whether it ever delivers one over the network? ReportingObserver answers
// that — it observes reports the browser produces locally, no network
// endpoint involved at all.
const observerEl = document.getElementById('observer-log');
if (typeof ReportingObserver === 'function') {
  const observed = [];
  const observer = new ReportingObserver((reports) => {
    reports.forEach((r) => observed.push({ type: r.type, url: r.url, body: r.body }));
    observerEl.textContent = 'ReportingObserver saw ' + observed.length + ' report(s):\n' + JSON.stringify(observed, null, 2);
  }, { buffered: true });
  observer.observe();
  setTimeout(() => {
    if (observed.length === 0) observerEl.textContent = 'ReportingObserver saw 0 reports after 3s';
  }, 3000);
} else {
  observerEl.textContent = 'ReportingObserver API not available in this browser';
}

// Poll our own collector server for whatever reports have actually arrived,
// via either report-uri or report-to. We don't assume timing — just poll
// for a few seconds and show whatever's really there.
const logEl = document.getElementById('collector-log');
let ticks = 0;
async function poll() {
  ticks++;
  const res = await fetch('/debug/reports');
  const reports = await res.json();
  logEl.textContent = reports.length === 0
    ? `(tick ${ticks}: still 0 reports received server-side)`
    : JSON.stringify(reports, null, 2);
  if (ticks < 6) setTimeout(poll, 1000);
}
poll();
