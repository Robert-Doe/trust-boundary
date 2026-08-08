// Loaded via document.createElement('script') + appendChild by the trusted
// root script, with NO nonce attribute of its own. If this runs, it proves
// 'strict-dynamic' propagated trust from the root script to this one.
document.getElementById('dynamic-child-proof').textContent =
  'ran — dynamically-inserted child executed, trust propagated from the root script';
document.getElementById('dynamic-child-proof').className = 'result allowed';
