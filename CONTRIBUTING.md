# Eva Demo 协作与发布流程

本仓库同时供多台电脑、多人和多个 AI 开发。任何参与者都必须先阅读根目录 `AGENTS.md`，并遵守本文件。GitHub `main` 对应 Vercel 正式站；普通开发不得直接修改或推送 `main`。

## 第一次在一台电脑上开始

```powershell
git clone https://github.com/labilio/eva-demo-progress.git
cd eva-demo-progress
git fetch origin
git switch main
git pull --ff-only origin main
npm test
```

不要复制另一台电脑的整个工作目录。通过 GitHub 同步源码，每台电脑各自保留自己的依赖、缓存和临时文件。

## 每个任务的固定流程

1. 查看 `git status`，不得覆盖已有未提交内容。
2. 从最新 `origin/main` 创建一个新分支。一个任务只使用一个分支：

   ```powershell
   git fetch origin
   git switch main
   git pull --ff-only origin main
   git switch -c feature/<简短任务名>
   ```

3. 开发并运行 `npm test`、`npm run build`、`npm run build:deploy` 和相关专项检查。`build` 保留本地批注工具，`build:deploy` 生成不含批注的 Vercel 产物。
4. 使用中文提交信息，将当前功能分支 push 到 GitHub：

   ```powershell
   git push -u origin HEAD
   ```

5. 创建 Pull Request。Vercel 会为非生产分支创建独立的 **Vercel Preview**；后续修改继续 push 到同一分支和同一 PR。
6. 把 PR、Preview 地址、目标 commit 和检查结果交给用户验收。此时不得更新正式版本号，不得合并 `main`。

## 唯一正式发布闸门

“合并 `main`”与“更新版本号”是同一个发布动作，必须得到用户在当前任务中的**人工明确确认**。仅有“完成”“提交”“push”“生成预览”或过去的授权，都不等于允许上线。

收到“验收通过，合并上线”等明确指令后，负责发布的 AI 才执行：

1. 将最新 `origin/main` 合入功能分支并解决冲突；
2. 运行 `npm run release:bump`，只修改根目录 `release.json`；
3. 重新运行全部检查并 push 功能分支；
4. 合并 PR 到 `main`，删除已合并分支；
5. 核对 `origin/main`、Vercel Production 和页面显示的版本/最近更新时间。

同一天发布多次时版本从 `v1` 递增为 `v2`、`v3`；跨日期发布时使用新日期并从 `v1` 开始。其他文件不得再维护第二份版本号或更新时间。

## AI 接手检查单

- 已阅读 `AGENTS.md`、本文件和与任务相关的设计规范；
- 当前不在 `main` 上开发；
- 分支来自最新 `origin/main`；
- 没有覆盖、删除或提交别人的无关改动；
- 已运行测试、构建和项目合同；
- 已提供 Vercel Preview，而不是把 Production 当预览；
- 未经当前任务人工授权，没有更新版本、合并或 push `main`。

## 冲突和并行开发

- 一台电脑、一个任务、一个功能分支；不要让两个 AI 同时修改同一工作区。
- 同事各自在自己的分支开发，通过 PR 汇合；不要互传包含 `.git`、`node_modules` 或缓存的文件夹。
- 遇到远端更新时先 `git fetch origin`，查看差异后再合并或 rebase；禁止用 force push、`git reset --hard` 或覆盖文件解决冲突。
- 数据库迁移、同一份核心运行时或同一个大文件不适合无协调并行修改，应拆成有顺序的 PR。
