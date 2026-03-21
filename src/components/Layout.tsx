import { ReactNode, useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Target, Bug, BookOpen, Zap, Search, Command, Menu, X, Palette, StickyNote, PenTool,
} from 'lucide-react';
import { QuickEntry } from './QuickEntry';
import { GlobalSearch } from './GlobalSearch';
import { useTheme, themes } from '@/hooks/useTheme';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/missions', label: 'Missions', icon: Target },
  { path: '/issues', label: 'Issues', icon: Bug },
  { path: '/learnings', label: 'Learnings', icon: BookOpen },
  { path: '/improvements', label: 'Improvements', icon: Zap },
  { path: '/notes', label: 'Sticky Notes', icon: StickyNote },
  { path: '/whiteboard', label: 'Whiteboard', icon: PenTool },
];

interface LayoutProps {
  children: ReactNode;
  onRefresh?: () => void;
}

export function Layout({ children, onRefresh }: LayoutProps) {
  const location = useLocation();
  const [quickEntryOpen, setQuickEntryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setQuickEntryOpen(true);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-56 flex-col border-r border-border bg-card fixed inset-y-0 left-0 z-30">
        <div className="p-4 border-b border-border">
          <h1 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Command className="h-4 w-4 text-primary" />
            EngineerOS
          </h1>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors duration-150 ${
                  active
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 border-t border-border space-y-0.5">
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover w-full transition-colors duration-150"
          >
            <Search className="h-4 w-4" />
            Search
            <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">⌘/</kbd>
          </button>
          <button
            onClick={() => setQuickEntryOpen(true)}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover w-full transition-colors duration-150"
          >
            <Zap className="h-4 w-4" />
            Quick Entry
            <kbd className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono">⌘K</kbd>
          </button>
          <div className="relative">
            <button
              onClick={() => setThemeOpen(!themeOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-surface-hover w-full transition-colors duration-150"
            >
              <Palette className="h-4 w-4" />
              Theme
            </button>
            {themeOpen && (
              <div className="absolute bottom-full left-0 mb-1 w-full bg-card border border-border rounded-md p-1.5 shadow-lg space-y-0.5">
                {themes.map(t => (
                  <button
                    key={t.id}
                    onClick={() => { setTheme(t.id); setThemeOpen(false); }}
                    className={`flex items-center gap-2 w-full px-3 py-1.5 rounded text-sm transition-colors ${
                      theme === t.id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                    }`}
                  >
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ background: t.color }} />
                    {t.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 inset-x-0 h-12 bg-card border-b border-border flex items-center px-4 z-30">
        <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground">
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="ml-3 text-sm font-semibold text-foreground flex items-center gap-2">
          <Command className="h-3.5 w-3.5 text-primary" />
          EngineerOS
        </h1>
        <div className="ml-auto flex gap-2">
          <button onClick={() => setSearchOpen(true)} className="text-muted-foreground p-1">
            <Search className="h-4 w-4" />
          </button>
          <button onClick={() => setQuickEntryOpen(true)} className="text-muted-foreground p-1">
            <Zap className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-60 bg-card border-r border-border z-50 md:hidden flex flex-col"
            >
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h1 className="text-sm font-semibold text-foreground">EngineerOS</h1>
                <button onClick={() => setSidebarOpen(false)} className="text-muted-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <nav className="flex-1 p-2 space-y-0.5">
                {navItems.map(item => {
                  const active = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                        active
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-surface-hover'
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="flex-1 md:ml-56 mt-12 md:mt-0">
        <div className="max-w-5xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>

      {/* Modals */}
      <QuickEntry open={quickEntryOpen} onClose={() => { setQuickEntryOpen(false); onRefresh?.(); }} />
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
