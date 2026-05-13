import { useState, useEffect, useRef, useCallback } from 'react';
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import {
  useTask, useUpdateTask, useComments, useCreateComment, useActivity,
} from '../../hooks/useProjectApi';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../types/project.types';
import type { Comment, ActivityLog } from '../../types/project.types';

interface Props {
  taskId: string;
  onClose: () => void;
}

export default function IssueDetailDrawer({ taskId, onClose }: Props) {
  const { data: task, isLoading } = useTask(taskId);
  const updateTask = useUpdateTask();
  const { data: comments } = useComments(taskId);
  const createComment = useCreateComment();
  const { data: activity } = useActivity(taskId);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'activity'>('comments');
  const titleRef = useRef<HTMLInputElement>(null);
  const commentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (task) setTitleDraft(task.title);
  }, [task]);

  useEffect(() => {
    if (editingTitle) titleRef.current?.focus();
  }, [editingTitle]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmitComment();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const handleTitleBlur = useCallback(() => {
    setEditingTitle(false);
    if (task && titleDraft.trim() && titleDraft !== task.title) {
      updateTask.mutate({ id: task.id, title: titleDraft.trim() });
    }
  }, [task, titleDraft, updateTask]);

  const handleSubmitComment = useCallback(() => {
    if (!commentText.trim() || !taskId) return;
    createComment.mutate({ taskId, body: commentText.trim() });
    setCommentText('');
  }, [commentText, taskId, createComment]);

  if (isLoading || !task) {
    return (
      <DrawerShell onClose={onClose}>
        <div className="animate-pulse space-y-4 p-6">
          <div className="h-6 bg-[#1f1f1f] rounded w-3/4" />
          <div className="h-4 bg-[#1f1f1f] rounded w-1/2" />
          <div className="h-20 bg-[#1f1f1f] rounded" />
        </div>
      </DrawerShell>
    );
  }

  return (
    <DrawerShell onClose={onClose}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#1f1f1f] flex items-center justify-between shrink-0">
          <span className="text-[10px] text-[#444] font-mono">{task.id.slice(0, 8).toUpperCase()}</span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-[#222] bg-transparent border-none cursor-pointer text-[#666] hover:text-white transition-colors"
          >
            <CloseOutlinedIcon sx={{ fontSize: 18 }} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-5 space-y-5">
            {/* Title — inline editable */}
            {editingTitle ? (
              <input
                ref={titleRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={handleTitleBlur}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleBlur()}
                className="w-full text-lg font-semibold text-white bg-transparent border-none outline-none focus:ring-0"
              />
            ) : (
              <h2
                onClick={() => setEditingTitle(true)}
                className="text-lg font-semibold text-white cursor-text hover:bg-[#1a1a1a] rounded px-1 -mx-1 py-0.5 transition-colors"
              >
                {task.title}
              </h2>
            )}

            {/* Description */}
            <div>
              <label className="block text-[10px] text-[#555] uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                defaultValue={task.description ?? ''}
                onBlur={(e) => {
                  const val = e.target.value;
                  if (val !== (task.description ?? '')) {
                    updateTask.mutate({ id: task.id, description: val || undefined });
                  }
                }}
                rows={3}
                placeholder="Add a description..."
                className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-violet-600 transition-colors resize-none"
              />
            </div>

            {/* Fields grid */}
            <div className="grid grid-cols-2 gap-4">
              {/* Status */}
              <Field label="Status">
                <select
                  value={task.status}
                  onChange={(e) => updateTask.mutate({ id: task.id, status: e.target.value })}
                  className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-violet-600 cursor-pointer appearance-none"
                >
                  {TASK_STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </Field>

              {/* Priority */}
              <Field label="Priority">
                <select
                  value={task.priority}
                  onChange={(e) => updateTask.mutate({ id: task.id, priority: e.target.value })}
                  className="w-full bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-violet-600 cursor-pointer appearance-none"
                >
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p.key} value={p.key}>{p.label}</option>
                  ))}
                </select>
              </Field>

              {/* Assignee */}
              <Field label="Assignee">
                <div className="flex items-center gap-2 bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg px-2 py-1.5">
                  <PersonOutlineOutlinedIcon sx={{ fontSize: 14, color: '#555' }} />
                  <input
                    defaultValue={task.assignee_id ?? ''}
                    placeholder="User ID..."
                    onBlur={(e) => {
                      const val = e.target.value.trim() || null;
                      if (val !== task.assignee_id) {
                        updateTask.mutate({ id: task.id, assigneeId: val });
                      }
                    }}
                    className="flex-1 bg-transparent text-sm text-white placeholder-[#444] border-none outline-none"
                  />
                </div>
              </Field>

              {/* Due date */}
              <Field label="Due date">
                <div className="flex items-center gap-2 bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg px-2 py-1.5">
                  <CalendarTodayOutlinedIcon sx={{ fontSize: 14, color: '#555' }} />
                  <input
                    type="date"
                    defaultValue={task.due_date?.slice(0, 10) ?? ''}
                    onChange={(e) => {
                      updateTask.mutate({ id: task.id, dueDate: e.target.value || null });
                    }}
                    className="flex-1 bg-transparent text-sm text-white border-none outline-none [color-scheme:dark]"
                  />
                </div>
              </Field>
            </div>

            {/* Labels */}
            <div>
              <label className="block text-[10px] text-[#555] uppercase tracking-wider mb-1.5">Labels</label>
              <LabelEditor
                labels={task.labels}
                onChange={(labels) => updateTask.mutate({ id: task.id, labels })}
              />
            </div>
          </div>

          {/* Tabs: Comments / Activity */}
          <div className="border-t border-[#1f1f1f]">
            <div className="flex px-6 gap-4 border-b border-[#1f1f1f]">
              <TabButton active={activeTab === 'comments'} onClick={() => setActiveTab('comments')}>
                Comments ({comments?.length ?? 0})
              </TabButton>
              <TabButton active={activeTab === 'activity'} onClick={() => setActiveTab('activity')}>
                Activity ({activity?.length ?? 0})
              </TabButton>
            </div>

            <div className="px-6 py-4">
              {activeTab === 'comments' ? (
                <div className="space-y-3">
                  {comments?.map((c) => <CommentItem key={c.id} comment={c} />)}
                  {(!comments || comments.length === 0) && (
                    <p className="text-xs text-[#555]">No comments yet.</p>
                  )}

                  {/* New comment */}
                  <div className="flex gap-2 mt-4">
                    <textarea
                      ref={commentRef}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Write a comment... (Cmd+Enter to send)"
                      rows={2}
                      className="flex-1 bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg px-3 py-2 text-sm text-white placeholder-[#444] focus:outline-none focus:border-violet-600 transition-colors resize-none"
                    />
                    <button
                      type="button"
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || createComment.isPending}
                      className="self-end p-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 rounded-lg cursor-pointer border-none text-white transition-colors"
                    >
                      <SendOutlinedIcon sx={{ fontSize: 16 }} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {activity?.map((a) => <ActivityItem key={a.id} log={a} />)}
                  {(!activity || activity.length === 0) && (
                    <p className="text-xs text-[#555]">No activity yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DrawerShell>
  );
}

function DrawerShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-[100]"
        onClick={onClose}
      />
      {/* Drawer panel */}
      <div className="fixed top-0 right-0 bottom-0 w-full max-w-lg bg-[#0d0d0d] border-l border-[#1f1f1f] z-[101] shadow-2xl animate-slide-in">
        {children}
      </div>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] text-[#555] uppercase tracking-wider mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`py-2.5 text-xs font-medium border-b-2 cursor-pointer bg-transparent transition-colors ${
        active
          ? 'border-violet-500 text-white'
          : 'border-transparent text-[#666] hover:text-white'
      }`}
    >
      {children}
    </button>
  );
}

function LabelEditor({ labels, onChange }: { labels: string[]; onChange: (l: string[]) => void }) {
  const [input, setInput] = useState('');

  const handleAdd = () => {
    const val = input.trim();
    if (val && !labels.includes(val)) {
      onChange([...labels, val]);
    }
    setInput('');
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {labels.map((l) => (
        <span key={l} className="flex items-center gap-1 text-xs bg-[#1f1f1f] text-[#999] px-2 py-0.5 rounded">
          {l}
          <button
            type="button"
            onClick={() => onChange(labels.filter((x) => x !== l))}
            className="text-[#555] hover:text-white bg-transparent border-none cursor-pointer text-[10px]"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
        placeholder="Add label..."
        className="text-xs bg-transparent text-white placeholder-[#444] border-none outline-none w-20"
      />
    </div>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-2">
      <div className="w-6 h-6 rounded-full bg-[#333] text-[#999] text-[9px] font-bold flex items-center justify-center shrink-0 mt-0.5">
        {comment.author_id.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-xs font-medium text-[#999]">{comment.author_id.slice(0, 8)}</span>
          <span className="text-[10px] text-[#444]">{timeAgo(comment.created_at)}</span>
        </div>
        <p className="text-sm text-[#ccc] leading-relaxed">{comment.body}</p>
      </div>
    </div>
  );
}

function ActivityItem({ log }: { log: ActivityLog }) {
  const actionLabels: Record<string, string> = {
    TASK_CREATED: 'created this task',
    TASK_UPDATED: 'updated this task',
    TASK_STATUS_CHANGED: `moved to ${(log.metadata?.to as string) ?? '?'}`,
    TASK_ASSIGNED: 'changed assignee',
    TASK_DELETED: 'deleted this task',
    COMMENT_CREATED: 'added a comment',
  };

  return (
    <div className="flex items-start gap-2 py-1">
      <div className="w-1.5 h-1.5 rounded-full bg-[#333] mt-1.5 shrink-0" />
      <p className="text-xs text-[#666]">
        <span className="text-[#999]">{log.actor_id?.slice(0, 8) ?? 'System'}</span>
        {' '}
        {actionLabels[log.action] ?? log.action}
        <span className="text-[#444] ml-2">{timeAgo(log.created_at)}</span>
      </p>
    </div>
  );
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
