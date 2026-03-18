import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { DB } from '@/lib/storage';
import { getDateStr } from '@/lib/score';
import type { DailyMission, TaskStatus } from '@/lib/types';
import { toast } from 'sonner';

interface Props {
  missions: DailyMission[];
  onRefresh: () => void;
}

const statusColors: Record<TaskStatus, string> = {
  'completed': 'bg-success/20 text-success',
  'in-progress': 'bg-primary/20 text-primary',
  'blocked': 'bg-destructive/20 text-destructive',
};

const statusLabels: Record<TaskStatus, string> = {
  'completed': 'Done',
  'in-progress': 'Active',
  'blocked': 'Blocked',
};

function StatusBadge({ status, onChange }: { status: TaskStatus; onChange: (s: TaskStatus) => void }) {
  const cycle: TaskStatus[] = ['in-progress', 'completed', 'blocked'];
  const next = () => {
    const idx = cycle.indexOf(status);
    onChange(cycle[(idx + 1) % cycle.length]);
  };
  return (
    <button onClick={next} className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusColors[status]} transition-colors`}>
      {statusLabels[status]}
    </button>
  );
}

export function DailyMissions({ missions, onRefresh }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const today = getDateStr();

  const todayMission = missions.find(m => m.date === today);

  const createMission = async () => {
    await DB.missions.save({
      date: today,
      mainTask: '',
      secondaryTask: '',
      quickWin: '',
      mainTaskStatus: 'in-progress',
      secondaryTaskStatus: 'in-progress',
      quickWinStatus: 'in-progress',
      notes: '',
    });
    toast.success('Mission created');
    onRefresh();
    setCreating(false);
  };

  const update = async (id: string, data: Partial<DailyMission>) => {
    const existing = await DB.missions.get(id);
    if (existing) {
      await DB.missions.save({ ...existing, ...data });
      onRefresh();
    }
  };

  const deleteMission = async (id: string) => {
    if (!confirm('Delete this mission?')) return;
    await DB.missions.delete(id);
    toast.success('Mission deleted');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Daily Missions</h2>
        {!todayMission && (
          <button
            onClick={createMission}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Mission
          </button>
        )}
      </div>

      {missions.length === 0 && (
        <div className="surface-card p-8 text-center">
          <p className="text-sm text-muted-foreground mb-3">No missions yet.</p>
          <button
            onClick={createMission}
            className="text-sm text-primary hover:underline"
          >
            Create today's mission →
          </button>
        </div>
      )}

      {missions.map((m, i) => {
        const isExpanded = expanded === m.id;
        const isToday = m.date === today;
        return (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className={`surface-card overflow-hidden ${isToday ? 'ring-1 ring-primary/20' : ''}`}
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isToday && <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">TODAY</span>}
                  <span className="text-xs font-mono text-muted-foreground">{m.date}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setExpanded(isExpanded ? null : m.id)} className="text-muted-foreground hover:text-foreground p-1">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <button onClick={() => deleteMission(m.id)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-2">
                {[
                  { label: 'Main', value: m.mainTask, status: m.mainTaskStatus, field: 'mainTask', statusField: 'mainTaskStatus' },
                  { label: 'Secondary', value: m.secondaryTask, status: m.secondaryTaskStatus, field: 'secondaryTask', statusField: 'secondaryTaskStatus' },
                  { label: 'Quick Win', value: m.quickWin, status: m.quickWinStatus, field: 'quickWin', statusField: 'quickWinStatus' },
                ].map(task => (
                  <div key={task.label} className="flex items-center gap-3">
                    <span className="text-label w-16 shrink-0">{task.label}</span>
                    <input
                      value={task.value}
                      onChange={e => update(m.id, { [task.field]: e.target.value })}
                      placeholder={`${task.label} task...`}
                      className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none"
                    />
                    <StatusBadge
                      status={task.status}
                      onChange={s => update(m.id, { [task.statusField]: s })}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Expanded Notes */}
            {isExpanded && (
              <div className="px-4 pb-4 border-t border-border pt-3">
                <label className="text-label block mb-1">Notes</label>
                <textarea
                  value={m.notes}
                  onChange={e => update(m.id, { notes: e.target.value })}
                  placeholder="Add notes..."
                  rows={3}
                  className="w-full bg-surface text-sm text-foreground placeholder:text-muted-foreground/50 outline-none rounded-md p-2 resize-none"
                />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
