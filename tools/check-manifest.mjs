import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const manifestPath = path.resolve(process.argv[2] || 'prototype-manifest.json');
const root = path.dirname(manifestPath);
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

for (const [index, block] of manifest.blocks.entries()) {
  if (block.order !== index) {
    throw new Error(`Manifest 顺序错误：期望 ${index}，实际 ${block.order}`);
  }
  if (block.file) {
    const fileStat = await stat(path.join(root, block.file));
    if (!fileStat.isFile()) throw new Error(`Manifest 目标不是文件：${block.file}`);
  }
}

console.log(`Eva prototype manifest verification passed (${manifest.blocks.length} blocks).`);
