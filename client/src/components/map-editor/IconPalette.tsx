import type { ReactElement } from "react";
import { AERIAL_ICONS, type AerialIconKey } from "./types";
import { cn } from "@/lib/utils";

interface IconPaletteProps {
  selected?: string;
  onSelect: (icon: AerialIconKey) => void;
}

const iconSvgs: Record<AerialIconKey, (color: string) => ReactElement> = {
  water_source: (c) => (
    <svg viewBox="0 0 24 24" fill={c} className="w-5 h-5">
      <path d="M12 2C8 8 4 12.5 4 16a8 8 0 0016 0c0-3.5-4-8-8-14z" />
    </svg>
  ),
  power_line: (c) => (
    <svg viewBox="0 0 24 24" fill={c} className="w-5 h-5">
      <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" />
    </svg>
  ),
  no_fly_zone: (c) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
    </svg>
  ),
  loading_zone: (c) => (
    <svg viewBox="0 0 24 24" fill={c} className="w-5 h-5">
      <path d="M12 3v12m0 0l-4-4m4 4l4-4M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2" stroke={c} fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  wind_sock: (c) => (
    <svg viewBox="0 0 24 24" fill={c} className="w-5 h-5">
      <path d="M4 4v16M4 4l12 3-12 6" />
    </svg>
  ),
  sensitive_area: (c) => (
    <svg viewBox="0 0 24 24" fill={c} className="w-5 h-5">
      <path d="M12 2L1 21h22L12 2zm0 6v6m0 2v2" stroke={c} fill="none" strokeWidth="2" strokeLinecap="round" />
    </svg>
  ),
  obstacle: (c) => (
    <svg viewBox="0 0 24 24" fill={c} className="w-5 h-5">
      <path d="M12 2l10 10-10 10L2 12 12 2z" fill="none" stroke={c} strokeWidth="2" />
      <line x1="12" y1="8" x2="12" y2="14" stroke={c} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill={c} />
    </svg>
  ),
  home_base: (c) => (
    <svg viewBox="0 0 24 24" fill={c} className="w-5 h-5">
      <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  turnaround: (c) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" className="w-5 h-5">
      <path d="M9 14l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 10h11a4 4 0 010 8h-1" strokeLinecap="round" />
    </svg>
  ),
  runway: (c) => (
    <svg viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" className="w-5 h-5">
      <line x1="4" y1="12" x2="20" y2="12" />
      <polyline points="16,8 20,12 16,16" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="8" x2="12" y2="16" strokeDasharray="2 2" />
    </svg>
  ),
};

export function IconPalette({ selected, onSelect }: IconPaletteProps) {
  return (
    <div className="space-y-1">
      <div className="text-xs font-medium text-muted-foreground">Icon</div>
      <div className="grid grid-cols-5 gap-1">
        {(Object.entries(AERIAL_ICONS) as [AerialIconKey, { label: string; color: string }][]).map(
          ([key, { label, color }]) => (
            <button
              key={key}
              type="button"
              title={label}
              className={cn(
                "w-8 h-8 rounded flex items-center justify-center border cursor-pointer transition-colors hover:bg-accent",
                selected === key && "ring-2 ring-primary bg-accent"
              )}
              onClick={() => onSelect(key)}
            >
              {iconSvgs[key](color)}
            </button>
          )
        )}
      </div>
    </div>
  );
}

/** Render an icon SVG as a data URL for use in marker pins */
export function getIconDataUrl(iconKey: AerialIconKey, size = 32): string {
  const info = AERIAL_ICONS[iconKey];
  const svgStrings: Record<AerialIconKey, string> = {
    water_source: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${info.color}" width="${size}" height="${size}"><path d="M12 2C8 8 4 12.5 4 16a8 8 0 0016 0c0-3.5-4-8-8-14z"/></svg>`,
    power_line: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${info.color}" width="${size}" height="${size}"><path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z"/></svg>`,
    no_fly_zone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${info.color}" stroke-width="2" width="${size}" height="${size}"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>`,
    loading_zone: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="${info.color}" fill="none" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}"><path d="M12 3v12m0 0l-4-4m4 4l4-4M5 17v2a2 2 0 002 2h10a2 2 0 002-2v-2"/></svg>`,
    wind_sock: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${info.color}" width="${size}" height="${size}"><path d="M4 4v16M4 4l12 3-12 6"/></svg>`,
    sensitive_area: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" stroke="${info.color}" fill="none" stroke-width="2" stroke-linecap="round" width="${size}" height="${size}"><path d="M12 2L1 21h22L12 2zm0 6v6m0 2v2"/></svg>`,
    obstacle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${size}" height="${size}"><path d="M12 2l10 10-10 10L2 12 12 2z" fill="none" stroke="${info.color}" stroke-width="2"/><line x1="12" y1="8" x2="12" y2="14" stroke="${info.color}" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17" r="1" fill="${info.color}"/></svg>`,
    home_base: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${info.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="${size}" height="${size}"><path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3v-6h6v6h3a1 1 0 001-1V10"/></svg>`,
    turnaround: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${info.color}" stroke-width="2" stroke-linecap="round" width="${size}" height="${size}"><path d="M9 14l-4-4 4-4"/><path d="M5 10h11a4 4 0 010 8h-1"/></svg>`,
    runway: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${info.color}" stroke-width="2" width="${size}" height="${size}"><line x1="4" y1="12" x2="20" y2="12"/><polyline points="16,8 20,12 16,16" stroke-linecap="round" stroke-linejoin="round"/><line x1="12" y1="8" x2="12" y2="16" stroke-dasharray="2 2"/></svg>`,
  };
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgStrings[iconKey])}`;
}
