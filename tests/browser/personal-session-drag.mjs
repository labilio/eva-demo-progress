import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { chromium } from 'playwright';
import { createServer } from '../../tools/serve.mjs';
import { fileURLToPath } from 'node:url';

let server, browser, page, origin;
before(async () => {
  server = createServer(fileURLToPath(new URL('../../dist', import.meta.url)));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1200, height: 800 } });
  // These are local UI tests: never contact the shared review service or external accounts.
  await context.route('**/*', route => new URL(route.request().url()).origin === origin
    ? route.continue() : route.abort());
  page = await context.newPage();
});
after(async () => {
  await browser?.close();
  if (server) await new Promise(resolve => server.close(resolve));
});


test('真实拖拽跨分组及刷新，保留会话正文与草稿', async () => {
 await page.goto(origin + '/#/conversation/personal-api-regression');
 const input=page.getByRole('textbox',{name:'向 Eva 同学提问'});
 await input.fill('保留拖拽中的草稿');
 const source=()=>page.locator('[data-eva-personal-conversation-id="personal-api-regression"]');
 const target=page.locator('[data-eva-drop-folder="personal-supply"]');
 await source().dragTo(target.locator('.eva-personal-folder__main'));
 await page.locator('[data-eva-drop-folder="personal-supply"] [data-eva-personal-conversation-id="personal-api-regression"]').waitFor();
 assert.equal(await input.inputValue(),'保留拖拽中的草稿');
 assert.match(page.url(),/personal-api-regression/);
 await page.reload();
 await page.locator('[data-eva-drop-folder="personal-supply"] [data-eva-personal-conversation-id="personal-api-regression"]').waitFor();
 await source().dragTo(page.locator('[data-eva-drop-folder=""] .eva-personal-folder__main'));
 await page.locator('[data-eva-drop-folder=""] [data-eva-personal-conversation-id="personal-api-regression"]').waitFor();
});
