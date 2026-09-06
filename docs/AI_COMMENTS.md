# AI／Codex 云端批注接口

批注既可以由人在网页侧栏创建，也可以由 Codex 等 AI 直接通过仓库命令写入。两种入口使用同一个 Supabase 数据源，创建后会立即出现在对应页面的共享批注中。

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

修改类型：

- `copy`：改文案
- `ui`：调整 UI
- `rebuild`：重做
- `function`：补充／优化功能（默认）

可选定位参数：`--tag`、`--role`、`--label`、`--placeholder`、`--input-type`、`--heading`、`--rx`、`--ry`。命令返回数据库中的完整 JSON 记录和批注 ID。

## 查询批注

```powershell
npm run comments -- list --page "#/guid"
```

AI 在重复创建意见前应先查询当前页面，避免同一问题被重复提交。

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
```

状态只有：`open`（待讨论）、`approved`（已确认）、`doing`（开发中）。AI 不得自行确认产品意见；只有已经得到用户人工明确确认时，才允许执行：

```powershell
npm run comments -- status `
  --id "批注 UUID" `
  --status approved `
  --confirmed-by-user
```

## 署名

默认署名是 `Codex`。临时覆盖使用 `--author "设计评审 AI"`；同一台电脑长期使用可以设置环境变量 `EVA_REVIEW_AUTHOR`。使用 AI 名称或“姓名的 Codex”，不要冒充真实同事。

## AI 执行规则

1. 用户要求“批注、评审、记录意见，但不要改代码”时，使用本命令，不修改产品源码。
2. 创建前确认页面路径和具体元素；无法可靠定位时先向用户确认，不创建悬空批注。
3. 创建后返回批注 ID、页面、定位对象、类型和意见摘要。
4. `approved` 必须来自本轮人工确认；AI 推断、旧对话授权和“看起来合理”都不算确认。
5. 本命令使用前端相同的 publishable key 和现有 RLS，不需要也禁止使用 Supabase secret/service-role key。
