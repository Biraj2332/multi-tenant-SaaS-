import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import AppShell from '../components/layout/AppShell';
import IssueDetailDrawer from '../components/board/IssueDetailDrawer';
import { useProject, useTasks, useCreateTask, useUpdateTask } from '../hooks/useProjectApi';
import { TASK_STATUSES } from '../types/project.types';
import type { Task, TaskStatus } from '../types/project.types';

export default function BoardPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { data: project } = useProject(projectId);
  const [assigneeFilter, setAssigneeFilter] = useState<string | undefined>(undefined);
  const { data: tasks, isLoading } = useTasks(projectId, { assigneeId: assigneeFilter });
  const updateTask = useUpdateTask();
  const createTask = useCreateTask();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);

  // Group tasks by status
  const columns = TASK_STATUSES.map((s) => ({
    ...s,
    tasks: (tasks ?? []).filter((t) => t.status === s.key).sort((a, b) => a.position - b.position),
  }));

  // Get unique assignee IDs for filter bar
  const assigneeIds = [...new Set((tasks ?? []).map((t) => t.assignee_id).filter(Boolean))] as string[];

  // Drag handlers
  const handleDragStart = useCallback((task: Task) => { setDraggedTask(task); }, []);

  const handleDrop = useCallback(
    (targetStatus: TaskStatus) => {
      if (!draggedTask || draggedTask.status === targetStatus) { setDraggedTask(null); return; }
      // Optimistic: update local state handled by React Query invalidation
      updateTask.mutate(
        { id: draggedTask.id, status: targetStatus },
        {
          onError: () => {
            // React Query will refetch on error, reverting optimistic update
          },
        },
      );
      setDraggedTask(null);
    },
    [draggedTask, updateTask],
  );

  const handleQuickCreate = useCallback(
    async (status: TaskStatus) => {
      if (!projectId) return;
      const title = window.prompt('Task title:');
      if (!title?.trim()) return;
      await createTask.mutateAsync({ projectId, title: title.trim(), status });
    },
    [projectId, createTask],
  );

  return (
    <AppShell title={project?.name ?? 'Board'}>
      <main>
        {/* Top bar */}
        <div className="border-b border-[#1f1f1f] px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/projects')}
              className="p-1.5 rounded-lg hover:bg-[#1a1a1a] bg-transparent border-none cursor-pointer text-[#666] hover:text-white transition-colors"
            >
              <ArrowBackOutlinedIcon sx={{ fontSize: 18 }} />
            </button>
            {project && (
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: project.color + '30', color: project.color }}
                >
                  {project.short_code.slice(0, 2)}
                </div>
                <span className="text-sm font-medium text-white">{project.name}</span>
                <span className="text-xs text-[#555]">Board</span>
              </div>
            )}
          </div>

          {/* Assignee filter */}
          <div className="flex items-center gap-2">
            <FilterListOutlinedIcon sx={{ fontSize: 16, color: '#555' }} />
            <button
              type="button"
              onClick={() => setAssigneeFilter(undefined)}
              className={`text-xs px-2 py-1 rounded cursor-pointer border-none transition-colors ${
                !assigneeFilter ? 'bg-violet-600/20 text-violet-300' : 'bg-transparent text-[#666] hover:text-white'
              }`}
            >
              All
            </button>
            {assigneeIds.map((aid) => (
              <button
                key={aid}
                type="button"
                onClick={() => setAssigneeFilter(assigneeFilter === aid ? undefined : aid)}
                className={`w-6 h-6 rounded-full text-[10px] font-bold cursor-pointer border-2 transition-all ${
                  assigneeFilter === aid
                    ? 'border-violet-500 bg-violet-600 text-white'
                    : 'border-transparent bg-[#333] text-[#999] hover:border-[#555]'
                }`}
              >
                {aid.slice(0, 2).toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Kanban columns */}
        <div className="flex gap-4 p-6 overflow-x-auto min-h-[calc(100vh-8rem)]">
          {columns.map((col) => (
            <KanbanColumn
              key={col.key}
              status={col.key}
              label={col.label}
              tasks={col.tasks}
              isLoading={isLoading}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
              onCardClick={setSelectedTaskId}
              onQuickCreate={handleQuickCreate}
            />
          ))}
        </div>
      </main>

      {selectedTaskId && (
        <IssueDetailDrawer
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </AppShell>
  );
}

function KanbanColumn({
  status,
  label,
  tasks,
  isLoading,
  onDragStart,
  onDrop,
  onCardClick,
  onQuickCreate,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  isLoading: boolean;
  onDragStart: (t: Task) => void;
  onDrop: (status: TaskStatus) => void;
  onCardClick: (id: string) => void;
  onQuickCreate: (status: TaskStatus) => void;
}) {
  const [dragOverActive, setDragOverActive] = useState(false);

  const statusColors: Record<string, string> = {
    backlog: '#555',
    todo: '#3b82f6',
    in_progress: '#eab308',
    done: '#22c55e',
  };

  return (
    <div
      className={`flex-shrink-0 w-72 flex flex-col rounded-xl transition-colors ${
        dragOverActive ? 'bg-[#1a1a1a]' : ''
      }`}
      onDragOver={(e) => { e.preventDefault(); setDragOverActive(true); }}
      onDragLeave={() => setDragOverActive(false)}
      onDrop={() => { setDragOverActive(false); onDrop(status); }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[status] ?? '#555' }} />
          <span className="text-xs font-semibold text-[#999] uppercase tracking-wider">{label}</span>
          <span className="text-[10px] text-[#444] bg-[#1a1a1a] px-1.5 py-0.5 rounded">{tasks.length}</span>
        </div>
        <button
          type="button"
          onClick={() => onQuickCreate(status)}
          className="p-0.5 rounded hover:bg-[#222] bg-transparent border-none cursor-pointer text-[#555] hover:text-white transition-colors"
        >
          <AddOutlinedIcon sx={{ fontSize: 14 }} />
        </button>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-2 px-1 overflow-y-auto">
        {isLoading
          ? [1, 2].map((i) => (
              <div key={i} className="h-20 rounded-lg bg-[#111] border border-[#1f1f1f] animate-pulse" />
            ))
          : tasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onDragStart={onDragStart}
                onClick={() => onCardClick(task.id)}
              />
            ))}
      </div>
    </div>
  );
}

function TaskCard({
  task,
  onDragStart,
  onClick,
}: {
  task: Task;
  onDragStart: (t: Task) => void;
  onClick: () => void;
}) {
  const priorityColors: Record<string, string> = {
    urgent: '#ef4444',
    high: '#f97316',
    medium: '#eab308',
    low: '#3b82f6',
    none: '#555',
  };

  return (
    <div
      draggable
      onDragStart={() => onDragStart(task)}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      role="button"
      tabIndex={0}
      className="bg-[#111] border border-[#1f1f1f] rounded-lg p-3 cursor-pointer hover:border-[#333] transition-colors group"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[10px] text-[#444] font-mono">
          {task.id.slice(0, 8).toUpperCase()}
        </span>
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: priorityColors[task.priority] ?? '#555' }}
        />
      </div>
      <p className="text-sm text-white leading-snug mb-2">{task.title}</p>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {task.labels.slice(0, 2).map((l) => (
            <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1f1f1f] text-[#888]">
              {l}
            </span>
          ))}
        </div>
        {task.assignee_id && (
          <div className="w-5 h-5 rounded-full bg-[#333] text-[#999] text-[9px] font-bold flex items-center justify-center">
            {task.assignee_id.slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
    </div>
  );
}
