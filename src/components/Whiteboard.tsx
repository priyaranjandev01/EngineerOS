import { useRef, useState, useCallback, useEffect } from 'react';
import { Pen, Eraser, Type, Undo2, Trash2, Download, Minus, Plus, Circle, StickyNote, ImagePlus, Move } from 'lucide-react';
import type { Tool, Point, WhiteboardStroke, WhiteboardText, WhiteboardState, WhiteboardNote, WhiteboardImage } from '@/lib/whiteboard-types';
import { WhiteboardNoteCard } from './whiteboard/WhiteboardNoteCard';
import { WhiteboardImageCard } from './whiteboard/WhiteboardImageCard';
import { ImageViewer } from './whiteboard/ImageViewer';

const COLORS = [
  'hsl(217, 91%, 60%)',
  'hsl(0, 84%, 60%)',
  'hsl(142, 71%, 45%)',
  'hsl(38, 92%, 50%)',
  'hsl(280, 67%, 60%)',
  'hsl(0, 0%, 20%)',
];

const NOTE_COLORS = [
  'hsl(48, 96%, 70%)',
  'hsl(142, 60%, 75%)',
  'hsl(217, 80%, 75%)',
  'hsl(340, 70%, 75%)',
  'hsl(280, 60%, 75%)',
];

const STORAGE_KEY = 'engineeros-whiteboard';

function loadState(): WhiteboardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { strokes: [], texts: [], notes: [], images: [], ...parsed };
    }
  } catch {}
  return { strokes: [], texts: [], notes: [], images: [] };
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
  const [viewImage, setViewImage] = useState<string | null>(null);

  const pushHistory = useCallback(() => {
    setHistory(h => [...h.slice(-30), { ...state }]);
  }, [state]);

  const updateState = useCallback((newState: WhiteboardState) => {
    setState(newState);
    saveState(newState);
  }, []);

  // Redraw canvas
  const redraw = useCallback((ctx: CanvasRenderingContext2D, s: WhiteboardState, extraPoints?: Point[]) => {
    const canvas = ctx.canvas;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Plain background
    const dpr = window.devicePixelRatio || 1;
    ctx.fillStyle = 'hsl(0, 0%, 100%)';
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);

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
        color: tool === 'eraser' ? '#ffffff' : color,
        width: tool === 'eraser' ? strokeWidth * 4 : strokeWidth,
      });
    }

    // Draw texts
    for (const t of s.texts) {
      ctx.font = `${t.fontSize}px 'Inter', sans-serif`;
      ctx.fillStyle = t.color;
      ctx.textBaseline = 'top';
      ctx.fillText(t.content, t.x, t.y);
    }
  }, [tool, color, strokeWidth]);

  function drawStroke(ctx: CanvasRenderingContext2D, stroke: WhiteboardStroke) {
    if (stroke.points.length < 2) return;
    ctx.beginPath();
    ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
    ctx.lineWidth = stroke.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalCompositeOperation = 'source-over';

    ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
    for (let i = 1; i < stroke.points.length; i++) {
      const prev = stroke.points[i - 1];
      const curr = stroke.points[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2;
      ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
    }
    ctx.stroke();
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
    if ('touches' in e && e.touches.length > 0) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    if ('clientX' in e) {
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }
    return { x: 0, y: 0 };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();

    if (tool === 'text') {
      const pt = getPoint(e);
      setTextInput(pt);
      setTextValue('');
      return;
    }
    if (tool === 'note') {
      const pt = getPoint(e);
      pushHistory();
      const newNote: WhiteboardNote = {
        id: generateId(),
        x: pt.x,
        y: pt.y,
        width: 160,
        height: 100,
        content: '',
        color: NOTE_COLORS[Math.floor(Math.random() * NOTE_COLORS.length)],
      };
      updateState({ ...state, notes: [...state.notes, newNote] });
      setTool('select');
      return;
    }
    if (tool === 'image') return;
    if (tool === 'select') return;

    setIsDrawing(true);
    currentStroke.current = [getPoint(e)];
    pushHistory();
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    if (!isDrawing) return;
    const pt = getPoint(e);
    currentStroke.current.push(pt);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) redraw(ctx, state, currentStroke.current);
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentStroke.current.length > 1) {
      const newStroke: WhiteboardStroke = {
        id: generateId(),
        tool: tool === 'eraser' ? 'eraser' : 'pen',
        points: currentStroke.current,
        color: tool === 'eraser' ? '#ffffff' : color,
        width: tool === 'eraser' ? strokeWidth * 4 : strokeWidth,
      };
      updateState({ ...state, strokes: [...state.strokes, newStroke] });
    }
    currentStroke.current = [];
  };

  const addText = () => {
    if (!textInput || !textValue.trim()) { setTextInput(null); return; }
    pushHistory();
    const newText: WhiteboardText = {
      id: generateId(),
      x: textInput.x,
      y: textInput.y,
      content: textValue,
      color,
      fontSize: 16,
    };
    updateState({ ...state, texts: [...state.texts, newText] });
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
    pushHistory();
    updateState({ strokes: [], texts: [], notes: [], images: [] });
  };

  const exportCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `whiteboard-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const src = ev.target?.result as string;
        const img = new Image();
        img.onload = () => {
          pushHistory();
          const maxW = 200;
          const scale = Math.min(maxW / img.width, 1);
          const newImg: WhiteboardImage = {
            id: generateId(),
            x: 50,
            y: 50,
            width: img.width * scale,
            height: img.height * scale,
            src,
            originalWidth: img.width,
            originalHeight: img.height,
          };
          updateState({ ...state, images: [...state.images, newImg] });
        };
        img.src = src;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const updateNote = (id: string, updates: Partial<WhiteboardNote>) => {
    updateState({
      ...state,
      notes: state.notes.map(n => n.id === id ? { ...n, ...updates } : n),
    });
  };

  const deleteNote = (id: string) => {
    pushHistory();
    updateState({ ...state, notes: state.notes.filter(n => n.id !== id) });
  };

  const updateImage = (id: string, updates: Partial<WhiteboardImage>) => {
    updateState({
      ...state,
      images: state.images.map(i => i.id === id ? { ...i, ...updates } : i),
    });
  };

  const deleteImage = (id: string) => {
    pushHistory();
    updateState({ ...state, images: state.images.filter(i => i.id !== id) });
  };

  const tools: { id: Tool; icon: typeof Pen; label: string }[] = [
    { id: 'pen', icon: Pen, label: 'Pen' },
    { id: 'eraser', icon: Eraser, label: 'Eraser' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'select', icon: Move, label: 'Move' },
    { id: 'note', icon: StickyNote, label: 'Note' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Whiteboard</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Digital canvas for sketching & notes</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 p-2 bg-card border border-border rounded-lg">
        <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5">
          {tools.map(t => (
            <button
              key={t.id}
              onClick={() => setTool(t.id)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded text-xs transition-all ${
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

        <div className="w-px h-6 bg-border" />

        {/* Image upload */}
        <button
          onClick={handleImageUpload}
          className="flex items-center gap-1.5 px-2 py-1.5 rounded text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          title="Upload Image"
        >
          <ImagePlus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Image</span>
        </button>

        <div className="w-px h-6 bg-border" />

        {/* Colors */}
        <div className="flex items-center gap-1">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => setColor(c)}
              className={`h-5 w-5 rounded-full border transition-all ${
                color === c ? 'ring-2 ring-primary ring-offset-1 ring-offset-card scale-110' : 'hover:scale-110'
              }`}
              style={{ background: c, borderColor: 'hsl(var(--border))' }}
            />
          ))}
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Stroke width */}
        <div className="flex items-center gap-1">
          <button onClick={() => setStrokeWidth(Math.max(1, strokeWidth - 1))} className="p-1 text-muted-foreground hover:text-foreground">
            <Minus className="h-3 w-3" />
          </button>
          <div className="flex items-center justify-center w-8">
            <Circle className="text-foreground" style={{ width: Math.min(strokeWidth * 3, 18), height: Math.min(strokeWidth * 3, 18) }} fill="currentColor" />
          </div>
          <button onClick={() => setStrokeWidth(Math.min(20, strokeWidth + 1))} className="p-1 text-muted-foreground hover:text-foreground">
            <Plus className="h-3 w-3" />
          </button>
        </div>

        <div className="w-px h-6 bg-border" />

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <button onClick={undo} disabled={history.length === 0} className="p-1.5 text-muted-foreground hover:text-foreground disabled:opacity-30 rounded hover:bg-muted" title="Undo">
            <Undo2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={clearAll} className="p-1.5 text-muted-foreground hover:text-destructive rounded hover:bg-muted" title="Clear all">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={exportCanvas} className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted" title="Export PNG">
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative w-full rounded-lg overflow-hidden border border-border"
        style={{ height: 'calc(100vh - 220px)', minHeight: 400, touchAction: 'none' }}
      >
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 ${
            tool === 'pen' ? 'cursor-crosshair' :
            tool === 'eraser' ? 'cursor-cell' :
            tool === 'text' ? 'cursor-text' :
            tool === 'note' ? 'cursor-copy' : 'cursor-default'
          }`}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />

        {/* Draggable notes */}
        {state.notes.map(note => (
          <WhiteboardNoteCard
            key={note.id}
            note={note}
            onUpdate={updateNote}
            onDelete={deleteNote}
            containerRef={containerRef}
          />
        ))}

        {/* Draggable images */}
        {state.images.map(img => (
          <WhiteboardImageCard
            key={img.id}
            image={img}
            onUpdate={updateImage}
            onDelete={deleteImage}
            onView={() => setViewImage(img.src)}
            containerRef={containerRef}
          />
        ))}

        {/* Text input overlay */}
        {textInput && (
          <div className="absolute z-20" style={{ left: textInput.x, top: textInput.y }}>
            <input
              autoFocus
              value={textValue}
              onChange={e => setTextValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addText(); if (e.key === 'Escape') setTextInput(null); }}
              onBlur={addText}
              className="bg-white border border-primary/40 rounded px-2 py-1 text-sm outline-none min-w-[140px] shadow-lg"
              placeholder="Type here..."
              style={{ color }}
            />
          </div>
        )}

        {/* Empty state */}
        {state.strokes.length === 0 && state.texts.length === 0 && state.notes.length === 0 && state.images.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Pen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Click and drag to start drawing</p>
            </div>
          </div>
        )}
      </div>

      {/* Fullscreen image viewer */}
      {viewImage && <ImageViewer src={viewImage} onClose={() => setViewImage(null)} />}
    </div>
  );
}
