import { readActiveSource } from './lib/read-active-source.mjs';
import { createPatchedRuntime } from '../tools/build-runtime.mjs';

const source = readActiveSource() + '\n' + createPatchedRuntime().source;
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
requireText("sidebarVariant: 'ai-sessions'", 'My AI does not declare its identity conversation rail');
requireText("conversationKind: 'ai-private-group'", 'My AI does not use a private parent group');
requireText('channel_type: 5', 'AI conversations must use Octo topic channels');
requireText("replyPolicy: 'direct-only'", 'AI private groups must respond directly without a mention setting');
requireText('ct?.selectedThreadId??Pt', 'AI selection must use the shared topic message path');
forbidText('eva-ai-team__conversation-breadcrumb', 'AI private conversations must not expose group/topic breadcrumbs');
requireText('identityAvatarUrl:', 'My AI sessions do not carry their parent AI identity avatar');
requireText('avatarUrl:', 'My AI identity groups do not provide an avatar');
requireText('wk-category-header__identity-avatar', 'the shared category header cannot render an AI identity avatar');
requireText("className:'eva-ai-team__session'", 'My AI is missing its conversation selection rows');
requireText('eva-my-ai-sidebar-actions', 'My AI is missing separate create-assistant and new-session actions');
requireText('eva-my-ai-identity-toggle', 'My AI identity expand/collapse control is missing from the right side');
requireText('function EvaAITeamPage()', 'My AI has no React role controller');
requireText('!ct?.conversationOnly&&React.createElement', 'My AI mounts the legacy sidebar alongside its role sidebar');
requireText('key:draftKey,source', 'identity/session changes do not reset shared IM state');
requireText('store.sendMessage(', 'My AI send does not use the canonical session store');
requireText('store.setDraft(', 'My AI drafts are not scoped in the canonical store');
forbidText('eva-ai-team__toolbar', 'My AI must not add an identity toolbar above the shared IM header');
requireText("className:'eva-ai-team__identity-action eva-ai-team__relation'", 'identity configuration is missing its link-icon entry');
requireText('openDetails(i.id)', 'the identity configuration icon does not open the shared editor');
forbidText("Dropdown.Item,{onClick:()=>newConversation(i.id)},'新建会话'", 'the identity menu duplicates the dedicated new-session plus action');
forbidText("Dropdown.Item,{onClick:()=>openDetails(i.id)},'查看配置'", 'identity configuration still uses the obsolete overflow menu');
requireText('store.subscribe', 'My AI does not observe canonical identity data');

requireText('Sa.identityAppearance?React.createElement(EvaAIIdentityAvatar', 'the shared conversation header loses source and ownership');
requireText('ct?.sidebarVariant!=="ai-sessions"', 'My AI still renders the team-only subzone action');
requireText('!fa&&!Sa.id.startsWith("dm-")&&Sa.chatType!=="direct"&&ct?.sidebarVariant!=="ai-sessions"&&Zi.push', 'direct chat message menus expose group-only subzones');
requireText('b-wangyilin|b-pilot', 'AI assistant message avatars are not resolved from their identity source');
requireText('ct?.sidebarVariant!=="ai-sessions"&&React.createElement(evaMembers().ui.CreateGroup', 'group-creation controls must not appear in My AI');
forbidText('eva-create-group-layer', 'obsolete DOM group creation bypasses the shared member controller');
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
