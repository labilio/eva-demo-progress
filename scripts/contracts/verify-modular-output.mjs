import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

export const verifyModularOutput = async ({ root, baselinePath }) => {
  const resolvedRoot = path.resolve(root);
  const resolvedBaseline = path.resolve(baselinePath);
  const baseline = JSON.parse(await readFile(resolvedBaseline, 'utf8'));
  const manifest = JSON.parse(
    await readFile(path.join(resolvedRoot, 'prototype-manifest.json'), 'utf8'),
  );

  if (manifest.sourceRevision !== baseline.sourceRevision) {
    throw new Error(`旧版本输出：${manifest.sourceRevision}`);
  }
  if (manifest.sourceCanonicalSha256 !== baseline.canonicalSha256) {
    throw new Error(`源内容 SHA-256 不一致：${manifest.sourceCanonicalSha256}`);
  }
  if (manifest.sourceCanonicalBytes !== baseline.canonicalBytes) {
    throw new Error(`源内容字节数不一致：${manifest.sourceCanonicalBytes}`);
  }

  const indexPath = path.join(resolvedRoot, 'index.html');
  const indexText = await readFile(indexPath, 'utf8');
  const indexStat = await stat(indexPath);
  if (indexStat.size >= 20_000) {
    throw new Error(`模块化入口仍然过大：${indexStat.size} bytes`);
  }

  const sourceParts = [indexText];
  let fileCount = 0;
  for (const [index, block] of manifest.blocks.entries()) {
    if (block.order !== index) {
      throw new Error(`Manifest 顺序错误：期望 ${index}，实际 ${block.order}`);
    }
    if (!block.file) continue;
    const filePath = path.resolve(resolvedRoot, block.file);
    if (!filePath.startsWith(`${resolvedRoot}${path.sep}`)) {
      throw new Error(`Manifest 文件越界：${block.file}`);
    }
    const fileText = await readFile(filePath, 'utf8');
    sourceParts.push(fileText);
    fileCount += 1;
  }

  const combinedSource = sourceParts.join('\n');
  for (const marker of baseline.requiredMarkers) {
    if (!combinedSource.includes(marker)) {
      throw new Error(`模块化输出缺少当前版标记：${marker}`);
    }
  }

  return {
    blocks: manifest.blocks.length,
    files: fileCount,
    indexBytes: indexStat.size,
  };
};

const isCli = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isCli) {
  const rootFlag = process.argv.indexOf('--root');
  const root = rootFlag >= 0
    ? process.argv[rootFlag + 1]
    : process.argv[2] || 'build/modular';
  const repositoryRoot = path.resolve(import.meta.dirname, '..', '..');
  const result = await verifyModularOutput({
    root,
    baselinePath: path.join(repositoryRoot, 'migration', 'baseline.json'),
  });
  console.log(
    `Eva modular output verification passed (${result.blocks} blocks, ${result.files} files, ${result.indexBytes} entry bytes).`,
  );
}
