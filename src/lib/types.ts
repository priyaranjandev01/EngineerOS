export interface EngineerEntity {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export type TaskStatus = 'completed' | 'in-progress' | 'blocked';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type ImprovementType = 'performance' | 'refactor' | 'optimization' | 'other';

export interface DailyMission extends EngineerEntity {
  date: string; // YYYY-MM-DD
  mainTask: string;
  secondaryTask: string;
  quickWin: string;
  mainTaskStatus: TaskStatus;
  secondaryTaskStatus: TaskStatus;
  quickWinStatus: TaskStatus;
  notes: string;
}

export interface Issue extends EngineerEntity {
  title: string;
  description: string;
  rootCause: string;
  fixApplied: string;
  affectedModules: string;
  prevention: string;
  severity: Severity;
  resolved: boolean;
}

export interface Learning extends EngineerEntity {
  topic: string;
  description: string;
  appliedInWork: boolean;
  impact: string;
}

export interface Improvement extends EngineerEntity {
  title: string;
  description: string;
  type: ImprovementType;
  beforeState: string;
  afterState: string;
  impact: string;
}

export interface StickyNote extends EngineerEntity {
  title: string;
  content: string;
  color: string;
  pinned: boolean;
}

export type EntityType = 'mission' | 'issue' | 'learning' | 'improvement' | 'stickyNote';
