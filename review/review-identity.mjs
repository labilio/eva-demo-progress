// Shared review signature only; not an authenticated Eva identity.
const KEY = 'eva-review-author';
const EVENT = 'eva-review-author-change';
export function getReviewAuthor() {
  const value = (localStorage.getItem(KEY) || '').trim();
  return value === '匿名同事' ? '' : value;
}
export function setReviewAuthor(value) {
  const name = String(value || '').trim();
  if (name && name !== '匿名同事') localStorage.setItem(KEY, name);
  else localStorage.removeItem(KEY);
  window.dispatchEvent(new Event(EVENT));
}
export function subscribeReviewAuthor(listener) {
  const storage = event => { if (event.key === KEY || event.key === null) listener(getReviewAuthor()); };
  const changed = () => listener(getReviewAuthor());
  window.addEventListener('storage', storage);
  window.addEventListener(EVENT, changed);
  return () => { window.removeEventListener('storage', storage); window.removeEventListener(EVENT, changed); };
}
