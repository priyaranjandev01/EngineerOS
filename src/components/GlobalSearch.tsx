import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Bug, BookOpen, Zap, Target } from 'lucide-react';
import { DB } from '@/lib/storage';
import { useNavigate } from 'react-router-dom';

interface Props {
  open: boolean;
  onClose: () => void;
}

const typeIcons: Record<string, typeof Bug> = {
  missions: Target,
  issues: Bug,
  learnings: BookOpen,
  improvements: Zap,
};

const typeRoutes: Record<string, string> = {
  missions: '/missions',
  issues: '/issues',
  learnings: '/learnings',
  improvements: '/improvements',
};

export function GlobalSearch({ open, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ type: string; item: any }[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timeout = setTimeout(async () => {
      const r = await DB.search(query);
      setResults(r.slice(0, 20));
    }, 150);
    return () => clearTimeout(timeout);
  }, [query]);

  const handleSelect = (type: string) => {
    navigate(typeRoutes[type] || '/');
    onClose();
  };

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
            <div className="surface-card">
              <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && onClose()}
                  placeholder="Search everything..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-80 overflow-y-auto">
                {results.length === 0 && query && (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No results found
                  </div>
                )}
                {results.map((r, i) => {
                  const Icon = typeIcons[r.type] || Bug;
                  const title = r.item.title || r.item.topic || r.item.mainTask || 'Untitled';
                  return (
                    <button
                      key={r.item.id + i}
                      onClick={() => handleSelect(r.type)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-hover transition-colors"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-foreground truncate">{title}</div>
                        <div className="text-xs text-muted-foreground capitalize">{r.type}</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {!query && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  Type to search across all data
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
