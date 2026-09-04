# Eva 模块化原型与在线协作设计

日期：2026-09-04

状态：已获用户批准

适用仓库：`D:\Geely\projects\eva-mode-exploration`

## 1. 目标

将当前 22 MB All-in-One Eva Demo 从唯一开发入口迁移为可维护、可并发修改、由 GitHub `main` 驱动 Vercel 自动构建的模块化项目，并增加在线共享 Comments。

迁移必须同时满足：

- 当前最新 Demo 的页面、数据和交互不因领导包使用旧版本而回退；
- 个人 Eva 任务流程采用客户 GDS for AI 2.0；
- 团队 IM 继续移植并复用 Octo-Web 的成熟 IM 内核；
- Eva 自有通用界面使用现有封装或 Semi UI；
- 全站继续使用 Lucide Icons；
- Comments 在线共享，评论前必须填写姓名；
- 本地目录形成清晰、唯一的开发入口，不再依赖散落文件；
- 旧 All-in-One 文件退出日常开发，但保留可恢复的 Git 历史。

## 2. 已确认事实

- 当前仓库 HEAD 为 `830514a`，领导拆分包的源版本为其祖先提交 `100c7cb`。
- 当前 `index.html` 与 `prototypes/eva demo 0904 -v1.html` 均为 22,454,724 字节。
- 领导包已经把旧版 standalone 拆为小入口、`vendor/`、`prototype/`、`assets/`、Comments 和工具脚本。
- 领导包仍包含约 18.6 MB 的 AionUI 编译 bundle，以及 CSS 覆盖、DOM 补丁和 bundle 字符串手术；它是改善协作效率的过渡结构，不是完整的 React 源码工程。
- AionUI 与新的 Eva 团队及产品没有产品、设计或正式实现关系。旧 Demo 采用 AionUI，只是领导在时间有限时借用一个外观相近的现成 UI 脚手架，避免从零制作 Demo。
- 客户 GDS 2.0 来自 6 张 1200×800 个人任务画板，覆盖 `home / input / skill-picker / operation / generating / completed`，没有覆盖团队 IM 或完整响应式产品。
- 当前仓库已有未提交的 `.gitignore` 修改和未跟踪 `docs/` 内容。迁移不得覆盖或混入这些既有材料。

## 3. 核心决策

### 3.1 版本与内容基线

唯一内容基线是当前最新提交 `830514a` 及迁移开始时经确认保留的本地改动。领导包的旧 HTML、旧 bundle、旧 CSS、旧 Demo 数据和旧页面补丁不得覆盖当前内容。

领导包按“能力移植”处理，不按目录合并处理。允许移植：

- standalone 拆分方法；
- manifest 与加载顺序；
- 锚点失配立即失败的补丁注册机制；
- patch hash 与入口检查思路；
- Comments 的选区、定位、回复和 Run 数据模型；
- GDS 2.0 原始规范和验证器。

AionUI 本身不属于允许移植的产品能力。不得根据 AionUI 仓库、组件、信息架构、交互或视觉推导 Eva 需求；现存 AionUI bundle 只作为保证迁移期间旧 Demo 可继续运行的临时兼容依赖。

### 3.2 开发与发布形态

- GitHub 中只维护一套模块化现行源代码。
- 本地使用正常开发服务器和增量加载，不再直接编辑巨型 HTML。
- Vercel 从 GitHub `main` 自动构建部署；默认不执行手动 `vercel deploy`。
- All-in-One HTML 不再作为现行入口或并行维护物。迁移成功前保留旧提交作为回滚点；如以后确有离线分享需求，可由构建脚本临时生成，不允许手工维护第二份源码。

### 3.3 UI 标准分工

- 个人 Eva 任务生命周期：客户 GDS for AI 2.0 是视觉与状态合同，默认采用 Production 模式，并保留 Fidelity 视觉特征。
- 团队 IM：Octo-Web 是消息行、连续消息、头像、时间、Hover、右键菜单、多选、引用、文件、任务卡片和输入区的能力标准。
- Eva 外壳：导航、表单、弹窗、按钮、列表、空状态优先使用项目封装；没有封装时使用 Semi UI。
- 图标：统一使用 Lucide Icons；同一语义允许且应该复用同一图标。

GDS 的固定 1200×800、260/940 和完成态 390/810 仅在其已覆盖的个人任务页面内作为参考，不得全局套用到团队协作页面。

## 4. 迁移架构

目标结构：

```text
eva-mode-exploration/
├─ src/
│  ├─ app/                       # 应用入口、路由、唯一全局状态源
│  ├─ features/
│  │  ├─ personal-eva/           # GDS 个人任务状态
│  │  ├─ team-im/                # Octo IM 内核与 Eva 适配层
│  │  ├─ projects/
│  │  ├─ contacts/
│  │  ├─ files/
│  │  ├─ digital-employees/
│  │  └─ feedback/               # Comments UI 与数据访问
│  ├─ design-system/
│  │  ├─ gds-for-ai-2.0/         # 客户原始规范、tokens、参考图
│  │  └─ theme/                  # Semi UI 与 Eva 主题适配
│  └─ shared/
│     ├─ components/
│     └─ icons/                  # Lucide 语义映射
├─ public/assets/
├─ supabase/migrations/
├─ scripts/contracts/
├─ docs/
├─ index.html                    # 小型应用入口
└─ vercel.json
```

迁移分两个阶段完成，但不保留两个现行产品入口：

1. **机械拆分与等价运行**：使用当前最新 standalone 生成小入口、当前版临时兼容 vendor 和按功能拆分的脚本/样式；先证明没有内容回退。
2. **逐域独立实现**：按 `team-im`、`personal-eva`、导航、项目、通讯录、文件、数字员工等边界，把 AionUI 脚手架和补丁逐步替换为 Eva 自己的组件、数据和状态所有者。

第一阶段允许临时保留当前 AionUI 编译运行时，但它只是迁移保险，不是架构基础或最终可维护源码。第二阶段每迁移一个域，必须同时删除该域对应的 AionUI 依赖、旧 DOM 补丁、旧 CSS 覆盖、旧事件监听和旧数据副本。最终现行应用不得依赖 AionUI bundle。

## 5. 状态与数据规则

- 路由是一级导航选中态的唯一权威源。
- IM 入口模式和会话 ID 决定当前会话数据；右侧只存在一个可见 IM 实例。
- 可从路由或业务数据推导的视觉状态不得复制为 `body class`、`window` 变量或手工 `aria-current`。
- 禁止通过先点击另一个入口、再覆盖结果的方式复用页面。
- 禁止在核心页面新增 `stopImmediatePropagation`、捕获阶段导航旁路或用于维持 React 主状态的 MutationObserver。
- 每个功能域只能有一个数据适配入口；页面只传数据和配置，不直接修改 IM 或其他组件内部 DOM。

## 6. Comments 与 Supabase

### 6.1 用户体验

- 持有 Vercel 链接即可查看 Demo。
- 首次评论必须填写姓名；空白姓名不能提交。
- 姓名保存在浏览器本地，后续自动带入，并随每条评论保存和展示。
- 姓名是内部评审署名，不等同于实名认证或正式账号。
- 评论支持页面路径、目标锚点/位置、正文、回复、处理状态和关联 Run。

### 6.2 数据边界

Supabase 只负责 Comments 及其协作状态，不把整个 Demo 改造成数据库驱动应用。最小数据字段包括：

- `id`
- `release_commit`
- `page_path`
- `target_anchor` 与位置数据
- `content`
- `author_name`
- `status`
- `created_at` 与 `updated_at`
- 可选的 `run_id`、完成 commit、处理摘要和回复

### 6.3 安全与故障隔离

- 客户端只使用公开匿名 key；禁止暴露 `service_role` 或 secret key。
- 所有公开表启用 RLS，并限制允许的读取、创建和更新范围。
- 评论失败必须明确提示，不得吞掉错误或显示假成功。
- Supabase 不可用时，Demo 页面和核心导航仍应正常运行；只禁用或降级 Comments。
- 公网评论不能直接触发 shell。Comment → Run 只创建待领取记录，由受控的本地 Agent 明确领取。

## 7. 防回退与验证合同

迁移不能只检查文件存在，必须建立会失败的合同：

- manifest 的源提交必须等于迁移基线。
- 拆分前后关键运行时补丁结果 hash 一致。
- 当前最新版的关键页面、会话、导航和更新时间存在。
- 三个团队 IM 入口使用统一 IM 内核，禁止直接替换 `.ch-stream.innerHTML`。
- 所有会话条目可点击并能切换数据。
- 个人 Eva 六个状态符合 GDS 的 required/forbidden 组件合同。
- Lucide 语义映射固定，禁止手写 SVG、Emoji 或字符图标替代。
- 禁止新增平行页面状态、消息实现和第二套右键菜单。
- Comments 写入、读取、回复和状态更新必须经过真实持久化检查。
- GitHub `main`、Vercel Deployment commit 和页面“最近更新”必须一致。

迁移采用小步提交：每一步只处理一个架构边界，能够独立回滚。任何阶段出现白屏、关键入口丢失或内容回退，停止后续迁移并回到上一个通过合同的提交。

## 8. 本地目录整理

`D:\Geely` 保留为产品系列根目录：

```text
D:\Geely\
├─ baseline/                     # 只读定稿基线，不移动、不修改
├─ projects/
│  ├─ eva-mode-exploration/      # 当前模块化 Demo 与唯一 Git 仓库
│  └─ eva-onboarding/            # 独立专项，不与当前仓库混合
├─ archive/                      # 确认不再现行但需保留的散落材料
├─ AGENTS.md
└─ README.md
```

整理规则：

- 不改变 `baseline/` 内容和校验值。
- 不把 `eva-onboarding` 合入当前 Demo 仓库。
- 根目录临时提取物、日志和过程材料移动到按日期分类的 `archive/process/`；无明确价值的文件也先归档，不直接删除。
- 用户提供的原始 ZIP 保留在原接收位置，只读检查结果和需要使用的规范进入对应项目目录。
- 当前项目只保留一个现行入口；旧原型放入明确的 archive/reference 区或仅保留于 Git 历史，不与现行源码并列命名为多个“最新版”。
- 更新根目录与项目 README，写清楚：当前项目、开发命令、发布链路、归档位置和禁止修改的基线。
- 移动前检查 Git 状态、脚本引用和文件 hash；移动后修正明确引用并检查不存在断链。

## 9. 非目标

- 不把 Eva 做成第二个 Octo。
- 不用 Semi UI 重造已经成熟的 Octo IM 业务组件。
- 不把 GDS 2.0 强行应用到它没有覆盖的团队协作页面。
- 不在本轮重写整个 AionUI 编译 bundle。
- 不从 AionUI 源码恢复、复制或推导 Eva 产品实现；AionUI 仅是待退出的旧 Demo 脚手架。
- 不让 Supabase 接管 Demo 的所有模拟业务数据。
- 不继续维护 Git 版、本地版和 All-in-One 版三套平行源码。
- 不在目录整理中删除基线、用户原始资料或来源不明的未提交文件。

## 10. 完成标准

- 本地开发、GitHub 源码和 Vercel 部署来自同一套模块化源代码。
- 当前最新版内容未回退，领导旧版本不再参与页面内容合并。
- 个人 Eva 任务页面按客户 GDS 2.0 实施。
- 团队 IM 使用统一 Octo 能力框架，不存在平行消息实现。
- Comments 必填姓名并能跨浏览器持久共享。
- 本地目录具有清晰项目、基线和归档边界。
- 旧 standalone 不再承担日常开发职责，仍可从迁移前 Git 提交恢复。
- AionUI 临时兼容依赖已经按域逐步移除，并在最终架构中完全退出。
- 所有静态合同、构建检查、Comments 持久化检查和规定的浏览器关键路径验证通过后，才允许将迁移结果推送到 `main` 触发 Vercel 自动部署。
