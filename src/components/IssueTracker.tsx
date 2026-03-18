import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { DB } from '@/lib/storage';
import type { Issue, Severity } from '@/lib/types';
import { toast } from 'sonner';

interface Props {
  issues: Issue[];
  onRefresh: () => void;
}

const severityDot: Record<Severity, string> = {
  low: 'bg-muted-foreground',
  medium: 'bg-primary',
  high: 'bg-warning',
  critical: 'bg-destructive',
};

const severityLabel: Record<Severity, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export function IssueTracker({ issues, onRefresh }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [severityFilter, setSeverityFilter] = useState<Severity | 'all'>('all');

  const filtered = issues.filter(i => {
    if (filter === 'open' && i.resolved) return false;
    if (filter === 'resolved' && !i.resolved) return false;
    if (severityFilter !== 'all' && i.severity !== severityFilter) return false;
    return true;
  });

  const createIssue = async () => {
    await DB.issues.save({
      title: '', description: '', rootCause: '', fixApplied: '',
      affectedModules: '', prevention: '', severity: 'medium', resolved: false,
    });
    toast.success('Issue created');
    onRefresh();
  };

  const update = async (id: string, data: Partial<Issue>) => {
    const existing = await DB.issues.get(id);
    if (existing) {
      await DB.issues.save({ ...existing, ...data });
      onRefresh();
    }
  };

  const deleteIssue = async (id: string) => {
    if (!confirm('Delete this issue?')) return;
    await DB.issues.delete(id);
    toast.success('Issue deleted');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Issues</h2>
        <button
          onClick={createIssue}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Issue
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {(['all', 'open', 'resolved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              filter === f ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <span className="text-border">|</span>
        {(['all', 'low', 'medium', 'high', 'critical'] as const).map(s => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              severityFilter === s ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {s === 'all' ? 'All Sev.' : severityLabel[s]}
          </button>
        ))}
        <span className="text-xs text-muted-foreground ml-auto font-mono">{filtered.length} results</span>
      </div>

      {filtered.length === 0 && (
        <div className="surface-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No issues found. Create one or use <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">⌘K</kbd></p>
        </div>
      )}

      {filtered.map((issue, i) => {
        const isExpanded = expanded === issue.id;
        return (
          <motion.div
            key={issue.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="surface-card overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${severityDot[issue.severity]}`} />
                <div className="flex-1 min-w-0">
                  <input
                    value={issue.title}
                    onChange={e => update(issue.id, { title: e.target.value })}
                    placeholder="Issue title..."
                    className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-muted-foreground">{issue.id.slice(0, 8)}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </span>
                    {issue.resolved && (
                      <span className="flex items-center gap-0.5 text-[10px] text-success">
                        <Check className="h-3 w-3" /> Resolved
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => update(issue.id, { resolved: !issue.resolved })}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      issue.resolved ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {issue.resolved ? 'Resolved' : 'Open'}
                  </button>
                  <button onClick={() => setExpanded(isExpanded ? null : issue.id)} className="text-muted-foreground hover:text-foreground p-1">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <button onClick={() => deleteIssue(issue.id)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-label block mb-1">Severity</label>
                        <select
                          value={issue.severity}
                          onChange={e => update(issue.id, { severity: e.target.value as Severity })}
                          className="w-full bg-surface text-sm text-foreground rounded-md p-2 outline-none border border-border"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                          <option value="critical">Critical</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-label block mb-1">Affected Modules</label>
                        <input
                          value={issue.affectedModules}
                          onChange={e => update(issue.id, { affectedModules: e.target.value })}
                          placeholder="auth, api, ui"
                          className="w-full bg-surface text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md p-2 outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-label block mb-1">Description</label>
                      <textarea
                        value={issue.description}
                        onChange={e => update(issue.id, { description: e.target.value })}
                        placeholder="Describe the issue..."
                        rows={2}
                        className="w-full bg-surface text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md p-2 outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-label block mb-1">Root Cause</label>
                      <textarea
                        value={issue.rootCause}
                        onChange={e => update(issue.id, { rootCause: e.target.value })}
                        placeholder="What caused this?"
                        rows={2}
                        className="w-full bg-surface text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md p-2 outline-none resize-none"
                      />
                    </div>
                    <div>
                      <label className="text-label block mb-1">Fix Applied</label>
                      <textarea
                        value={issue.fixApplied}
                        onChange={e => update(issue.id, { fixApplied: e.target.value })}
                        placeholder="What fix was applied?"
                        rows={2}
                        className="w-full bg-surface text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md p-2 outline-none resize-none"
                      />
                    </div>
                    <div className="rounded-md bg-success/5 p-3">
                      <label className="text-label block mb-1 text-success">Prevention</label>
                      <textarea
                        value={issue.prevention}
                        onChange={e => update(issue.id, { prevention: e.target.value })}
                        placeholder="How can this be prevented in the future?"
                        rows={2}
                        className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 outline-none resize-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
