import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { DB } from '@/lib/storage';
import type { Improvement, ImprovementType } from '@/lib/types';
import { toast } from 'sonner';

interface Props {
  improvements: Improvement[];
  onRefresh: () => void;
}

const typeLabels: Record<ImprovementType, string> = {
  performance: 'Performance',
  refactor: 'Refactor',
  optimization: 'Optimization',
  other: 'Other',
};

export function ImprovementTracker({ improvements, onRefresh }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<ImprovementType | 'all'>('all');

  const filtered = typeFilter === 'all' ? improvements : improvements.filter(i => i.type === typeFilter);

  const create = async () => {
    await DB.improvements.save({
      title: '', description: '', type: 'other',
      beforeState: '', afterState: '', impact: '',
    });
    toast.success('Improvement created');
    onRefresh();
  };

  const update = async (id: string, data: Partial<Improvement>) => {
    const existing = await DB.improvements.get(id);
    if (existing) {
      await DB.improvements.save({ ...existing, ...data });
      onRefresh();
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this improvement?')) return;
    await DB.improvements.delete(id);
    toast.success('Improvement deleted');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Improvements</h2>
        <button
          onClick={create}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Improvement
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2">
        {(['all', 'performance', 'refactor', 'optimization', 'other'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              typeFilter === t ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {t === 'all' ? 'All' : typeLabels[t]}
          </button>
        ))}
        <span className="text-xs text-muted-foreground ml-auto font-mono">{filtered.length} results</span>
      </div>

      {filtered.length === 0 && (
        <div className="surface-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No improvements yet. Track your optimizations with <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">⌘K</kbd></p>
        </div>
      )}

      {filtered.map((imp, i) => {
        const isExpanded = expanded === imp.id;
        return (
          <motion.div
            key={imp.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="surface-card overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <input
                    value={imp.title}
                    onChange={e => update(imp.id, { title: e.target.value })}
                    placeholder="Improvement title..."
                    className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(imp.createdAt).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                      {typeLabels[imp.type]}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => setExpanded(isExpanded ? null : imp.id)} className="text-muted-foreground hover:text-foreground p-1">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <button onClick={() => remove(imp.id)} className="text-muted-foreground hover:text-destructive p-1">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                  <div className="px-4 pb-4 border-t border-border pt-3 space-y-3">
                    <div>
                      <label className="text-label block mb-1">Type</label>
                      <select
                        value={imp.type}
                        onChange={e => update(imp.id, { type: e.target.value as ImprovementType })}
                        className="w-full bg-surface text-sm text-foreground rounded-md p-2 outline-none border border-border"
                      >
                        {Object.entries(typeLabels).map(([k, v]) => (
                          <option key={k} value={k}>{v}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-label block mb-1">Description</label>
                      <textarea
                        value={imp.description}
                        onChange={e => update(imp.id, { description: e.target.value })}
                        placeholder="What was improved?"
                        rows={2}
                        className="w-full bg-surface text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md p-2 outline-none resize-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-label block mb-1">Before</label>
                        <textarea
                          value={imp.beforeState}
                          onChange={e => update(imp.id, { beforeState: e.target.value })}
                          placeholder="latency: 340ms"
                          rows={2}
                          className="w-full bg-surface text-sm text-foreground font-mono placeholder:text-muted-foreground/50 rounded-md p-2 outline-none resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-label block mb-1">After</label>
                        <textarea
                          value={imp.afterState}
                          onChange={e => update(imp.id, { afterState: e.target.value })}
                          placeholder="latency: 200ms"
                          rows={2}
                          className="w-full bg-surface text-sm text-foreground font-mono placeholder:text-muted-foreground/50 rounded-md p-2 outline-none resize-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-label block mb-1">Impact</label>
                      <textarea
                        value={imp.impact}
                        onChange={e => update(imp.id, { impact: e.target.value })}
                        placeholder="latency: -140ms"
                        rows={2}
                        className="w-full bg-surface text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md p-2 outline-none resize-none"
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
