import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMMENTS_CONFIG } from '../review/comments-config.mjs';
import { buildAnchorRecord } from '../review/comments-domain.mjs';
import { createCommentsStore } from '../review/comments-store.mjs';

const HELP = `Eva 云端批注命令

用法：
  npm run comments -- add --page <hash> --selector <css> --kind <type> --body <text>
  npm run comments -- list --page <hash>
  npm run comments -- list --ids <UUID,UUID>
  npm run comments -- claim --ids <UUID,UUID> --author <认领者>
  npm run comments -- unclaim --ids <UUID,UUID> --author <认领者>
  npm run comments -- reply --id <comment-id> --body <text>
  npm run comments -- status --id <comment-id> --status <open|approved|doing|done>
  npm run comments -- delete --id <comment-id>

定位参数：--selector、--anchor-id、--quote 至少提供一个。
署名：默认 Codex；可用 --author 或 EVA_REVIEW_AUTHOR 覆盖。
已确认状态或“已基本定稿”类型必须额外提供 --confirmed-by-user。
`;

function parseFlags(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith('--')) throw new Error(`无法识别的参数：${token}`);
    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith('--')) values[key] = true;
    else { values[key] = next; index += 1; }
  }
  return values;
}

function required(flags, key) {
  const value = String(flags[key] || '').trim();
  if (!value) throw new Error(`缺少 --${key}`);
  return value;
}

function authorOf(flags, env) {
  return String(flags.author || env.EVA_REVIEW_AUTHOR || 'Codex').trim();
}

function printJson(write, value) {
  write(`${JSON.stringify(value, null, 2)}\n`);
}

export async function runCommentsCommand(argv, dependencies = {}) {
  const [command = 'help', ...rest] = argv;
  const flags = parseFlags(rest);
  const env = dependencies.env || process.env;
  const write = dependencies.write || (value => process.stdout.write(value));
  if (command === 'help' || flags.help) {
    write(HELP);
    return;
  }

  const store = dependencies.store || createCommentsStore({ ...COMMENTS_CONFIG, fetchImpl: dependencies.fetchImpl });
  const author = authorOf(flags, env);

  if (command === 'add') {
    const page = required(flags, 'page');
    const status = String(flags.status || 'open');
    const kind = String(flags.kind || 'function');
    if ((status === 'approved' || kind === 'ready') && !flags['confirmed-by-user']) {
      throw new Error(`设置${kind === 'ready' ? '已基本定稿类型' : '已确认状态'}必须提供 --confirmed-by-user，表示已取得人工确认`);
    }
    if (![flags.selector, flags['anchor-id'], flags.quote].some(value => String(value || '').trim())) {
      throw new Error('批注必须提供 selector、anchor-id 或 quote 之一');
    }
    const row = await store.create({
      page_path: page,
      author_name: author,
      body: required(flags, 'body'),
      kind,
      status,
      anchor: buildAnchorRecord({
        page,
        selector: flags.selector,
        anchorId: flags['anchor-id'],
        quote: flags.quote,
        tag: flags.tag,
        role: flags.role,
        label: flags.label,
        placeholder: flags.placeholder,
        inputType: flags['input-type'],
        heading: flags.heading,
        rx: flags.rx,
        ry: flags.ry,
      }),
    });
    printJson(write, row);
    return row;
  }

  if (command === 'list') {
    const rows = await store.list(flags.page ? String(flags.page).trim() : undefined, flags.ids ? String(flags.ids).split(',').map(id => id.trim()) : undefined);
    printJson(write, rows);
    return rows;
  }

  if (command === 'claim' || command === 'unclaim') {
    const rows = await store.claim(required(flags, 'ids').split(',').map(id => id.trim()), author, command === 'unclaim');
    printJson(write, rows);
    return rows;
  }

  if (command === 'reply') {
    const row = await store.addReply(required(flags, 'id'), {
      author_name: author,
      body: required(flags, 'body'),
    });
    printJson(write, row);
    return row;
  }

  if (command === 'status') {
    const status = required(flags, 'status');
    if (status === 'approved' && !flags['confirmed-by-user']) {
      throw new Error('设置已确认状态必须提供 --confirmed-by-user，表示已取得人工确认');
    }
    const row = await store.updateStatus(required(flags, 'id'), status);
    printJson(write, row);
    return row;
  }

  if (command === 'delete') {
    const row = await store.remove(required(flags, 'id'));
    printJson(write, row);
    return row;
  }

  throw new Error(`不支持的命令：${command}\n${HELP}`);
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  runCommentsCommand(process.argv.slice(2)).catch(error => {
    console.error(`批注命令失败：${error.message}`);
    process.exitCode = 1;
  });
}
