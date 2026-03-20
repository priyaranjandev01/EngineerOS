import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { useData } from "@/hooks/useData";
import { Dashboard } from "@/components/Dashboard";
import { DailyMissions } from "@/components/DailyMissions";
import { IssueTracker } from "@/components/IssueTracker";
import { LearningLog } from "@/components/LearningLog";
import { ImprovementTracker } from "@/components/ImprovementTracker";
import { StickyNotes } from "@/components/StickyNotes";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

function AppContent() {
  const { missions, issues, learnings, improvements, stickyNotes, loading, refresh } = useData();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground font-mono animate-pulse-subtle">Initializing...</div>
      </div>
    );
  }

  return (
    <Layout onRefresh={refresh}>
      <Routes>
        <Route path="/" element={<Dashboard missions={missions} issues={issues} learnings={learnings} improvements={improvements} />} />
        <Route path="/missions" element={<DailyMissions missions={missions} onRefresh={refresh} />} />
        <Route path="/issues" element={<IssueTracker issues={issues} onRefresh={refresh} />} />
        <Route path="/learnings" element={<LearningLog learnings={learnings} onRefresh={refresh} />} />
        <Route path="/improvements" element={<ImprovementTracker improvements={improvements} onRefresh={refresh} />} />
        <Route path="/notes" element={<StickyNotes notes={stickyNotes} onRefresh={refresh} />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Layout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
