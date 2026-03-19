import { cn } from "@/lib/utils";
import { Eye, EyeOff, Pentagon, Minus, MapPin, Square, Circle, Type } from "lucide-react";
import type { MapAnnotation } from "./types";

interface MapEditorLayerPanelProps {
  annotations: MapAnnotation[];
  selectedId: string | null;
  fieldBoundaryId?: string; // In site mode, the primary polygon
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
}

const typeIcons: Record<MapAnnotation["type"], React.ReactNode> = {
  polygon: <Pentagon className="h-3.5 w-3.5" />,
  polyline: <Minus className="h-3.5 w-3.5" />,
  marker: <MapPin className="h-3.5 w-3.5" />,
  rectangle: <Square className="h-3.5 w-3.5" />,
  circle: <Circle className="h-3.5 w-3.5" />,
  text: <Type className="h-3.5 w-3.5" />,
};

export function MapEditorLayerPanel({
  annotations,
  selectedId,
  fieldBoundaryId,
  onSelect,
  onToggleVisibility,
}: MapEditorLayerPanelProps) {
  return (
    <div className="w-48 border-r bg-muted/30 overflow-y-auto flex-shrink-0">
      <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
        Layers
      </div>
      <div className="p-1">
        {annotations.length === 0 && (
          <div className="text-xs text-muted-foreground text-center py-4 px-2">
            No shapes yet. Use the toolbar to draw.
          </div>
        )}
        {annotations.map((a) => (
          <button
            key={a.id}
            type="button"
            className={cn(
              "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs hover:bg-accent transition-colors",
              selectedId === a.id && "bg-accent"
            )}
            onClick={() => onSelect(a.id)}
          >
            {/* Color swatch */}
            <div
              className="w-3 h-3 rounded-sm border flex-shrink-0"
              style={{
                backgroundColor: a.fillColor || a.strokeColor,
                borderColor: a.strokeColor,
              }}
            />
            {/* Type icon */}
            <span className="text-muted-foreground flex-shrink-0">{typeIcons[a.type]}</span>
            {/* Name */}
            <span className="truncate flex-1">
              {fieldBoundaryId === a.id ? "Field Boundary" : a.name}
            </span>
            {/* Visibility toggle */}
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground flex-shrink-0 p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                onToggleVisibility(a.id);
              }}
            >
              {a.visible ? (
                <Eye className="h-3 w-3" />
              ) : (
                <EyeOff className="h-3 w-3" />
              )}
            </button>
          </button>
        ))}
      </div>
    </div>
  );
}
