import { useOrg } from '../contexts/OrgContext';
import { hasPermission, Permission } from '../lib/permissions';

export function usePermission(permission: Permission): boolean {
  const { currentOrg } = useOrg();
  return hasPermission(currentOrg?.role, permission);
}
