import fs from 'node:fs';

const source = fs.readFileSync('index.html', 'utf8');
const failures = [];

function requireText(text, message) {
  if (!source.includes(text)) failures.push(message);
}

function forbidText(text, message) {
  if (source.includes(text)) failures.push(message);
}

requireText('evaSidebarSelectionFromRoute=', 'missing the single route-to-navigation selection mapper');
requireText('activeNavId:evaActiveNavId', 'sidebar does not receive the shared React activeNavId');
requireText('window.__evaSidebarOverlayNavId||evaSidebarSelectionFromRoute', 'overlay selection does not take priority over its underlying route');
requireText('window.__evaSidebarOverlayNavId=detail.overlay?id:""', 'selection events do not centrally set or clear overlay state');
requireText('isActive:rt.activeNavId===gt', 'first-level entries do not use the shared activeNavId');

forbidText('var activeSidebarNavId = \'\';', 'parallel DOM sidebar selection state still exists');
forbidText("surface.classList.toggle('bg-fill-3'", 'parallel DOM code still paints selection classes');
forbidText('isActive:!1,onClick:()=>{}}));case"projects"', 'My AI still hard-codes an inactive state');

if (failures.length) {
  failures.forEach(failure => console.error(`Sidebar selection contract violation: ${failure}`));
  process.exit(1);
}

console.log('Eva sidebar selection contract verification passed.');
