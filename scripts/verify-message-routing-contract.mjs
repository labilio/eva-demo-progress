import { readActiveSource } from './lib/read-active-source.mjs';

const source = readActiveSource();
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
requireText('sidebarVariant:"ai-sessions"', 'My AI does not declare the assistant/session sidebar variant');
requireText('conversationKind:"openclaw-session"', 'My AI child rows are not identified as OpenClaw sessions');
requireText('identityAvatarUrl:', 'My AI sessions do not carry their parent AI identity avatar');
requireText('avatarUrl:', 'My AI identity groups do not provide an avatar');
requireText('wk-category-header__identity-avatar', 'the shared category header cannot render an AI identity avatar');
requireText('wk-conv-compact-item--session', 'the shared conversation item has no session-row presentation');
requireText('eva-my-ai-sidebar-actions', 'My AI is missing separate create-assistant and new-session actions');
requireText('Sa.identityAvatarUrl??', 'the shared conversation header does not use the selected session identity avatar');
requireText('split("\\\\n")', 'runtime-generated session previews contain an unescaped newline and will blank the app');
requireText('ct?.sidebarVariant!=="ai-sessions"', 'My AI still renders the team-only subzone action');
requireText('!fa&&ct?.sidebarVariant!=="ai-sessions"&&Zi.push', 'My AI message context menus still expose the team-only create-subzone action');
requireText('[data-eva-message-mode="my-ai"] .wk-sidebar-tabbar', 'My AI still exposes the team IM focus/recent switcher');
requireText('b-wangyilin|b-pilot', 'AI assistant message avatars are not resolved from their identity source');
requireText('!/[?&]evaIM=my-ai/.test(hash)', 'the legacy group-creation enhancement still leaks team controls into My AI');
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
