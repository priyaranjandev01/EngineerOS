import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, ChevronDown, ChevronUp, History, Maximize2 } from 'lucide-react';
import { DB } from '@/lib/storage';
import { getDateStr } from '@/lib/score';
import type { DailyMission, TaskStatus } from '@/lib/types';
import { NotepadModal } from './NotepadModal';
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
    <button onClick={next} className={`px-2 py-0.5 rounded text-[11px] font-medium ${statusColors[status]} transition-colors shrink-0`}>
      {statusLabels[status]}
    </button>
  );
}

function NotepadModal({ notes, onChange, onClose, readOnly }: { notes: string; onChange: (v: string) => void; onClose: () => void; readOnly: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl mx-4 bg-card border border-border rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium text-foreground">Mission Notes</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
        <textarea
          value={notes}
          onChange={e => onChange(e.target.value)}
          placeholder="Write your notes here..."
          readOnly={readOnly}
          autoFocus
          className="w-full h-80 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 p-4 outline-none resize-none font-mono leading-relaxed"
        />
      </div>
    </div>
  );
}

function MissionCard({ m, today, expanded, onToggleExpand, onUpdate, onDelete, index }: {
  m: DailyMission;
  today: string;
  expanded: boolean;
  onToggleExpand: () => void;
  onUpdate: (id: string, data: Partial<DailyMission>) => void;
  onDelete: (id: string) => void;
  index: number;
}) {
  const isToday = m.date === today;
  const [notepadOpen, setNotepadOpen] = useState(false);

  return (
    <>
      <motion.div
        key={m.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.02 }}
        className={`surface-card overflow-hidden ${isToday ? 'ring-1 ring-primary/20' : ''}`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isToday && <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">TODAY</span>}
              <span className="text-xs font-mono text-muted-foreground">{m.date}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onToggleExpand} className="text-muted-foreground hover:text-foreground p-1">
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              <button onClick={() => onDelete(m.id)} className="text-muted-foreground hover:text-destructive p-1">
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
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium w-20 shrink-0 text-right">{task.label}</span>
                <input
                  value={task.value}
                  onChange={e => onUpdate(m.id, { [task.field]: e.target.value })}
                  placeholder={`${task.label} task...`}
                  className="flex-1 min-w-0 bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md px-2.5 py-1.5 border border-border/50 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors"
                  readOnly={!isToday}
                />
                <StatusBadge
                  status={task.status}
                  onChange={s => onUpdate(m.id, { [task.statusField]: s })}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Expanded Notes */}
        {expanded && (
          <div className="px-4 pb-4 border-t border-border pt-3">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Notes</label>
              <button
                onClick={() => setNotepadOpen(true)}
                className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors"
              >
                <Maximize2 className="h-3 w-3" />
                Notepad
              </button>
            </div>
            <textarea
              value={m.notes}
              onChange={e => onUpdate(m.id, { notes: e.target.value })}
              placeholder="Add notes..."
              rows={3}
              className="w-full bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md p-2.5 border border-border/50 outline-none focus:border-primary/40 focus:ring-1 focus:ring-primary/20 transition-colors resize-none"
              readOnly={!isToday}
            />
          </div>
        )}
      </motion.div>

      {notepadOpen && (
        <NotepadModal
          notes={m.notes}
          onChange={v => onUpdate(m.id, { notes: v })}
          onClose={() => setNotepadOpen(false)}
          readOnly={!isToday}
        />
      )}
    </>
  );
}

export function DailyMissions({ missions, onRefresh }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const today = getDateStr();

  const todayMission = missions.find(m => m.date === today);
  const pastMissions = missions.filter(m => m.date !== today);

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
    <div className="space-y-6">
      {/* Today's Mission */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Today's Mission</h2>
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

        {!todayMission && (
          <div className="surface-card p-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">No mission for today yet.</p>
            <button
              onClick={createMission}
              className="text-sm text-primary hover:underline"
            >
              Create today's mission →
            </button>
          </div>
        )}

        {todayMission && (
          <MissionCard
            m={todayMission}
            today={today}
            expanded={expanded === todayMission.id}
            onToggleExpand={() => setExpanded(expanded === todayMission.id ? null : todayMission.id)}
            onUpdate={update}
            onDelete={deleteMission}
            index={0}
          />
        )}
      </div>

      {/* History */}
      {pastMissions.length > 0 && (
        <div className="space-y-4">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <History className="h-4 w-4" />
            <span className="font-medium">Mission History</span>
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{pastMissions.length}</span>
            {showHistory ? <ChevronUp className="h-3.5 w-3.5 ml-1" /> : <ChevronDown className="h-3.5 w-3.5 ml-1" />}
          </button>

          {showHistory && (
            <div className="space-y-3">
              {pastMissions.map((m, i) => (
                <MissionCard
                  key={m.id}
                  m={m}
                  today={today}
                  expanded={expanded === m.id}
                  onToggleExpand={() => setExpanded(expanded === m.id ? null : m.id)}
                  onUpdate={update}
                  onDelete={deleteMission}
                  index={i}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
