export interface MapAnnotation {
  id: string;
  type: "polygon" | "polyline" | "marker" | "rectangle" | "circle" | "text";
  name: string;
  coordinates?: number[][]; // [lat, lng] pairs
  radius?: number; // For circles (meters)
  bounds?: { n: number; s: number; e: number; w: number }; // For rectangles
  strokeColor: string;
  strokeOpacity: number;
  strokeWeight: number;
  fillColor?: string;
  fillOpacity?: number;
  icon?: string; // Predefined icon key for markers
  text?: string; // For text annotations
  fontSize?: number;
  area?: number; // Auto-calculated sq meters
  perimeter?: number; // Auto-calculated meters
  visible: boolean;
}

export interface SiteAnnotations {
  version: 1;
  annotations: MapAnnotation[];
}

export type DrawingTool =
  | "select"
  | "polygon"
  | "polyline"
  | "marker"
  | "rectangle"
  | "circle"
  | "text";

export type MapTypeOption = "satellite" | "hybrid" | "terrain";

export const PRESET_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#ffffff", // white
  "#000000", // black
  "#6b7280", // gray
  "#92400e", // brown
] as const;

export const AERIAL_ICONS = {
  water_source: { label: "Water Source", color: "#3b82f6" },
  power_line: { label: "Power Line", color: "#eab308" },
  no_fly_zone: { label: "No-Fly Zone", color: "#ef4444" },
  loading_zone: { label: "Loading Zone", color: "#f97316" },
  wind_sock: { label: "Wind Sock", color: "#06b6d4" },
  sensitive_area: { label: "Sensitive Area", color: "#eab308" },
  obstacle: { label: "Obstacle", color: "#ef4444" },
  home_base: { label: "Home Base", color: "#22c55e" },
  turnaround: { label: "Turnaround", color: "#8b5cf6" },
  runway: { label: "Runway", color: "#6b7280" },
} as const;

export type AerialIconKey = keyof typeof AERIAL_ICONS;

export function createDefaultAnnotation(
  type: MapAnnotation["type"],
  overrides?: Partial<MapAnnotation>
): MapAnnotation {
  return {
    id: crypto.randomUUID(),
    type,
    name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${Date.now().toString(36).slice(-4)}`,
    strokeColor: "#3b82f6",
    strokeOpacity: 1,
    strokeWeight: 2,
    fillColor: "#3b82f6",
    fillOpacity: 0.25,
    visible: true,
    ...overrides,
  };
}
