import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AssignmentIndOutlinedIcon from '@mui/icons-material/AssignmentIndOutlined';
import SwapHorizOutlinedIcon from '@mui/icons-material/SwapHorizOutlined';
import AlternateEmailOutlinedIcon from '@mui/icons-material/AlternateEmailOutlined';
import EventOutlinedIcon from '@mui/icons-material/EventOutlined';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import DoneAllOutlinedIcon from '@mui/icons-material/DoneAllOutlined';
import { useNotifications, useMarkRead, useMarkAllRead, type Notification } from '../../hooks/useApi';

const ICON_MAP: Record<Notification['type'], React.ComponentType<{ sx?: object }>> = {
  task_assigned: AssignmentIndOutlinedIcon,
  status_changed: SwapHorizOutlinedIcon,
  mentioned: AlternateEmailOutlinedIcon,
  sprint_event: EventOutlinedIcon,
  member_joined: PersonAddOutlinedIcon,
  bug_reported: BugReportOutlinedIcon,
};

const ICON_COLOR: Record<Notification['type'], string> = {
  task_assigned: 'text-violet-400',
  status_changed: 'text-blue-400',
  mentioned: 'text-yellow-400',
  sprint_event: 'text-teal-400',
  member_joined: 'text-emerald-400',
  bug_reported: 'text-red-400',
};

interface NotificationsPanelProps {
  onClose: () => void;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function NotificationsPanel({ onClose }: NotificationsPanelProps) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const { data: notifications = [], isLoading } = useNotifications();
  const markRead = useMarkRead();
  const markAllRead = useMarkAllRead();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  function handleClick(n: Notification) {
    if (!n.read_at) markRead.mutate([n.id]);
    if (n.resource_type === 'task') {
      navigate(`/projects?task=${n.resource_id}`);
    } else if (n.resource_type === 'project') {
      navigate(`/projects/${n.resource_id}/board`);
    }
    onClose();
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div
      ref={ref}
      className="absolute right-0 top-12 w-96 max-h-[70vh] bg-[#0f0f0f] border border-[#262626] rounded-lg shadow-2xl flex flex-col z-50"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1f1f1f]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Notifications</h3>
          {unreadCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-violet-600 text-white font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllRead.mutate()}
            className="text-xs text-[#888] hover:text-white transition-colors flex items-center gap-1 bg-transparent border-none cursor-pointer"
          >
            <DoneAllOutlinedIcon sx={{ fontSize: 14 }} />
            Mark all read
          </button>
        )}
      </div>

      <div className="overflow-y-auto flex-1">
        {isLoading && (
          <div className="px-4 py-8 text-center text-sm text-[#666]">Loading...</div>
        )}
        {!isLoading && notifications.length === 0 && (
          <div className="px-4 py-12 text-center text-sm text-[#666]">No notifications yet</div>
        )}
        {notifications.map((n) => {
          const Icon = ICON_MAP[n.type] ?? AlternateEmailOutlinedIcon;
          const color = ICON_COLOR[n.type] ?? 'text-[#888]';
          return (
            <button
              key={n.id}
              type="button"
              onClick={() => handleClick(n)}
              className={`w-full text-left px-4 py-3 border-b border-[#1a1a1a] hover:bg-[#161616] transition-colors flex gap-3 cursor-pointer bg-transparent ${
                !n.read_at ? 'bg-[#13131a]' : ''
              }`}
            >
              <div className={`shrink-0 mt-0.5 ${color}`}>
                <Icon sx={{ fontSize: 18 }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white font-medium truncate">{n.title}</div>
                <div className="text-xs text-[#888] mt-0.5 line-clamp-2">{n.body}</div>
                <div className="text-[10px] text-[#555] mt-1">{timeAgo(n.created_at)}</div>
              </div>
              {!n.read_at && (
                <div className="shrink-0 w-2 h-2 rounded-full bg-violet-500 mt-2" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
