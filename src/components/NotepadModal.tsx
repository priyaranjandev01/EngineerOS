import { X } from 'lucide-react';

interface Props {
  title: string;
  value: string;
  onChange: (v: string) => void;
  onClose: () => void;
  readOnly?: boolean;
}

export function NotepadModal({ title, value, onChange, onClose, readOnly }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-3xl mx-4 bg-card border border-border rounded-lg shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 transition-colors active:scale-95">
            <X className="h-4 w-4" />
          </button>
        </div>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Write here..."
          readOnly={readOnly}
          autoFocus
          className="w-full h-96 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 p-4 outline-none resize-none font-mono leading-relaxed"
        />
      </div>
    </div>
  );
}
