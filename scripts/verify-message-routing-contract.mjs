import fs from 'node:fs';

const source = fs.readFileSync('index.html', 'utf8');
const failures = [];

function requireText(text, message) {
  if (!source.includes(text)) failures.push(message);
}

function forbidText(text, message) {
  if (source.includes(text)) failures.push(message);
}

requireText('navigate("/messages?evaIM=my-ai")', 'My AI is not a real route into the shared MessagesPage');
requireText('messageSource(evaMessageMode)', 'MessagesPage does not select data through the shared message source');
requireText('evaMessageMode==="my-ai"', 'the shared message source has no My AI data mode');
requireText('key:evaMessageMode,source:rt', 'ChannelsView is reused with stale internal state when the message mode changes');
forbidText("event.target.closest('[data-eva-my-avatar-nav]')", 'a DOM capture layer still intercepts the My AI navigation entry');
forbidText('body.eva-my-avatar-open .eva-msg', 'My AI still creates a fixed-position IM shell over the real page');
forbidText("document.body.classList.contains('eva-my-avatar-open') || hash.indexOf('#/guid')", 'the personal conversation column still claims My AI routes');
forbidText('var myAvatarOpen', 'My AI still has a parallel mutable open state outside the route');
forbidText('function openMyAvatar', 'My AI still has a parallel DOM navigation entry point');
forbidText('function syncMyAvatarSelection', 'My AI still synchronizes route-owned selection through DOM state');
forbidText('window.__evaOpenMyAvatar', 'My AI still exposes the obsolete overlay controller globally');
forbidText('MY_AI_CONVERSATIONS', 'the personal conversation rail still owns a parallel copy of My AI data');
forbidText('eva-my-ai-conversation-item', 'the personal conversation rail still renders My AI entries');
forbidText("document.body.classList.contains('eva-my-avatar-open')", 'runtime behavior still reads the obsolete My AI body state');
forbidText('body.eva-my-avatar-open', 'CSS still depends on the obsolete My AI body state');

if (failures.length) {
  failures.forEach(failure => console.error(`Message routing contract violation: ${failure}`));
  process.exit(1);
}

console.log('Eva message routing contract verification passed.');
