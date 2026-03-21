import { useRef, useState, useCallback } from 'react';
import { X, Maximize2, Minus, Plus } from 'lucide-react';
import type { WhiteboardImage } from '@/lib/whiteboard-types';

interface Props {
  image: WhiteboardImage;
  onUpdate: (id: string, updates: Partial<WhiteboardImage>) => void;
  onDelete: (id: string) => void;
  onView: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function WhiteboardImageCard({ image, onUpdate, onDelete, onView, containerRef }: Props) {
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDragging(true);

    const container = containerRef.current;
    if (!container) return;
    const contRect = container.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    offset.current = { x: clientX - image.x - contRect.left, y: clientY - image.y - contRect.top };

    const move = (ev: MouseEvent | TouchEvent) => {
      if ('touches' in ev) ev.preventDefault();
      const cx = 'touches' in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
      const cy = 'touches' in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;
      onUpdate(image.id, {
        x: cx - contRect.left - offset.current.x,
        y: cy - contRect.top - offset.current.y,
      });
    };

    const end = () => {
      setDragging(false);
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', end);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', end);
    };

    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', end);
  }, [image, onUpdate, containerRef]);

  const resize = (delta: number) => {
    const aspect = image.originalHeight / image.originalWidth;
    const newW = Math.max(60, Math.min(800, image.width + delta));
    onUpdate(image.id, { width: newW, height: newW * aspect });
  };

  return (
    <div
      className="absolute z-10 group select-none"
      style={{
        left: image.x,
        top: image.y,
        width: image.width,
        opacity: dragging ? 0.85 : 1,
      }}
    >
      {/* Controls */}
      <div className="absolute -top-7 left-0 right-0 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-0.5 bg-card/90 rounded px-1 py-0.5 border border-border shadow-sm">
          <button onClick={() => resize(-30)} className="p-0.5 text-muted-foreground hover:text-foreground"><Minus className="h-3 w-3" /></button>
          <button onClick={() => resize(30)} className="p-0.5 text-muted-foreground hover:text-foreground"><Plus className="h-3 w-3" /></button>
          <button onClick={onView} className="p-0.5 text-muted-foreground hover:text-foreground"><Maximize2 className="h-3 w-3" /></button>
          <button onClick={() => onDelete(image.id)} className="p-0.5 text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
        </div>
      </div>

      <img
        src={image.src}
        alt="Whiteboard image"
        className="w-full rounded shadow-md cursor-grab active:cursor-grabbing border border-border/30"
        style={{ height: image.height }}
        draggable={false}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      />
    </div>
  );
}
