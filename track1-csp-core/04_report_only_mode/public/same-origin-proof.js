const el = document.getElementById('same-origin-proof');
if (el) {
  el.textContent = 'ran — same-origin external script executed normally';
  el.className = 'result allowed';
}
