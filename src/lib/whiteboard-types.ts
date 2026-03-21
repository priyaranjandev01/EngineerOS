export type Tool = 'pen' | 'eraser' | 'text' | 'select';

export interface Point {
  x: number;
  y: number;
}

export interface WhiteboardStroke {
  id: string;
  tool: 'pen' | 'eraser';
  points: Point[];
  color: string;
  width: number;
}

export interface WhiteboardText {
  id: string;
  x: number;
  y: number;
  content: string;
  color: string;
  fontSize: number;
}

export interface WhiteboardState {
  strokes: WhiteboardStroke[];
  texts: WhiteboardText[];
}
