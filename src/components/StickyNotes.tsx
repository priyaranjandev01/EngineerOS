import { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Trash2, Maximize2 } from 'lucide-react';
import { DB } from '@/lib/storage';
import type { StickyNote } from '@/lib/types';
import { NotepadModal } from './NotepadModal';
import { toast } from 'sonner';

const colorOptions = [
  { id: 'yellow', bg: 'bg-yellow-500/10 border-yellow-500/20', dot: 'bg-yellow-500' },
  { id: 'green', bg: 'bg-emerald-500/10 border-emerald-500/20', dot: 'bg-emerald-500' },
  { id: 'blue', bg: 'bg-blue-500/10 border-blue-500/20', dot: 'bg-blue-500' },
  { id: 'pink', bg: 'bg-pink-500/10 border-pink-500/20', dot: 'bg-pink-500' },
  { id: 'orange', bg: 'bg-orange-500/10 border-orange-500/20', dot: 'bg-orange-500' },
] as const;

type NoteColor = typeof colorOptions[number]['id'];

function getColor(color: string) {
  return colorOptions.find(c => c.id === color) || colorOptions[0];
}

interface Props {
  notes: StickyNote[];
  onRefresh: () => void;
}

export function StickyNotes({ notes, onRefresh }: Props) {
  const [notepadId, setNotepadId] = useState<string | null>(null);

  const create = async (color: NoteColor = 'yellow') => {
    await DB.stickyNotes.save({ title: '', content: '', color, pinned: false });
    toast.success('Note created');
    onRefresh();
  };

  const update = async (id: string, data: Partial<StickyNote>) => {
    const existing = await DB.stickyNotes.get(id);
    if (existing) {
      await DB.stickyNotes.save({ ...existing, ...data });
      onRefresh();
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this note?')) return;
    await DB.stickyNotes.delete(id);
    toast.success('Note deleted');
    onRefresh();
  };

  const notepadNote = notes.find(n => n.id === notepadId);

  const pinned = notes.filter(n => n.pinned);
  const unpinned = notes.filter(n => !n.pinned);
  const sorted = [...pinned, ...unpinned];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground tracking-tight">Sticky Notes</h2>
        <div className="flex items-center gap-1">
          {colorOptions.map(c => (
            <button
              key={c.id}
              onClick={() => create(c.id)}
              className="p-1.5 rounded-md hover:bg-muted transition-colors active:scale-95"
              title={`New ${c.id} note`}
            >
              <div className={`h-3.5 w-3.5 rounded-full ${c.dot}`} />
            </button>
          ))}
          <button
            onClick={() => create('yellow')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors ml-1"
          >
            <Plus className="h-3.5 w-3.5" />
            New Note
          </button>
        </div>
      </div>

      {sorted.length === 0 && (
        <div className="surface-card p-8 text-center">
          <p className="text-sm text-muted-foreground">No sticky notes yet. Add important notes you want to keep handy.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {sorted.map((note, i) => {
          const color = getColor(note.color);
          return (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`rounded-lg border p-4 ${color.bg} relative group`}
            >
              <div className="flex items-start gap-2 mb-2">
                <input
                  value={note.title}
                  onChange={e => update(note.id, { title: e.target.value })}
                  placeholder="Note title..."
                  className="flex-1 bg-transparent text-sm font-semibold text-foreground placeholder:text-muted-foreground/50 outline-none"
                />
                <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => update(note.id, { pinned: !note.pinned })}
                    className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors ${
                      note.pinned ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {note.pinned ? '📌' : 'Pin'}
                  </button>
                  <button
                    onClick={() => setNotepadId(note.id)}
                    className="text-muted-foreground hover:text-foreground p-1 transition-colors"
                    title="Open in notepad"
                  >
                    <Maximize2 className="h-3.5 w-3.5" />
                  </button>
                  <button onClick={() => remove(note.id)} className="text-muted-foreground hover:text-destructive p-1 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Color picker */}
              <div className="flex gap-1 mb-2">
                {colorOptions.map(c => (
                  <button
                    key={c.id}
                    onClick={() => update(note.id, { color: c.id })}
                    className={`h-2.5 w-2.5 rounded-full ${c.dot} transition-transform ${note.color === c.id ? 'scale-125 ring-1 ring-offset-1 ring-offset-transparent ring-foreground/30' : 'opacity-50 hover:opacity-100'}`}
                  />
                ))}
              </div>

              <textarea
                value={note.content}
                onChange={e => update(note.id, { content: e.target.value })}
                placeholder="Write your note..."
                rows={4}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 outline-none resize-none leading-relaxed"
              />
              <div className="flex items-center justify-between mt-1">
                <span className="text-[10px] font-mono text-muted-foreground">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {notepadNote && (
        <NotepadModal
          title={notepadNote.title || 'Sticky Note'}
          value={notepadNote.content}
          onChange={v => update(notepadNote.id, { content: v })}
          onClose={() => setNotepadId(null)}
        />
      )}
    </div>
  );
}
