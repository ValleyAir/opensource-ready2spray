import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Save } from "lucide-react";
import { useEffect, useRef, useCallback, useState } from "react";
import L from "leaflet";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet/dist/leaflet.css";
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
  const mapRef = useRef<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);
  const [mapType, setMapType] = useState<MapTypeOption>("satellite");
  const [fieldBoundaryId, setFieldBoundaryId] = useState<string | null>(null);
  const tileLayersRef = useRef<Map<string, L.TileLayer>>(new Map());

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

  // Apply style updates to Leaflet layers
  const applyOverlayStyle = useCallback((id: string, ann: MapAnnotation) => {
    const layer = overlayRefs.current.get(id);
    if (!layer) return;

    const styleOptions = {
      color: ann.strokeColor,
      opacity: ann.strokeOpacity,
      weight: ann.strokeWeight,
      fillColor: ann.fillColor,
      fillOpacity: ann.fillOpacity,
    };

    if (layer instanceof L.Polygon || layer instanceof L.Polyline || layer instanceof L.Circle) {
      layer.setStyle(styleOptions);
    }

    if (layer instanceof L.Marker) {
      // Visibility is handled separately
      if (ann.visible) {
        (layer as any)._icon?.parentElement && layer.addTo(mapRef.current!);
      } else {
        layer.removeFrom(mapRef.current!);
      }
    }
  }, [overlayRefs]);

  // Sync overlay styles when annotations change
  useEffect(() => {
    annotations.forEach((ann) => {
      applyOverlayStyle(ann.id, ann);
    });
  }, [annotations, applyOverlayStyle]);

  // Update map type by swapping tile layers
  useEffect(() => {
    if (!mapRef.current) return;

    const getTileLayer = (type: MapTypeOption): L.TileLayer => {
      if (tileLayersRef.current.has(type)) {
        return tileLayersRef.current.get(type)!;
      }

      let url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
      let attribution = "&copy; Esri";

      if (type === "terrain") {
        url = "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png";
        attribution = "&copy; OpenTopoMap";
      } else if (type === "hybrid") {
        // Use satellite for hybrid in Leaflet
        url = "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
        attribution = "&copy; Esri";
      }

      const layer = L.tileLayer(url, { attribution, maxZoom: 19 });
      tileLayersRef.current.set(type, layer);
      return layer;
    };

    // Remove current layer
    mapRef.current.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) {
        mapRef.current!.removeLayer(layer);
      }
    });

    // Add new layer
    const newLayer = getTileLayer(mapType);
    newLayer.addTo(mapRef.current);
  }, [mapType]);

  const handleMapReady = useCallback(
    (map: L.Map) => {
      mapRef.current = map;

      // Create FeatureGroup for drawn items
      const featureGroup = L.featureGroup().addTo(map);
      featureGroupRef.current = featureGroup;

      // Set up leaflet-draw control
      const drawControl = new L.Control.Draw({
        position: "topright",
        draw: {
          polygon: { shapeOptions: { color: "#3b82f6" } },
          polyline: { shapeOptions: { color: "#3b82f6" } },
          rectangle: { shapeOptions: { color: "#3b82f6" } },
          circle: { shapeOptions: { color: "#3b82f6" } },
          marker: true,
          circlemarker: false,
        },
        edit: { featureGroup },
      });
      map.addControl(drawControl);
      drawControlRef.current = drawControl;

      // Handle shape creation
      map.on("draw:created", (e: any) => {
        const layer = e.layer;
        let shapeData: Partial<MapAnnotation> = {};

        if (layer instanceof L.Polygon && !(layer instanceof L.Rectangle)) {
          const latlngs = layer.getLatLngs()[0] as L.LatLng[];
          const coords = latlngs.map((ll) => [ll.lat, ll.lng]);
          shapeData = { type: "polygon", coordinates: coords };
        } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
          const latlngs = layer.getLatLngs() as L.LatLng[];
          const coords = latlngs.map((ll) => [ll.lat, ll.lng]);
          shapeData = { type: "polyline", coordinates: coords };
        } else if (layer instanceof L.Rectangle) {
          const bounds = (layer as any).getBounds();
          shapeData = {
            type: "rectangle",
            bounds: {
              n: bounds.getNorth(),
              s: bounds.getSouth(),
              e: bounds.getEast(),
              w: bounds.getWest(),
            },
          };
        } else if (layer instanceof L.Circle) {
          const center = layer.getLatLng();
          shapeData = {
            type: "circle",
            coordinates: [[center.lat, center.lng]],
            radius: layer.getRadius(),
          };
        } else if (layer instanceof L.Marker) {
          const pos = layer.getLatLng();
          shapeData = { type: "marker", coordinates: [[pos.lat, pos.lng]] };
        }

        const ann = addShape(shapeData.type || "polygon", shapeData);
        overlayRefs.current.set(ann.id, layer);

        // Add click listener for selection
        layer.on("click", () => selectShape(ann.id));
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
        map.setView([initialCenter.lat, initialCenter.lng], 16);
      }
    },
    [initialPolygon, initialCenter, initialAnnotations, mode, addShape, selectShape, overlayRefs]
  );

  // Load initial polygon as a field boundary annotation
  const loadInitialPolygon = (map: L.Map, polygonData: any) => {
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

    // Calculate measurements using Haversine formula
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
    const poly = L.polygon(
      coords.map((c) => [c[0], c[1]]),
      {
        color: ann.strokeColor,
        opacity: ann.strokeOpacity,
        weight: ann.strokeWeight,
        fillColor: ann.fillColor,
        fillOpacity: ann.fillOpacity,
      }
    ).addTo(map);

    overlayRefs.current.set(ann.id, poly);
    poly.on("click", () => selectShape(ann.id));

    // Fit map to polygon
    const bounds = L.latLngBounds(coords.map((c) => [c[0], c[1]]));
    map.fitBounds(bounds);
  };

  // Render an annotation as a Leaflet layer
  const renderAnnotationOverlay = (map: L.Map, ann: MapAnnotation) => {
    switch (ann.type) {
      case "polygon": {
        if (!ann.coordinates) return;
        const poly = L.polygon(
          ann.coordinates.map((c) => [c[0], c[1]]),
          {
            color: ann.strokeColor,
            opacity: ann.strokeOpacity,
            weight: ann.strokeWeight,
            fillColor: ann.fillColor,
            fillOpacity: ann.fillOpacity,
          }
        );
        if (ann.visible) poly.addTo(map);
        overlayRefs.current.set(ann.id, poly);
        poly.on("click", () => selectShape(ann.id));
        break;
      }
      case "polyline": {
        if (!ann.coordinates) return;
        const line = L.polyline(
          ann.coordinates.map((c) => [c[0], c[1]]),
          {
            color: ann.strokeColor,
            opacity: ann.strokeOpacity,
            weight: ann.strokeWeight,
          }
        );
        if (ann.visible) line.addTo(map);
        overlayRefs.current.set(ann.id, line);
        line.on("click", () => selectShape(ann.id));
        break;
      }
      case "rectangle": {
        if (!ann.bounds) return;
        const rect = L.rectangle(
          [[ann.bounds.s, ann.bounds.w], [ann.bounds.n, ann.bounds.e]],
          {
            color: ann.strokeColor,
            opacity: ann.strokeOpacity,
            weight: ann.strokeWeight,
            fillColor: ann.fillColor,
            fillOpacity: ann.fillOpacity,
          }
        );
        if (ann.visible) rect.addTo(map);
        overlayRefs.current.set(ann.id, rect);
        rect.on("click", () => selectShape(ann.id));
        break;
      }
      case "circle": {
        if (!ann.coordinates?.[0]) return;
        const circle = L.circle(
          [ann.coordinates[0][0], ann.coordinates[0][1]],
          {
            radius: ann.radius || 100,
            color: ann.strokeColor,
            opacity: ann.strokeOpacity,
            weight: ann.strokeWeight,
            fillColor: ann.fillColor,
            fillOpacity: ann.fillOpacity,
          }
        );
        if (ann.visible) circle.addTo(map);
        overlayRefs.current.set(ann.id, circle);
        circle.on("click", () => selectShape(ann.id));
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

  // Render markers (including text and icon markers) using Leaflet DivIcon
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
          const old = overlayRefs.current.get(ann.id);
          if (old && mapRef.current) {
            mapRef.current.removeLayer(old);
          }
          overlayRefs.current.delete(ann.id);
        }

        if (!ann.coordinates?.[0]) return;

        const pos: L.LatLngExpression = [ann.coordinates[0][0], ann.coordinates[0][1]];

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

        const icon = L.divIcon({
          html: content.outerHTML,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
          popupAnchor: [0, -16],
          className: "custom-marker",
        });

        const marker = L.marker(pos, { icon, title: ann.name });
        if (ann.visible) {
          marker.addTo(mapRef.current);
        }

        marker.on("click", () => selectShape(ann.id));
        overlayRefs.current.set(ann.id, marker);
        markerFingerprintsRef.current.set(ann.id, fp);
      });
  }, [annotations, selectShape, overlayRefs, markerFingerprint]);

  // Handle text tool click on map — creates a text label at click location
  useEffect(() => {
    if (!mapRef.current || activeTool !== "text") return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      addShape("text", {
        coordinates: [[e.latlng.lat, e.latlng.lng]],
        text: "Label",
        strokeColor: "#000000",
      });
    };

    mapRef.current.on("click", handleClick);

    return () => {
      if (mapRef.current) {
        mapRef.current.off("click", handleClick);
      }
    };
  }, [activeTool, addShape]);

  // Disable draw control when text tool is active
  useEffect(() => {
    if (!drawControlRef.current) return;
    // leaflet-draw doesn't have a direct disable, so we manage via handlers
  }, [activeTool]);

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
    return () => {
      document.body.style.overflow = prev;
    };
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
