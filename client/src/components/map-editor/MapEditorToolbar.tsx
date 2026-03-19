import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  MousePointer2,
  Pentagon,
  Minus,
  MapPin,
  Square,
  Circle,
  Type,
  Undo2,
} from "lucide-react";
import type { DrawingTool, MapTypeOption } from "./types";

interface MapEditorToolbarProps {
  activeTool: DrawingTool;
  mapType: MapTypeOption;
  onToolChange: (tool: DrawingTool) => void;
  onMapTypeChange: (type: MapTypeOption) => void;
  onUndo: () => void;
  canUndo: boolean;
}

const tools: { value: DrawingTool; icon: React.ReactNode; label: string }[] = [
  { value: "select", icon: <MousePointer2 className="h-4 w-4" />, label: "Select" },
  { value: "polygon", icon: <Pentagon className="h-4 w-4" />, label: "Polygon" },
  { value: "polyline", icon: <Minus className="h-4 w-4" />, label: "Polyline" },
  { value: "marker", icon: <MapPin className="h-4 w-4" />, label: "Marker" },
  { value: "rectangle", icon: <Square className="h-4 w-4" />, label: "Rectangle" },
  { value: "circle", icon: <Circle className="h-4 w-4" />, label: "Circle" },
  { value: "text", icon: <Type className="h-4 w-4" />, label: "Text" },
];

export function MapEditorToolbar({
  activeTool,
  mapType,
  onToolChange,
  onMapTypeChange,
  onUndo,
  canUndo,
}: MapEditorToolbarProps) {
  return (
    <div className="flex items-center gap-2 p-2 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Drawing Tools */}
      <ToggleGroup
        type="single"
        value={activeTool}
        onValueChange={(v) => v && onToolChange(v as DrawingTool)}
        className="gap-0.5"
      >
        {tools.map((t) => (
          <ToggleGroupItem
            key={t.value}
            value={t.value}
            aria-label={t.label}
            title={t.label}
            size="sm"
            className="h-8 w-8 p-0"
          >
            {t.icon}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>

      <div className="h-6 w-px bg-border mx-1" />

      {/* Undo */}
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo last shape"
      >
        <Undo2 className="h-4 w-4" />
      </Button>

      <div className="flex-1" />

      {/* Map Type */}
      <ToggleGroup
        type="single"
        value={mapType}
        onValueChange={(v) => v && onMapTypeChange(v as MapTypeOption)}
        className="gap-0.5"
      >
        <ToggleGroupItem value="satellite" size="sm" className="h-7 text-xs px-2">
          Satellite
        </ToggleGroupItem>
        <ToggleGroupItem value="hybrid" size="sm" className="h-7 text-xs px-2">
          Hybrid
        </ToggleGroupItem>
        <ToggleGroupItem value="terrain" size="sm" className="h-7 text-xs px-2">
          Terrain
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
}
