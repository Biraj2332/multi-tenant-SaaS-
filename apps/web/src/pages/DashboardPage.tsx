import { useUser } from '@clerk/clerk-react';
import Navbar from '../components/layout/Navbar';
import { useOrg } from '../contexts/OrgContext';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';

const PlanBadge = ({ plan }: { plan: string }) => {
  const colors: Record<string, string> = {
    starter: 'bg-[#333] text-[#999]',
    pro: 'bg-violet-900/50 text-violet-300',
    enterprise: 'bg-amber-900/40 text-amber-300',
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors[plan] ?? colors.starter}`}>
      {plan.charAt(0).toUpperCase() + plan.slice(1)}
    </span>
  );
};

export default function DashboardPage() {
  const { user } = useUser();
  const { currentOrg, isLoading } = useOrg();

  return (
    <div className="min-h-screen bg-[#0d0d0d]">
      <Navbar />
      <main className="pt-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-white">
              {isLoading
                ? 'Loading...'
                : currentOrg
                  ? currentOrg.name
                  : `Welcome back${user?.firstName ? `, ${user.firstName}` : ''}`}
            </h1>
            {currentOrg && <PlanBadge plan={currentOrg.plan} />}
          </div>
          <p className="text-sm text-[#888] mb-10">
            {currentOrg
              ? `Schema: ${currentOrg.schemaName} · Role: ${currentOrg.role}`
              : 'No organization selected. Create one to get started.'}
          </p>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { label: 'Projects', icon: FolderOutlinedIcon },
              { label: 'Members', icon: PeopleOutlineOutlinedIcon },
              { label: 'Audit Logs', icon: HistoryOutlinedIcon },
            ].map(({ label, icon: Icon }) => (
              <div
                key={label}
                className="border border-[#1f1f1f] bg-[#111] rounded-xl p-6"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon sx={{ fontSize: 16, color: '#555' }} />
                  <p className="text-xs text-[#555] uppercase tracking-widest">{label}</p>
                </div>
                <p className="text-2xl font-bold text-white">—</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
