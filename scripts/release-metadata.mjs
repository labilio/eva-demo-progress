import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function formatHongKongMinute(date = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Hong_Kong',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date).filter(part => part.type !== 'literal').map(part => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}`;
}

export function nextReleaseMetadata(current, date = new Date()) {
  const updatedAt = formatHongKongMinute(date);
  const shortDate = updatedAt.slice(5, 10);
  const match = /^(\d{2}-\d{2}) v(\d+)$/.exec(current.version || '');
  const revision = match && match[1] === shortDate ? Number(match[2]) + 1 : 1;
  return { version: `${shortDate} v${revision}`, updatedAt };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  const releasePath = path.resolve('release.json');
  const current = JSON.parse(fs.readFileSync(releasePath, 'utf8'));
  const next = nextReleaseMetadata(current);
  fs.writeFileSync(releasePath, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`Eva release metadata updated: ${next.version} (${next.updatedAt})`);
}
