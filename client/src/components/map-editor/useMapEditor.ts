import { useState, useCallback, useRef } from "react";
import type { MapAnnotation, SiteAnnotations, DrawingTool } from "./types";
import { createDefaultAnnotation } from "./types";

// Measurement helpers
function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculatePerimeter(coords: number[][]): number {
  let perimeter = 0;
  for (let i = 0; i < coords.length; i++) {
    const next = coords[(i + 1) % coords.length];
    perimeter += haversineDistance(coords[i][0], coords[i][1], next[0], next[1]);
  }
  return perimeter;
}

function calculateArea(coords: number[][]): number {
  // Shoelface formula on projected coordinates
  if (coords.length < 3) return 0;
  const R = 6371000;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const lat1 = (coords[i][0] * Math.PI) / 180;
    const lat2 = (coords[j][0] * Math.PI) / 180;
    const dLng = ((coords[j][1] - coords[i][1]) * Math.PI) / 180;
    area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs((area * R * R) / 2);
}

export function sqMetersToAcres(sqMeters: number): number {
  return sqMeters / 4046.8564224;
}

export function metersToMiles(meters: number): number {
  return meters / 1609.344;
}

export function metersToFeet(meters: number): number {
  return meters * 3.28084;
}

export function useMapEditor(initialAnnotations?: SiteAnnotations | null) {
  const [annotations, setAnnotations] = useState<MapAnnotation[]>(
    initialAnnotations?.annotations || []
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<DrawingTool>("select");
  const overlayRefs = useRef<Map<string, any>>(new Map());

  const selected = annotations.find((a) => a.id === selectedId) || null;

  const addShape = useCallback(
    (type: MapAnnotation["type"], data: Partial<MapAnnotation>) => {
      const annotation = createDefaultAnnotation(type, data);
      // Auto-calculate measurements
      if (annotation.coordinates && annotation.coordinates.length >= 3 && type === "polygon") {
        annotation.area = calculateArea(annotation.coordinates);
        annotation.perimeter = calculatePerimeter(annotation.coordinates);
      }
      if (annotation.coordinates && type === "polyline") {
        let len = 0;
        for (let i = 1; i < annotation.coordinates.length; i++) {
          len += haversineDistance(
            annotation.coordinates[i - 1][0],
            annotation.coordinates[i - 1][1],
            annotation.coordinates[i][0],
            annotation.coordinates[i][1]
          );
        }
        annotation.perimeter = len;
      }
      if (type === "circle" && annotation.radius) {
        annotation.area = Math.PI * annotation.radius * annotation.radius;
        annotation.perimeter = 2 * Math.PI * annotation.radius;
      }
      if (type === "rectangle" && annotation.bounds) {
        const { n, s, e, w } = annotation.bounds;
        const width = haversineDistance(n, w, n, e);
        const height = haversineDistance(n, w, s, w);
        annotation.area = width * height;
        annotation.perimeter = 2 * (width + height);
      }
      setAnnotations((prev) => [...prev, annotation]);
      setSelectedId(annotation.id);
      setActiveTool("select");
      return annotation;
    },
    []
  );

  const removeShape = useCallback((id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
    setSelectedId((prev) => (prev === id ? null : prev));
    const overlay = overlayRefs.current.get(id);
    if (overlay) {
      if (typeof overlay.remove === 'function') overlay.remove();
      else if (typeof overlay.setMap === 'function') overlay.setMap(null);
    }
    overlayRefs.current.delete(id);
  }, []);

  const updateShape = useCallback((id: string, updates: Partial<MapAnnotation>) => {
    setAnnotations((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const updated = { ...a, ...updates };
        // Recalculate measurements if coordinates changed
        if (updates.coordinates && updated.type === "polygon" && updated.coordinates!.length >= 3) {
          updated.area = calculateArea(updated.coordinates!);
          updated.perimeter = calculatePerimeter(updated.coordinates!);
        }
        if (updates.coordinates && updated.type === "polyline") {
          let len = 0;
          for (let i = 1; i < updated.coordinates!.length; i++) {
            len += haversineDistance(
              updated.coordinates![i - 1][0],
              updated.coordinates![i - 1][1],
              updated.coordinates![i][0],
              updated.coordinates![i][1]
            );
          }
          updated.perimeter = len;
        }
        return updated;
      })
    );
  }, []);

  const selectShape = useCallback((id: string | null) => {
    setSelectedId(id);
  }, []);

  const setDrawingTool = useCallback((tool: DrawingTool) => {
    setActiveTool(tool);
    if (tool !== "select") {
      setSelectedId(null);
    }
  }, []);

  const toggleVisibility = useCallback((id: string) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, visible: !a.visible } : a))
    );
  }, []);

  const undoLast = useCallback(() => {
    setAnnotations((prev) => {
      if (prev.length === 0) return prev;
      const removed = prev[prev.length - 1];
      const overlay = overlayRefs.current.get(removed.id);
      if (overlay) {
        if (typeof overlay.remove === 'function') overlay.remove();
        else if (typeof overlay.setMap === 'function') overlay.setMap(null);
      }
      overlayRefs.current.delete(removed.id);
      return prev.slice(0, -1);
    });
  }, []);

  const serialize = useCallback((): SiteAnnotations => {
    return {
      version: 1,
      annotations: annotations.map(({ visible, ...rest }) => ({ ...rest, visible })),
    };
  }, [annotations]);

  const totalArea = annotations
    .filter((a) => a.area && a.visible)
    .reduce((sum, a) => sum + (a.area || 0), 0);

  return {
    annotations,
    selected,
    selectedId,
    activeTool,
    overlayRefs,
    totalArea,
    addShape,
    removeShape,
    updateShape,
    selectShape,
    setDrawingTool,
    toggleVisibility,
    undoLast,
    serialize,
    setAnnotations,
  };
}
