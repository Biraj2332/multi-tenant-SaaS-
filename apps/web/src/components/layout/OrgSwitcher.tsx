import { useState, useRef, useEffect } from 'react';
import UnfoldMoreOutlinedIcon from '@mui/icons-material/UnfoldMoreOutlined';
import CheckOutlinedIcon from '@mui/icons-material/CheckOutlined';
import AddOutlinedIcon from '@mui/icons-material/AddOutlined';
import { useOrg, OrgInfo } from '../../contexts/OrgContext';
import { useNavigate } from 'react-router-dom';

const planBadge: Record<string, { label: string; className: string }> = {
  starter: { label: 'Starter', className: 'bg-[#333] text-[#999]' },
  pro: { label: 'Pro', className: 'bg-violet-900/50 text-violet-300' },
  enterprise: { label: 'Enterprise', className: 'bg-amber-900/40 text-amber-300' },
};

function OrgInitials({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <div className="w-8 h-8 rounded-lg bg-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
      {initials}
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const badge = planBadge[plan] ?? planBadge.starter;
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${badge.className}`}>
      {badge.label}
    </span>
  );
}

export default function OrgSwitcher() {
  const { currentOrg, orgs, switchOrg, isLoading } = useOrg();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (isLoading || !currentOrg) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111] border border-[#1f1f1f] animate-pulse">
        <div className="w-8 h-8 rounded-lg bg-[#222]" />
        <div className="w-24 h-4 rounded bg-[#222]" />
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#111] border border-[#1f1f1f] hover:border-[#333] transition-colors cursor-pointer w-full"
      >
        <OrgInitials name={currentOrg.name} />
        <div className="flex flex-col items-start min-w-0">
          <span className="text-sm font-medium text-white truncate max-w-[140px]">
            {currentOrg.name}
          </span>
          <span className="text-[10px] text-[#666] capitalize">{currentOrg.role}</span>
        </div>
        <UnfoldMoreOutlinedIcon sx={{ fontSize: 16, color: '#666', marginLeft: 'auto' }} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-[#141414] border border-[#1f1f1f] rounded-xl shadow-2xl z-[100] overflow-hidden">
          <div className="px-3 py-2 border-b border-[#1f1f1f]">
            <p className="text-[10px] uppercase tracking-widest text-[#555] font-semibold">
              Organizations
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {orgs.map((org) => (
              <OrgRow
                key={org.tenantId}
                org={org}
                isActive={org.tenantId === currentOrg.tenantId}
                onSelect={() => {
                  switchOrg(org.tenantId);
                  setOpen(false);
                }}
              />
            ))}
          </div>
          <div className="border-t border-[#1f1f1f]">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                navigate('/onboarding');
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-[#888] hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer bg-transparent border-none"
            >
              <AddOutlinedIcon sx={{ fontSize: 16 }} />
              Create new organization
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function OrgRow({
  org,
  isActive,
  onSelect,
}: {
  org: OrgInfo;
  isActive: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex items-center gap-2 w-full px-3 py-2.5 text-left transition-colors cursor-pointer bg-transparent border-none ${
        isActive ? 'bg-[#1a1a1a]' : 'hover:bg-[#1a1a1a]'
      }`}
    >
      <OrgInitials name={org.name} />
      <div className="flex flex-col min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-white truncate">{org.name}</span>
          <PlanBadge plan={org.plan} />
        </div>
        <span className="text-[10px] text-[#555] capitalize">{org.role}</span>
      </div>
      {isActive && <CheckOutlinedIcon sx={{ fontSize: 16, color: '#7c3aed' }} />}
    </button>
  );
}
