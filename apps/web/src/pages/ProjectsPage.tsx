import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import AppShell from '../components/layout/AppShell';
import NewProjectModal from '../components/projects/NewProjectModal';
import { useProjects, useArchiveProject, useDeleteProject } from '../hooks/useProjectApi';
import type { Project } from '../types/project.types';
import { useOrg } from '../contexts/OrgContext';

export default function ProjectsPage() {
  const { currentOrg } = useOrg();
  const { data: projects, isLoading } = useProjects();
  const [showNewModal, setShowNewModal] = useState(false);

  return (
    <AppShell title="Projects">
      <main className="pt-6 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-xl font-bold text-white">Projects</h1>
              <p className="text-sm text-[#666] mt-1">
                {currentOrg?.name ?? 'Organization'} · {projects?.length ?? 0} projects
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowNewModal(true)}
              className="flex items-center gap-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer border-none font-medium"
            >
              <AddOutlinedIcon sx={{ fontSize: 16 }} />
              New Project
            </button>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-40 rounded-xl bg-[#111] border border-[#1f1f1f] animate-pulse" />
              ))}
            </div>
          ) : !projects?.length ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <FolderOutlinedIcon sx={{ fontSize: 48, color: '#333' }} />
              <p className="text-[#666] mt-4 text-sm">No projects yet. Create your first one.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </div>
      </main>

      {showNewModal && <NewProjectModal onClose={() => setShowNewModal(false)} />}
    </AppShell>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const navigate = useNavigate();
  const archiveMutation = useArchiveProject();
  const deleteMutation = useDeleteProject();
  const [menuOpen, setMenuOpen] = useState(false);
  const { currentOrg } = useOrg();
  const canManage = currentOrg?.role === 'owner' || currentOrg?.role === 'admin';

  const statusLabel =
    project.progress === 100
      ? 'Completed'
      : project.progress > 0
        ? 'In Progress'
        : project.total_tasks > 0
          ? 'Not Started'
          : 'Empty';

  return (
    <div
      className="group relative border border-[#1f1f1f] bg-[#111] rounded-xl p-5 cursor-pointer hover:border-[#333] transition-colors"
      onClick={() => navigate(`/projects/${project.id}/board`)}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/projects/${project.id}/board`)}
      role="button"
      tabIndex={0}
    >
      {/* Color strip */}
      <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl" style={{ backgroundColor: project.color }} />

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ backgroundColor: project.color + '30', color: project.color }}
          >
            {project.short_code.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{project.name}</p>
            <p className="text-[10px] text-[#555] uppercase tracking-wider">{project.short_code}</p>
          </div>
        </div>

        {canManage && (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[#222] transition-all bg-transparent border-none cursor-pointer text-[#666] hover:text-white"
            >
              <MoreHorizOutlinedIcon sx={{ fontSize: 16 }} />
            </button>
            {menuOpen && (
              <div
                className="absolute right-0 top-full mt-1 w-36 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg shadow-xl z-50 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => { archiveMutation.mutate(project.id); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-[#999] hover:text-white hover:bg-[#222] bg-transparent border-none cursor-pointer transition-colors"
                >
                  Archive
                </button>
                <button
                  type="button"
                  onClick={() => { deleteMutation.mutate(project.id); setMenuOpen(false); }}
                  className="w-full text-left px-3 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-[#222] bg-transparent border-none cursor-pointer transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {project.description && (
        <p className="text-xs text-[#666] mb-3 line-clamp-2">{project.description}</p>
      )}

      {/* Progress bar */}
      <div className="mt-auto">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-[#555]">{statusLabel}</span>
          <span className="text-[10px] text-[#555]">
            {project.done_tasks}/{project.total_tasks} tasks
          </span>
        </div>
        <div className="h-1.5 bg-[#1f1f1f] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${project.progress}%`,
              backgroundColor: project.color,
            }}
          />
        </div>
      </div>
    </div>
  );
}
