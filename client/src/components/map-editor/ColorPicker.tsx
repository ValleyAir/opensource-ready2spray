import { Input } from "@/components/ui/input";
import { PRESET_COLORS } from "./types";
import { cn } from "@/lib/utils";

interface ColorPickerProps {
  color: string;
  opacity?: number;
  onChange: (color: string) => void;
  onOpacityChange?: (opacity: number) => void;
  label?: string;
}

export function ColorPicker({ color, opacity, onChange, onOpacityChange, label }: ColorPickerProps) {
  return (
    <div className="space-y-2">
      {label && <div className="text-xs font-medium text-muted-foreground">{label}</div>}
      <div className="grid grid-cols-6 gap-1">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            className={cn(
              "w-6 h-6 rounded border cursor-pointer transition-transform hover:scale-110",
              color === c && "ring-2 ring-primary ring-offset-1"
            )}
            style={{ backgroundColor: c }}
            onClick={() => onChange(c)}
          />
        ))}
      </div>
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded border flex-shrink-0"
          style={{ backgroundColor: color }}
        />
        <Input
          value={color}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 text-xs font-mono"
          placeholder="#000000"
        />
      </div>
      {onOpacityChange !== undefined && opacity !== undefined && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-14">Opacity</span>
          <input
            type="range"
            min="0"
            max="100"
            value={Math.round(opacity * 100)}
            onChange={(e) => onOpacityChange(parseInt(e.target.value) / 100)}
            className="flex-1 h-1.5 accent-primary"
          />
          <span className="text-xs text-muted-foreground w-8 text-right">
            {Math.round(opacity * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
