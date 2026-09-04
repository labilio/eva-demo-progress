import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = path.resolve(import.meta.dirname, '..', '..');
const manifestPath = path.join(root, 'migration', 'baseline.json');

const fail = (message) => {
  console.error(`Eva migration baseline verification failed: ${message}`);
  process.exitCode = 1;
};

let baseline;
try {
  baseline = JSON.parse(await readFile(manifestPath, 'utf8'));
} catch (error) {
  if (error?.code === 'ENOENT') {
    fail('migration/baseline.json 不存在');
    process.exit();
  }
  throw error;
}

const sourceRevision = process.env.EVA_SOURCE_REVISION?.trim();
if (sourceRevision && sourceRevision !== baseline.sourceRevision) {
  fail(`sourceRevision 不一致：${sourceRevision}`);
}

const contents = await Promise.all(
  baseline.entries.map(async (relativePath) => ({
    relativePath,
    bytes: await readFile(path.join(root, relativePath)),
  })),
);

const canonicalContents = contents.map(({ relativePath, bytes }) => ({
  relativePath,
  text: bytes.toString('utf8').replace(/\r\n/g, '\n'),
}));

const hashes = canonicalContents.map(({ text }) =>
  createHash('sha256').update(text).digest('hex'),
);

if (new Set(hashes).size !== 1) {
  fail(`两个现行入口内容不一致：${hashes.join(', ')}`);
}

if (hashes[0] !== baseline.canonicalSha256) {
  fail(`SHA-256 漂移：${hashes[0]}`);
}

for (const { relativePath, text } of canonicalContents) {
  const canonicalBytes = Buffer.byteLength(text);
  if (canonicalBytes !== baseline.canonicalBytes) {
    fail(`${relativePath} 规范化字节数漂移：${canonicalBytes}`);
  }
}

const sourceText = contents[0].bytes.toString('utf8');
for (const marker of baseline.requiredMarkers) {
  if (!sourceText.includes(marker)) {
    fail(`缺少当前版标记：${marker}`);
  }
}

if (!process.exitCode) {
  console.log(`Eva migration baseline verification passed (${hashes[0]}).`);
}
