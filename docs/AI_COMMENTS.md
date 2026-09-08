# AI／Codex 云端批注接口

批注既可以由人在网页侧栏创建，也可以由 Codex 等 AI 直接通过仓库命令写入。两种入口使用同一个 Supabase 数据源，创建后会立即出现在对应页面的共享批注中。

Supabase 仅承载共享批注，不是 Eva 云盘、聊天、项目或任务的业务后端。产品演示数据与浏览器本地存储的边界统一遵循 [AGENTS.md「数据存储边界」](../AGENTS.md#数据存储边界)；排查本地上传或文件预览问题时，不得据此推导出需要修改批注数据库。

## 创建批注

```powershell
npm run comments -- add `
  --page "#/guid" `
  --selector "[data-eva-nav-id='my-ai']" `
  --label "我的 AI" `
  --kind ui `
  --body "调整这个入口的间距"
```

必须提供 `--page`，并在 `--selector`、`--anchor-id`、`--quote` 中至少提供一个。优先顺序是稳定元素 ID／`data-*` 选择器、可辨识的引用文案、普通 CSS 选择器。不要使用依赖 DOM 序号的脆弱选择器。

批注类型：

- `copy`：改文案
- `ui`：调整 UI
- `rebuild`：重做
- `function`：补充／优化功能（默认）
- `ready`：已基本定稿

可选定位参数：`--tag`、`--role`、`--label`、`--placeholder`、`--input-type`、`--heading`、`--rx`、`--ry`。命令返回数据库中的完整 JSON 记录和批注 ID。

## 查询批注

```powershell
npm run comments -- list
npm run comments -- list --page "#/guid"
```

不带 `--page` 查询整个 Demo 的全部共享批注；带 `--page` 只查询指定页面。AI 在重复创建意见前应先查询，避免同一问题被重复提交。

## 回复批注

```powershell
npm run comments -- reply `
  --id "批注 UUID" `
  --body "已补充复现条件"
```

## 更新状态

```powershell
npm run comments -- status --id "批注 UUID" --status doing
npm run comments -- status --id "批注 UUID" --status open
npm run comments -- status --id "批注 UUID" --status done
```

## 删除批注

```powershell
npm run comments -- delete --id "批注 UUID"
```

批注是项目内的共享评审数据，所有访问者和协作 AI 都能查看、回复、改状态和删除。删除会同时删除其回复且无法撤销，执行前必须确认目标批注 ID。

状态只有：`open`（待讨论）、`approved`（已确认）、`doing`（原型修改中）、`done`（原型已改完）。`ready`（已基本定稿）是批注类型，不是状态。AI 不得自行确认产品意见或宣告基本定稿；只有已经得到用户人工明确确认时，才允许设置 `approved` 状态或创建 `ready` 类型，并必须提供 `--confirmed-by-user`。

```powershell
npm run comments -- add `
  --page "#/guid" `
  --selector "[data-eva-nav-id='my-ai']" `
  --kind ready `
  --body "这一部分已经基本定稿" `
  --confirmed-by-user
```

## 署名

默认署名是 `Codex`。临时覆盖使用 `--author "设计评审 AI"`；同一台电脑长期使用可以设置环境变量 `EVA_REVIEW_AUTHOR`。使用 AI 名称或“姓名的 Codex”，不要冒充真实同事。

网页中的人类批注和回复可以不填写姓名；空姓名会统一保存并显示为“匿名同事”。填写过一次的姓名仍会保存在当前浏览器中，后续自动沿用。

## AI 执行规则

1. 用户要求“批注、评审、记录意见，但不要改代码”时，使用本命令，不修改产品源码。
2. 创建前确认页面路径和具体元素；无法可靠定位时先向用户确认，不创建悬空批注。
3. 创建后返回批注 ID、页面、定位对象、类型和意见摘要。
4. `approved` 状态和 `ready` 类型必须来自本轮人工确认；AI 推断、旧对话授权和“看起来合理”都不算确认。
5. 本命令使用前端相同的 publishable key 和现有 RLS，不需要也禁止使用 Supabase secret/service-role key。
6. 删除属于共享操作；只能删除用户明确指定或本轮联调产生的批注，不得批量清理未知批注。

## 批注处理中心与认领

批注侧栏顶部“批注转 AI 修改”在新标签页打开 `/review/developer.html`，按一级功能菜单展示共享批注大表。复用原批注、讨论、四种状态，仅增加 `claimed_by` / `claimed_at` 共享署名。姓名不构成身份认证或访问权限。

默认筛选已确认、未认领。勾选可跨筛选保留；普通复制不更改状态，认领并复制在数据库事务中检查全部所选项，冲突时全部不认领。认领成功状态为修改中。释放认领保留原状态；评审者可在原批注侧栏重新确认后安排开发。

```sh
npm run comments -- list --ids <UUID,UUID>
npm run comments -- claim --ids <UUID,UUID> --author "开发者姓名"
npm run comments -- unclaim --ids <UUID,UUID> --author "原认领者姓名"
```

提示词包含仓库、实际前端构建 commit/分支/版本、页面 URL、批注 UUID、原文、完整讨论、定位数据及源码检索起点。源码参照不能代替读取当前职责清单。构建元信息由构建过程生成，不维护第二套正式版本号。AI 接手先刷新批注；复制文本本身不代表执行或发布授权。

开发结果复用 `reply`，回填修改说明、commit/PR、预览地址和验证结果后，用原有 `status` 命令更新实际进度。不得将“原型已改完”表述为人工验收通过。
