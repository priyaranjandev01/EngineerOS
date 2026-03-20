import { useState, useEffect, useCallback } from 'react';
import { DB } from '@/lib/storage';
import type { DailyMission, Issue, Learning, Improvement, StickyNote } from '@/lib/types';

export function useData() {
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [stickyNotes, setStickyNotes] = useState<StickyNote[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [m, i, l, imp, sn] = await Promise.all([
      DB.missions.getAll(),
      DB.issues.getAll(),
      DB.learnings.getAll(),
      DB.improvements.getAll(),
      DB.stickyNotes.getAll(),
    ]);
    setMissions(m);
    setIssues(i);
    setLearnings(l);
    setImprovements(imp);
    setStickyNotes(sn);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { missions, issues, learnings, improvements, stickyNotes, loading, refresh };
}
