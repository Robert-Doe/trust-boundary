window.__childScriptRan = true;
const el = document.getElementById('result-c');
if (el) { el.textContent = (el.textContent || '') + ' | child.js executed via script.src'; }
