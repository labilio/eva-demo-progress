import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const patch = fs.readFileSync('prototype/009-8-patch-automation.js', 'utf8');
const styles = fs.readFileSync('prototype/031-shared-automation-v2.css', 'utf8');

test('project automation preserves the original Loop component contract', () => {
  assert.match(patch, /Loop 原版项目自动化组件不存在/);
  assert.match(patch, /className:\"loop-automation-cards\"/);
  assert.match(patch, /React\.createElement\(AutopilotDetailPage/);
  assert.match(patch, /triggerAutopilot\(Vt\.id\)/);
  assert.match(patch, /EvaLoopIdentityAvatar/);
  assert.match(patch, /window\.EvaAIIdentity\.badge/);
  assert.doesNotMatch(patch, /source\.slice\(0, projectAutomationStart\) \+ String\.raw`function AutomationPage/);
});

test('personal automation keeps the shared Eva automation page', () => {
  assert.match(patch, /ScheduledTasksPage=\(\)=>\{/);
  assert.match(patch, /EvaSharedAutomationPage,\{scope:\"personal\"/);
});

test('Eva card styling is scoped to project automation only', () => {
  assert.match(styles, /\.collab-body > \.loop-page \.loop-automation-card\{/);
  assert.match(styles, /var\(--eva-border-focus\)/);
  assert.doesNotMatch(styles, /\.eva-shared-auto\[data-scope=['\"]personal['\"]\][^{]*\.loop-automation-card/);
});
