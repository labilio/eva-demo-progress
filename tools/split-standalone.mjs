import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const slug = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'block';

const canonicalSource = (source) => source.replace(/\r\n/g, '\n');

const loaderAnchor = /var sourceNode = document\.getElementById\(['"]eva-app-module-source['"]\);\s*var source = sourceNode \? sourceNode\.textContent : '';/;

const rewriteRuntimeLoader = (source) => {
  if (!source.includes("document.getElementById('eva-app-module-source')") &&
      !source.includes('document.getElementById("eva-app-module-source")')) {
    return { source, rewrote: false };
  }

  if (!loaderAnchor.test(source)) {
    throw new Error('基础模块加载器锚点不匹配');
  }

  let rewritten = source.replace(
    /^(\s*)\(function \(\) \{/,
    '$1(async function () {',
  );
  rewritten = rewritten.replace(
    loaderAnchor,
    [
      "var sourceResponse = await fetch('vendor/eva-legacy-runtime.js');",
      "    if (!sourceResponse.ok) throw new Error('EVA 临时兼容运行时加载失败：HTTP ' + sourceResponse.status);",
      '    var source = await sourceResponse.text();',
    ].join('\n'),
  );
  return { source: rewritten, rewrote: true };
};

export const splitStandalone = async ({ sourcePath, outputRoot, sourceRevision }) => {
  const resolvedSource = path.resolve(sourcePath);
  const resolvedOutput = path.resolve(outputRoot);
  const source = await fs.readFile(resolvedSource, 'utf8');
  const prototypeDir = path.join(resolvedOutput, 'prototype');
  const vendorDir = path.join(resolvedOutput, 'vendor');
  await fs.mkdir(prototypeDir, { recursive: true });
  await fs.mkdir(vendorDir, { recursive: true });

  const tagPattern = /<(script|style)\b([^>]*)>/gi;
  const blocks = [];
  let match;
  let cursor = 0;
  let index = 0;
  let html = '';
  let runtimeExtracted = false;
  let runtimeLoaderRewritten = false;

  while ((match = tagPattern.exec(source))) {
    const tag = match[1].toLowerCase();
    const attrs = match[2] || '';
    const closingTag = `</${tag}>`;
    const bodyEnd = source.indexOf(closingTag, tagPattern.lastIndex);
    if (bodyEnd < 0) {
      throw new Error(`找不到 ${closingTag}：offset ${match.index}`);
    }

    html += source.slice(cursor, match.index);
    const body = source.slice(tagPattern.lastIndex, bodyEnd);
    const dataName = attrs.match(/\bdata-eva-([\w-]+)/i)?.[1];
    const idName = attrs.match(/\bid=["']([^"']+)["']/i)?.[1];
    const blockName = slug(dataName || idName || `${tag}-${index}`);
    const order = String(index).padStart(3, '0');
    const isRuntime = idName === 'eva-app-module-source';
    const isBaseStyle = tag === 'style' && body.length > 1_000_000;
    const isInertData = tag === 'script' && /\btype=["']application\/json["']/i.test(attrs);

    if (isRuntime) {
      runtimeExtracted = true;
      const relativePath = 'vendor/eva-legacy-runtime.js';
      await fs.writeFile(path.join(resolvedOutput, relativePath), body);
      blocks.push({
        order: index,
        tag,
        name: blockName,
        file: relativePath,
        bytes: Buffer.byteLength(body),
        role: 'vendor',
      });
      html += `<!-- Temporary Eva migration runtime: ${relativePath} -->`;
    } else if (isInertData) {
      html += source.slice(match.index, bodyEnd + closingTag.length);
      blocks.push({
        order: index,
        tag,
        name: blockName,
        file: null,
        bytes: Buffer.byteLength(body),
        role: 'inline-data',
      });
    } else {
      const extension = tag === 'style' ? 'css' : 'js';
      const relativePath = isBaseStyle
        ? 'vendor/eva-legacy.css'
        : `prototype/${order}-${blockName}.${extension}`;
      const rewrite = tag === 'script'
        ? rewriteRuntimeLoader(body)
        : { source: body, rewrote: false };
      const output = rewrite.source;
      runtimeLoaderRewritten ||= rewrite.rewrote;
      await fs.writeFile(path.join(resolvedOutput, relativePath), output);

      if (isBaseStyle) {
        html += `<link rel="stylesheet" href="${relativePath}">`;
      } else if (tag === 'style') {
        html += `<link rel="stylesheet" href="${relativePath}">`;
      } else {
        const keptType = attrs.match(/\btype=["']module["']/i) ? ' type="module"' : '';
        html += `<script src="${relativePath}"${keptType}></script>`;
      }

      blocks.push({
        order: index,
        tag,
        name: blockName,
        file: relativePath,
        bytes: Buffer.byteLength(output),
        role: isBaseStyle ? 'vendor' : 'prototype',
      });
    }

    index += 1;
    cursor = bodyEnd + closingTag.length;
    tagPattern.lastIndex = cursor;
  }

  html += source.slice(cursor);
  if (runtimeExtracted && !runtimeLoaderRewritten) {
    throw new Error('基础模块加载器锚点不匹配');
  }
  const normalized = canonicalSource(source);
  const manifest = {
    source: path.basename(resolvedSource),
    sourceRevision,
    sourceCanonicalSha256: createHash('sha256').update(normalized).digest('hex'),
    sourceCanonicalBytes: Buffer.byteLength(normalized),
    blocks,
  };

  await fs.writeFile(path.join(resolvedOutput, 'index.html'), html);
  await fs.writeFile(
    path.join(resolvedOutput, 'prototype-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );

  return {
    indexBytes: Buffer.byteLength(html),
    vendorBytes: blocks
      .filter((block) => block.role === 'vendor')
      .reduce((sum, block) => sum + block.bytes, 0),
    prototypeBytes: blocks
      .filter((block) => block.role === 'prototype')
      .reduce((sum, block) => sum + block.bytes, 0),
    externalBlocks: blocks.filter((block) => block.file).length,
    inlineDataBlocks: blocks.filter((block) => block.role === 'inline-data').length,
  };
};

const isCli = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isCli) {
  const sourcePath = process.argv[2];
  const outputRoot = process.argv[3];
  if (!sourcePath || !outputRoot) {
    console.error('用法：node tools/split-standalone.mjs <standalone.html> <输出目录>');
    process.exit(1);
  }
  const sourceRevision = process.env.EVA_SOURCE_REVISION || 'unknown';
  console.log(JSON.stringify(
    await splitStandalone({ sourcePath, outputRoot, sourceRevision }),
    null,
    2,
  ));
}
