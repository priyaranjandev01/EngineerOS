import { useRef, useState, useCallback, useEffect } from 'react';
import { Pen, Eraser, Type, Undo2, Trash2, Download, Minus, Plus, Circle, StickyNote, ImagePlus, Move, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import type { Tool, Point, WhiteboardStroke, WhiteboardText, WhiteboardState, WhiteboardNote, WhiteboardImage } from '@/lib/whiteboard-types';
import { WhiteboardNoteCard } from './whiteboard/WhiteboardNoteCard';
import { WhiteboardImageCard } from './whiteboard/WhiteboardImageCard';
import { ImageViewer } from './whiteboard/ImageViewer';
import { FlowDiagramPanel } from './FlowDiagramPanel';

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
  const [showFlowPanel, setShowFlowPanel] = useState(true);

  // Pan & Zoom state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0 });
  const panOffset = useRef({ x: 0, y: 0 });

  // Canvas logical size (large for infinite feel)
  const CANVAS_W = 3000;
  const CANVAS_H = 3000;

  const pushHistory = useCallback(() => {
    setHistory(h => [...h.slice(-30), { ...state }]);
  }, [state]);

  const updateState = useCallback((newState: WhiteboardState) => {
    setState(newState);
    saveState(newState);
  }, []);

  const redraw = useCallback((ctx: CanvasRenderingContext2D, s: WhiteboardState, extraPoints?: Point[]) => {
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
    ctx.fillStyle = 'hsl(0, 0%, 100%)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    for (const stroke of s.strokes) {
      drawStroke(ctx, stroke);
    }

    if (extraPoints && extraPoints.length > 1) {
      drawStroke(ctx, {
        id: '',
        tool: tool === 'eraser' ? 'eraser' : 'pen',
        points: extraPoints,
        color: tool === 'eraser' ? '#ffffff' : color,
        width: tool === 'eraser' ? strokeWidth * 4 : strokeWidth,
      });
    }

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

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');
    if (ctx) redraw(ctx, state);
  }, [state, redraw]);

  const getPoint = (e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0, clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    // Convert screen coords to canvas coords accounting for zoom and pan
    const x = (clientX - rect.left) / zoom;
    const y = (clientY - rect.top) / zoom;
    return { x, y };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();

    // Middle mouse or space+click for panning
    if ('button' in e && (e as React.MouseEvent).button === 1) {
      startPan(e);
      return;
    }

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
    if (tool === 'select') {
      startPan(e);
      return;
    }

    setIsDrawing(true);
    currentStroke.current = [getPoint(e)];
    pushHistory();
  };

  const startPan = (e: React.MouseEvent | React.TouchEvent) => {
    setIsPanning(true);
    let clientX = 0, clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    panStart.current = { x: clientX, y: clientY };
    panOffset.current = { ...pan };
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();

    if (isPanning) {
      let clientX = 0, clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = (e as React.MouseEvent).clientX;
        clientY = (e as React.MouseEvent).clientY;
      }
      setPan({
        x: panOffset.current.x + (clientX - panStart.current.x),
        y: panOffset.current.y + (clientY - panStart.current.y),
      });
      return;
    }

    if (!isDrawing) return;
    const pt = getPoint(e);
    currentStroke.current.push(pt);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) redraw(ctx, state, currentStroke.current);
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();

    if (isPanning) {
      setIsPanning(false);
      return;
    }

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

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(z => Math.min(3, Math.max(0.2, z + delta)));
    } else {
      setPan(p => ({
        x: p.x - e.deltaX,
        y: p.y - e.deltaY,
      }));
    }
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

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
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
            x: (-pan.x / zoom) + 50,
            y: (-pan.y / zoom) + 50,
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
    { id: 'select', icon: Move, label: 'Pan' },
    { id: 'note', icon: StickyNote, label: 'Note' },
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground tracking-tight">Whiteboard</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Infinite canvas — scroll to pan, Ctrl+scroll to zoom</p>
        </div>
        <button
          onClick={() => setShowFlowPanel(!showFlowPanel)}
          className={`px-3 py-1.5 text-xs rounded-md border transition-colors ${
            showFlowPanel
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-card text-muted-foreground border-border hover:text-foreground'
          }`}
        >
          Flow Diagrams
        </button>
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

        {/* Zoom controls */}
        <div className="flex items-center gap-0.5">
          <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted" title="Zoom out">
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <span className="text-[10px] text-muted-foreground w-10 text-center font-mono">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.1))} className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted" title="Zoom in">
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <button onClick={resetView} className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-muted" title="Reset view">
            <Maximize2 className="h-3.5 w-3.5" />
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

      {/* Main area: Whiteboard + Flow Panel */}
      <div className="flex gap-3" style={{ height: 'calc(100vh - 220px)', minHeight: 400 }}>
        {/* Canvas */}
        <div
          ref={containerRef}
          className="relative flex-1 rounded-lg overflow-hidden border border-border bg-card"
          style={{ touchAction: 'none' }}
          onWheel={handleWheel}
        >
          <div
            className="absolute"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: CANVAS_W,
              height: CANVAS_H,
            }}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_W}
              height={CANVAS_H}
              className={`${
                tool === 'pen' ? 'cursor-crosshair' :
                tool === 'eraser' ? 'cursor-cell' :
                tool === 'text' ? 'cursor-text' :
                tool === 'note' ? 'cursor-copy' :
                tool === 'select' ? 'cursor-grab' : 'cursor-default'
              } ${isPanning ? '!cursor-grabbing' : ''}`}
              style={{ width: CANVAS_W, height: CANVAS_H }}
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
                  className="bg-card border border-primary/40 rounded px-2 py-1 text-sm outline-none min-w-[140px] shadow-lg text-foreground"
                  placeholder="Type here..."
                  style={{ color }}
                />
              </div>
            )}
          </div>

          {/* Empty state */}
          {state.strokes.length === 0 && state.texts.length === 0 && state.notes.length === 0 && state.images.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Pen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground/50">Click and drag to start drawing</p>
                <p className="text-[10px] text-muted-foreground/30 mt-1">Scroll to pan • Ctrl+scroll to zoom</p>
              </div>
            </div>
          )}

          {/* Zoom indicator */}
          <div className="absolute bottom-2 left-2 bg-card/80 backdrop-blur-sm border border-border rounded px-2 py-0.5 text-[10px] text-muted-foreground font-mono pointer-events-none">
            {Math.round(zoom * 100)}%
          </div>
        </div>

        {/* Flow Diagram Panel */}
        {showFlowPanel && (
          <div className="w-72 shrink-0 bg-card border border-border rounded-lg p-3 overflow-y-auto hidden md:block">
            <FlowDiagramPanel />
          </div>
        )}
      </div>

      {/* Fullscreen image viewer */}
      {viewImage && <ImageViewer src={viewImage} onClose={() => setViewImage(null)} />}
    </div>
  );
}
