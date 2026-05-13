import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useQueryClient } from '@tanstack/react-query';

export interface OrgInfo {
  tenantId: string;
  name: string;
  slug: string;
  plan: 'starter' | 'pro' | 'enterprise';
  role: string;
  schemaName: string;
}

interface OrgContextValue {
  currentOrg: OrgInfo | null;
  orgs: OrgInfo[];
  isLoading: boolean;
  switchOrg: (tenantId: string) => void;
  refreshOrgs: () => Promise<void>;
}

const OrgContext = createContext<OrgContextValue>({
  currentOrg: null,
  orgs: [],
  isLoading: true,
  switchOrg: () => {},
  refreshOrgs: async () => {},
});

const ORG_STORAGE_KEY = 'tenantops_current_org';

function loadStoredOrgId(): string | null {
  return localStorage.getItem(ORG_STORAGE_KEY);
}

function storeOrgId(tenantId: string): void {
  localStorage.setItem(ORG_STORAGE_KEY, tenantId);
}

export function OrgProvider({ children }: { children: ReactNode }) {
  const { userId, getToken } = useAuth();
  const queryClient = useQueryClient();
  const [orgs, setOrgs] = useState<OrgInfo[]>([]);
  const [currentOrg, setCurrentOrg] = useState<OrgInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrgs = useCallback(async () => {
    if (!userId) {
      setOrgs([]);
      setCurrentOrg(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const token = await getToken();
    const baseURL = `${import.meta.env.VITE_API_URL || 'http://localhost:13000'}/${import.meta.env.VITE_API_PREFIX || 'api/v1'}`;

    const res = await fetch(`${baseURL}/orgs/mine`, {
      headers: {
        'Content-Type': 'application/json',
        'x-clerk-user-id': userId,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!res.ok) {
      setOrgs([]);
      setCurrentOrg(null);
      setIsLoading(false);
      return;
    }

    const json = await res.json();
    const fetched: OrgInfo[] = json.data ?? [];
    setOrgs(fetched);

    // Restore saved org or pick first
    const storedId = loadStoredOrgId();
    const match = fetched.find((o) => o.tenantId === storedId);
    const selected = match ?? fetched[0] ?? null;
    setCurrentOrg(selected);
    if (selected) storeOrgId(selected.tenantId);

    setIsLoading(false);
  }, [userId, getToken]);

  useEffect(() => {
    fetchOrgs();
  }, [fetchOrgs]);

  const switchOrg = useCallback(
    (tenantId: string) => {
      const target = orgs.find((o) => o.tenantId === tenantId);
      if (!target) return;
      setCurrentOrg(target);
      storeOrgId(tenantId);
      // Invalidate all queries when switching org
      queryClient.clear();
    },
    [orgs, queryClient],
  );

  return (
    <OrgContext.Provider value={{ currentOrg, orgs, isLoading, switchOrg, refreshOrgs: fetchOrgs }}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg(): OrgContextValue {
  return useContext(OrgContext);
}
