import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { MapAnnotation } from "./types";
import { ColorPicker } from "./ColorPicker";
import { IconPalette } from "./IconPalette";
import { sqMetersToAcres, metersToMiles, metersToFeet } from "./useMapEditor";
import type { AerialIconKey } from "./types";

interface MapEditorPropertiesPanelProps {
  selected: MapAnnotation | null;
  isFieldBoundary?: boolean;
  onUpdate: (id: string, updates: Partial<MapAnnotation>) => void;
  onDelete: (id: string) => void;
}

export function MapEditorPropertiesPanel({
  selected,
  isFieldBoundary,
  onUpdate,
  onDelete,
}: MapEditorPropertiesPanelProps) {
  if (!selected) {
    return (
      <div className="w-56 border-l bg-muted/30 flex-shrink-0 flex items-center justify-center">
        <p className="text-xs text-muted-foreground text-center px-4">
          Select a shape to edit its properties
        </p>
      </div>
    );
  }

  const formatArea = (sqm?: number) => {
    if (!sqm) return "—";
    const acres = sqMetersToAcres(sqm);
    return acres >= 1 ? `${acres.toFixed(2)} ac` : `${sqm.toFixed(0)} m²`;
  };

  const formatLength = (m?: number) => {
    if (!m) return "—";
    if (m > 1609) return `${metersToMiles(m).toFixed(2)} mi`;
    return `${metersToFeet(m).toFixed(0)} ft`;
  };

  return (
    <div className="w-56 border-l bg-muted/30 flex-shrink-0 overflow-y-auto">
      <div className="p-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b">
        Properties
      </div>
      <div className="p-3 space-y-3">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Name</label>
          <Input
            value={selected.name}
            onChange={(e) => onUpdate(selected.id, { name: e.target.value })}
            className="h-7 text-xs"
          />
        </div>

        {/* Type badge */}
        <Badge variant="outline" className="text-xs">
          {selected.type}
        </Badge>

        {/* Measurements */}
        {(selected.type === "polygon" || selected.type === "rectangle" || selected.type === "circle") && (
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Area</span>
              <span className="font-medium">{formatArea(selected.area)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Perimeter</span>
              <span className="font-medium">{formatLength(selected.perimeter)}</span>
            </div>
          </div>
        )}

        {selected.type === "polyline" && (
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Length</span>
              <span className="font-medium">{formatLength(selected.perimeter)}</span>
            </div>
          </div>
        )}

        {/* Stroke Color */}
        <ColorPicker
          label="Stroke"
          color={selected.strokeColor}
          onChange={(c) => onUpdate(selected.id, { strokeColor: c })}
        />

        {/* Fill Color (for area shapes) */}
        {(selected.type === "polygon" || selected.type === "rectangle" || selected.type === "circle") && (
          <ColorPicker
            label="Fill"
            color={selected.fillColor || "#3b82f6"}
            opacity={selected.fillOpacity ?? 0.25}
            onChange={(c) => onUpdate(selected.id, { fillColor: c })}
            onOpacityChange={(o) => onUpdate(selected.id, { fillOpacity: o })}
          />
        )}

        {/* Icon selector (markers only) */}
        {selected.type === "marker" && (
          <IconPalette
            selected={selected.icon}
            onSelect={(icon: AerialIconKey) => onUpdate(selected.id, { icon })}
          />
        )}

        {/* Text content (text annotations) */}
        {selected.type === "text" && (
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Text</label>
            <Input
              value={selected.text || ""}
              onChange={(e) => onUpdate(selected.id, { text: e.target.value })}
              className="h-7 text-xs"
              placeholder="Label text..."
            />
          </div>
        )}

        {/* Delete */}
        {!isFieldBoundary && (
          <Button
            variant="destructive"
            size="sm"
            className="w-full mt-4"
            onClick={() => onDelete(selected.id)}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1" />
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
