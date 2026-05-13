export type Role = "owner" | "admin" | "member" | "viewer";

export type Permission =
  | "task:create"
  | "task:edit"
  | "task:delete"
  | "project:create"
  | "project:edit"
  | "project:delete"
  | "project:archive"
  | "sprint:create"
  | "sprint:start"
  | "sprint:complete"
  | "sprint:manage"
  | "issue:create"
  | "issue:bulk-move"
  | "comment:create"
  | "member:invite"
  | "member:remove"
  | "member:role-change"
  | "billing:view"
  | "billing:manage"
  | "analytics:view"
  | "settings:general"
  | "settings:notifications"
  | "settings:security"
  | "audit-log:view"
  | "bug:report"
  | "member:change-role"
  | "org:delete";

type PermissionMap = Record<Permission, boolean>;
type PermissionMatrix = Record<Role, PermissionMap>;

export const PERMISSION_MATRIX: PermissionMatrix = {
  owner: {
    "task:create": true,
    "task:edit": true,
    "task:delete": true,
    "project:create": true,
    "project:edit": true,
    "project:delete": true,
    "project:archive": true,
    "sprint:create": true,
    "sprint:start": true,
    "sprint:complete": true,
    "sprint:manage": true,
    "issue:create": true,
    "issue:bulk-move": true,
    "comment:create": true,
    "member:invite": true,
    "member:remove": true,
    "member:role-change": true,
    "billing:view": true,
    "billing:manage": true,
    "analytics:view": true,
    "settings:general": true,
    "settings:notifications": true,
    "settings:security": true,
    "audit-log:view": true,
    "bug:report": true,
    "member:change-role": true,
    "org:delete": true,
  },
  admin: {
    "task:create": true,
    "task:edit": true,
    "task:delete": true,
    "project:create": true,
    "project:edit": true,
    "project:delete": true,
    "project:archive": true,
    "sprint:create": true,
    "sprint:start": true,
    "sprint:complete": true,
    "sprint:manage": true,
    "issue:create": true,
    "issue:bulk-move": true,
    "comment:create": true,
    "member:invite": true,
    "member:remove": false,
    "member:role-change": true,
    "billing:view": true,
    "billing:manage": false,
    "analytics:view": true,
    "settings:general": true,
    "settings:notifications": true,
    "settings:security": true,
    "audit-log:view": true,
    "bug:report": true,
    "member:change-role": true,
    "org:delete": false,
  },
  member: {
    "task:create": true,
    "task:edit": true,
    "task:delete": false,
    "project:create": false,
    "project:edit": false,
    "project:delete": false,
    "project:archive": false,
    "sprint:create": false,
    "sprint:start": false,
    "sprint:complete": false,
    "sprint:manage": false,
    "issue:create": true,
    "issue:bulk-move": false,
    "comment:create": true,
    "member:invite": false,
    "member:remove": false,
    "member:role-change": false,
    "billing:view": false,
    "billing:manage": false,
    "analytics:view": true,
    "settings:general": false,
    "settings:notifications": true,
    "settings:security": true,
    "audit-log:view": false,
    "bug:report": true,
    "member:change-role": false,
    "org:delete": false,
  },
  viewer: {
    "task:create": false,
    "task:edit": false,
    "task:delete": false,
    "project:create": false,
    "project:edit": false,
    "project:delete": false,
    "project:archive": false,
    "sprint:create": false,
    "sprint:start": false,
    "sprint:complete": false,
    "sprint:manage": false,
    "issue:create": false,
    "issue:bulk-move": false,
    "comment:create": false,
    "member:invite": false,
    "member:remove": false,
    "member:role-change": false,
    "billing:view": false,
    "billing:manage": false,
    "analytics:view": true,
    "settings:general": false,
    "settings:notifications": true,
    "settings:security": true,
    "audit-log:view": false,
    "bug:report": false,
    "member:change-role": false,
    "org:delete": false,
  },
};

export function hasPermission(
  role: Role | string | undefined,
  permission: Permission,
): boolean {
  if (!role) return false;
  const map = PERMISSION_MATRIX[role as Role];
  return map ? map[permission] === true : false;
}
