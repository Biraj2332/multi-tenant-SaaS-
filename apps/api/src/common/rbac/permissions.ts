import { Role } from '../../modules/memberships/enums/role.enum';

export type Permission =
  | 'project:create'
  | 'project:archive'
  | 'project:delete'
  | 'task:create'
  | 'task:delete'
  | 'sprint:manage'
  | 'issue:create'
  | 'issue:bulk-move'
  | 'member:invite'
  | 'member:remove'
  | 'member:role-change'
  | 'billing:view'
  | 'billing:manage'
  | 'analytics:view'
  | 'settings:general'
  | 'audit-log:view';

const all: Permission[] = [
  'project:create', 'project:archive', 'project:delete',
  'task:create', 'task:delete',
  'sprint:manage', 'issue:create', 'issue:bulk-move',
  'member:invite', 'member:remove', 'member:role-change',
  'billing:view', 'billing:manage',
  'analytics:view', 'settings:general', 'audit-log:view',
];

const adminAll: Permission[] = all.filter((p) => p !== 'billing:manage' && p !== 'project:delete');

const member: Permission[] = [
  'project:create',
  'task:create', 'task:delete',
  'issue:create',
  'analytics:view',
];

const viewer: Permission[] = ['analytics:view'];

export const PERMISSION_MATRIX: Record<Role, ReadonlySet<Permission>> = {
  [Role.OWNER]: new Set(all),
  [Role.ADMIN]: new Set(adminAll),
  [Role.MEMBER]: new Set(member),
  [Role.VIEWER]: new Set(viewer),
};

export function hasPermission(role: string | undefined, permission: Permission): boolean {
  if (!role) return false;
  const set = PERMISSION_MATRIX[role as Role];
  return set ? set.has(permission) : false;
}

export function permissionsFor(role: string | undefined): Permission[] {
  if (!role) return [];
  const set = PERMISSION_MATRIX[role as Role];
  return set ? Array.from(set) : [];
}
