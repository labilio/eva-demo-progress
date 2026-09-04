import fs from 'node:fs';

const source = fs.readFileSync('index.html', 'utf8');
const failures = [];

function requireMatch(pattern, message) {
  if (!pattern.test(source)) failures.push(message);
}

function forbidMatch(pattern, message) {
  if (pattern.test(source)) failures.push(message);
}

forbidMatch(
  /body\.eva-my-avatar-open \.eva-msg\s*\{/s,
  'My AI still overlays a second positioned IM shell',
);

requireMatch(
  /\.wk-messageinput-inputbox\s*\{[^}]*display:\s*flex[^}]*align-items:\s*center[^}]*margin-right:\s*16px/s,
  'shared composer is missing the Octo MessageInput inputbox contract',
);

requireMatch(
  /wk-popupmenus-revoke[^}]*background-image:\s*url\(data:image\/png;base64,/s,
  'revoke action does not use the embedded Octo-Web revoke asset',
);

requireMatch(
  /\.wk-contextmenus li\.wk-ctx-danger \.ctx-icon > \*\s*\{[^}]*display:\s*none/s,
  'the generic revoke glyph paths are still visible',
);

requireMatch(
  /\.wk-contextmenus li\.wk-ctx-danger \.ctx-icon\s*\{[^}]*background-image:\s*url\(data:image\/png;base64,/s,
  'the context menu does not render the Octo revoke asset on the revoke icon slot',
);

if (failures.length) {
  failures.forEach(failure => console.error(`Eva IM shell contract violation: ${failure}`));
  process.exit(1);
}

console.log('Eva IM shell contract verification passed.');
