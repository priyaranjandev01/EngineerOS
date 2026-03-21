export type Tool = 'pen' | 'eraser' | 'text' | 'select' | 'note' | 'image';

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

export interface WhiteboardNote {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  color: string;
}

export interface WhiteboardImage {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  src: string; // data URL
  originalWidth: number;
  originalHeight: number;
}

export interface WhiteboardState {
  strokes: WhiteboardStroke[];
  texts: WhiteboardText[];
  notes: WhiteboardNote[];
  images: WhiteboardImage[];
}
