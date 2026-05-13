import { useState } from 'react';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import WhatshotOutlinedIcon from '@mui/icons-material/WhatshotOutlined';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useReportBug } from '../../hooks/useApi';
import { useProjects } from '../../hooks/useProjectApi';

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical', desc: 'System down, data loss', Icon: WhatshotOutlinedIcon, color: 'text-red-400 border-red-500/40 bg-red-500/5' },
  { value: 'high', label: 'High', desc: 'Major functionality broken', Icon: ReportProblemOutlinedIcon, color: 'text-orange-400 border-orange-500/40 bg-orange-500/5' },
  { value: 'medium', label: 'Medium', desc: 'Moderate impact', Icon: WarningAmberOutlinedIcon, color: 'text-yellow-400 border-yellow-500/40 bg-yellow-500/5' },
  { value: 'low', label: 'Low', desc: 'Cosmetic, minor', Icon: InfoOutlinedIcon, color: 'text-blue-400 border-blue-500/40 bg-blue-500/5' },
] as const;

interface ReportBugModalProps {
  onClose: () => void;
}

export default function ReportBugModal({ onClose }: ReportBugModalProps) {
  const { data: projects = [] } = useProjects();
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const reportBug = useReportBug();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !projectId) return;
    reportBug.mutate(
      { projectId, title: title.trim(), description: description.trim(), severity },
      { onSuccess: () => onClose() },
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#0f0f0f] border border-[#262626] rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
          <h2 className="text-base font-semibold text-white">Report a bug</h2>
          <button type="button" onClick={onClose} className="text-[#888] hover:text-white p-1 bg-transparent border-none cursor-pointer">
            <CloseOutlinedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-[#a0a0a0] mb-1.5">Project</label>
            <select
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#262626] focus:border-violet-500 rounded-md text-sm text-white outline-none"
              required
            >
              {projects.length === 0 && <option value="">No projects</option>}
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#a0a0a0] mb-1.5">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary..."
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#262626] focus:border-violet-500 rounded-md text-sm text-white outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#a0a0a0] mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Steps to reproduce, expected vs. actual..."
              rows={4}
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#262626] focus:border-violet-500 rounded-md text-sm text-white outline-none resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#a0a0a0] mb-2">Severity</label>
            <div className="grid grid-cols-2 gap-2">
              {SEVERITY_OPTIONS.map((opt) => {
                const Icon = opt.Icon;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setSeverity(opt.value)}
                    className={`flex items-start gap-2 p-3 rounded-md border-2 cursor-pointer transition-all bg-transparent text-left ${
                      severity === opt.value ? opt.color : 'border-[#1f1f1f] text-[#a0a0a0] hover:border-[#333]'
                    }`}
                  >
                    <Icon sx={{ fontSize: 18 }} />
                    <div>
                      <div className="text-sm font-medium">{opt.label}</div>
                      <div className="text-[11px] opacity-70 mt-0.5">{opt.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-[#a0a0a0] hover:text-white bg-transparent border border-[#262626] rounded-md cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={reportBug.isPending}
              className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md font-medium border-none cursor-pointer disabled:opacity-50"
            >
              {reportBug.isPending ? 'Reporting...' : 'Report bug'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
