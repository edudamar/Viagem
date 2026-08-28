import { useState } from "react";
import { ChevronDown, ChevronRight, AlertTriangle, Check, Edit3, Trash2 } from "lucide-react";
import type { ChecklistItem } from "@/types";
import { cn } from "@/utils/helpers";

type Props = {
  grupo: string;
  items: ChecklistItem[];
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onEdit: () => void;
  onRemoveGroup: () => void;
};

export function ChecklistGroup({ grupo, items, onToggle, onRemove, onEdit, onRemoveGroup }: Props) {
  const [open, setOpen] = useState(true);
  const done = items.filter((i) => i.done).length;
  const total = items.length;
  const pct = total > 0 ? (done / total) * 100 : 0;

  return (
    <div className="bg-surface overflow-hidden rounded-xl border border-border">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          {open ? <ChevronDown className="text-text-muted h-4 w-4" /> : <ChevronRight className="text-text-muted h-4 w-4" />}
          <span className="font-medium">{grupo}</span>
          <span className="text-text-muted text-xs">
            {done}/{total}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="text-text-muted hover:text-primary p-1"
          >
            <Edit3 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveGroup(); }}
            className="text-text-muted hover:text-red-500 p-1"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </button>
      {open && (
        <div className="border-t border-border">
          {items.length === 0 ? (
            <p className="text-text-muted px-4 py-3 text-center text-xs">Nenhum item neste grupo.</p>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center gap-3 border-b border-border/50 px-4 py-2.5 last:border-b-0">
                <button
                  onClick={() => onToggle(item.id)}
                  className={cn(
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    item.done ? "border-primary bg-primary" : "border-gray-300 hover:border-primary",
                  )}
                >
                  {item.done && <Check className="h-3 w-3 text-white" />}
                </button>
                <span className={cn("flex-1 text-sm", item.done && "text-text-muted line-through")}>
                  {item.urgente && (
                    <AlertTriangle className="mr-1 inline h-3.5 w-3.5 text-amber-500" />
                  )}
                  {item.titulo}
                </span>
                <button
                  onClick={() => onRemove(item.id)}
                  className="text-text-muted hover:text-red-500 text-xs"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
