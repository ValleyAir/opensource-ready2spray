import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useRef, useCallback, useState } from "react";
import { MapView } from "@/components/Map";
import { MapEditorToolbar } from "./MapEditorToolbar";
import { MapEditorLayerPanel } from "./MapEditorLayerPanel";
import { MapEditorPropertiesPanel } from "./MapEditorPropertiesPanel";
import { useMapEditor, sqMetersToAcres } from "./useMapEditor";
import { getIconDataUrl } from "./IconPalette";
import type {
  MapAnnotation,
  SiteAnnotations,
  DrawingTool,
  MapTypeOption,
  AerialIconKey,
} from "./types";
import { createDefaultAnnotation, AERIAL_ICONS } from "./types";

interface MapEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    polygon?: any; // GeoJSON polygon for field boundary (site mode)
    annotations: SiteAnnotations;
    centerLat?: string;
    centerLng?: string;
    acres?: number;
  }) => void;
  initialPolygon?: any;
  initialCenter?: { lat: number; lng: number };
  initialAnnotations?: SiteAnnotations | null;
  mode: "site" | "standalone";
  title?: string;
}

export function MapEditor({
  open,
  onOpenChange,
  onSave,
  initialPolygon,
  initialCenter,
  initialAnnotations,
  mode,
  title = "Map Editor",
}: MapEditorProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const [mapType, setMapType] = useState<MapTypeOption>("satellite");
  const [fieldBoundaryId, setFieldBoundaryId] = useState<string | null>(null);

  const {
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
  } = useMapEditor(initialAnnotations);

  // Convert DrawingTool to Google Maps overlay type
  const toolToOverlayType = (tool: DrawingTool): google.maps.drawing.OverlayType | null => {
    switch (tool) {
      case "polygon": return google.maps.drawing.OverlayType.POLYGON;
      case "polyline": return google.maps.drawing.OverlayType.POLYLINE;
      case "marker": return google.maps.drawing.OverlayType.MARKER;
      case "rectangle": return google.maps.drawing.OverlayType.RECTANGLE;
      case "circle": return google.maps.drawing.OverlayType.CIRCLE;
      default: return null;
    }
  };

  // Apply style updates to Google Maps overlays
  const applyOverlayStyle = useCallback((id: string, ann: MapAnnotation) => {
    const overlay = overlayRefs.current.get(id);
    if (!overlay) return;

    if (ann.type === "polygon" || ann.type === "rectangle") {
      const shape = overlay as google.maps.Polygon | google.maps.Rectangle;
      shape.setOptions({
        strokeColor: ann.strokeColor,
        strokeOpacity: ann.strokeOpacity,
        strokeWeight: ann.strokeWeight,
        fillColor: ann.fillColor,
        fillOpacity: ann.fillOpacity,
        visible: ann.visible,
      });
    } else if (ann.type === "polyline") {
      const shape = overlay as google.maps.Polyline;
      shape.setOptions({
        strokeColor: ann.strokeColor,
        strokeOpacity: ann.strokeOpacity,
        strokeWeight: ann.strokeWeight,
        visible: ann.visible,
      });
    } else if (ann.type === "circle") {
      const shape = overlay as google.maps.Circle;
      shape.setOptions({
        strokeColor: ann.strokeColor,
        strokeOpacity: ann.strokeOpacity,
        strokeWeight: ann.strokeWeight,
        fillColor: ann.fillColor,
        fillOpacity: ann.fillOpacity,
        visible: ann.visible,
      });
    }
  }, [overlayRefs]);

  // Sync overlay styles when annotations change
  useEffect(() => {
    annotations.forEach((ann) => {
      applyOverlayStyle(ann.id, ann);
    });
  }, [annotations, applyOverlayStyle]);

  // Update drawing manager when active tool changes
  useEffect(() => {
    if (!drawingManagerRef.current) return;
    const overlayType = toolToOverlayType(activeTool);
    drawingManagerRef.current.setDrawingMode(overlayType);
  }, [activeTool]);

  // Update map type
  useEffect(() => {
    if (!mapRef.current) return;
    const types: Record<MapTypeOption, google.maps.MapTypeId> = {
      satellite: google.maps.MapTypeId.SATELLITE,
      hybrid: google.maps.MapTypeId.HYBRID,
      terrain: google.maps.MapTypeId.TERRAIN,
    };
    mapRef.current.setMapTypeId(types[mapType]);
  }, [mapType]);

  const handleMapReady = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;
      map.setMapTypeId(google.maps.MapTypeId.SATELLITE);

      // Set up Drawing Manager
      const drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: null,
        drawingControl: false, // We use our own toolbar
        polygonOptions: {
          strokeColor: "#3b82f6",
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: "#3b82f6",
          fillOpacity: 0.25,
          editable: true,
        },
        polylineOptions: {
          strokeColor: "#3b82f6",
          strokeOpacity: 1,
          strokeWeight: 2,
          editable: true,
        },
        rectangleOptions: {
          strokeColor: "#3b82f6",
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: "#3b82f6",
          fillOpacity: 0.25,
          editable: true,
        },
        circleOptions: {
          strokeColor: "#3b82f6",
          strokeOpacity: 1,
          strokeWeight: 2,
          fillColor: "#3b82f6",
          fillOpacity: 0.25,
          editable: true,
        },
      });
      drawingManager.setMap(map);
      drawingManagerRef.current = drawingManager;

      // Handle shape completion
      google.maps.event.addListener(drawingManager, "overlaycomplete", (event: any) => {
        const overlay = event.overlay;
        let shapeData: Partial<MapAnnotation> = {};

        switch (event.type) {
          case google.maps.drawing.OverlayType.POLYGON: {
            const poly = overlay as google.maps.Polygon;
            const path = poly.getPath();
            const coords = path.getArray().map((p: google.maps.LatLng) => [p.lat(), p.lng()]);
            shapeData = { type: "polygon", coordinates: coords };
            break;
          }
          case google.maps.drawing.OverlayType.POLYLINE: {
            const line = overlay as google.maps.Polyline;
            const path = line.getPath();
            const coords = path.getArray().map((p: google.maps.LatLng) => [p.lat(), p.lng()]);
            shapeData = { type: "polyline", coordinates: coords };
            break;
          }
          case google.maps.drawing.OverlayType.MARKER: {
            const marker = overlay as google.maps.marker.AdvancedMarkerElement | google.maps.Marker;
            let pos: google.maps.LatLng | google.maps.LatLngLiteral | null | undefined;
            if ("position" in marker) {
              pos = marker.position as google.maps.LatLng;
            }
            if (pos) {
              const lat = typeof pos.lat === "function" ? pos.lat() : (pos as any).lat;
              const lng = typeof pos.lng === "function" ? pos.lng() : (pos as any).lng;
              shapeData = { type: "marker", coordinates: [[lat, lng]] };
            }
            // Remove the default marker; we'll render our own
            overlay.setMap(null);
            break;
          }
          case google.maps.drawing.OverlayType.RECTANGLE: {
            const rect = overlay as google.maps.Rectangle;
            const bounds = rect.getBounds()!;
            const ne = bounds.getNorthEast();
            const sw = bounds.getSouthWest();
            shapeData = {
              type: "rectangle",
              bounds: { n: ne.lat(), s: sw.lat(), e: ne.lng(), w: sw.lng() },
            };
            break;
          }
          case google.maps.drawing.OverlayType.CIRCLE: {
            const circle = overlay as google.maps.Circle;
            const center = circle.getCenter()!;
            shapeData = {
              type: "circle",
              coordinates: [[center.lat(), center.lng()]],
              radius: circle.getRadius(),
            };
            break;
          }
        }

        const ann = addShape(shapeData.type || "polygon", shapeData);

        // Store overlay ref (markers are handled separately)
        if (event.type !== google.maps.drawing.OverlayType.MARKER) {
          overlayRefs.current.set(ann.id, overlay);

          // Add click listener for selection
          google.maps.event.addListener(overlay, "click", () => {
            selectShape(ann.id);
          });
        }
      });

      // Load initial polygon (site mode)
      if (initialPolygon && mode === "site") {
        loadInitialPolygon(map, initialPolygon);
      }

      // Load initial annotations
      if (initialAnnotations?.annotations) {
        initialAnnotations.annotations.forEach((ann) => {
          renderAnnotationOverlay(map, ann);
        });
      }

      // Center map
      if (initialCenter) {
        map.setCenter(initialCenter);
        map.setZoom(16);
      }
    },
    [initialPolygon, initialCenter, initialAnnotations, mode, addShape, selectShape, overlayRefs]
  );

  // Load initial polygon as a field boundary annotation
  const loadInitialPolygon = (map: google.maps.Map, polygonData: any) => {
    let coords: number[][] = [];

    if (polygonData.type === "Polygon" && polygonData.coordinates) {
      coords = polygonData.coordinates[0].map((c: number[]) => [c[1], c[0]]); // GeoJSON [lng,lat] -> [lat,lng]
    } else if (polygonData.type === "MultiPolygon" && polygonData.coordinates) {
      coords = polygonData.coordinates[0][0].map((c: number[]) => [c[1], c[0]]);
    } else if (Array.isArray(polygonData)) {
      coords = polygonData.map((c: any) =>
        Array.isArray(c) ? [c[1], c[0]] : [c.lat, c.lng]
      );
    }

    if (coords.length < 3) return;

    const ann = createDefaultAnnotation("polygon", {
      coordinates: coords,
      name: "Field Boundary",
      strokeColor: "#22c55e",
      fillColor: "#22c55e",
      fillOpacity: 0.15,
    });

    // Calculate measurements
    const R = 6371000;
    let area = 0;
    for (let i = 0; i < coords.length; i++) {
      const j = (i + 1) % coords.length;
      const lat1 = (coords[i][0] * Math.PI) / 180;
      const lat2 = (coords[j][0] * Math.PI) / 180;
      const dLng = ((coords[j][1] - coords[i][1]) * Math.PI) / 180;
      area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
    }
    ann.area = Math.abs((area * R * R) / 2);

    setFieldBoundaryId(ann.id);
    setAnnotations((prev) => [ann, ...prev]);

    // Render on map
    const path = coords.map((c) => ({ lat: c[0], lng: c[1] }));
    const poly = new google.maps.Polygon({
      paths: path,
      strokeColor: ann.strokeColor,
      strokeOpacity: ann.strokeOpacity,
      strokeWeight: ann.strokeWeight,
      fillColor: ann.fillColor,
      fillOpacity: ann.fillOpacity,
      editable: true,
      map,
    });
    overlayRefs.current.set(ann.id, poly);

    google.maps.event.addListener(poly, "click", () => selectShape(ann.id));

    // Fit map to polygon
    const bounds = new google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds);
  };

  // Render an annotation as a Google Maps overlay
  const renderAnnotationOverlay = (map: google.maps.Map, ann: MapAnnotation) => {
    switch (ann.type) {
      case "polygon": {
        if (!ann.coordinates) return;
        const path = ann.coordinates.map((c) => ({ lat: c[0], lng: c[1] }));
        const poly = new google.maps.Polygon({
          paths: path,
          strokeColor: ann.strokeColor,
          strokeOpacity: ann.strokeOpacity,
          strokeWeight: ann.strokeWeight,
          fillColor: ann.fillColor,
          fillOpacity: ann.fillOpacity,
          editable: true,
          visible: ann.visible,
          map,
        });
        overlayRefs.current.set(ann.id, poly);
        google.maps.event.addListener(poly, "click", () => selectShape(ann.id));
        break;
      }
      case "polyline": {
        if (!ann.coordinates) return;
        const path = ann.coordinates.map((c) => ({ lat: c[0], lng: c[1] }));
        const line = new google.maps.Polyline({
          path,
          strokeColor: ann.strokeColor,
          strokeOpacity: ann.strokeOpacity,
          strokeWeight: ann.strokeWeight,
          editable: true,
          visible: ann.visible,
          map,
        });
        overlayRefs.current.set(ann.id, line);
        google.maps.event.addListener(line, "click", () => selectShape(ann.id));
        break;
      }
      case "rectangle": {
        if (!ann.bounds) return;
        const rect = new google.maps.Rectangle({
          bounds: {
            north: ann.bounds.n,
            south: ann.bounds.s,
            east: ann.bounds.e,
            west: ann.bounds.w,
          },
          strokeColor: ann.strokeColor,
          strokeOpacity: ann.strokeOpacity,
          strokeWeight: ann.strokeWeight,
          fillColor: ann.fillColor,
          fillOpacity: ann.fillOpacity,
          editable: true,
          visible: ann.visible,
          map,
        });
        overlayRefs.current.set(ann.id, rect);
        google.maps.event.addListener(rect, "click", () => selectShape(ann.id));
        break;
      }
      case "circle": {
        if (!ann.coordinates?.[0]) return;
        const circle = new google.maps.Circle({
          center: { lat: ann.coordinates[0][0], lng: ann.coordinates[0][1] },
          radius: ann.radius || 100,
          strokeColor: ann.strokeColor,
          strokeOpacity: ann.strokeOpacity,
          strokeWeight: ann.strokeWeight,
          fillColor: ann.fillColor,
          fillOpacity: ann.fillOpacity,
          editable: true,
          visible: ann.visible,
          map,
        });
        overlayRefs.current.set(ann.id, circle);
        google.maps.event.addListener(circle, "click", () => selectShape(ann.id));
        break;
      }
      // Markers and text are rendered via the marker rendering effect below
    }
  };

  // Build a fingerprint for marker/text annotations so we can detect property changes
  const markerFingerprint = useCallback((ann: MapAnnotation) => {
    return `${ann.icon || ""}|${ann.text || ""}|${ann.strokeColor}|${ann.visible}|${ann.fontSize || 12}`;
  }, []);

  // Track fingerprints to detect when marker content needs rebuilding
  const markerFingerprintsRef = useRef<Map<string, string>>(new Map());

  // Render markers (including text and icon markers) using AdvancedMarkerElement
  useEffect(() => {
    if (!mapRef.current) return;

    annotations
      .filter((a) => a.type === "marker" || a.type === "text")
      .forEach((ann) => {
        const fp = markerFingerprint(ann);
        const existingFp = markerFingerprintsRef.current.get(ann.id);

        // If already rendered and nothing changed, skip
        if (overlayRefs.current.has(ann.id) && existingFp === fp) {
          return;
        }

        // If fingerprint changed, destroy old marker first
        if (overlayRefs.current.has(ann.id)) {
          const old = overlayRefs.current.get(ann.id) as any;
          if (old) {
            if ("map" in old) old.map = null;
            else if ("setMap" in old) old.setMap(null);
          }
          overlayRefs.current.delete(ann.id);
        }

        if (!ann.coordinates?.[0]) return;

        const pos = { lat: ann.coordinates[0][0], lng: ann.coordinates[0][1] };

        // Build content element
        const content = document.createElement("div");

        if (ann.type === "text") {
          content.style.cssText = `
            background: rgba(0,0,0,0.75);
            color: white;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: ${ann.fontSize || 12}px;
            white-space: nowrap;
            font-weight: 500;
          `;
          content.textContent = ann.text || "Label";
        } else if (ann.icon && ann.icon in AERIAL_ICONS) {
          const img = document.createElement("img");
          img.src = getIconDataUrl(ann.icon as AerialIconKey);
          img.style.cssText = "width: 32px; height: 32px;";
          content.appendChild(img);
        } else {
          // Default pin
          content.style.cssText = `
            width: 12px; height: 12px;
            background: ${ann.strokeColor};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 1px 3px rgba(0,0,0,0.4);
          `;
        }

        try {
          const marker = new google.maps.marker.AdvancedMarkerElement({
            map: ann.visible ? mapRef.current : null,
            position: pos,
            content,
            title: ann.name,
          });

          marker.addListener("click", () => selectShape(ann.id));
          overlayRefs.current.set(ann.id, marker as any);
        } catch {
          // Fallback: regular marker
          const marker = new google.maps.Marker({
            map: ann.visible ? mapRef.current! : null,
            position: pos,
            title: ann.name,
          });
          marker.addListener("click", () => selectShape(ann.id));
          overlayRefs.current.set(ann.id, marker);
        }

        markerFingerprintsRef.current.set(ann.id, fp);
      });
  }, [annotations, selectShape, overlayRefs, markerFingerprint]);

  // Handle text tool click on map — creates a text label at click location
  useEffect(() => {
    if (!mapRef.current || activeTool !== "text") return;

    const listener = mapRef.current.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      addShape("text", {
        coordinates: [[e.latLng.lat(), e.latLng.lng()]],
        text: "Label",
        strokeColor: "#000000",
      });
    });

    return () => google.maps.event.removeListener(listener);
  }, [activeTool, addShape]);

  // Escape key to close
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // Handle save
  const handleSave = () => {
    const serialized = serialize();

    if (mode === "site" && fieldBoundaryId) {
      const fieldBoundary = annotations.find((a) => a.id === fieldBoundaryId);
      let polygon: any = undefined;
      let centerLat: string | undefined;
      let centerLng: string | undefined;
      let acres: number | undefined;

      if (fieldBoundary?.coordinates && fieldBoundary.coordinates.length >= 3) {
        // Convert back to GeoJSON [lng, lat] format
        const geoCoords = fieldBoundary.coordinates.map((c) => [c[1], c[0]]);
        geoCoords.push(geoCoords[0]); // Close the ring
        polygon = { type: "Polygon", coordinates: [geoCoords] };

        // Calculate center
        const lats = fieldBoundary.coordinates.map((c) => c[0]);
        const lngs = fieldBoundary.coordinates.map((c) => c[1]);
        centerLat = ((Math.min(...lats) + Math.max(...lats)) / 2).toFixed(7);
        centerLng = ((Math.min(...lngs) + Math.max(...lngs)) / 2).toFixed(7);
        acres = fieldBoundary.area ? sqMetersToAcres(fieldBoundary.area) : undefined;
      }

      // Exclude field boundary from annotations
      const otherAnnotations = serialized.annotations.filter((a) => a.id !== fieldBoundaryId);

      onSave({
        polygon,
        annotations: { version: 1, annotations: otherAnnotations },
        centerLat,
        centerLng,
        acres,
      });
    } else {
      onSave({ annotations: serialized });
    }
    onOpenChange(false);
  };

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-3 py-2 border-b bg-background">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onOpenChange(false)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
        <span className="font-semibold text-sm truncate flex-1">{title}</span>
        {totalArea > 0 && (
          <span className="text-xs text-muted-foreground">
            Total: {sqMetersToAcres(totalArea).toFixed(2)} ac
          </span>
        )}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
        </div>
      </div>

      {/* Toolbar */}
      <MapEditorToolbar
        activeTool={activeTool}
        mapType={mapType}
        onToolChange={setDrawingTool}
        onMapTypeChange={setMapType}
        onUndo={undoLast}
        canUndo={annotations.length > 0}
      />

      {/* 3-panel layout */}
      <div className="flex flex-1 min-h-0">
        {/* Left: Layers */}
        <MapEditorLayerPanel
          annotations={annotations}
          selectedId={selectedId}
          fieldBoundaryId={fieldBoundaryId || undefined}
          onSelect={selectShape}
          onToggleVisibility={toggleVisibility}
        />

        {/* Center: Map */}
        <div className="flex-1 relative">
          <MapView
            className="w-full h-full"
            initialCenter={initialCenter || { lat: 20, lng: 0 }}
            initialZoom={initialCenter ? 16 : 3}
            mapTypeId="satellite"
            mapTypeControl={false}
            onMapReady={handleMapReady}
          />
        </div>

        {/* Right: Properties */}
        <MapEditorPropertiesPanel
          selected={selected}
          isFieldBoundary={selected?.id === fieldBoundaryId}
          onUpdate={updateShape}
          onDelete={removeShape}
        />
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center px-3 py-1 border-t bg-muted/50 text-xs text-muted-foreground">
        <span>
          {annotations.length} shape{annotations.length !== 1 ? "s" : ""}
        </span>
        {totalArea > 0 && (
          <>
            <span className="mx-2">|</span>
            <span>Area: {sqMetersToAcres(totalArea).toFixed(2)} ac</span>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
