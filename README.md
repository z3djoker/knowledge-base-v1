# Knowledge Base V1

AI 售前工程师系统，面向低空经济行业的企业级知识资产管理与后续 AI 售前辅助平台。

当前版本：

```text
V5 正式封版
```

当前封版 Commit：

```text
08aff75 feat(v5): complete authentication and user management
```

当前分支：

```text
codex/v3-complete-local-asset-management
```

## 项目目标

系统目标是沉淀企业知识资产，并在后续阶段支持 RAG 检索、AI 问答、售前方案生成和 PPT 大纲生成。

长期目标：

1. 检索历史案例
2. 检索产品资料
3. 检索法规标准
4. 自动生成初步售前方案
5. 自动生成汇报材料
6. 自动生成 PPT 大纲

## 当前能力

V5 已完成：

- 管理员账号密码登录
- JWT + HttpOnly Cookie 会话
- 后台页面鉴权
- 核心 API 鉴权
- RBAC 角色预留与后台启用
- super_admin 初始化脚本
- 后台用户管理
- 用户创建、编辑、禁用、启用、重置密码
- 用户角色分配
- 文件上传
- 文件解析
- metadata 管理
- 标签同步
- PostgreSQL 入库
- 后台文件列表数据库优先读取
- 数据库主导软删除
- 本地 trash 回收站

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS
- PostgreSQL 16
- Docker Compose
- Prisma
- Node.js crypto.scrypt
- JWT + HttpOnly Cookie

## 本地启动

启动 PostgreSQL：

```bash
docker compose up -d
```

安装依赖：

```bash
npm install
```

执行数据库 migration：

```bash
npm run db:migrate
```

初始化默认角色：

```bash
npm run db:seed
```

初始化 super_admin：

```bash
npm run db:seed:admin
```

启动开发服务：

```bash
npm run dev
```

## 环境变量

请复制 `.env.example` 为 `.env`，并按本地环境填写。

关键变量：

```text
DATABASE_URL
POSTGRES_DB
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_PORT
JWT_SECRET
INITIAL_ADMIN_EMAIL
INITIAL_ADMIN_PASSWORD
INITIAL_ADMIN_NAME
```

不要提交真实 `.env`。

## 主要页面

- `/login`：后台登录
- `/admin`：后台管理，包含用户管理与文件管理
- `/upload`：上传页面
- `/chat`：预留聊天页面

## V5 权限范围

当前启用后台访问角色：

```text
super_admin
internal_admin
```

预留角色：

```text
sales
engineer
customer_admin
customer_user
```

已保护核心 API：

```text
/api/files
/api/upload
/api/parse
/api/file-metadata
/api/admin/users
```

## V5 架构决策

V5 启用登录与权限系统后，PostgreSQL 是权限系统强依赖。

数据库不可用时：

```text
不绕过鉴权
不直接读取 filesystem
后台核心 API 返回错误
```

该行为属于预期架构行为，不是 Bug。

原因：

- 用户状态依赖数据库
- 角色信息依赖数据库
- 权限判断依赖数据库
- 绕过数据库读取 filesystem 会破坏 V5 权限边界

V4.3 的 filesystem fallback 仍保留在以下范围：

- PostgreSQL 可用
- 已完成鉴权
- 数据库记录缺失或文件系统历史资产需要兜底合并

不再承诺 PostgreSQL 完全不可用时后台文件列表仍可用。

## V4 兼容性

V5 封版验收已确认：

- 上传可用
- 解析可用
- metadata 保存可用
- 数据库同步可用
- 删除后 `files.deleted_at` 有值
- 删除后 `files.status = deleted`
- 本地文件进入 `trash/uploads`
- 解析结果进入 `trash/parsed`
- metadata 进入 `trash/metadata`

V5 后，以上能力需要登录且具备后台角色。

## 当前未实现

- 客户门户
- 客户项目隔离
- RAG
- 向量数据库
- AI 问答
- AI 售前方案生成
- AI PPT 生成
- DeepSeek 接入
- Kimi 接入
- Supabase
- 微信登录
- 手机号登录
- 审计日志
- Session 吊销
- Token Version

## 下一阶段建议

- V6.0 Document Chunks
- V6.1 Full Text Search
- V6.2 RAG Retrieval
- V6.3 AI 售前工程师
- V6.4 PPT 方案生成

不要在未确认方案前直接进入 V6 开发。
