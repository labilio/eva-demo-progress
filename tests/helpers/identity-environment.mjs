import {readFileSync} from 'node:fs';
import vm from 'node:vm';
export function loadIdentityEnvironment(window) {
  for (const file of ['003-my-assistant-identity.js', '004-project-appearance.js']) {
    vm.runInNewContext(readFileSync(new URL('../../prototype/' + file, import.meta.url), 'utf8'), {window});
  }
}
