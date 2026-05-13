import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import PlayArrowOutlinedIcon from '@mui/icons-material/PlayArrowOutlined';
import CheckCircleOutlineOutlinedIcon from '@mui/icons-material/CheckCircleOutlineOutlined';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import KeyboardArrowRightOutlinedIcon from '@mui/icons-material/KeyboardArrowRightOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import ArrowUpwardOutlinedIcon from '@mui/icons-material/ArrowUpwardOutlined';
import RemoveOutlinedIcon from '@mui/icons-material/RemoveOutlined';
import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';
import AppShell from '../components/layout/AppShell';
import { useProjects } from '../hooks/useProjectApi';
import {
  useSprints,
  useIssues,
  useCreateSprint,
  useStartSprint,
  useCompleteSprint,
  useCreateIssue,
  type Sprint,
  type Issue,
} from '../hooks/useApi';
import { usePermission } from '../hooks/usePermission';

const PRIORITY_ICON: Record<string, { Icon: React.ComponentType<{ sx?: object }>; color: string }> = {
  urgent: { Icon: ReportProblemOutlinedIcon, color: 'text-red-400' },
  high: { Icon: ArrowUpwardOutlinedIcon, color: 'text-orange-400' },
  medium: { Icon: RemoveOutlinedIcon, color: 'text-yellow-400' },
  low: { Icon: ArrowDownwardOutlinedIcon, color: 'text-blue-400' },
  none: { Icon: RemoveOutlinedIcon, color: 'text-[#666]' },
};

const STATUS_COLOR: Record<string, string> = {
  open: 'bg-[#262626] text-[#a0a0a0]',
  in_progress: 'bg-blue-500/15 text-blue-300',
  resolved: 'bg-emerald-500/15 text-emerald-300',
  closed: 'bg-[#1a1a1a] text-[#666]',
};

export default function BacklogPage() {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const [projectId, setProjectId] = useState<string>('');
  const selectedProject = projectId || projects[0]?.id || '';
  const { data: sprints = [] } = useSprints(selectedProject || undefined);
  const { data: issues = [] } = useIssues({ projectId: selectedProject });
  const createSprint = useCreateSprint();
  const startSprint = useStartSprint();
  const completeSprint = useCompleteSprint();
  const createIssue = useCreateIssue();

  const [expanded, setExpanded] = useState<Record<string, boolean>>({ backlog: true });
  const [creating, setCreating] = useState<string | null>(null);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const canManageSprints = usePermission('sprint:manage');
  const canCreateIssue = usePermission('task:create');

  function toggle(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function submitNewIssue(sprintId: string | null) {
    if (!newIssueTitle.trim() || !selectedProject) return;
    createIssue.mutate(
      {
        projectId: selectedProject,
        title: newIssueTitle.trim(),
        type: 'task',
        priority: 'medium',
        sprintId: sprintId ?? undefined,
      },
      {
        onSuccess: () => {
          setNewIssueTitle('');
          setCreating(null);
        },
      },
    );
  }

  function handleCreateSprint() {
    if (!selectedProject) return;
    const name = prompt('Sprint name (e.g. "Sprint 7")');
    if (!name) return;
    createSprint.mutate({ projectId: selectedProject, name });
  }

  function handleCompleteSprint(s: Sprint) {
    const strategy = confirm('Move incomplete issues to next sprint? OK = next sprint, Cancel = backlog')
      ? 'next_sprint'
      : 'backlog';
    completeSprint.mutate({ id: s.id, projectId: selectedProject, strategy });
  }

  const backlogIssues = issues.filter((i) => !i.sprint_id);
  const issuesBySprint = sprints.reduce<Record<string, Issue[]>>((acc, s) => {
    acc[s.id] = issues.filter((i) => i.sprint_id === s.id);
    return acc;
  }, {});

  return (
    <AppShell title="Backlog">
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <select
            value={selectedProject}
            onChange={(e) => setProjectId(e.target.value)}
            className="bg-[#0f0f0f] border border-[#262626] text-sm text-white px-3 py-1.5 rounded-md outline-none focus:border-violet-500"
          >
            {projects.length === 0 && <option value="">No projects</option>}
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {canManageSprints && (
            <button
              type="button"
              onClick={handleCreateSprint}
              disabled={!selectedProject}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-md font-medium border-none cursor-pointer disabled:opacity-50"
            >
              <AddOutlinedIcon sx={{ fontSize: 16 }} />
              Create sprint
            </button>
          )}
        </div>

        {/* Sprints */}
        {sprints.map((sprint) => (
          <SprintGroup
            key={sprint.id}
            sprint={sprint}
            issues={issuesBySprint[sprint.id] ?? []}
            expanded={!!expanded[sprint.id]}
            onToggle={() => toggle(sprint.id)}
            creating={creating === sprint.id}
            newIssueTitle={newIssueTitle}
            setNewIssueTitle={setNewIssueTitle}
            onStartCreate={() => setCreating(sprint.id)}
            onCancelCreate={() => setCreating(null)}
            onSubmitCreate={() => submitNewIssue(sprint.id)}
            onStart={() => startSprint.mutate({ id: sprint.id, projectId: selectedProject })}
            onComplete={() => handleCompleteSprint(sprint)}
            onIssueClick={(i) => navigate(`/projects/${i.project_id}/board?task=${i.id}`)}
            canManage={canManageSprints}
            canCreateIssue={canCreateIssue}
          />
        ))}

        {/* Backlog */}
        <SprintGroup
          backlog
          issues={backlogIssues}
          expanded={!!expanded.backlog}
          onToggle={() => toggle('backlog')}
          creating={creating === 'backlog'}
          newIssueTitle={newIssueTitle}
          setNewIssueTitle={setNewIssueTitle}
          onStartCreate={() => setCreating('backlog')}
          onCancelCreate={() => setCreating(null)}
          onSubmitCreate={() => submitNewIssue(null)}
          onIssueClick={(i) => navigate(`/projects/${i.project_id}/board?task=${i.id}`)}
          canCreateIssue={canCreateIssue}
        />
      </div>
    </AppShell>
  );
}

interface SprintGroupProps {
  sprint?: Sprint;
  backlog?: boolean;
  issues: Issue[];
  expanded: boolean;
  onToggle: () => void;
  creating: boolean;
  newIssueTitle: string;
  setNewIssueTitle: (v: string) => void;
  onStartCreate: () => void;
  onCancelCreate: () => void;
  onSubmitCreate: () => void;
  onStart?: () => void;
  onComplete?: () => void;
  onIssueClick: (i: Issue) => void;
  canManage?: boolean;
  canCreateIssue: boolean;
}

function SprintGroup(p: SprintGroupProps) {
  const title = p.backlog ? 'Backlog' : p.sprint?.name ?? '';
  const status = p.sprint?.status;
  const Chevron = p.expanded ? KeyboardArrowDownOutlinedIcon : KeyboardArrowRightOutlinedIcon;

  return (
    <div className="border border-[#1f1f1f] rounded-lg mb-4 bg-[#0d0d0d] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
        <button
          type="button"
          onClick={p.onToggle}
          className="flex items-center gap-2 text-left bg-transparent border-none cursor-pointer text-white"
        >
          <Chevron sx={{ fontSize: 18, color: '#888' }} />
          <span className="text-sm font-medium">{title}</span>
          <span className="text-xs text-[#666]">({p.issues.length})</span>
          {status && status !== 'planned' && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                status === 'active'
                  ? 'bg-emerald-500/15 text-emerald-300'
                  : 'bg-[#262626] text-[#888]'
              }`}
            >
              {status.toUpperCase()}
            </span>
          )}
        </button>
        <div className="flex items-center gap-2">
          {p.canManage && p.sprint?.status === 'planned' && (
            <button
              type="button"
              onClick={p.onStart}
              className="flex items-center gap-1 px-2 py-1 text-xs text-white bg-emerald-600/80 hover:bg-emerald-600 rounded border-none cursor-pointer"
            >
              <PlayArrowOutlinedIcon sx={{ fontSize: 14 }} />
              Start sprint
            </button>
          )}
          {p.canManage && p.sprint?.status === 'active' && (
            <button
              type="button"
              onClick={p.onComplete}
              className="flex items-center gap-1 px-2 py-1 text-xs text-white bg-blue-600/80 hover:bg-blue-600 rounded border-none cursor-pointer"
            >
              <CheckCircleOutlineOutlinedIcon sx={{ fontSize: 14 }} />
              Complete sprint
            </button>
          )}
        </div>
      </div>

      {p.expanded && (
        <div>
          {p.issues.length === 0 && !p.creating && (
            <div className="px-4 py-6 text-center text-xs text-[#666]">No issues</div>
          )}
          {p.issues.map((issue) => {
            const pri = PRIORITY_ICON[issue.priority] ?? PRIORITY_ICON.none;
            const Icon = pri.Icon;
            return (
              <button
                key={issue.id}
                type="button"
                onClick={() => p.onIssueClick(issue)}
                className="w-full text-left flex items-center gap-3 px-4 py-2.5 border-b border-[#1a1a1a] last:border-b-0 hover:bg-[#151515] transition-colors bg-transparent"
              >
                <Icon sx={{ fontSize: 14 }} className={pri.color} />
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase ${STATUS_COLOR[issue.status] ?? STATUS_COLOR.open}`}
                >
                  {issue.status.replace('_', ' ')}
                </span>
                <span className="flex-1 text-sm text-white truncate">{issue.title}</span>
                {issue.type === 'bug' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
                    BUG
                  </span>
                )}
              </button>
            );
          })}
          {p.canCreateIssue && (
            <div className="border-t border-[#1a1a1a]">
              {p.creating ? (
                <div className="px-4 py-3 flex gap-2">
                  <input
                    autoFocus
                    value={p.newIssueTitle}
                    onChange={(e) => p.setNewIssueTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') p.onSubmitCreate();
                      if (e.key === 'Escape') p.onCancelCreate();
                    }}
                    placeholder="Issue title..."
                    className="flex-1 px-2 py-1.5 bg-[#0a0a0a] border border-[#262626] focus:border-violet-500 rounded text-sm text-white outline-none"
                  />
                  <button
                    type="button"
                    onClick={p.onSubmitCreate}
                    className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded border-none cursor-pointer"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={p.onCancelCreate}
                    className="px-3 py-1.5 text-xs text-[#a0a0a0] bg-transparent border border-[#262626] rounded cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={p.onStartCreate}
                  className="w-full text-left flex items-center gap-2 px-4 py-2.5 text-xs text-[#666] hover:text-white hover:bg-[#151515] bg-transparent border-none cursor-pointer"
                >
                  <AddOutlinedIcon sx={{ fontSize: 14 }} />
                  Add issue
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
