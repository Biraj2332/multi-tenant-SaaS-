import { useState } from 'react';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import CloseIcon from '@mui/icons-material/Close';
import type { Invitee } from '../../../types/onboarding.types';

interface Props {
  invitees: Invitee[];
  onAdd: (invitee: Invitee) => void;
  onRemove: (email: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const ROLES: Invitee['role'][] = ['admin', 'member', 'viewer'];

export default function Step2InviteMembers({ invitees, onAdd, onRemove, onNext, onBack }: Props) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Invitee['role']>('member');

  const handleAdd = () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    if (invitees.some((inv) => inv.email === trimmed)) return;
    onAdd({ email: trimmed, role });
    setEmail('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-lg bg-violet-600/10 flex items-center justify-center">
          <PersonAddOutlinedIcon className="text-violet-400" sx={{ fontSize: 22 }} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Invite your team</h2>
          <p className="text-sm text-[#888]">You can always invite more later</p>
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="teammate@company.com"
          className="flex-1 bg-[#111] border border-[#1f1f1f] rounded-lg px-4 py-2.5 text-white text-sm placeholder:text-[#555] focus:outline-none focus:border-violet-500/50 transition-colors"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value as Invitee['role'])}
          className="bg-[#111] border border-[#1f1f1f] rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50 cursor-pointer"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleAdd}
          className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none"
        >
          Add
        </button>
      </div>

      {invitees.length > 0 && (
        <div className="space-y-2">
          {invitees.map((inv) => (
            <div
              key={inv.email}
              className="flex items-center justify-between bg-[#111] border border-[#1f1f1f] rounded-lg px-4 py-2.5"
            >
              <div className="flex items-center gap-3">
                <span className="text-sm text-white">{inv.email}</span>
                <span className="text-xs text-[#888] bg-[#1a1a1a] px-2 py-0.5 rounded">
                  {inv.role}
                </span>
              </div>
              <button
                type="button"
                onClick={() => onRemove(inv.email)}
                className="text-[#555] hover:text-white transition-colors bg-transparent border-none cursor-pointer p-0"
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-[#1a1a1a] hover:bg-[#222] text-white py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border border-[#1f1f1f]"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="flex-1 bg-violet-600 hover:bg-violet-700 text-white py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none"
        >
          {invitees.length === 0 ? 'Skip' : 'Continue'}
        </button>
      </div>
    </div>
  );
}
