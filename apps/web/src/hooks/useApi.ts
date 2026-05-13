import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../infrastructure/api/index';

// ============================================================================
// SPRINTS
// ============================================================================

export interface Sprint {
  id: string;
  project_id: string;
  name: string;
  goal: string | null;
  status: 'planned' | 'active' | 'completed';
  starts_at: string | null;
  ends_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export function useSprints(projectId: string | undefined) {
  return useQuery<Sprint[]>({
    queryKey: ['sprints', projectId],
    queryFn: async () => {
      const res = await apiClient.get('/sprints', { params: { projectId } });
      return res.data.data;
    },
    enabled: !!projectId,
    staleTime: 5 * 60_000,
  });
}

export function useCreateSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { projectId: string; name: string; goal?: string; startsAt?: string; endsAt?: string }) => {
      const res = await apiClient.post('/sprints', payload);
      return res.data.data as Sprint;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['sprints', vars.projectId] }),
  });
}

export function useStartSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; projectId: string }) => {
      const res = await apiClient.post(`/sprints/${id}/start`);
      return res.data.data as Sprint;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ['sprints', vars.projectId] }),
  });
}

export function useCompleteSprint() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, strategy }: { id: string; projectId: string; strategy: 'next_sprint' | 'backlog' }) => {
      const res = await apiClient.post(`/sprints/${id}/complete`, { strategy });
      return res.data.data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['sprints', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}

// ============================================================================
// ISSUES
// ============================================================================

export interface Issue {
  id: string;
  project_id: string;
  sprint_id: string | null;
  title: string;
  description: string | null;
  type: 'task' | 'bug' | 'feature' | 'chore';
  severity: 'critical' | 'high' | 'medium' | 'low' | null;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'urgent' | 'high' | 'medium' | 'low' | 'none';
  assignee_id: string | null;
  rank: number;
  reported_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export function useIssues(filters: { projectId?: string; type?: string; severity?: string; status?: string }) {
  return useQuery<Issue[]>({
    queryKey: ['issues', filters],
    queryFn: async () => {
      const res = await apiClient.get('/issues', { params: filters });
      return res.data.data;
    },
    staleTime: 2 * 60_000,
  });
}

export function useCreateIssue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      projectId: string;
      title: string;
      description?: string;
      type: 'task' | 'bug' | 'feature' | 'chore';
      severity?: string;
      priority?: string;
      sprintId?: string;
    }) => {
      const res = await apiClient.post('/issues', payload);
      return res.data.data as Issue;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issues'] }),
  });
}

export function useReportBug() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { projectId: string; title: string; description: string; severity: 'critical' | 'high' | 'medium' | 'low' }) => {
      const res = await apiClient.post('/issues/bug', payload);
      return res.data.data as Issue;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['issues'] }),
  });
}

// ============================================================================
// MEMBERS
// ============================================================================

export interface Member {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  joined_at: string;
  last_active_at: string | null;
}

export interface Invitation {
  id: string;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
}

export function useMembers() {
  return useQuery<Member[]>({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await apiClient.get('/members');
      return res.data.data;
    },
    staleTime: 30 * 60_000,
  });
}

export function usePendingInvitations() {
  return useQuery<Invitation[]>({
    queryKey: ['invitations'],
    queryFn: async () => {
      const res = await apiClient.get('/members/invitations');
      return res.data.data;
    },
  });
}

export function useInviteMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { email: string; role: string }) => {
      const res = await apiClient.post('/members/invite', payload);
      return res.data.data as Invitation;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invitations'] }),
  });
}

export function useChangeRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const res = await apiClient.patch(`/members/${userId}/role`, { role });
      return res.data.data as Member;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

export function useRemoveMember() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: string) => {
      await apiClient.delete(`/members/${userId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members'] }),
  });
}

// ============================================================================
// NOTIFICATIONS
// ============================================================================

export interface Notification {
  id: string;
  user_id: string;
  type: 'task_assigned' | 'status_changed' | 'mentioned' | 'sprint_event' | 'member_joined' | 'bug_reported';
  title: string;
  body: string;
  resource_type: string;
  resource_id: string;
  read_at: string | null;
  created_at: string;
}

export function useNotifications() {
  return useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications');
      return res.data.data;
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery<number>({
    queryKey: ['notifications', 'unread'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications/unread-count');
      return res.data.data ?? 0;
    },
    refetchInterval: 30_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[]) => {
      await apiClient.post('/notifications/mark-read', { ids });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/notifications/mark-all-read');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// ============================================================================
// SETTINGS
// ============================================================================

export interface NotifPrefs {
  category: string;
  email_enabled: boolean;
  in_app_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
}

export interface OrgSession {
  id: string;
  device_type: string;
  browser: string;
  ip_address: string;
  location: string | null;
  last_seen_at: string;
  is_current: boolean;
}

export function useNotifPrefs() {
  return useQuery<NotifPrefs[]>({
    queryKey: ['settings', 'notifications'],
    queryFn: async () => {
      const res = await apiClient.get('/settings/notifications');
      return res.data.data;
    },
    staleTime: 10 * 60_000,
  });
}

export function useUpdateNotifPrefs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: NotifPrefs[]) => {
      const res = await apiClient.put('/settings/notifications', payload);
      return res.data.data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'notifications'] }),
  });
}

export function useUpdateGeneral() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name?: string; slug?: string; timezone?: string }) => {
      const res = await apiClient.put('/settings/general', payload);
      return res.data.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['orgs'] });
    },
  });
}

export function useSessions() {
  return useQuery<OrgSession[]>({
    queryKey: ['settings', 'sessions'],
    queryFn: async () => {
      const res = await apiClient.get('/settings/sessions');
      return res.data.data;
    },
  });
}

export function useRevokeSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => { await apiClient.delete(`/settings/sessions/${id}`); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings', 'sessions'] }),
  });
}

export function useDeleteOrg() {
  return useMutation({
    mutationFn: async (payload: { confirmation: string }) => {
      await apiClient.delete('/settings/org', { data: payload });
    },
  });
}

// ============================================================================
// AUDIT LOGS
// ============================================================================

export interface AuditLog {
  id: string;
  actor_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export function useAuditLogs(limit = 20) {
  return useQuery<AuditLog[]>({
    queryKey: ['audit-logs', limit],
    queryFn: async () => {
      const res = await apiClient.get('/settings/audit-logs', { params: { limit } });
      return res.data.data;
    },
  });
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface MetricSummary {
  tasksCompleted: number;
  activeMembers: number;
  openCriticalBugs: number;
  sprintVelocity: number;
  velocityTrend: 'up' | 'down' | 'neutral';
}

export interface DailyCount { date: string; count: number; }
export interface DistributionItem { status: string; count: number; }
export interface WorkloadItem { user_id: string; name: string; count: number; }
export interface SeverityTrendItem { date: string; critical: number; high: number; medium: number; low: number; }

export function useMetricSummary(days = 7) {
  return useQuery<MetricSummary>({
    queryKey: ['analytics', 'summary', days],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/summary', { params: { days } });
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useTasksPerDay(days = 30, projectId?: string) {
  return useQuery<DailyCount[]>({
    queryKey: ['analytics', 'tasks-per-day', days, projectId],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/tasks-per-day', { params: { days, projectId } });
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useIssueDistribution(projectId?: string) {
  return useQuery<DistributionItem[]>({
    queryKey: ['analytics', 'distribution', projectId],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/distribution', { params: { projectId } });
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useTeamWorkload() {
  return useQuery<WorkloadItem[]>({
    queryKey: ['analytics', 'workload'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/workload');
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useBugSeverityTrend(days = 30) {
  return useQuery<SeverityTrendItem[]>({
    queryKey: ['analytics', 'bug-trend', days],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/bug-severity-trend', { params: { days } });
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });
}
