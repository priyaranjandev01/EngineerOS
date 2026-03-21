import { useRef, useState, useCallback } from 'react';
import { X } from 'lucide-react';
import type { WhiteboardNote } from '@/lib/whiteboard-types';

interface Props {
  note: WhiteboardNote;
  onUpdate: (id: string, updates: Partial<WhiteboardNote>) => void;
  onDelete: (id: string) => void;
  containerRef: React.RefObject<HTMLDivElement>;
}

export function WhiteboardNoteCard({ note, onUpdate, onDelete, containerRef }: Props) {
  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  const startDrag = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    offset.current = { x: clientX - note.x, y: clientY - note.y };

    const container = containerRef.current;
    if (!container) return;
    const contRect = container.getBoundingClientRect();

    const move = (ev: MouseEvent | TouchEvent) => {
      const cx = 'touches' in ev ? ev.touches[0].clientX : (ev as MouseEvent).clientX;
      const cy = 'touches' in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;
      const newX = Math.max(0, cx - contRect.left - offset.current.x + contRect.left);
      const newY = Math.max(0, cy - contRect.top - offset.current.y + contRect.top);
      onUpdate(note.id, { x: cx - contRect.left - (offset.current.x - contRect.left), y: cy - contRect.top - (offset.current.y - contRect.top) });
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
  }, [note, onUpdate, containerRef]);

  return (
    <div
      className="absolute z-10 rounded-md shadow-lg flex flex-col select-none"
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        minHeight: note.height,
        backgroundColor: note.color,
        opacity: dragging ? 0.85 : 1,
      }}
    >
      <div
        className="flex items-center justify-between px-2 py-1 cursor-grab active:cursor-grabbing"
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        <span className="text-[10px] font-medium text-gray-700 select-none">Note</span>
        <button
          onClick={() => onDelete(note.id)}
          className="text-gray-500 hover:text-gray-800 p-0.5"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      <textarea
        value={note.content}
        onChange={e => onUpdate(note.id, { content: e.target.value })}
        placeholder="Write a note..."
        className="flex-1 bg-transparent text-xs text-gray-800 px-2 pb-2 outline-none resize-none min-h-[60px] placeholder:text-gray-400"
        style={{ touchAction: 'auto' }}
      />
    </div>
  );
}
