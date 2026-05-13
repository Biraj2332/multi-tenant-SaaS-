import { useState, useEffect } from 'react';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { useCreateProject } from '../../hooks/useProjectApi';
import { useNavigate } from 'react-router-dom';

const COLORS = ['#7c3aed', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#ec4899', '#06b6d4'];

export default function NewProjectModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const createMutation = useCreateProject();
  const [name, setName] = useState('');
  const [shortCode, setShortCode] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [codeEdited, setCodeEdited] = useState(false);

  useEffect(() => {
    if (!codeEdited) {
      setShortCode(
        name
          .replace(/[^a-zA-Z0-9\s]/g, '')
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 3)
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 5) || '',
      );
    }
  }, [name, codeEdited]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !shortCode.trim()) return;
    const project = await createMutation.mutateAsync({ name, shortCode, description, color });
    onClose();
    navigate(`/projects/${project.id}/board`);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-[#141414] border border-[#1f1f1f] rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
          <h2 className="text-base font-semibold text-white">New Project</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[#222] bg-transparent border-none cursor-pointer text-[#666] hover:text-white transition-colors"
          >
            <CloseOutlinedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          <div>
            <label className="block text-xs text-[#888] mb-1.5">Project name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Project"
              className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-violet-600 transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs text-[#888] mb-1.5">Short code</label>
            <input
              value={shortCode}
              onChange={(e) => { setShortCode(e.target.value.toUpperCase().slice(0, 5)); setCodeEdited(true); }}
              placeholder="MP"
              maxLength={5}
              className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-violet-600 transition-colors font-mono"
            />
          </div>

          <div>
            <label className="block text-xs text-[#888] mb-1.5">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What is this project about?"
              className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-violet-600 transition-colors resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-[#888] mb-2">Color</label>
            <div className="flex gap-2">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full cursor-pointer border-2 transition-all ${
                    color === c ? 'border-white scale-110' : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#888] hover:text-white bg-transparent border border-[#1f1f1f] rounded-lg cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim() || !shortCode.trim() || createMutation.isPending}
              className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg cursor-pointer border-none font-medium transition-colors"
            >
              {createMutation.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
