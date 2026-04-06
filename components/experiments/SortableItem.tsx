import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, X } from "lucide-react";

export function SortableItem({ sensor, onRemove }: { sensor: any; onRemove: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: sensor.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 ${isDragging ? "shadow-lg border-primary ring-1 ring-primary/20" : ""
        }`}
    >
      <div className="flex items-center gap-3">
        {/* Drag Handle */}
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-primary"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="flex flex-col">
          <span className="text-sm font-medium text-primary">{sensor.name}</span>
          <span className="text-xs text-muted-foreground">{sensor.channelCount} Channels</span>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-1.5 hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}