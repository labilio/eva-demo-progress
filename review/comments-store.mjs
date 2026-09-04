const TABLE = 'eva_demo_comments';

function validateComment(comment) {
  const name = String(comment.author_name || '').trim();
  const body = String(comment.body || '').trim();
  if (name.length < 2) throw new Error('姓名至少两个字');
  if (name.length > 40) throw new Error('姓名不能超过 40 个字');
  if (!body) throw new Error('请填写意见');
  if (body.length > 2000) throw new Error('意见不能超过 2000 个字');
  return { ...comment, author_name: name, body };
}

export function createCommentsStore({ url, key, fetchImpl = fetch }) {
  if (!url || !key) throw new Error('Supabase Comments 配置缺失');
  const endpoint = `${url.replace(/\/$/, '')}/rest/v1/${TABLE}`;
  const headers = {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
  async function request(target, options) {
    const response = await fetchImpl(target, { ...options, headers: { ...headers, ...(options?.headers || {}) } });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.message || `Comments 请求失败（${response.status}）`);
    return payload;
  }
  return {
    async list(pagePath) {
      const query = new URLSearchParams({
        select: 'id,page_path,anchor,author_name,body,kind,status,created_at',
        page_path: `eq.${pagePath}`,
        order: 'created_at.desc',
      });
      return request(`${endpoint}?${query}`, { method: 'GET' });
    },
    async create(comment) {
      const valid = validateComment(comment);
      const rows = await request(endpoint, {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify({
          client_nonce: valid.client_nonce || crypto.randomUUID(),
          page_path: valid.page_path,
          anchor: valid.anchor || {},
          author_name: valid.author_name,
          body: valid.body,
          kind: valid.kind || 'issue',
          status: 'open',
        }),
      });
      return rows[0];
    },
  };
}
