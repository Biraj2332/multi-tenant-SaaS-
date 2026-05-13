import { useState } from 'react';
import { useParams, NavLink, useNavigate } from 'react-router-dom';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import PaymentOutlinedIcon from '@mui/icons-material/PaymentOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import AppShell from '../components/layout/AppShell';
import { useOrg } from '../contexts/OrgContext';
import { usePermission } from '../hooks/usePermission';
import {
  useUpdateGeneral,
  useNotifPrefs,
  useUpdateNotifPrefs,
  useSessions,
  useRevokeSession,
  useDeleteOrg,
  useAuditLogs,
  type NotifPrefs,
} from '../hooks/useApi';

const TABS = [
  { id: 'general', label: 'General', Icon: TuneOutlinedIcon },
  { id: 'billing', label: 'Plan & Billing', Icon: PaymentOutlinedIcon },
  { id: 'notifications', label: 'Notifications', Icon: NotificationsNoneOutlinedIcon },
  { id: 'security', label: 'Security', Icon: SecurityOutlinedIcon },
];

export default function SettingsPage() {
  const { tab = 'general' } = useParams<{ tab: string }>();

  return (
    <AppShell title="Settings">
      <div className="max-w-5xl mx-auto px-8 py-6 flex gap-8">
        <aside className="w-52 shrink-0">
          <nav className="space-y-1">
            {TABS.map(({ id, label, Icon }) => (
              <NavLink
                key={id}
                to={`/settings/${id}`}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive ? 'bg-[#1a1a1a] text-white' : 'text-[#a0a0a0] hover:bg-[#151515] hover:text-white'
                  }`
                }
              >
                <Icon sx={{ fontSize: 16 }} />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="flex-1 min-w-0">
          {tab === 'general' && <GeneralTab />}
          {tab === 'billing' && <BillingTab />}
          {tab === 'notifications' && <NotificationsTab />}
          {tab === 'security' && <SecurityTab />}
        </div>
      </div>
    </AppShell>
  );
}

function GeneralTab() {
  const { currentOrg } = useOrg();
  const update = useUpdateGeneral();
  const deleteOrg = useDeleteOrg();
  const navigate = useNavigate();
  const canUpdate = usePermission('settings:general');
  const canDelete = usePermission('org:delete');
  const [name, setName] = useState(currentOrg?.name ?? '');
  const [slug, setSlug] = useState(currentOrg?.slug ?? '');
  const [confirmation, setConfirmation] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  return (
    <div className="space-y-8">
      <Section title="Organization">
        <Field label="Name">
          <input
            disabled={!canUpdate}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#262626] focus:border-violet-500 rounded-md text-sm text-white outline-none disabled:opacity-50"
          />
        </Field>
        <Field label="Slug">
          <input
            disabled={!canUpdate}
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#262626] focus:border-violet-500 rounded-md text-sm text-white outline-none disabled:opacity-50"
          />
        </Field>
        {canUpdate && (
          <button
            type="button"
            onClick={() => update.mutate({ name, slug })}
            disabled={update.isPending}
            className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-md font-medium border-none cursor-pointer disabled:opacity-50"
          >
            {update.isPending ? 'Saving...' : 'Save changes'}
          </button>
        )}
      </Section>

      {canDelete && (
        <Section title="Danger zone" danger>
          <p className="text-sm text-[#a0a0a0] mb-3">
            Permanently delete this organization, its tenant schema and all data. This action cannot be undone.
          </p>
          {!showDelete ? (
            <button
              type="button"
              onClick={() => setShowDelete(true)}
              className="px-4 py-2 text-sm bg-transparent border border-red-500/40 text-red-400 hover:bg-red-500/10 rounded-md font-medium cursor-pointer"
            >
              Delete organization
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-[#a0a0a0]">
                Type <span className="text-red-400 font-mono">{currentOrg?.slug}</span> to confirm:
              </p>
              <input
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                className="w-full px-3 py-2 bg-[#0a0a0a] border border-red-500/40 rounded-md text-sm text-white outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={confirmation !== currentOrg?.slug || deleteOrg.isPending}
                  onClick={() =>
                    deleteOrg.mutate(
                      { confirmation },
                      { onSuccess: () => navigate('/') },
                    )
                  }
                  className="px-4 py-2 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md font-medium border-none cursor-pointer disabled:opacity-50"
                >
                  Permanently delete
                </button>
                <button
                  type="button"
                  onClick={() => { setShowDelete(false); setConfirmation(''); }}
                  className="px-4 py-2 text-sm text-[#a0a0a0] hover:text-white bg-transparent border border-[#262626] rounded-md cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Section>
      )}
    </div>
  );
}

function BillingTab() {
  const { currentOrg } = useOrg();
  const canManage = usePermission('billing:manage');
  const plan = currentOrg?.plan ?? 'starter';
  const planName = plan.charAt(0).toUpperCase() + plan.slice(1);

  return (
    <div className="space-y-8">
      <Section title="Current plan">
        <div className="flex items-center justify-between p-4 bg-[#0a0a0a] border border-[#262626] rounded-md">
          <div>
            <div className="text-sm font-semibold text-white">{planName}</div>
            <div className="text-xs text-[#888] mt-0.5">
              {plan === 'starter' && 'Free · up to 3 projects'}
              {plan === 'pro' && '$29 / month · unlimited projects'}
              {plan === 'enterprise' && '$99 / month · advanced features'}
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30 font-medium uppercase">
            Active
          </span>
        </div>
        {canManage && plan === 'starter' && (
          <button
            type="button"
            onClick={() => (window.location.href = '/#pricing')}
            className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-md font-medium border-none cursor-pointer"
          >
            Upgrade plan
          </button>
        )}
      </Section>
    </div>
  );
}

const NOTIF_CATEGORIES = [
  { id: 'task_assigned', label: 'Task assigned to me' },
  { id: 'mentioned', label: 'Mentions in comments' },
  { id: 'status_changed', label: 'Status changes on my issues' },
  { id: 'sprint_event', label: 'Sprint events (start, complete)' },
  { id: 'member_joined', label: 'New members join' },
  { id: 'bug_reported', label: 'Bug reports' },
];

function NotificationsTab() {
  const { data: prefs = [] } = useNotifPrefs();
  const update = useUpdateNotifPrefs();
  const [draft, setDraft] = useState<NotifPrefs[] | null>(null);
  const current = draft ?? prefs;

  function getPref(category: string): NotifPrefs {
    return current.find((p) => p.category === category) ?? {
      category,
      email_enabled: true,
      in_app_enabled: true,
      quiet_hours_start: null,
      quiet_hours_end: null,
    };
  }

  function setPref(category: string, patch: Partial<NotifPrefs>) {
    const others = current.filter((p) => p.category !== category);
    setDraft([...others, { ...getPref(category), ...patch }]);
  }

  return (
    <div className="space-y-6">
      <Section title="Notification preferences">
        <div className="border border-[#1f1f1f] rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="text-xs text-[#888] uppercase tracking-wide border-b border-[#1f1f1f]">
                <th className="text-left font-medium px-4 py-3">Category</th>
                <th className="text-center font-medium px-4 py-3 w-24">In-app</th>
                <th className="text-center font-medium px-4 py-3 w-24">Email</th>
              </tr>
            </thead>
            <tbody>
              {NOTIF_CATEGORIES.map((cat) => {
                const p = getPref(cat.id);
                return (
                  <tr key={cat.id} className="border-b border-[#1a1a1a] last:border-b-0">
                    <td className="px-4 py-3 text-sm text-white">{cat.label}</td>
                    <td className="px-4 py-3 text-center">
                      <Toggle checked={p.in_app_enabled} onChange={(v) => setPref(cat.id, { in_app_enabled: v })} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Toggle checked={p.email_enabled} onChange={(v) => setPref(cat.id, { email_enabled: v })} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {draft && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                update.mutate(draft, { onSuccess: () => setDraft(null) });
              }}
              className="px-4 py-2 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-md font-medium border-none cursor-pointer"
            >
              Save preferences
            </button>
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="px-4 py-2 text-sm text-[#a0a0a0] hover:text-white bg-transparent border border-[#262626] rounded-md cursor-pointer"
            >
              Reset
            </button>
          </div>
        )}
      </Section>
    </div>
  );
}

function SecurityTab() {
  const { data: sessions = [] } = useSessions();
  const { data: logs = [] } = useAuditLogs(20);
  const revoke = useRevokeSession();

  return (
    <div className="space-y-8">
      <Section title="Active sessions">
        <div className="border border-[#1f1f1f] rounded-md divide-y divide-[#1a1a1a]">
          {sessions.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[#666]">No active sessions</div>
          )}
          {sessions.map((s) => (
            <div key={s.id} className="px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-sm text-white flex items-center gap-2">
                  {s.browser} · {s.device_type}
                  {s.is_current && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      THIS DEVICE
                    </span>
                  )}
                </div>
                <div className="text-xs text-[#888] mt-0.5">
                  {s.ip_address} {s.location && `· ${s.location}`} · last seen{' '}
                  {new Date(s.last_seen_at).toLocaleString()}
                </div>
              </div>
              {!s.is_current && (
                <button
                  type="button"
                  onClick={() => revoke.mutate(s.id)}
                  className="text-xs text-red-400 hover:text-red-300 bg-transparent border border-red-500/30 hover:bg-red-500/10 px-2 py-1 rounded cursor-pointer"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Audit log">
        <div className="border border-[#1f1f1f] rounded-md divide-y divide-[#1a1a1a] max-h-96 overflow-y-auto">
          {logs.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[#666]">No activity yet</div>
          )}
          {logs.map((log) => (
            <div key={log.id} className="px-4 py-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-white font-medium font-mono">{log.action}</span>
                <span className="text-[#666]">{new Date(log.created_at).toLocaleString()}</span>
              </div>
              <div className="text-[#888] mt-0.5">
                {log.target_type}
                {log.target_id && ` · ${log.target_id.slice(0, 8)}`}
                {log.ip_address && ` · ${log.ip_address}`}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <div
      className={`border ${danger ? 'border-red-500/30' : 'border-[#1f1f1f]'} rounded-lg p-6 bg-[#0d0d0d] space-y-4`}
    >
      <h3 className={`text-sm font-semibold ${danger ? 'text-red-400' : 'text-white'}`}>{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-[#a0a0a0] mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer border-none ${
        checked ? 'bg-violet-600' : 'bg-[#262626]'
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
      />
    </button>
  );
}
