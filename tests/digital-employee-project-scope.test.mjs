import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function setup() {
  const window = { EvaDigitalEmployeesStore: {
    get: id => ({ id, name: '数字员工', ownership: 'organization' }),
    appearance: () => ({})
  }};
  vm.runInNewContext(fs.readFileSync(new URL('../prototype/009-2-membership.js', import.meta.url), 'utf8'), { window });
  const store = window.EvaMembership.create({ people: [{ id: 'owner', name: '负责人' }, { id: 'member', name: '成员' }] });
  store.createProject('p', '项目', 'owner', []);
  store.addMember('p', 'owner', 'member');
  store.createGroup('project-group', '项目群', 'p', 'owner', []);
  store.createGroup('org-group', '非项目群', null, 'owner', []);
  return store;
}

test('数字员工不能直接加入项目内群或无项目群，失败不修改成员数据', () => {
  const store = setup();
  const before = store.snapshot();
  for (const id of ['project-group', 'org-group']) {
    assert.throws(() => store.addEmployee(id, 'owner', 'employee'), /只能放进项目/);
  }
  assert.deepEqual(store.snapshot(), before);
});

test('数字员工仍可放进项目，全员群别名归一化到项目且重复添加不重复', () => {
  const store = setup();
  store.addEmployee('p', 'owner', 'employee');
  store.addEmployee('all:p', 'owner', 'employee');
  assert.deepEqual(Array.from(store.snapshot().projects.p.employeeIds), ['employee']);
  assert.equal(store.snapshot().groups['project-group'].employeeIds, undefined);
});

test('群聊边界调整不改变现有项目成员添加权限', () => {
  const store = setup();
  assert.equal(store.manager('p', 'member'), false);
  store.addEmployee('p', 'member', 'employee');
  assert.deepEqual(Array.from(store.snapshot().projects.p.employeeIds), ['employee']);
});
