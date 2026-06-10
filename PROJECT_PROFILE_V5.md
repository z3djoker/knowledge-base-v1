# AI售前工程师项目主档案（V5版）

## 一、项目概述

### 项目名称

Knowledge Base V1（AI售前工程师系统）

### 项目目标

打造面向低空经济行业的企业级 AI 售前工程师系统，实现：

- 企业知识资产统一管理
- 文件上传与解析
- 项目资料沉淀
- 售前方案辅助生成
- 后续 RAG 知识库检索
- 后续 AI 问答与方案生成
- 后续客户门户与权限隔离

最终目标：

1. 检索历史案例
2. 检索产品资料
3. 检索法规标准
4. 自动生成初步售前方案
5. 自动生成汇报材料
6. 自动生成 PPT 大纲

## 二、当前版本状态

当前版本：

```text
V5 正式封版
```

Git Commit：

```text
08aff75 feat(v5): complete authentication and user management
```

GitHub 分支：

```text
codex/v3-complete-local-asset-management
```

状态：

```text
本地与远端已同步
```

## 三、版本演进历史

### V1 项目基础框架

实现：

- Next.js
- TypeScript
- Tailwind
- Admin 页面框架

### V2 文件上传系统

实现：

- 上传文件
- 文件保存
- 后台查看

### V3 本地知识资产管理

实现：

- 上传
- 删除
- 元数据
- 中文后台

### V3.1 本地文档解析

实现：

- PDF 解析
- DOCX 解析
- XLSX 解析
- PPTX 解析

输出：

```text
parsed/
```

### V3.2 文件管理增强

实现：

- 查重
- 删除
- 批量处理

### V4 数据库化资产管理

实现：

- Docker PostgreSQL `postgres:16`
- Prisma schema
- Prisma migration
- Prisma seed

核心数据模型：

- customers
- projects
- files
- parsed_documents
- document_chunks
- tags
- file_tags
- users
- roles
- permissions
- user_roles
- project_members

### V4.2 业务数据双写

上传：

```text
文件系统 + 数据库
```

解析：

```text
parsed/ + parsed_documents
```

metadata：

```text
metadata/ + files
```

### V4.3 数据库优先读取

后台文件列表：

```text
database-first
filesystem-fallback
```

### V4.4 数据库主导删除

实现：

- `files.deleted_at` 软删除
- 本地回收站

回收站目录：

```text
trash/uploads
trash/parsed
trash/metadata
```

## 四、V5 正式封版内容

### V5.1 登录与权限体系

登录入口：

```text
/login
```

登录方式：

```text
账号密码登录
```

Session：

```text
JWT + HttpOnly Cookie
```

Cookie：

```text
kb_session
```

Password Hash：

```text
Node.js crypto.scrypt
```

角色：

```text
super_admin
internal_admin
sales
engineer
customer_admin
customer_user
```

当前启用后台访问：

```text
super_admin
internal_admin
```

后台鉴权：

```text
/admin
```

未登录：

```text
/login
```

无权限：

```text
403 或 forbidden 跳转
```

已保护核心 API：

```text
/api/files
/api/upload
/api/parse
/api/file-metadata
```

### V5.2 用户管理系统

新增用户列表，支持：

- 查看用户
- 查看角色
- 查看状态
- 查看最后登录时间

创建用户支持：

- email
- name
- password
- role

编辑用户支持：

- 邮箱
- 姓名
- 状态

密码重置：

```text
管理员重置密码
```

用户禁用：

```text
status = disabled
disabled_at
```

角色分配：

```text
user_roles
```

安全边界：

- 禁止 internal_admin 管理 super_admin
- 禁止管理员禁用自己
- 禁止禁用最后一个 active super_admin
- 禁止降级最后一个 active super_admin

## 五、当前系统能力

当前已具备：

- 管理员登录
- 用户管理
- 文件上传
- 文件解析
- 元数据管理
- 标签管理
- 数据库入库
- 数据库查询
- 软删除
- 回收站
- 数据库优先读取
- 文件系统兜底

## 六、重要架构决策

### ADR-001：V5 权限启用后 PostgreSQL 成为权限系统强依赖

背景：

V4.3 曾引入 filesystem fallback，用于数据库化迁移期保障后台文件列表不因数据库记录缺失而丢失历史资产。

V5.1 启用登录与 RBAC 后，后台核心 API 必须先完成用户和角色鉴权。用户状态、禁用状态、角色信息均来自 PostgreSQL。

决策：

PostgreSQL 完全不可用时：

```text
不绕过鉴权
不直接读取 filesystem
后台核心 API 返回错误
```

该行为属于：

```text
预期架构行为
非 Bug
```

原因：

- 用户状态依赖数据库
- 角色信息依赖数据库
- 权限信息依赖数据库
- 绕过数据库直接读取 filesystem 会破坏 V5 权限边界
- 后续客户门户和客户数据隔离更不能绕过数据库鉴权

保留的 fallback 范围：

- PostgreSQL 可用
- 已完成用户鉴权
- `files` 表记录缺失时合并 filesystem 兜底记录
- 历史本地资产不会因数据库记录缺失而从后台消失

不再承诺：

```text
PostgreSQL 完全不可用时 /api/files 返回 filesystem fallback
```

后续可优化：

- 将数据库不可用时的 500 优化为 503
- 增加更清晰的错误提示
- 增加数据库健康检查
- 增加监控与告警

## 七、当前未实现内容

未实现：

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

## 八、V6 规划方向

推荐优先级：

### V6.0 Document Chunks

真正启用：

```text
document_chunks
```

### V6.1 全文检索

实现：

```text
文件内容搜索
```

### V6.2 RAG

实现：

```text
知识库问答
```

### V6.3 AI 售前工程师

自动生成：

- 需求分析
- 产品推荐
- 方案框架

### V6.4 PPT 方案生成

输出：

- Markdown
- PPT 大纲
- 项目汇报材料

## 九、项目现阶段评价

完成度：

```text
约 40%
```

基础设施：

```text
约 80%
```

AI 能力：

```text
约 0%
```

当前已完成：

```text
企业级知识资产管理平台基础架构
```

下一阶段核心任务：

```text
让系统真正具备知识检索与 AI 生成能力
```
