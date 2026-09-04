# Eva Demo

Eva 桌面端交互原型的在线进度预览。

## 当前入口

- 唯一页面入口：`index.html`
- 可维护业务模块：`prototype/`
- 暂存的旧运行时依赖：`vendor/`（后续逐步替换，不作为产品实现参照）
- 模块加载顺序：`prototype-manifest.json`

本地使用 `npm start` 后访问 `http://127.0.0.1:4173`。拆分版依赖 HTTP 加载，不再支持直接双击 `file://`；线上仍由 GitHub `main` 自动发布到 Vercel。

## 发布流程

GitHub `main` 是唯一生产发布入口：本地修改经明确授权 commit 并 push 后，由 Vercel 自动部署。日常更新不运行 `vercel deploy`；该命令只用于用户明确要求的临时预览或 CLI 排障。

发布前后必须分别确认状态，不能把它们混称为“已经上线”：

1. **本地已修改**：工作区文件已更新，尚未代表 GitHub 或线上发生变化。
2. **GitHub main 已推送**：目标 commit 已到远端 `main`，尚未代表 Vercel 构建完成。
3. **Vercel 已部署**：生产部署成功且对应目标 commit，尚未代表页面交互已经人工检查。
4. **浏览器已验收**：等待自动部署生效后，在目标线上地址逐入口验证，并核对页面最近更新时间。

用户未授权 commit/push 时，工作停留在“本地已修改”。部署失败或浏览器未检查时，必须如实停留在相应状态。

## 实施边界

- 团队 IM 入口共享一套 `EvaIMConversation`/Octo-Web IM 内核，只替换数据和入口配置。
- Eva 页面外壳及通用界面优先使用既有封装或 Semi UI，不重造成熟 IM 组件。
- 图标使用 Lucide；相同语义允许并应复用同一图标，不设“每个图标只能出现一次”的限制。
- AionUI 仅是历史 Demo 的临时运行时依赖，与 Eva 的产品定位、设计和功能没有关系；新增功能不得参考 AionUI。
