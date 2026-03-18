import type { DailyMission, Issue, Learning, Improvement } from './types';

export function calculateDailyScore(data: {
  missions: DailyMission[];
  issues: Issue[];
  learnings: Learning[];
  improvements: Improvement[];
}, dateStr: string) {
  const dayStart = new Date(dateStr).setHours(0, 0, 0, 0);
  const dayEnd = new Date(dateStr).setHours(23, 59, 59, 999);
  const inDay = (ts: number) => ts >= dayStart && ts <= dayEnd;

  const tasksCompleted = data.missions
    .filter(m => m.date === dateStr)
    .reduce((sum, m) => {
      let c = 0;
      if (m.mainTaskStatus === 'completed') c++;
      if (m.secondaryTaskStatus === 'completed') c++;
      if (m.quickWinStatus === 'completed') c++;
      return sum + c;
    }, 0);

  const issuesResolved = data.issues.filter(i => i.resolved && inDay(i.updatedAt)).length;
  const learningsAdded = data.learnings.filter(l => inDay(l.createdAt)).length;
  const improvementsMade = data.improvements.filter(i => inDay(i.createdAt)).length;

  return {
    score: (tasksCompleted * 2) + (issuesResolved * 3) + (learningsAdded * 1) + (improvementsMade * 2),
    tasksCompleted,
    issuesResolved,
    learningsAdded,
    improvementsMade,
  };
}

export function getDateStr(date: Date = new Date()): string {
  return date.toISOString().split('T')[0];
}

export function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(getDateStr(d));
  }
  return days;
}
