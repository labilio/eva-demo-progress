
(function () {
  try {
    var key = 'eva-collab-spaces';
    var current = JSON.parse(localStorage.getItem(key) || '[]');
    if (!Array.isArray(current) || !current.length) return;
    var changed = false;
    current = current.map(function (space) {
      if (space.id === 'official' || space.name === 'EVA Official Space') {
        changed = true;
        return Object.assign({}, space, { color: '#7771D6', colorBg: '#F1F0FF', official: true, lockedGroups: true });
      }
      if (space.id === 'prod' || space.name === '智能产品部' || space.name === 'AI 产品共创') {
        changed = true;
        return Object.assign({}, space, {
          name: '供应链运营协同', short: '供',
          desc: '协同推进间接采购、供应商质量与合规风控工作',
          color: '#4F6BED', colorBg: '#EEF2FF', bots: 7
        });
      }
      if (space.id === 'lab' || space.name === '体验实验室') {
        changed = true;
        return Object.assign({}, space, {
          name: '客户联合交付', short: '客',
          desc: '内部交付团队与客户成员在独立权限下共同推进工作',
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
  } catch (error) {}
})();
