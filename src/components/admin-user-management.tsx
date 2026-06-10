"use client";

import { useMemo, useState } from "react";
import type { AdminRoleRecord, AdminUserRecord } from "@/lib/admin-users";
import type { CurrentUser } from "@/lib/auth/guards";

type AdminUserManagementProps = {
  currentUser: CurrentUser;
  initialUsers: AdminUserRecord[];
  roles: AdminRoleRecord[];
};

type ModalMode = "create" | "edit" | "password" | "roles" | "status";

type FormState = {
  email: string;
  name: string;
  password: string;
  status: string;
  roleSlugs: string[];
};

const userText = {
  title: "用户管理",
  description: "管理后台账号、角色和启用状态。V5.2 暂不开放注册。",
  createUser: "创建用户",
  email: "邮箱",
  name: "姓名",
  status: "状态",
  roles: "角色",
  lastLogin: "最后登录",
  createdAt: "创建时间",
  disabledState: "禁用状态",
  actions: "操作",
  active: "启用",
  disabled: "禁用",
  enabled: "正常",
  neverLogin: "从未登录",
  notDisabled: "未禁用",
  edit: "编辑",
  resetPassword: "重置密码",
  editRoles: "角色分配",
  disable: "禁用",
  enable: "启用",
  cancel: "取消",
  save: "保存",
  creating: "创建中",
  saving: "保存中",
  password: "密码",
  newPassword: "新密码",
  passwordHelp: "至少 8 位",
  statusConfirmTitle: "确认状态变更",
  statusConfirmBody: "确认更新该用户的启用状态吗？",
  empty: "暂无用户。",
  failedUnknown: "未知错误",
};

function createEmptyForm(): FormState {
  return {
    email: "",
    name: "",
    password: "",
    status: "active",
    roleSlugs: ["sales"],
  };
}

function formFromUser(user: AdminUserRecord): FormState {
  return {
    email: user.email,
    name: user.name ?? "",
    password: "",
    status: user.status,
    roleSlugs: user.roles,
  };
}

function formatDate(value: string | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function roleLabel(role: AdminRoleRecord) {
  return role.name || role.slug;
}

export function AdminUserManagement({
  currentUser,
  initialUsers,
  roles,
}: AdminUserManagementProps) {
  const [users, setUsers] = useState(initialUsers);
  const [modalMode, setModalMode] = useState<ModalMode | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);
  const [form, setForm] = useState<FormState>(() => createEmptyForm());
  const [message, setMessage] = useState<{
    tone: "success" | "error" | "loading";
    text: string;
  } | null>(null);
  const isCurrentSuperAdmin = currentUser.roles.includes("super_admin");
  const visibleRoles = useMemo(
    () =>
      isCurrentSuperAdmin
        ? roles
        : roles.filter((role) => role.slug !== "super_admin"),
    [isCurrentSuperAdmin, roles],
  );

  function replaceUser(nextUser: AdminUserRecord) {
    setUsers((current) =>
      current.map((user) => (user.id === nextUser.id ? nextUser : user)),
    );
  }

  function openCreate() {
    setSelectedUser(null);
    setForm(createEmptyForm());
    setMessage(null);
    setModalMode("create");
  }

  function openForUser(mode: ModalMode, user: AdminUserRecord) {
    setSelectedUser(user);
    setForm(formFromUser(user));
    setMessage(null);
    setModalMode(mode);
  }

  function closeModal() {
    setModalMode(null);
    setSelectedUser(null);
    setMessage(null);
  }

  function updateForm<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleRole(roleSlug: string) {
    setForm((current) => {
      const hasRole = current.roleSlugs.includes(roleSlug);
      const roleSlugs = hasRole
        ? current.roleSlugs.filter((role) => role !== roleSlug)
        : [...current.roleSlugs, roleSlug];

      return { ...current, roleSlugs };
    });
  }

  async function submitJson(
    url: string,
    options: {
      method: "POST" | "PATCH" | "PUT";
      body: unknown;
      loadingText: string;
      successText: string;
    },
  ) {
    setMessage({ tone: "loading", text: options.loadingText });

    try {
      const response = await fetch(url, {
        method: options.method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(options.body),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? userText.failedUnknown);
      }

      if (result.user) {
        if (options.method === "POST" && url === "/api/admin/users") {
          setUsers((current) => [result.user, ...current]);
        } else {
          replaceUser(result.user);
        }
      }

      setMessage({ tone: "success", text: options.successText });
      closeModal();
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : userText.failedUnknown,
      });
    }
  }

  async function submitCreate() {
    await submitJson("/api/admin/users", {
      method: "POST",
      body: {
        email: form.email,
        name: form.name,
        password: form.password,
        status: form.status,
        roleSlugs: form.roleSlugs,
      },
      loadingText: userText.creating,
      successText: "用户已创建。",
    });
  }

  async function submitEdit() {
    if (!selectedUser) {
      return;
    }

    await submitJson(`/api/admin/users/${selectedUser.id}`, {
      method: "PATCH",
      body: {
        email: form.email,
        name: form.name,
        status: form.status,
      },
      loadingText: userText.saving,
      successText: "用户已更新。",
    });
  }

  async function submitPassword() {
    if (!selectedUser) {
      return;
    }

    await submitJson(`/api/admin/users/${selectedUser.id}/password`, {
      method: "POST",
      body: {
        password: form.password,
      },
      loadingText: userText.saving,
      successText: "密码已重置。",
    });
  }

  async function submitRoles() {
    if (!selectedUser) {
      return;
    }

    await submitJson(`/api/admin/users/${selectedUser.id}/roles`, {
      method: "PUT",
      body: {
        roleSlugs: form.roleSlugs,
      },
      loadingText: userText.saving,
      successText: "角色已更新。",
    });
  }

  async function submitStatus() {
    if (!selectedUser) {
      return;
    }

    await submitJson(`/api/admin/users/${selectedUser.id}`, {
      method: "PATCH",
      body: {
        status: selectedUser.status === "active" ? "disabled" : "active",
      },
      loadingText: userText.saving,
      successText: "状态已更新。",
    });
  }

  function isProtectedSuperAdmin(user: AdminUserRecord) {
    return !isCurrentSuperAdmin && user.roles.includes("super_admin");
  }

  function renderRoleCheckboxes() {
    return (
      <div className="grid gap-2 md:grid-cols-2">
        {visibleRoles.map((role) => (
          <label
            key={role.slug}
            className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
          >
            <input
              type="checkbox"
              checked={form.roleSlugs.includes(role.slug)}
              onChange={() => toggleRole(role.slug)}
              className="h-4 w-4 rounded border-slate-300"
            />
            <span>{roleLabel(role)}</span>
          </label>
        ))}
      </div>
    );
  }

  function renderModal() {
    if (!modalMode) {
      return null;
    }

    const title =
      modalMode === "create"
        ? userText.createUser
        : modalMode === "edit"
          ? userText.edit
          : modalMode === "password"
            ? userText.resetPassword
            : modalMode === "roles"
              ? userText.editRoles
              : userText.statusConfirmTitle;
    const isSaving = message?.tone === "loading";

    return (
      <div className="fixed inset-0 z-50 bg-slate-950/30 p-4">
        <div className="mx-auto max-h-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold text-slate-950">{title}</h3>

          {modalMode === "create" || modalMode === "edit" ? (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-2 block">{userText.email}</span>
                <input
                  value={form.email}
                  onChange={(event) => updateForm("email", event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-2 block">{userText.name}</span>
                <input
                  value={form.name}
                  onChange={(event) => updateForm("name", event.target.value)}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </label>
              {modalMode === "create" ? (
                <label className="text-sm font-medium text-slate-700">
                  <span className="mb-2 block">{userText.password}</span>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      updateForm("password", event.target.value)
                    }
                    placeholder={userText.passwordHelp}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </label>
              ) : null}
              <label className="text-sm font-medium text-slate-700">
                <span className="mb-2 block">{userText.status}</span>
                <select
                  value={form.status}
                  onChange={(event) => updateForm("status", event.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="active">{userText.active}</option>
                  <option value="disabled">{userText.disabled}</option>
                </select>
              </label>
              {modalMode === "create" ? (
                <div className="md:col-span-2">
                  <p className="mb-2 text-sm font-medium text-slate-700">
                    {userText.roles}
                  </p>
                  {renderRoleCheckboxes()}
                </div>
              ) : null}
            </div>
          ) : null}

          {modalMode === "password" ? (
            <label className="mt-5 block text-sm font-medium text-slate-700">
              <span className="mb-2 block">{userText.newPassword}</span>
              <input
                type="password"
                value={form.password}
                onChange={(event) => updateForm("password", event.target.value)}
                placeholder={userText.passwordHelp}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
          ) : null}

          {modalMode === "roles" ? (
            <div className="mt-5">
              <p className="mb-2 text-sm font-medium text-slate-700">
                {userText.roles}
              </p>
              {renderRoleCheckboxes()}
            </div>
          ) : null}

          {modalMode === "status" ? (
            <p className="mt-5 text-sm leading-6 text-slate-600">
              {userText.statusConfirmBody}
            </p>
          ) : null}

          {message ? (
            <p
              className={`mt-4 text-sm ${
                message.tone === "error"
                  ? "text-red-700"
                  : message.tone === "success"
                    ? "text-emerald-700"
                    : "text-slate-500"
              }`}
            >
              {message.text}
            </p>
          ) : null}

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                if (modalMode === "create") {
                  void submitCreate();
                } else if (modalMode === "edit") {
                  void submitEdit();
                } else if (modalMode === "password") {
                  void submitPassword();
                } else if (modalMode === "roles") {
                  void submitRoles();
                } else {
                  void submitStatus();
                }
              }}
              className="rounded-md bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {isSaving ? userText.saving : userText.save}
            </button>
            <button
              type="button"
              onClick={closeModal}
              className="rounded-md border border-slate-300 px-5 py-2 text-sm font-semibold text-slate-700"
            >
              {userText.cancel}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-950">
            {userText.title}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {userText.description}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="w-fit rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {userText.createUser}
        </button>
      </div>

      {users.length === 0 ? (
        <div className="px-6 py-10 text-sm text-slate-500">
          {userText.empty}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] table-fixed text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="w-[18%] px-4 py-3 font-semibold">
                  {userText.email}
                </th>
                <th className="w-[10%] px-4 py-3 font-semibold">
                  {userText.name}
                </th>
                <th className="w-[9%] px-4 py-3 font-semibold">
                  {userText.status}
                </th>
                <th className="w-[17%] px-4 py-3 font-semibold">
                  {userText.roles}
                </th>
                <th className="w-[13%] px-4 py-3 font-semibold">
                  {userText.lastLogin}
                </th>
                <th className="w-[13%] px-4 py-3 font-semibold">
                  {userText.createdAt}
                </th>
                <th className="w-[10%] px-4 py-3 font-semibold">
                  {userText.disabledState}
                </th>
                <th className="w-[16%] px-4 py-3 font-semibold">
                  {userText.actions}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((user) => {
                const protectedSuperAdmin = isProtectedSuperAdmin(user);
                const isSelf = user.id === currentUser.id;

                return (
                  <tr key={user.id} className="align-top">
                    <td className="px-4 py-4 font-medium text-slate-900">
                      <span className="line-clamp-2 break-all">
                        {user.email}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {user.name ?? "-"}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          user.status === "active"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {user.status === "active"
                          ? userText.active
                          : userText.disabled}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      <span className="line-clamp-3 break-words">
                        {user.roles.join(", ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(user.lastLoginAt) || userText.neverLogin}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-4 text-slate-600">
                      {user.disabledAt
                        ? formatDate(user.disabledAt)
                        : userText.notDisabled}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={protectedSuperAdmin}
                          onClick={() => openForUser("edit", user)}
                          className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          {userText.edit}
                        </button>
                        <button
                          type="button"
                          disabled={protectedSuperAdmin}
                          onClick={() => openForUser("roles", user)}
                          className="rounded-md border border-cyan-200 px-3 py-2 text-xs font-semibold text-cyan-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                          {userText.editRoles}
                        </button>
                        <button
                          type="button"
                          disabled={protectedSuperAdmin}
                          onClick={() => openForUser("password", user)}
                          className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                        >
                          {userText.resetPassword}
                        </button>
                        <button
                          type="button"
                          disabled={protectedSuperAdmin || isSelf}
                          onClick={() => openForUser("status", user)}
                          className="rounded-md border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                        >
                          {user.status === "active"
                            ? userText.disable
                            : userText.enable}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {renderModal()}
    </section>
  );
}
