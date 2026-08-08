// Loaded via a plain <script src="..."> written directly in the static
// HTML (parser-inserted), with no nonce. Even though this file is
// same-origin and 'self' IS in the policy, 'strict-dynamic' should make the
// browser ignore 'self' entirely — so this should never run.
document.getElementById('static-child-proof').textContent =
  'ran (should NOT happen — strict-dynamic should have ignored self)';
document.getElementById('static-child-proof').className = 'result allowed';
