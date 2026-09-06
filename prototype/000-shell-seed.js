
(function () {
  try {
    var key = 'eva-collab-spaces';
    var migrationKey = 'eva-project-seed-migration:v1';
    if (localStorage.getItem(migrationKey)) return;
    var current = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(current) || !current.length) { localStorage.setItem(migrationKey, 'done'); return; }
    var changed = false;
    current = current.map(function (space) {
      if (space.id === 'official') {
        changed = true;
        return Object.assign({}, space, { color: '#7771D6', colorBg: '#F1F0FF', official: true, lockedGroups: true });
      }
      if (space.id === 'prod') {
        changed = true;
        return Object.assign({}, space, {
          name: ['智能产品部', 'AI 产品共创'].includes(space.name) ? '供应链运营协同' : space.name,
          short: ['智能产品部', 'AI 产品共创'].includes(space.name) ? '供' : space.short,
          desc: ['智能产品部', 'AI 产品共创'].includes(space.name) ? '协同推进间接采购、供应商质量与合规风控工作' : space.desc,
          color: '#4F6BED', colorBg: '#EEF2FF', bots: 7
        });
      }
      if (space.id === 'lab') {
        changed = true;
        return Object.assign({}, space, {
          name: space.name === '体验实验室' ? '客户联合交付' : space.name,
          short: space.name === '体验实验室' ? '客' : space.short,
          desc: space.name === '体验实验室' ? '内部交付团队与客户成员在独立权限下共同推进工作' : space.desc,
          color: '#12A38F', colorBg: '#E9F8F5'
        });
      }
      if (space.id === 'drive-design') {
        changed = true;
        return Object.assign({}, space, { color: '#2F86C7', colorBg: '#EAF6FC' });
      }
      if (!space.colorBg && /^#[0-9a-f]{6}$/i.test(space.color || '')) {
        changed = true;
        return Object.assign({}, space, { colorBg: space.color + '18' });
      }
      return space;
    });
    if (changed) localStorage.setItem(key, JSON.stringify(current));
    localStorage.setItem(migrationKey, 'done');
  } catch (error) {}
})();
