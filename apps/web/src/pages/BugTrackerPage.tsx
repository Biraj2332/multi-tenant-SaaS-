import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import FilterListOutlinedIcon from '@mui/icons-material/FilterListOutlined';
import AppShell from '../components/layout/AppShell';
import ReportBugModal from '../components/bugs/ReportBugModal';
import { useIssues, type Issue } from '../hooks/useApi';
import { useProjects } from '../hooks/useProjectApi';
import { usePermission } from '../hooks/usePermission';

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-red-500/15 text-red-300 border-red-500/30',
  high: 'bg-orange-500/15 text-orange-300 border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30',
  low: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
};

const STATUS_BADGE: Record<string, string> = {
  open: 'bg-[#262626] text-[#a0a0a0]',
  in_progress: 'bg-blue-500/15 text-blue-300',
  resolved: 'bg-emerald-500/15 text-emerald-300',
  closed: 'bg-[#1a1a1a] text-[#666]',
};

export default function BugTrackerPage() {
  const navigate = useNavigate();
  const { data: projects = [] } = useProjects();
  const [reportOpen, setReportOpen] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<{ projectId?: string; severity?: string; status?: string }>({});
  const { data: bugs = [], isLoading } = useIssues({ ...filters, type: 'bug' });
  const canReport = usePermission('bug:report');

  function openIssue(b: Issue) {
    navigate(`/projects/${b.project_id}/board?task=${b.id}`);
  }

  return (
    <AppShell title="Bug Tracker">
      <div className="max-w-6xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Bugs</h2>
            <p className="text-sm text-[#888] mt-0.5">{bugs.length} reported</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-[#a0a0a0] hover:text-white bg-[#0f0f0f] border border-[#262626] rounded-md cursor-pointer"
            >
              <FilterListOutlinedIcon sx={{ fontSize: 16 }} />
              Filter
            </button>
            {canReport && (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md font-medium border-none cursor-pointer"
              >
                <BugReportOutlinedIcon sx={{ fontSize: 16 }} />
                Report bug
              </button>
            )}
          </div>
        </div>

        {filterOpen && (
          <div className="mb-4 p-4 border border-[#1f1f1f] rounded-lg bg-[#0d0d0d] flex gap-3 flex-wrap">
            <select
              value={filters.projectId ?? ''}
              onChange={(e) => setFilters({ ...filters, projectId: e.target.value || undefined })}
              className="bg-[#0a0a0a] border border-[#262626] text-sm text-white px-2 py-1.5 rounded outline-none"
            >
              <option value="">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <select
              value={filters.severity ?? ''}
              onChange={(e) => setFilters({ ...filters, severity: e.target.value || undefined })}
              className="bg-[#0a0a0a] border border-[#262626] text-sm text-white px-2 py-1.5 rounded outline-none"
            >
              <option value="">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filters.status ?? ''}
              onChange={(e) => setFilters({ ...filters, status: e.target.value || undefined })}
              className="bg-[#0a0a0a] border border-[#262626] text-sm text-white px-2 py-1.5 rounded outline-none"
            >
              <option value="">All statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
            <button
              type="button"
              onClick={() => setFilters({})}
              className="text-xs text-[#888] hover:text-white bg-transparent border-none cursor-pointer ml-auto"
            >
              Clear
            </button>
          </div>
        )}

        <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1f1f1f] text-xs text-[#888] uppercase tracking-wide">
                <th className="text-left font-medium px-4 py-3">Title</th>
                <th className="text-left font-medium px-4 py-3 w-28">Severity</th>
                <th className="text-left font-medium px-4 py-3 w-32">Status</th>
                <th className="text-left font-medium px-4 py-3 w-32">Reported</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-[#666]">Loading...</td></tr>
              )}
              {!isLoading && bugs.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-sm text-[#666]">No bugs reported</td></tr>
              )}
              {bugs.map((b) => (
                <tr
                  key={b.id}
                  onClick={() => openIssue(b)}
                  className="border-b border-[#1a1a1a] last:border-b-0 hover:bg-[#111] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-white">{b.title}</td>
                  <td className="px-4 py-3">
                    {b.severity && (
                      <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded border ${SEVERITY_BADGE[b.severity]}`}>
                        {b.severity.toUpperCase()}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded uppercase ${STATUS_BADGE[b.status] ?? STATUS_BADGE.open}`}>
                      {b.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#a0a0a0]">{new Date(b.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {reportOpen && <ReportBugModal onClose={() => setReportOpen(false)} />}
    </AppShell>
  );
}
