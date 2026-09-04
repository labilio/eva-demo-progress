import fs from 'node:fs';

export function readActiveSource(root = '.') {
  const manifest = JSON.parse(fs.readFileSync(`${root}/prototype-manifest.json`, 'utf8'));
  const orderedFiles = manifest.blocks
    .filter(block => block.file)
    .map(block => block.file);
  return [
    fs.readFileSync(`${root}/index.html`, 'utf8'),
    ...orderedFiles.map(file => fs.readFileSync(`${root}/${file}`, 'utf8')),
  ].join('\n');
}
