import { motion } from 'framer-motion';
import { Bug, BookOpen, Zap, Target, TrendingUp, AlertTriangle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';
import type { DailyMission, Issue, Learning, Improvement } from '@/lib/types';
import { calculateDailyScore, getDateStr, getLast7Days } from '@/lib/score';

interface Props {
  missions: DailyMission[];
  issues: Issue[];
  learnings: Learning[];
  improvements: Improvement[];
}

const stagger = {
  container: { transition: { staggerChildren: 0.02 } },
  item: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.2, 0, 0, 1] } },
  },
};

export function Dashboard({ missions, issues, learnings, improvements }: Props) {
  const today = getDateStr();
  const todayScore = calculateDailyScore({ missions, issues, learnings, improvements }, today);

  const last7 = getLast7Days().map(d => ({
    day: d.slice(5),
    ...calculateDailyScore({ missions, issues, learnings, improvements }, d),
  }));

  const severityCounts = { low: 0, medium: 0, high: 0, critical: 0 };
  issues.forEach(i => { severityCounts[i.severity]++; });
  const severityData = [
    { name: 'Low', value: severityCounts.low, color: 'hsl(240, 5%, 64.9%)' },
    { name: 'Med', value: severityCounts.medium, color: 'hsl(217, 91%, 60%)' },
    { name: 'High', value: severityCounts.high, color: 'hsl(38, 92%, 50%)' },
    { name: 'Crit', value: severityCounts.critical, color: 'hsl(0, 84.2%, 60.2%)' },
  ];

  // Pattern detection
  const rootCauses = issues
    .filter(i => i.rootCause)
    .reduce((acc, i) => {
      const k = i.rootCause.toLowerCase().trim();
      acc[k] = (acc[k] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  const topCauses = Object.entries(rootCauses)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const moduleCounts = issues
    .filter(i => i.affectedModules)
    .reduce((acc, i) => {
      i.affectedModules.split(',').map(m => m.trim().toLowerCase()).filter(Boolean).forEach(m => {
        acc[m] = (acc[m] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);
  const topModules = Object.entries(moduleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const unresolvedCount = issues.filter(i => !i.resolved).length;

  const stats = [
    { label: 'Tasks Done', value: todayScore.tasksCompleted, icon: Target, color: 'text-primary' },
    { label: 'Issues', value: issues.length, icon: Bug, color: 'text-warning' },
    { label: 'Learnings', value: learnings.length, icon: BookOpen, color: 'text-success' },
    { label: 'Improvements', value: improvements.length, icon: Zap, color: 'text-primary' },
  ];

  // Recent activity
  const allItems = [
    ...missions.map(m => ({ type: 'Mission', title: m.mainTask, time: m.updatedAt })),
    ...issues.map(i => ({ type: 'Issue', title: i.title, time: i.updatedAt })),
    ...learnings.map(l => ({ type: 'Learning', title: l.topic, time: l.updatedAt })),
    ...improvements.map(i => ({ type: 'Improvement', title: i.title, time: i.updatedAt })),
  ].sort((a, b) => b.time - a.time).slice(0, 8);

  return (
    <motion.div variants={stagger.container} initial="initial" animate="animate" className="space-y-6">
      {/* Header */}
      <motion.div variants={stagger.item}>
        <h2 className="text-lg font-semibold text-foreground tracking-tight">
          System Ready. {unresolvedCount > 0 ? `${unresolvedCount} Issue${unresolvedCount > 1 ? 's' : ''} Pending RCA.` : 'All Clear.'}
        </h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </motion.div>

      {/* Score + Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <motion.div variants={stagger.item} className="col-span-2 md:col-span-1 surface-card p-4 flex flex-col items-center justify-center">
          <span className="text-label mb-1">Today Score</span>
          <span className="text-3xl font-mono font-semibold text-primary">{todayScore.score}</span>
        </motion.div>
        {stats.map(s => (
          <motion.div key={s.label} variants={stagger.item} className="surface-card p-4">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className={`h-3.5 w-3.5 ${s.color}`} />
              <span className="text-label">{s.label}</span>
            </div>
            <span className="text-2xl font-mono font-semibold text-foreground">{s.value}</span>
          </motion.div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid md:grid-cols-2 gap-3">
        <motion.div variants={stagger.item} className="surface-card p-4">
          <h3 className="text-label mb-3">Weekly Activity</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={last7}>
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(240, 5%, 64.9%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(240, 5%, 64.9%)' }} axisLine={false} tickLine={false} width={24} />
                <Tooltip
                  contentStyle={{ background: 'hsl(240, 10%, 6%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 12 }}
                  labelStyle={{ color: 'hsl(0, 0%, 98%)' }}
                />
                <Bar dataKey="score" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={stagger.item} className="surface-card p-4">
          <h3 className="text-label mb-3">Issues by Severity</h3>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData}>
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(240, 5%, 64.9%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(240, 5%, 64.9%)' }} axisLine={false} tickLine={false} width={24} />
                <Tooltip
                  contentStyle={{ background: 'hsl(240, 10%, 6%)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 12 }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {severityData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Pattern Detection + Recent Activity */}
      <div className="grid md:grid-cols-2 gap-3">
        <motion.div variants={stagger.item} className="surface-card p-4 space-y-4">
          <h3 className="text-label flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" />
            Pattern Detection
          </h3>
          {topCauses.length > 0 ? (
            <div>
              <h4 className="text-xs text-muted-foreground mb-2">Top Root Causes</h4>
              {topCauses.map(([cause, count]) => (
                <div key={cause} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-foreground truncate mr-2">{cause}</span>
                  <span className="text-xs font-mono text-muted-foreground shrink-0">{count}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Add root causes to issues to detect patterns.</p>
          )}
          {topModules.length > 0 && (
            <div>
              <h4 className="text-xs text-muted-foreground mb-2">Most Affected Modules</h4>
              {topModules.map(([mod, count]) => (
                <div key={mod} className="flex items-center justify-between py-1.5">
                  <span className="text-sm text-foreground font-mono truncate mr-2">{mod}</span>
                  <span className="text-xs font-mono text-muted-foreground shrink-0">{count}x</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div variants={stagger.item} className="surface-card p-4">
          <h3 className="text-label flex items-center gap-2 mb-3">
            <TrendingUp className="h-3.5 w-3.5" />
            Recent Activity
          </h3>
          {allItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity yet. Press <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">⌘K</kbd> to get started.</p>
          ) : (
            <div className="space-y-0.5">
              {allItems.map((item, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5">
                  <span className="text-[10px] font-mono text-muted-foreground w-16 shrink-0">
                    {new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-xs text-muted-foreground w-16 shrink-0">{item.type}</span>
                  <span className="text-sm text-foreground truncate">{item.title || 'Untitled'}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
