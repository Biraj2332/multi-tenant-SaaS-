import { useState } from 'react';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import { useInviteMember } from '../../hooks/useApi';

const ROLES = [
  { value: 'admin', label: 'Admin', desc: 'Manage projects, members and settings' },
  { value: 'member', label: 'Member', desc: 'Create and edit issues, comment' },
  { value: 'viewer', label: 'Viewer', desc: 'Read-only access to projects' },
];

interface InviteModalProps {
  onClose: () => void;
}

export default function InviteModal({ onClose }: InviteModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('member');
  const [error, setError] = useState<string | null>(null);
  const invite = useInviteMember();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email');
      return;
    }
    invite.mutate(
      { email, role },
      {
        onSuccess: () => onClose(),
        onError: (err: unknown) => {
          const message = err instanceof Error ? err.message : 'Failed to send invitation';
          setError(message);
        },
      },
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0f0f0f] border border-[#262626] rounded-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1f1f1f]">
          <h2 className="text-base font-semibold text-white">Invite a teammate</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#888] hover:text-white p-1 bg-transparent border-none cursor-pointer"
          >
            <CloseOutlinedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-medium text-[#a0a0a0] mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="teammate@company.com"
              className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#262626] focus:border-violet-500 rounded-md text-sm text-white outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#a0a0a0] mb-1.5">Role</label>
            <div className="space-y-2">
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-colors ${
                    role === r.value
                      ? 'border-violet-500 bg-violet-500/5'
                      : 'border-[#262626] hover:border-[#3a3a3a]'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={(e) => setRole(e.target.value)}
                    className="mt-1 accent-violet-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{r.label}</div>
                    <div className="text-xs text-[#888] mt-0.5">{r.desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
          {error && <div className="text-xs text-red-400">{error}</div>}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-[#a0a0a0] hover:text-white bg-transparent border border-[#262626] rounded-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={invite.isPending}
              className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-md font-medium border-none cursor-pointer disabled:opacity-50"
            >
              {invite.isPending ? 'Sending...' : 'Send invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
