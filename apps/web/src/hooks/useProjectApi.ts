import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../infrastructure/api/index';
import type {
  Project, Task, Comment, ActivityLog,
  CreateProjectPayload, CreateTaskPayload, UpdateTaskPayload,
} from '../types/project.types';

// --- Projects ---

export function useProjects() {
  return useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await apiClient.get('/projects');
      return res.data.data;
    },
  });
}

export function useProject(id: string | undefined) {
  return useQuery<Project>({
    queryKey: ['project', id],
    queryFn: async () => {
      const res = await apiClient.get(`/projects/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      const res = await apiClient.post('/projects', payload);
      return res.data.data as Project;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); },
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string; name?: string; description?: string; color?: string; icon?: string }) => {
      const res = await apiClient.patch(`/projects/${id}`, payload);
      return res.data.data as Project;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); },
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/projects/${id}`);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); },
  });
}

export function useArchiveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.patch(`/projects/${id}/archive`);
      return res.data.data as Project;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['projects'] }); },
  });
}

// --- Tasks ---

export function useTasks(projectId: string | undefined, filters?: { status?: string; assigneeId?: string }) {
  return useQuery<Task[]>({
    queryKey: ['tasks', projectId, filters],
    queryFn: async () => {
      const params: Record<string, string> = { projectId: projectId! };
      if (filters?.status) params.status = filters.status;
      if (filters?.assigneeId) params.assigneeId = filters.assigneeId;
      const res = await apiClient.get('/tasks', { params });
      return res.data.data;
    },
    enabled: !!projectId,
  });
}

export function useTask(id: string | undefined) {
  return useQuery<Task>({
    queryKey: ['task', id],
    queryFn: async () => {
      const res = await apiClient.get(`/tasks/${id}`);
      return res.data.data;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      const res = await apiClient.post('/tasks', payload);
      return res.data.data as Task;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['tasks', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & UpdateTaskPayload) => {
      const res = await apiClient.patch(`/tasks/${id}`, payload);
      return res.data.data as Task;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks', data.project_id] });
      qc.invalidateQueries({ queryKey: ['task', data.id] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      await apiClient.delete(`/tasks/${id}`);
      return { projectId };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['tasks', data.projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

// --- Comments ---

export function useComments(taskId: string | undefined) {
  return useQuery<Comment[]>({
    queryKey: ['comments', taskId],
    queryFn: async () => {
      const res = await apiClient.get(`/tasks/${taskId}/comments`);
      return res.data.data;
    },
    enabled: !!taskId,
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, body }: { taskId: string; body: string }) => {
      const res = await apiClient.post(`/tasks/${taskId}/comments`, { body });
      return res.data.data as Comment;
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['comments', vars.taskId] });
    },
  });
}

// --- Activity ---

export function useActivity(taskId: string | undefined) {
  return useQuery<ActivityLog[]>({
    queryKey: ['activity', taskId],
    queryFn: async () => {
      const res = await apiClient.get(`/tasks/${taskId}/activity`);
      return res.data.data;
    },
    enabled: !!taskId,
  });
}
