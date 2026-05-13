import type { ReactNode } from 'react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { UserButton, SignedIn } from '@clerk/clerk-react';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import ListAltOutlinedIcon from '@mui/icons-material/ListAltOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import InsightsOutlinedIcon from '@mui/icons-material/InsightsOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import OrgSwitcher from './OrgSwitcher';
import NotificationsPanel from '../notifications/NotificationsPanel';
import { useUnreadCount } from '../../hooks/useApi';

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', Icon: DashboardOutlinedIcon },
  { to: '/projects', label: 'Projects', Icon: FolderOutlinedIcon },
  { to: '/backlog', label: 'Backlog', Icon: ListAltOutlinedIcon },
  { to: '/bugs', label: 'Bug Tracker', Icon: BugReportOutlinedIcon },
  { to: '/team', label: 'Team', Icon: PeopleOutlineOutlinedIcon },
  { to: '/analytics', label: 'Analytics', Icon: InsightsOutlinedIcon },
  { to: '/settings/general', label: 'Settings', Icon: SettingsOutlinedIcon },
];

interface AppShellProps {
  children: ReactNode;
  title?: string;
}

export default function AppShell({ children, title }: AppShellProps) {
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();
  const { data: unread = 0 } = useUnreadCount();

  return (
    <div className="min-h-screen flex bg-[#0a0a0a] text-white">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-[#1f1f1f] bg-[#0d0d0d] flex flex-col">
        <div className="h-14 flex items-center px-5 border-b border-[#1f1f1f]">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-white font-bold text-base tracking-tight cursor-pointer bg-transparent border-none"
          >
            TenantOps
          </button>
        </div>
        <div className="px-3 py-3 border-b border-[#1f1f1f]">
          <OrgSwitcher />
        </div>
        <nav className="flex-1 px-2 py-3 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors mb-0.5 ${
                  isActive
                    ? 'bg-[#1a1a1a] text-white'
                    : 'text-[#a0a0a0] hover:bg-[#151515] hover:text-white'
                }`
              }
            >
              <Icon sx={{ fontSize: 18 }} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-3 border-t border-[#1f1f1f]">
          <SignedIn>
            <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: 'w-8 h-8' } }} />
          </SignedIn>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-[#1f1f1f] flex items-center justify-between px-6 bg-[#0d0d0d]">
          <h1 className="text-sm font-medium text-white">{title ?? ''}</h1>
          <div className="flex items-center gap-3 relative">
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative text-[#a0a0a0] hover:text-white transition-colors bg-transparent border-none cursor-pointer p-1.5 rounded-md hover:bg-[#1a1a1a]"
              aria-label="Notifications"
            >
              <NotificationsNoneOutlinedIcon sx={{ fontSize: 20 }} />
              {unread > 0 && (
                <span className="absolute top-0 right-0 min-w-[16px] h-4 px-1 rounded-full bg-violet-600 text-[10px] font-semibold text-white flex items-center justify-center">
                  {unread > 99 ? '99+' : unread}
                </span>
              )}
            </button>
            {notifOpen && (
              <NotificationsPanel onClose={() => setNotifOpen(false)} />
            )}
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
