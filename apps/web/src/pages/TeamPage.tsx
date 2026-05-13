import { useState } from 'react';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import MoreVertOutlinedIcon from '@mui/icons-material/MoreVertOutlined';
import AppShell from '../components/layout/AppShell';
import InviteModal from '../components/team/InviteModal';
import {
  useMembers,
  usePendingInvitations,
  useChangeRole,
  useRemoveMember,
  type Member,
} from '../hooks/useApi';
import { usePermission } from '../hooks/usePermission';

const ROLE_BADGE: Record<string, string> = {
  owner: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
  admin: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  member: 'bg-teal-500/15 text-teal-300 border-teal-500/30',
  viewer: 'bg-[#262626] text-[#a0a0a0] border-[#333]',
};

const ROLE_OPTIONS = ['admin', 'member', 'viewer'];

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const { data: members = [], isLoading } = useMembers();
  const { data: invitations = [] } = usePendingInvitations();
  const changeRole = useChangeRole();
  const removeMember = useRemoveMember();
  const canInvite = usePermission('member:invite');
  const canRemove = usePermission('member:remove');
  const canChangeRole = usePermission('member:change-role');

  function handleRoleChange(m: Member, role: string) {
    changeRole.mutate({ userId: m.user_id, role });
    setOpenMenu(null);
  }

  function handleRemove(m: Member) {
    if (confirm(`Remove ${m.email} from the organization?`)) {
      removeMember.mutate(m.user_id);
    }
    setOpenMenu(null);
  }

  return (
    <AppShell title="Team">
      <div className="max-w-5xl mx-auto px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Members</h2>
            <p className="text-sm text-[#888] mt-0.5">
              {members.length} {members.length === 1 ? 'member' : 'members'}
              {invitations.length > 0 && ` · ${invitations.length} pending`}
            </p>
          </div>
          {canInvite && (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-md font-medium border-none cursor-pointer"
            >
              <PersonAddOutlinedIcon sx={{ fontSize: 16 }} />
              Invite
            </button>
          )}
        </div>

        <div className="border border-[#1f1f1f] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#1f1f1f] text-xs text-[#888] uppercase tracking-wide">
                <th className="text-left font-medium px-4 py-3">Member</th>
                <th className="text-left font-medium px-4 py-3">Role</th>
                <th className="text-left font-medium px-4 py-3">Joined</th>
                <th className="text-left font-medium px-4 py-3">Last active</th>
                <th className="w-12" />
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-sm text-[#666]">
                    Loading...
                  </td>
                </tr>
              )}
              {members.map((m) => (
                <tr key={m.id} className="border-b border-[#1a1a1a] last:border-b-0 hover:bg-[#111] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {m.avatar_url ? (
                        <img src={m.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center text-xs font-medium text-[#a0a0a0]">
                          {(m.name ?? m.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-sm text-white">{m.name ?? m.email}</div>
                        {m.name && <div className="text-xs text-[#666]">{m.email}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 text-[11px] font-medium rounded border ${ROLE_BADGE[m.role] ?? ROLE_BADGE.viewer}`}
                    >
                      {m.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-[#a0a0a0]">
                    {new Date(m.joined_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-[#888]">
                    {m.last_active_at ? new Date(m.last_active_at).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-4 py-3 relative">
                    {m.role !== 'owner' && (canChangeRole || canRemove) && (
                      <button
                        type="button"
                        onClick={() => setOpenMenu(openMenu === m.id ? null : m.id)}
                        className="p-1 text-[#888] hover:text-white bg-transparent border-none cursor-pointer rounded hover:bg-[#1a1a1a]"
                      >
                        <MoreVertOutlinedIcon sx={{ fontSize: 18 }} />
                      </button>
                    )}
                    {openMenu === m.id && (
                      <div className="absolute right-4 top-10 w-44 bg-[#0f0f0f] border border-[#262626] rounded-md shadow-lg z-20 py-1">
                        {canChangeRole &&
                          ROLE_OPTIONS.filter((r) => r !== m.role).map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => handleRoleChange(m, r)}
                              className="w-full text-left px-3 py-1.5 text-sm text-[#a0a0a0] hover:text-white hover:bg-[#1a1a1a] bg-transparent border-none cursor-pointer"
                            >
                              Change to {r}
                            </button>
                          ))}
                        {canRemove && (
                          <button
                            type="button"
                            onClick={() => handleRemove(m)}
                            className="w-full text-left px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 bg-transparent border-none cursor-pointer border-t border-[#1f1f1f]"
                          >
                            Remove from org
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {invitations.length > 0 && (
          <div className="mt-8">
            <h3 className="text-sm font-semibold text-white mb-3">Pending invitations</h3>
            <div className="border border-[#1f1f1f] rounded-lg divide-y divide-[#1a1a1a]">
              {invitations.map((inv) => (
                <div key={inv.id} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-white">{inv.email}</div>
                    <div className="text-xs text-[#888] mt-0.5">
                      Invited as {inv.role} · expires{' '}
                      {new Date(inv.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">
                    PENDING
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {inviteOpen && <InviteModal onClose={() => setInviteOpen(false)} />}
    </AppShell>
  );
}
