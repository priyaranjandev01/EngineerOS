import { useRef, useState, useCallback, useEffect } from 'react';
import { Pen, Eraser, Type, Undo2, Trash2, Download, Minus, Plus, Circle } from 'lucide-react';
import type { Tool, Point, WhiteboardStroke, WhiteboardText, WhiteboardState } from '@/lib/whiteboard-types';

const COLORS = [
  'hsl(217, 91%, 60%)',   // primary blue
  'hsl(0, 84%, 60%)',     // red
  'hsl(142, 71%, 45%)',   // green
  'hsl(38, 92%, 50%)',    // orange
  'hsl(280, 67%, 60%)',   // purple
  'hsl(0, 0%, 90%)',      // white
];

const STORAGE_KEY = 'engineeros-whiteboard';

function loadState(): WhiteboardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { strokes: [], texts: [] };
}

function saveState(state: WhiteboardState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function generateId() {
  return crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function Whiteboard() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>('pen');
  const [color, setColor] = useState(COLORS[0]);
  const [strokeWidth, setStrokeWidth] = useState(2);
  const [state, setState] = useState<WhiteboardState>(loadState);
  const [isDrawing, setIsDrawing] = useState(false);
  const currentStroke = useRef<Point[]>([]);
  const [textInput, setTextInput] = useState<{ x: number; y: number } | null>(null);
  const [textValue, setTextValue] = useState('');
  const [history, setHistory] = useState<WhiteboardState[]>([]);

  // Redraw canvas
  const redraw = useCallback((ctx: CanvasRenderingContext2D, s: WhiteboardState, extraPoints?: Point[]) => {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid pattern
    ctx.strokeStyle = 'hsla(217, 30%, 40%, 0.06)';
    ctx.lineWidth = 1;
    const gridSize = 30;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Dot intersections
    ctx.fillStyle = 'hsla(217, 30%, 50%, 0.12)';
    for (let x = 0; x < canvas.width; x += gridSize) {
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw strokes
    for (const stroke of s.strokes) {
      drawStroke(ctx, stroke);
    }

    // Draw current stroke preview
    if (extraPoints && extraPoints.length > 1) {
      drawStroke(ctx, {
        id: '',
        tool: tool === 'eraser' ? 'eraser' : 'pen',
        points: extraPoints,
        color: tool === 'eraser' ? 'hsl(240, 10%, 3.9%)' : color,
        width: tool === 'eraser' ? strokeWidth * 4 : strokeWidth,
      });
    }

    // Draw texts
    for (const t of s.texts) {
      ctx.font = `${t.fontSize}px 'Inter', sans-serif`;
      ctx.fillStyle = t.color;
      ctx.fillText(t.content, t.x, t.y);
    }
  }, [tool, color, strokeWidth]);

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: WhiteboardStroke) {
    if (stroke.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1];
      const curr = stroke.points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  }

  // Setup canvas size
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
        redraw(ctx, state);
      }
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [state, redraw]);

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (tool === 'text') {
      const pt = getPoint(e);
      setTextInput(pt);
      setTextValue('');
      return;
    }
    if (tool === 'select') return;
    setIsDrawing(true);
    currentStroke.current = [getPoint(e)];
    setHistory(h => [...h, { ...state }]);
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const pt = getPoint(e);
    currentStroke.current.push(pt);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) redraw(ctx, state, currentStroke.current);
  };

  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.current.length > 1) {
      const newStroke: WhiteboardStroke = {
        id: generateId(),
        tool: tool === 'eraser' ? 'eraser' : 'pen',
        points: currentStroke.current,
        color: tool === 'eraser' ? 'hsl(240, 10%, 3.9%)' : color,
        width: tool === 'eraser' ? strokeWidth * 4 : strokeWidth,
      };
      const newState = { ...state, strokes: [...state.strokes, newStroke] };
      setState(newState);
      saveState(newState);
    }
    currentStroke.current = [];
  };

  const addText = () => {
    if (!textInput || !textValue.trim()) { setTextInput(null); return; }
    const newText: WhiteboardText = {
      id: generateId(),
      x: textInput.x,
      y: textInput.y,
      content: textValue,
      color,
      fontSize: 16,
    };
    setHistory(h => [...h, { ...state }]);
    const newState = { ...state, texts: [...state.texts, newText] };
    setState(newState);
    saveState(newState);
    setTextInput(null);
    setTextValue('');
  };

  const undo = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setHistory(h => h.slice(0, -1));
    setState(prev);
    saveState(prev);
  };

  const clearAll = () => {
    setHistory(h => [...h, { ...state }]);
    const empty: WhiteboardState = { strokes: [], texts: [] };
    setState(empty);
    saveState(empty);
  };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const tools: { id: Tool; icon: typeof Pen; label: string }[] = [
    { id: 'pen', icon: Pen, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'text', icon: Type, label: 'Text' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Whiteboard</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Freeform digital canvas for sketching ideas</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-card border border-border rounded-lg">
        {/* Tools */}
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5">
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-all ${
                tool === t.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title={t.label}
            >
              <t.icon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-border" />

        {/* Colors */}
        <div className="flex items-center gap-1">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-5 w-5 rounded-full transition-all ${
                color === c ? 'ring-2 ring-primary ring-offset-2 ring-offset-card scale-110' : 'hover:scale-110'
              }`}
              style={{ background: c }}
            />
          ))}
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-border" />

        {/* Stroke width */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setStrokeWidth(Math.max(1, strokeWidth - 1))}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Minus className="h-3 w-3" />
          </button>
          <div className="flex items-center justify-center w-8">
            <Circle className="text-foreground" style={{ width: Math.min(strokeWidth * 3, 18), height: Math.min(strokeWidth * 3, 18) }} fill="currentColor" />
          </div>
          <button
            onClick={() => setStrokeWidth(Math.min(20, strokeWidth + 1))}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>

        {/* Separator */}
        <div className="w-px h-6 bg-border" />

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={undo}
            disabled={history.length === 0}
            className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors rounded hover:bg-muted"
            title="Undo"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={clearAll}
            className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded hover:bg-muted"
            title="Clear all"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={exportCanvas}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
            title="Export as PNG"
          >
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative w-full bg-card border border-border rounded-lg overflow-hidden"
        style={{ height: 'calc(100vh - 220px)', minHeight: 400 }}
      >
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 ${
            tool === 'pen' ? 'cursor-crosshair' :
            tool === 'eraser' ? 'cursor-cell' :
            tool === 'text' ? 'cursor-text' : 'cursor-default'
          }`}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />

        {/* Text input overlay */}
        {textInput && (
          <div
            className="absolute z-10"
            style={{ left: textInput.x, top: textInput.y }}
          >
            <input
              autoFocus
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addText(); if (e.key === 'Escape') setTextInput(null); }}
              onBlur={addText}
              className="bg-card/90 border border-primary/30 rounded px-2 py-1 text-sm text-foreground outline-none backdrop-blur-sm min-w-[120px] shadow-lg"
              placeholder="Type here..."
              style={{ color }}
            />
          </div>
        )}

        {/* Empty state */}
        {state.strokes.length === 0 && state.texts.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Pen className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground/40">Click and drag to start drawing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
