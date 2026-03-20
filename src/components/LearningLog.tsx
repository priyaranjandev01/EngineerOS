import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, ChevronDown, ChevronUp, Check, Maximize2 } from 'lucide-react';
import { DB } from '@/lib/storage';
import type { Learning } from '@/lib/types';
import { NotepadModal } from './NotepadModal';
import { toast } from 'sonner';

interface Props {
  learnings: Learning[];
  onRefresh: () => void;
}

export function LearningLog({ learnings, onRefresh }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [notepad, setNotepad] = useState<{ id: string; field: string; title: string } | null>(null);

  const create = async () => {
    await DB.learnings.save({
      topic: '', description: '', appliedInWork: false, impact: '',
    });
    toast.success('Learning created');
    onRefresh();
  };

  const update = async (id: string, data: Partial<Learning>) => {
    const existing = await DB.learnings.get(id);
    if (existing) {
      await DB.learnings.save({ ...existing, ...data });
      onRefresh();
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this learning?')) return;
    await DB.learnings.delete(id);
    toast.success('Learning deleted');
    onRefresh();
  };

  const notepadItem = notepad ? learnings.find(l => l.id === notepad.id) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Learning Log</h2>
        <button
          onClick={create}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          New Learning
        </button>
      </div>

      {learnings.length === 0 && (
        <div className="surface-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No learnings yet. Capture insights with <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded text-[10px]">⌘K</kbd></p>
        </div>
      )}

      {learnings.map((l, i) => {
        const isExpanded = expanded === l.id;
        return (
          <motion.div
            key={l.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            className="surface-card overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <input
                    value={l.topic}
                    onChange={e => update(l.id, { topic: e.target.value })}
                    placeholder="Learning topic..."
                    className="w-full bg-transparent text-sm font-medium text-foreground placeholder:text-muted-foreground/50 outline-none"
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-mono text-muted-foreground">
                      {new Date(l.createdAt).toLocaleDateString()}
                    </span>
                    {l.appliedInWork && (
                      <span className="flex items-center gap-0.5 text-[10px] text-success">
                        <Check className="h-3 w-3" /> Applied
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => update(l.id, { appliedInWork: !l.appliedInWork })}
                    className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                      l.appliedInWork ? 'bg-success/20 text-success' : 'bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {l.appliedInWork ? 'Applied' : 'Not Applied'}
                  </button>
                  <button onClick={() => setExpanded(isExpanded ? null : l.id)} className="text-muted-foreground hover:text-foreground p-1">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  <button onClick={() => remove(l.id)} className="text-muted-foreground hover:text-destructive p-1">
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
                      <div className="flex items-center mb-1">
                        <label className="text-label">Description</label>
                        <button onClick={() => setNotepad({ id: l.id, field: 'description', title: 'Description' })} className="text-muted-foreground hover:text-primary transition-colors ml-1">
                          <Maximize2 className="h-3 w-3" />
                        </button>
                      </div>
                      <textarea
                        value={l.description}
                        onChange={e => update(l.id, { description: e.target.value })}
                        placeholder="What did you learn?"
                        rows={3}
                        className="w-full bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md p-2 outline-none border border-border/50 focus:border-primary/40 resize-none"
                      />
                    </div>
                    <div>
                      <div className="flex items-center mb-1">
                        <label className="text-label">Impact</label>
                        <button onClick={() => setNotepad({ id: l.id, field: 'impact', title: 'Impact' })} className="text-muted-foreground hover:text-primary transition-colors ml-1">
                          <Maximize2 className="h-3 w-3" />
                        </button>
                      </div>
                      <textarea
                        value={l.impact}
                        onChange={e => update(l.id, { impact: e.target.value })}
                        placeholder="How did this impact your work?"
                        rows={2}
                        className="w-full bg-muted/50 text-sm text-foreground placeholder:text-muted-foreground/50 rounded-md p-2 outline-none border border-border/50 focus:border-primary/40 resize-none"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {notepad && notepadItem && (
        <NotepadModal
          title={notepad.title}
          value={(notepadItem as any)[notepad.field] || ''}
          onChange={v => update(notepad.id, { [notepad.field]: v })}
          onClose={() => setNotepad(null)}
        />
      )}
    </div>
  );
}
