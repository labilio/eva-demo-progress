# Eva 模块化原型

## 项目级 AI 身份视觉合同

- 适用于全项目的通讯录、消息、AI 团队、项目成员与选择器、详情和编辑器等入口。
- Eva Logo＋主人头像统一调用 `window.EvaAIIdentity.avatar`。React 与旧 HTML 只做渲染适配，禁止业务入口单独拼接组合头像。
- 唯一比例来自通讯录：32px 主头像、14px 主人头像、1px 白边、右下偏移 -1px。入口只传整体 size；比例由 `prototype/003-ai-identity.css` 统一计算，业务 CSS 禁止覆盖主人头像大小、边框或偏移。
- AI 标记的用途是在人类与 AI 共用的身份体系中区分两者，不是所有 AI 的装饰，也不是已连接 Octo 的状态标。是否展示由使用场景决定，身份类型来自数据，不按名称猜测。
- 团队 IM（包括与 AI 的私聊）、通讯录、项目／群成员列表及成员选择器中的 AI 身份名称旁显示 AI 标；「我的 AI 团队」的身份行作为团队 IM 对象入口沿用此规则，即使当前筛选只展示 AI 也保持一致。
- 个人「Eva 同学」的助理列表、消息、标题及创建／编辑页面不显示 AI 标，即使该助理已连接团队也不例外。纯 AI 管理表单（连接助理、创建／配置分身）和纯数字员工市场也不重复显示 AI 标；进入团队 IM 或成员体系后再显示。
- 群聊标题、session 标题、导航、分类标题及普通内容不加 AI 标。头像表达来源与归属，AI 标表达协作身份类型，两者独立，不因隐藏 AI 标而改变头像。
- AI 标记统一复用 Octo `AiBadge`，其底层委托 `window.EvaAIIdentity.badge`；旧 HTML 调用同一公共函数。禁止手写标签或增加颜色、尺寸变体。
- 新增身份入口必须运行头像合同测试，并验证组合比例和 AI 标记。



本目录继承 `D:\Geely\AGENTS.md` 的全部约束；以下规则只补充本专项容易重复出错的客户端外壳边界。

## 客户端窗口外壳

- Eva 同学是桌面客户端，不是网页产品。原型中的 `.topbar` 表示客户端系统标题栏，是所有页面共享且必须持续可见的窗口外壳。
- 新增或修改消息、Space、云盘、通讯录等一级页面时，只替换标题栏下方的内容区；不得从视口 `top: 0` 覆盖标题栏，也不得为某个页面复制、重造或省略标题栏。
- 一级页面禁止使用全屏或 `position: fixed` 根节点覆盖现有应用。一级页面只能由 React Router 选择并挂载到原生 Outlet 中的唯一页面宿主；页面内部标题属于内容标题，不能替代系统标题栏。
- 弹层、抽屉和遮罩也要先判断其归属范围。除非明确评审的是整个窗口级阻断态，否则默认限制在标题栏下方的客户端内容区。
- 交付前静态检查所有新增一级页面根节点，确认系统标题栏中的品牌、Token、帮助、反馈及窗口控制不会被页面内容遮挡。静态检查只能证明源码边界正确，不能表述为已经完成视觉或交互验收。

## 当前工作稿

- 当前唯一页面入口为 `index.html`，业务模块位于 `prototype/`。`prototype-manifest.json` 是源码职责与装配顺序清单，`index.html` 是浏览器实际加载入口；两者由合同检查保持一致。仓库只维护这一套模块化页面源码。
- `009-0` 维护时间，`009-1` 维护云盘数据，`009-2` 维护供应链数据，`009-3` 维护 IM 数据；`009-4` 是补丁注册器，`009-5` 是 IM 补丁，`009-6` 是通用补丁，`009-7` 是侧栏/路由补丁，`009-8` 是自动化补丁。`009-0` 至 `009-3` 在浏览器加载，`009-4` 至 `009-8` 只在 Node 构建阶段运行。
- `009-5` 至 `009-8` 只能通过 `window.__evaPatch` 注册，由 `tools/build-runtime.mjs` 在构建时按固定顺序执行并生成 `dist/vendor/eva-runtime.module.js`。浏览器禁止读取、拼接、编译 `eva-legacy-runtime.js`。修改补丁链后必须运行 `node tools/patch-hash.mjs` 与 `node --check dist/vendor/eva-runtime.module.js`。
- 项目仓库为 `https://github.com/labilio/eva-demo-progress`；线上评审入口为 `https://eva-demo-progress.vercel.app/`。本地在仓库根目录运行 `npm start`，默认访问 `http://127.0.0.1:4173/`。
- GitHub、Vercel 和本地使用同一套模块化源码。功能分支用于并行开发和评审，GitHub `main` 是 Vercel 生产发布的唯一来源；未经明确授权不得把功能分支合并或推送到 `main`。
- `vendor/eva-legacy-runtime.js` 是当前构建兼容依赖，不是 Eva 产品或设计参照。AionUI 与 Eva 没有产品关系；新增能力不得照搬或参照 AionUI。
- 本地预览必须通过 `npm start` 使用 HTTP，不以 `file://` 作为运行合同。
- 项目群聊的现行结构为“大群 → 可选子区”。数据模型、标题、筛选和管理入口都必须遵循这一层级。

## 预置内容与人员的统一项目

- 今后所有需要预置人员和演示内容的功能，统一在现有“供应链运营协同”项目（协作项目 ID：`prod`；任务看板项目 ID：`p-supply`）中准备和串联，包括人类、分身、角色、邀请状态、群聊、子区、消息、任务、文件及共享关系。
- 复用该项目及现有人员的稳定 ID；不得为一个新功能另建默认演示项目、复制人员或复制项目对象。数据仍按职责维护在 `009-1`、`009-2`、`009-3` 对应数据模块，通过 ID 关联。
- 新增功能的演示说明和 Edge 验收路径默认从该项目开始。必须预置足以走通主流程的内容，不能要求评审者先创建其他测试项目或手工补齐人员。
- 预置只用于原型演示，不得绕过人类与分身的归属、邀请接受或项目/群访问规则。实际用户新建项目仍按正常创建逻辑初始化。
- 跨项目权限测试需要额外项目时，仅使用隔离测试夹具或临时测试数据，不将其变成新的默认演示项目。详细约定见 `docs/演示数据约定.md`。

## 现行架构图（接手前必读）

这是一套模块化源码、一个浏览器入口、一条构建链和一个原生路由出口。GitHub、Vercel 与本地预览读取的是同一套文件，不存在需要人工同步的第二份 HTML。

```text
开发与发布

本地工作区
  ├─ index.html                         唯一页面入口
  ├─ prototype/                        Eva 数据、样式和功能模块
  ├─ vendor/eva-legacy-runtime.js      构建兼容运行时，只作为构建输入
  ├─ review/                           独立云端批注工具层
  └─ prototype-manifest.json           入口加载顺序与文件登记表
          │
          ├─ npm start
          │    ├─ npm run build
          │    └─ dist/ ──────────────→ 本地 HTTP 预览
          │
          └─ 用户授权后 commit / push
                         │
                         ▼
                    GitHub 功能分支
                         │ 评审通过后合入 main
                         ▼
                    GitHub main
                         │ Vercel 自动构建
                         ▼
                    Vercel 生产站
```

```text
构建与浏览器启动（严格单向）

npm run build
  ├─ 读取 vendor/eva-legacy-runtime.js
  ├─ 执行 009-4 → 009-5 → 009-6 → 009-7 → 009-8
  ├─ 锚点不匹配立即让构建失败
  └─ 生成 dist/vendor/eva-runtime.module.js
                    │
                    ▼
dist/index.html
  ├─ 009-0 / 009-1 / 009-2 / 009-3 结构化 Demo 数据
  ├─ 010-native-page-registry.js     路由页面宿主注册表
  └─ eva-runtime.module.js           已完成构建的唯一应用运行时
                    │
                    ▼
React HashRouter → ProtectedLayout → Layout → Outlet
                                             └─ 当前路由对应的唯一 Page
```

```text
EvaApp
├─ Topbar                         全局唯一
├─ Sidebar                       全局唯一；选中态由 URL 推导
└─ Router Outlet                 一级页面唯一出口
   ├─ PersonalEvaPage            /guid、/conversation/:id
   ├─ TeamMessagesPage           /messages（含关注/最近、我的 AI 模式）
   ├─ ProjectsPage               /collab
   ├─ ContactsPage               /contacts
   ├─ DrivePage                  /drive
   ├─ WorkboardPage              /eva-stub/工作板
   ├─ DigitalEmployeesPage       /eva-stub/数字员工
   └─ ConnectionCenterPage       /eva-stub/技能
```

`010-native-page-registry.js` 是非 React 页面与 React Route 宿主之间的注册桥，并在路由离开时执行 cleanup。它不是第二个页面控制器，禁止由它创建 fixed 页面、修改路由或管理导航选中态。页面完成 React 化后，应同步删除对应注册桥、页面 CSS 与 DOM 增强代码。

### 修改应落在哪一层

| 要修改的内容 | 唯一职责位置 | 禁止做法 |
| --- | --- | --- |
| Demo 时间常量 | `009-0-demo-time.js` | 散落到页面模板或 CSS |
| 云盘示例数据 | `009-1-data-drive.js` | 在视图打开时另拼第二份数据 |
| 供应链项目、任务、人员数据 | `009-2-data-supply.js` | 为某个页面复制一套项目对象 |
| 团队消息、AI 身份、OpenClaw session 示例数据 | `009-3-data-im.js` | 在 DOM 模板中硬编码消息或会话 |
| 补丁注册、锚点替换公共能力 | `009-4-registry.js` | 新增另一份 patch 数组、Observer 或全局替换器 |
| 统一 IM 的数据适配及业务组件接入 | `009-5-patch-im.js` | 为关注、最近、我的 AI 分别重画消息区和输入框 |
| 非 IM 的通用运行时适配 | `009-6-patch-general.js` | 把明确属于侧栏或自动化的修改塞进来 |
| 一级导航、侧栏与路由状态 | `009-7-patch-sider.js` | 用 DOM class、模拟点击或手改 `aria-current` 维护选中态 |
| 自动化任务页面适配 | `009-8-patch-automation.js` | 在其他入口覆盖一层自动化页面 |
| 构建、顺序执行与唯一产物 | `tools/build-runtime.mjs` | 在浏览器读取、拼接或编译兼容运行时 |
| 非 React 页面迁移桥 | `010-native-page-registry.js` + 对应页面模块 | 向 `document.body` 追加一级页面、用 fixed/z-index 盖住 Outlet |
| Eva 页面样式 | 对应的 `prototype/*.css`，优先复用现有 token/组件 | 在 JS 里追加页面级 style、靠更高优先级掩盖旧规则 |
| 云端批注 | `review/` 与 `supabase/` | 混入 Eva 产品信息架构或占用产品内容区域 |

### 架构不变量

1. DOM 中只能有一个 Eva 应用实例、一个可见 IM 会话实例和一个一级导航状态源。
2. `009-5` 至 `009-8` 只能注册补丁；只有 `tools/build-runtime.mjs` 可以读取并装配兼容运行时，浏览器只加载构建产物。
3. 同一种产品能力只能有一个业务组件。入口差异必须表现为数据和配置差异，不能复制 DOM、CSS 与事件。
4. 路由是一级导航选中态的唯一权威源；业务数据是会话、任务和文件内容的权威源。不得再把 DOM 当状态仓库。
5. 锚点变化必须显式失败，禁止“找不到就跳过”或用更宽泛的字符串替换继续运行。
6. 调整文件或加载顺序时，同步更新 `index.html` 与 `prototype-manifest.json`；二者必须描述同一条链。
7. 一个能力只保留当前入口、状态、CSS 和监听器；不保留平行实现或无调用方代码。
8. 一级页面只允许挂载在 Router Outlet 的路由宿主中；Modal、Popover、右键菜单和批注侧栏可以使用 Portal，但不能承担页面导航。
9. 当前兼容运行时约 18.6 MB。构建时装配避免浏览器现场编译；降低首次解析时间需要继续将业务域组件化并进行代码分割。当前架构状态必须如实描述。

### 改动后的最低验证门槛

```text
npm test
npm run check:manifest
npm run check:project
node scripts/verify-message-routing-contract.mjs
node scripts/verify-sidebar-selection-contract.mjs
node tools/patch-hash.mjs
git diff --check
```

涉及路由、导航、IM、弹窗或运行时装配时，还必须通过真实浏览器执行最小链路：进入目标入口 → 切换到另一个入口 → 再切回 → 确认选中态、内容、输入区和交互没有残留。静态检查通过不能代替这一步。

## 客户设计规范

- 规范已随仓库保存在 `docs/design-system/gds-for-ai2.0/`。开始 UI 改动前先阅读该目录的 `README.md`、`design.md`、token、组件定义和对应参考图，并运行目录内的 `validate.mjs`。
- 客户提供的现行规范为 Eva GDS for AI 2.0，仓库内文件是原始规范包的完整可用内容（已排除 macOS 系统元数据）。它是个人 Eva 桌面体验的设计依据；AionUI 和常见 AI 聊天产品都不能替代该规范。
- GDS 的核心工程材料包括 `design.md`、`tokens.dtcg.json`、`tokens.json`、`components.json`、`validate.mjs` 以及 `assets/reference/` 六个状态参考图。实施相关页面前必须同时核对规范、语义 token、组件合同和对应状态截图，不能只看一张图近似手搓。
- 当前 GDS 已验证的基准是 1200 × 800 桌面视口；个人 Eva 常规态使用 260/940 骨架、776 px 居中主列，主色为 `#1563EB`，圆角按 8/12/16/20 分级。生成中与完成态属于同一任务生命周期，不得拆成彼此无关的平行页面。
- GDS 的适用范围是个人 Eva 体验。团队 IM 仍以 Octo-Web 成熟 IM 能力为标准；Eva 自有且需长期维护的通用界面优先复用现有封装或 Semi UI。三者边界不得混淆。
- GDS 应通过语义 token 和组件适配层接入，不把原始色值散落到业务 CSS。实现时以规范、组件合同和参考状态图为共同依据。

## IM 内核与图标规范

- IM 内核唯一实现是 `EvaIMConversation` 及其 Octo-Web 消息组件和交互控制器。“消息－关注”“消息－最近”“团队－我的 AI”的右侧消息流、消息操作和输入区只能传入不同数据与入口配置，不得复制 DOM、复制 CSS、重写 `.ch-stream.innerHTML` 或另挂一套事件监听器。
- 三类入口的数据对象必须分开：消息－关注/最近组织 Octo 团队会话；团队－我的 AI 按“AI 身份 → OpenClaw session”组织私聊入口，一个助理或分身可有多个 session；个人－Eva 同学是直接使用本地 OpenClaw 的个人多 session 入口。三者可以复用消息能力，但不得把 AI 身份、Octo channel 与 OpenClaw session 混成同一种对象。
- Octo-Web 只提供成熟 IM 能力；Eva 继续拥有自己的导航、信息架构、品牌、文案和业务场景。个人－Eva 同学保留个人助理会话形态，不因团队 IM 统一而强制改造。
- 消息行、连续消息、头像、时间、Hover、右键菜单、多选、引用、文件、任务卡片和输入区必须使用统一 IM 内核的组件合同。发现差异时修复公共实现或适配层，不在单一入口叠加视觉补丁。
- Eva 自有且需要持续维护的页面外壳、导航、弹窗、表单、按钮、列表和空状态优先使用现有项目封装；没有封装时使用 Semi UI。不得为了技术栈统一而用 Semi UI 重造行为完整的 Octo IM 业务组件。
- 所有应用图标继续使用既有 Lucide 组件与语义。Lucide 图标允许重复使用：同一语义应优先复用同一图标，不同语义只在确实会造成识别混淆时调整；禁止把“每个图标只能出现一次”当作规则。
- 禁止手写 SVG、Unicode 图形或 CSS 图形替代已有 Lucide 图标。若当前 bundle 没有所需导出，使用项目既有的 `createLucideIcon` 和 Lucide 官方节点定义创建组件，并保留标准 Lucide 类名、尺寸和 `currentColor` 行为。

## UI 状态归属与迁移规则

- 新增或修改 UI 状态前，必须明确三个信息：唯一所有者、可推导的数据源、组件切换时的重置边界。能够从路由或业务数据推导的视觉状态，不得再保存第二份 DOM、`window` 全局变量或 `body` class 状态。
- 一级导航的唯一权威源是 URL／路由。选中态只能从当前路由推导；禁止通过“先点击另一个导航，再用覆盖层改结果”、手动互斥 `aria-current` 或捕获阶段拦截点击来模拟导航。
- 团队 IM 的入口模式由 `evaMessageMode` 决定，消息－关注/最近与团队－我的 AI 各自的数据由 `messageSource(evaMessageMode)` 提供，并统一交给 `ChannelsView`。My AI 左栏必须用身份分组展示 OpenClaw session，不得显示关注/最近或子区等团队会话控件。模式变化必须通过组件身份或公共状态控制器重置内部会话状态，不得让上一模式的选中会话残留到下一模式。
- DOM 增强脚本只能补充 React 未承载的独立 Demo 表面，不得把 DOM、MutationObserver、定时器或自定义事件作为 React 页面主状态。不得在一级导航或统一 IM 上新增捕获监听与 `stopImmediatePropagation()` 旁路。
- 每项能力只允许一个入口、一个数据源、一组 CSS 状态选择器和一个事件控制器；无调用方代码必须删除。
- 涉及导航、路由或 IM 数据源的改动，交付前必须运行语义合同检查及最终生成 ES 模块语法检查。检查应验证状态归属和禁止的旁路模式，不使用脱离业务域的全局数量阈值代替架构判断。

## Git、发布与验收状态

- 本项目生产发布链路固定为：本地修改 → 在用户明确授权后 commit → push 到 GitHub `main` → Vercel 自动部署。禁止默认执行 `vercel deploy`；只有用户明确要求临时 Preview Deployment 或排查 Vercel CLI 时才允许手动部署。
- “完成后部署”不等于自动获得 commit 或 push 权限。用户要求“不 commit”时只保留本地工作区；没有新的明确授权，不得为触发 Vercel 而自行提交或推送。
- 任何进度汇报都必须区分四种状态：`本地已修改`、`GitHub main 已推送`、`Vercel 已部署`、`浏览器已验收`。后一状态不能由前一状态推导，必须分别有 Git、Vercel 和浏览器证据。
- push 后等待 Vercel 自动部署，确认部署对应目标 commit，再进行线上浏览器检查。页面显示旧内容时先核对 commit、部署状态、缓存和页面“最近更新时间”，不得通过额外手动部署掩盖发布链路问题。
- 每轮交付至少运行 `node scripts/verify-project-contract.mjs` 和与本次修改相关的专项检查；若声称视觉或交互已完成，还必须提供目标版本的浏览器实测证据。

## 云端批注与评审

- 原型批注是独立评审工具层，不是 Eva 产品 UI。源码位于 `review/`，数据库迁移位于 `supabase/migrations/`；不得把批注列表塞进 Eva 页面布局，也不得劫持 Eva 原有“反馈问题”入口。
- 页面右上角的轻量“批注”入口只负责打开覆盖式侧栏；侧栏默认隐藏、不得挤压或改写 Eva 布局。批注按当前 hash 页面归类，但不是按访问者隔离。
- 所有同事访问同一 Vercel 站点时，读写的是同一个 Supabase 项目 `eva-demo-comments`，因此能看到同一页面下的共享批注。姓名必填，姓名只用于评审署名，不等同于账号体系。
- 前端只能使用 Supabase publishable key；禁止把 secret/service-role key 写入浏览器代码。公开表必须启用 RLS，匿名访问仅允许 `SELECT` 和受约束的 `INSERT`，不得给客户端更新或删除权限。
- 批注改动必须验证：入口默认收起、侧栏覆盖而不占位、提交后可见、刷新后仍可读取、不同页面筛选正确；联调产生的测试批注在验证后清理。

## 项目成员身份展示规则

- 项目及其群聊的进人、管人界面，凡展示具体人类或 AI 身份，必须同时展示头像与姓名；覆盖邀请候选、已选项、邀请记录中的被邀请人与发起人、审批与接受邀请、成员列表、角色转让与接任者、移除确认、分身管理及提及成员。不得仅为主列表补头像而遗漏弹窗和记录。
- 人类统一复用成员身份组件和稳定账号头像，角色置于姓名第二行，不加角色 Tag。紧凑候选及发起人使用同一组件的紧凑尺寸。
- AI 统一调用 `EvaAIIdentity.avatar` 与 `EvaAIIdentity.badge`；不得在业务入口重画组合头像或 AI 标。
- 群名、项目名、统计数字和规则说明不属于具体人员身份，不需要附加人员头像。
- 新增或修改入口时，同时检查候选、选中结果、历史记录和确认弹窗，验证头像与实际身份 ID 一致。

## 聊天信息管理的移植边界

- Octo-Web 是团队 IM 交互参考，不是 Eva 的功能清单；只接入 Eva 已确认且当前原型支持的能力。
- Eva 通讯录独立维护，本轮不得增加“保存到通讯录”或“保存的群聊”。
- 本轮不提供二维码/扫码、Webhook 消息推送、GROUP.md、私聊内发起群聊、群备注和群内昵称。不保留空占位或模拟成功提示。
- 群聊成员页不放邀请记录，邀请处理使用统一信箱。
- 群聊保留成员网格、全部成员、邀请/移除/转让/退出/解散及已确认权限规则、群名/头像/公告；私聊保留对象信息；两类共用免打扰、置顶与清空记录。
- 打开信息面板不重建聊天流或输入框，保留草稿和滚动位置，不覆盖系统标题栏。
