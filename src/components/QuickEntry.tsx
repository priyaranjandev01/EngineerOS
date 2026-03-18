import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bug, BookOpen, Zap, X } from 'lucide-react';
import { DB } from '@/lib/storage';
import type { Severity } from '@/lib/types';
import { toast } from 'sonner';

type QuickMode = 'issue' | 'learning' | 'improvement';

const modes: { key: QuickMode; label: string; icon: typeof Bug; prefix: string }[] = [
  { key: 'issue', label: 'Issue', icon: Bug, prefix: '/i' },
  { key: 'learning', label: 'Learning', icon: BookOpen, prefix: '/l' },
  { key: 'improvement', label: 'Improvement', icon: Zap, prefix: '/m' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export function QuickEntry({ open, onClose }: Props) {
  const [mode, setMode] = useState<QuickMode>('issue');
  const [value, setValue] = useState('');
  const [severity, setSeverity] = useState<Severity>('medium');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const handleInput = (v: string) => {
    for (const m of modes) {
      if (v.startsWith(m.prefix + ' ')) {
        setMode(m.key);
        setValue(v.slice(m.prefix.length + 1));
        return;
      }
    }
    setValue(v);
  };

  const submit = async () => {
    if (!value.trim()) return;
    const title = value.trim();

    if (mode === 'issue') {
      await DB.issues.save({
        title, description: '', rootCause: '', fixApplied: '',
        affectedModules: '', prevention: '', severity, resolved: false,
      });
      toast.success('Issue created');
    } else if (mode === 'learning') {
      await DB.learnings.save({
        topic: title, description: '', appliedInWork: false, impact: '',
      });
      toast.success('Learning captured');
    } else {
      await DB.improvements.save({
        title, description: '', type: 'other',
        beforeState: '', afterState: '', impact: '',
      });
      toast.success('Improvement logged');
    }

    setValue('');
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); submit(); }
    if (e.key === 'Escape') onClose();
  };

  const currentMode = modes.find(m => m.key === mode)!;
  const Icon = currentMode.icon;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.15, ease: [0.2, 0, 0, 1] }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-lg z-50"
          >
            <div className="surface-card p-1">
              {/* Mode Tabs */}
              <div className="flex gap-1 px-2 pt-2 pb-1">
                {modes.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setMode(m.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                      mode === m.key
                        ? 'bg-primary/15 text-primary'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <m.icon className="h-3 w-3" />
                    {m.label}
                    <kbd className="text-[9px] font-mono opacity-50">{m.prefix}</kbd>
                  </button>
                ))}
              </div>

              {/* Input */}
              <div className="flex items-center gap-3 px-3 py-2">
                <Icon className="h-4 w-4 text-primary shrink-0" />
                <input
                  ref={inputRef}
                  value={value}
                  onChange={e => handleInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Add ${currentMode.label.toLowerCase()}...`}
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Severity for Issues */}
              {mode === 'issue' && (
                <div className="px-3 pb-2 flex items-center gap-2">
                  <span className="text-label">Severity</span>
                  {(['low', 'medium', 'high', 'critical'] as Severity[]).map(s => (
                    <button
                      key={s}
                      onClick={() => setSeverity(s)}
                      className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                        severity === s
                          ? s === 'critical' ? 'bg-destructive/20 text-destructive'
                            : s === 'high' ? 'bg-warning/20 text-warning'
                            : s === 'medium' ? 'bg-primary/20 text-primary'
                            : 'bg-muted text-muted-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Footer */}
              <div className="px-3 py-2 border-t border-border flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  Press <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">Enter</kbd> to save
                </span>
                <span className="text-[11px] text-muted-foreground">
                  <kbd className="font-mono bg-muted px-1 py-0.5 rounded text-[10px]">Esc</kbd> to close
                </span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
