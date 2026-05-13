import {
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import TaskAltOutlinedIcon from '@mui/icons-material/TaskAltOutlined';
import PeopleOutlineOutlinedIcon from '@mui/icons-material/PeopleOutlineOutlined';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';
import SpeedOutlinedIcon from '@mui/icons-material/SpeedOutlined';
import TrendingUpOutlinedIcon from '@mui/icons-material/TrendingUpOutlined';
import TrendingDownOutlinedIcon from '@mui/icons-material/TrendingDownOutlined';
import TrendingFlatOutlinedIcon from '@mui/icons-material/TrendingFlatOutlined';
import AppShell from '../components/layout/AppShell';
import {
  useMetricSummary,
  useTasksPerDay,
  useIssueDistribution,
  useTeamWorkload,
  useBugSeverityTrend,
} from '../hooks/useApi';

const STATUS_COLORS: Record<string, string> = {
  todo: '#6b7280',
  in_progress: '#3b82f6',
  in_review: '#a855f7',
  done: '#10b981',
  cancelled: '#4b5563',
};

const TOOLTIP_STYLE = {
  background: '#0f0f0f',
  border: '1px solid #262626',
  borderRadius: 6,
  color: '#fff',
  fontSize: 12,
};

export default function AnalyticsPage() {
  const { data: summary } = useMetricSummary(7);
  const { data: tasksPerDay = [] } = useTasksPerDay(30);
  const { data: distribution = [] } = useIssueDistribution();
  const { data: workload = [] } = useTeamWorkload();
  const { data: severityTrend = [] } = useBugSeverityTrend(30);

  return (
    <AppShell title="Analytics">
      <div className="max-w-7xl mx-auto px-8 py-6 space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Tasks completed"
            value={summary?.tasksCompleted ?? 0}
            sub="last 7 days"
            Icon={TaskAltOutlinedIcon}
            color="text-emerald-400"
          />
          <MetricCard
            label="Active members"
            value={summary?.activeMembers ?? 0}
            sub="last 7 days"
            Icon={PeopleOutlineOutlinedIcon}
            color="text-blue-400"
          />
          <MetricCard
            label="Open critical bugs"
            value={summary?.openCriticalBugs ?? 0}
            sub="all time"
            Icon={BugReportOutlinedIcon}
            color="text-red-400"
          />
          <MetricCard
            label="Sprint velocity"
            value={summary?.sprintVelocity ?? 0}
            sub="avg pts / sprint"
            Icon={SpeedOutlinedIcon}
            color="text-violet-400"
            trend={summary?.velocityTrend}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Tasks per day */}
          <ChartCard title="Tasks completed per day" subtitle="Last 30 days">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={tasksPerDay}>
                <defs>
                  <linearGradient id="tasksFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 10 }} />
                <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="url(#tasksFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Distribution Pie */}
          <ChartCard title="Issue distribution" subtitle="By status">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={distribution}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={2}
                >
                  {distribution.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#666'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#a0a0a0' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Team Workload */}
          <ChartCard title="Team workload" subtitle="Open issues per assignee">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={workload} layout="vertical">
                <XAxis type="number" stroke="#555" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" stroke="#555" tick={{ fontSize: 10 }} width={100} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Bug Severity Trend */}
          <ChartCard title="Bug severity trend" subtitle="Last 30 days">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={severityTrend}>
                <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 10 }} />
                <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#a0a0a0' }} />
                <Area type="monotone" dataKey="critical" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.5} />
                <Area type="monotone" dataKey="high" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.5} />
                <Area type="monotone" dataKey="medium" stackId="1" stroke="#eab308" fill="#eab308" fillOpacity={0.5} />
                <Area type="monotone" dataKey="low" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      </div>
    </AppShell>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  sub: string;
  Icon: React.ComponentType<{ sx?: object }>;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}

function MetricCard({ label, value, sub, Icon, color, trend }: MetricCardProps) {
  const TrendIcon =
    trend === 'up' ? TrendingUpOutlinedIcon : trend === 'down' ? TrendingDownOutlinedIcon : TrendingFlatOutlinedIcon;
  const trendColor =
    trend === 'up' ? 'text-emerald-400' : trend === 'down' ? 'text-red-400' : 'text-[#666]';
  return (
    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={color}>
          <Icon sx={{ fontSize: 22 }} />
        </div>
        {trend && (
          <span className={trendColor}>
            <TrendIcon sx={{ fontSize: 16 }} />
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold text-white">{value.toLocaleString()}</div>
      <div className="text-xs text-[#a0a0a0] mt-1">{label}</div>
      <div className="text-[10px] text-[#666] mt-0.5">{sub}</div>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#0d0d0d] border border-[#1f1f1f] rounded-lg p-5">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-[#666] mt-0.5">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
