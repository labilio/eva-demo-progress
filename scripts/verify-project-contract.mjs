import fs from 'node:fs';
import crypto from 'node:crypto';

const currentPrototype = 'prototypes/eva demo 0904 -v1.html';
const entryFile = 'index.html';

function fail(message) {
  console.error(`Project contract violation: ${message}`);
  process.exitCode = 1;
}

function read(path) {
  if (!fs.existsSync(path)) {
    fail(`missing ${path}`);
    return '';
  }
  return fs.readFileSync(path, 'utf8');
}

read('AGENTS.md');
read('README.md');
const entry = read(entryFile);
const prototype = read(currentPrototype);
const gitignore = read('.gitignore').replace(/\r\n/g, '\n');
const vercelIgnore = read('.vercelignore').replace(/\r\n/g, '\n').trim();

for (const trackedPath of [
  '!AGENTS.md',
  '!README.md',
  '!index.html',
  '!scripts/verify-project-contract.mjs',
  `!${currentPrototype}`,
]) {
  if (!gitignore.split('\n').includes(trackedPath)) {
    fail(`.gitignore does not expose the maintained contract file: ${trackedPath}`);
  }
}

if (gitignore.split('\n').includes('!prototypes/eva demo 0903 -v3.html')) {
  fail('.gitignore still exposes the retired 0903-v3 prototype as the current artifact');
}

if (entry && prototype) {
  const hash = value => crypto.createHash('sha256').update(value).digest('hex');
  if (hash(entry) !== hash(prototype)) {
    fail(`${entryFile} and ${currentPrototype} are not byte-identical`);
  }
}

for (const forbidden of ['EvaCtxIcon=', 'evaMenuIcons={']) {
  if (entry.includes(forbidden)) fail(`${entryFile} contains retired hand-written icon code: ${forbidden}`);
}

const expectedVercelIgnore = '*\n!index.html\n!vercel.json';
if (vercelIgnore !== expectedVercelIgnore) {
  fail('.vercelignore must publish only index.html and vercel.json');
}

if (!process.exitCode) console.log('Eva project contract verification passed.');
