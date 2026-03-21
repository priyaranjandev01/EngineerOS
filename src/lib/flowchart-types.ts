export interface FlowNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  type: 'process' | 'decision' | 'start' | 'end' | 'io';
  color: string;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface FlowDiagram {
  id: string;
  name: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  isTemplate?: boolean;
}

export const FLOW_NODE_COLORS = {
  start: 'hsl(142, 71%, 45%)',
  end: 'hsl(0, 84%, 60%)',
  process: 'hsl(217, 91%, 60%)',
  decision: 'hsl(38, 92%, 50%)',
  io: 'hsl(280, 67%, 60%)',
};

export const FLOW_TEMPLATES: FlowDiagram[] = [
  {
    id: 'tpl-basic',
    name: 'Basic Process',
    isTemplate: true,
    nodes: [
      { id: 'n1', x: 200, y: 30, width: 120, height: 40, label: 'Start', type: 'start', color: FLOW_NODE_COLORS.start },
      { id: 'n2', x: 200, y: 120, width: 120, height: 50, label: 'Process A', type: 'process', color: FLOW_NODE_COLORS.process },
      { id: 'n3', x: 200, y: 220, width: 120, height: 50, label: 'Process B', type: 'process', color: FLOW_NODE_COLORS.process },
      { id: 'n4', x: 200, y: 320, width: 120, height: 40, label: 'End', type: 'end', color: FLOW_NODE_COLORS.end },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' },
      { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4' },
    ],
  },
  {
    id: 'tpl-decision',
    name: 'Decision Tree',
    isTemplate: true,
    nodes: [
      { id: 'n1', x: 220, y: 30, width: 120, height: 40, label: 'Start', type: 'start', color: FLOW_NODE_COLORS.start },
      { id: 'n2', x: 220, y: 120, width: 130, height: 60, label: 'Condition?', type: 'decision', color: FLOW_NODE_COLORS.decision },
      { id: 'n3', x: 80, y: 240, width: 120, height: 50, label: 'Yes Path', type: 'process', color: FLOW_NODE_COLORS.process },
      { id: 'n4', x: 360, y: 240, width: 120, height: 50, label: 'No Path', type: 'process', color: FLOW_NODE_COLORS.process },
      { id: 'n5', x: 220, y: 350, width: 120, height: 40, label: 'End', type: 'end', color: FLOW_NODE_COLORS.end },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' },
      { id: 'e2', from: 'n2', to: 'n3', label: 'Yes' },
      { id: 'e3', from: 'n2', to: 'n4', label: 'No' },
      { id: 'e4', from: 'n3', to: 'n5' },
      { id: 'e5', from: 'n4', to: 'n5' },
    ],
  },
  {
    id: 'tpl-sprint',
    name: 'Sprint Workflow',
    isTemplate: true,
    nodes: [
      { id: 'n1', x: 220, y: 20, width: 120, height: 40, label: 'Backlog', type: 'start', color: FLOW_NODE_COLORS.start },
      { id: 'n2', x: 220, y: 100, width: 130, height: 50, label: 'Sprint Planning', type: 'process', color: FLOW_NODE_COLORS.process },
      { id: 'n3', x: 220, y: 190, width: 120, height: 50, label: 'Development', type: 'process', color: FLOW_NODE_COLORS.process },
      { id: 'n4', x: 220, y: 280, width: 120, height: 50, label: 'Code Review', type: 'io', color: FLOW_NODE_COLORS.io },
      { id: 'n5', x: 220, y: 370, width: 130, height: 60, label: 'Approved?', type: 'decision', color: FLOW_NODE_COLORS.decision },
      { id: 'n6', x: 60, y: 370, width: 110, height: 50, label: 'Rework', type: 'process', color: FLOW_NODE_COLORS.end },
      { id: 'n7', x: 220, y: 470, width: 120, height: 40, label: 'Deploy', type: 'end', color: FLOW_NODE_COLORS.start },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' },
      { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4' },
      { id: 'e4', from: 'n4', to: 'n5' },
      { id: 'e5', from: 'n5', to: 'n6', label: 'No' },
      { id: 'e6', from: 'n6', to: 'n3' },
      { id: 'e7', from: 'n5', to: 'n7', label: 'Yes' },
    ],
  },
  {
    id: 'tpl-bug',
    name: 'Bug Lifecycle',
    isTemplate: true,
    nodes: [
      { id: 'n1', x: 220, y: 20, width: 120, height: 40, label: 'Bug Found', type: 'start', color: FLOW_NODE_COLORS.start },
      { id: 'n2', x: 220, y: 100, width: 120, height: 50, label: 'Triage', type: 'process', color: FLOW_NODE_COLORS.process },
      { id: 'n3', x: 220, y: 200, width: 130, height: 60, label: 'Valid Bug?', type: 'decision', color: FLOW_NODE_COLORS.decision },
      { id: 'n4', x: 400, y: 200, width: 110, height: 40, label: 'Closed', type: 'end', color: FLOW_NODE_COLORS.end },
      { id: 'n5', x: 220, y: 310, width: 120, height: 50, label: 'Fix', type: 'process', color: FLOW_NODE_COLORS.process },
      { id: 'n6', x: 220, y: 410, width: 120, height: 50, label: 'Test', type: 'io', color: FLOW_NODE_COLORS.io },
      { id: 'n7', x: 220, y: 500, width: 120, height: 40, label: 'Resolved', type: 'end', color: FLOW_NODE_COLORS.start },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' },
      { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4', label: 'No' },
      { id: 'e4', from: 'n3', to: 'n5', label: 'Yes' },
      { id: 'e5', from: 'n5', to: 'n6' },
      { id: 'e6', from: 'n6', to: 'n7' },
    ],
  },
  {
    id: 'tpl-cicd',
    name: 'CI/CD Pipeline',
    isTemplate: true,
    nodes: [
      { id: 'n1', x: 220, y: 20, width: 120, height: 40, label: 'Push Code', type: 'start', color: FLOW_NODE_COLORS.start },
      { id: 'n2', x: 220, y: 100, width: 120, height: 50, label: 'Build', type: 'process', color: FLOW_NODE_COLORS.process },
      { id: 'n3', x: 220, y: 190, width: 120, height: 50, label: 'Unit Tests', type: 'io', color: FLOW_NODE_COLORS.io },
      { id: 'n4', x: 220, y: 280, width: 130, height: 60, label: 'Tests Pass?', type: 'decision', color: FLOW_NODE_COLORS.decision },
      { id: 'n5', x: 400, y: 280, width: 110, height: 40, label: 'Fix & Retry', type: 'process', color: FLOW_NODE_COLORS.end },
      { id: 'n6', x: 220, y: 380, width: 120, height: 50, label: 'Staging', type: 'process', color: FLOW_NODE_COLORS.process },
      { id: 'n7', x: 220, y: 470, width: 120, height: 40, label: 'Production', type: 'end', color: FLOW_NODE_COLORS.start },
    ],
    edges: [
      { id: 'e1', from: 'n1', to: 'n2' },
      { id: 'e2', from: 'n2', to: 'n3' },
      { id: 'e3', from: 'n3', to: 'n4' },
      { id: 'e4', from: 'n4', to: 'n5', label: 'Fail' },
      { id: 'e5', from: 'n5', to: 'n2' },
      { id: 'e6', from: 'n4', to: 'n6', label: 'Pass' },
      { id: 'e7', from: 'n6', to: 'n7' },
    ],
  },
];
