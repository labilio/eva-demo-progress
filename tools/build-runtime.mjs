import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const patchFiles = [
  'prototype/009-4-registry.js',
  'prototype/009-5-patch-im.js',
  'prototype/009-6-patch-general.js',
  'prototype/009-7-patch-sider.js',
  'prototype/009-8-patch-automation.js',
];

const reviewBlockStart = '<!-- eva-review:start -->';
const reviewBlockEnd = '<!-- eva-review:end -->';

export function siteDirectories({ deployment = false } = {}) {
  return deployment ? ['prototype'] : ['prototype', 'review', 'supabase'];
}

export function createSiteIndex(source, { deployment = false } = {}) {
  if (!deployment) return source;
  const start = source.indexOf(reviewBlockStart);
  const end = source.indexOf(reviewBlockEnd);
  if (start < 0 || end < start) throw new Error('部署构建缺少完整的批注资源边界标记');
  const output = `${source.slice(0, start)}${source.slice(end + reviewBlockEnd.length)}`;
  if (/\b(?:href|src)=["']review\//.test(output)) throw new Error('部署构建仍包含批注资源引用');
  return output;
}

export function createPatchedRuntime(root = process.cwd()) {
  const release = JSON.parse(fs.readFileSync(path.join(root, 'release.json'), 'utf8'));
  const window = { __EVA_RELEASE: release };
  const context = vm.createContext({ window, console });
  for (const file of patchFiles) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  let source = fs.readFileSync(path.join(root, 'vendor/eva-legacy-runtime.js'), 'utf8');
  for (const patch of window.__EVA_PATCHES || []) source = patch.apply(source);
  return { source, release, patchOrder: Array.from(window.__EVA_PATCHES || [], patch => String(patch.name)) };
}

export function buildSite(root = process.cwd(), { deployment = false } = {}) {
  const projectRoot = path.resolve(root);
  const outputRoot = path.resolve(projectRoot, 'dist');
  if (outputRoot !== path.join(projectRoot, 'dist') || !outputRoot.startsWith(`${projectRoot}${path.sep}`)) {
    throw new Error('拒绝清理非项目 dist 目录');
  }

  fs.rmSync(outputRoot, { recursive: true, force: true });
  fs.mkdirSync(outputRoot, { recursive: true });
  for (const directory of siteDirectories({ deployment })) {
    fs.cpSync(path.join(projectRoot, directory), path.join(outputRoot, directory), { recursive: true });
  }
  fs.mkdirSync(path.join(outputRoot, 'vendor'), { recursive: true });
  fs.copyFileSync(path.join(projectRoot, 'vendor/eva-legacy.css'), path.join(outputRoot, 'vendor/eva-legacy.css'));
  const indexSource = fs.readFileSync(path.join(projectRoot, 'index.html'), 'utf8');
  fs.writeFileSync(path.join(outputRoot, 'index.html'), createSiteIndex(indexSource, { deployment }));

  const result = createPatchedRuntime(projectRoot);
  fs.writeFileSync(
    path.join(outputRoot, 'vendor/eva-runtime.module.js'),
    `${result.source}\n//# sourceURL=eva-demo-${result.release.version.replace(/[^0-9a-z]+/gi, '-').toLowerCase()}.module.js\n`,
  );
  // Reject an invalid browser bundle before reporting a successful build.
  execFileSync(process.execPath, ['--check', path.join(outputRoot, 'vendor/eva-runtime.module.js')], { stdio: 'pipe' });
  return { outputRoot, deployment, ...result };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const unknownArguments = process.argv.slice(2).filter(argument => argument !== '--deployment');
  if (unknownArguments.length) throw new Error(`未知构建参数：${unknownArguments.join(', ')}`);
  const result = buildSite(process.cwd(), { deployment: process.argv.includes('--deployment') });
  const mode = result.deployment ? 'deployment without review' : 'local review';
  console.log(`Eva build complete: ${result.outputRoot} (${Buffer.byteLength(result.source)} runtime bytes, ${mode})`);
}
