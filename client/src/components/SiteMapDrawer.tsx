import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/Map";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface SiteMapDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (polygon: any, centerLat: string, centerLng: string, acres: number, sensitiveAreas?: any[]) => void;
  initialPolygon?: any;
  initialCenter?: { lat: number; lng: number };
  initialSensitiveAreas?: any[];
}

export function SiteMapDrawer({ open, onOpenChange, onSave, initialPolygon, initialCenter, initialSensitiveAreas }: SiteMapDrawerProps) {
  const [polygon, setPolygon] = useState<any>(initialPolygon || null);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(initialCenter || null);
  const [acres, setAcres] = useState<number>(0);
  const [sensitiveAreas, setSensitiveAreas] = useState<any[]>(initialSensitiveAreas || []);
  const [markers, setMarkers] = useState<google.maps.marker.AdvancedMarkerElement[]>([]);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    const google = window.google;
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillColor: "#22c55e",
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: "#16a34a",
        clickable: true,
        editable: true,
        zIndex: 1,
      },
    });

    drawingManager.setMap(map);

    // If there's an initial polygon, draw it (supports Polygon and MultiPolygon)
    if (initialPolygon && initialPolygon.coordinates) {
      const rings = initialPolygon.type === "MultiPolygon"
        ? initialPolygon.coordinates.map((poly: number[][][]) => poly[0])
        : [initialPolygon.coordinates[0]];

      let totalArea = 0;
      rings.forEach((ring: [number, number][]) => {
        if (!ring) return;
        const paths = ring.map((coord: [number, number]) => ({
          lat: coord[1],
          lng: coord[0],
        }));

        const existingPolygon = new google.maps.Polygon({
          paths,
          fillColor: "#22c55e",
          fillOpacity: 0.3,
          strokeWeight: 2,
          strokeColor: "#16a34a",
          editable: true,
          map,
        });

        const area = google.maps.geometry.spherical.computeArea(existingPolygon.getPath());
        totalArea += area;

        // Update polygon when edited
        google.maps.event.addListener(existingPolygon.getPath(), "set_at", () => {
          updatePolygonData(existingPolygon, google);
        });
        google.maps.event.addListener(existingPolygon.getPath(), "insert_at", () => {
          updatePolygonData(existingPolygon, google);
        });
      });

      setAcres(totalArea * 0.000247105);
    }

    // Handle new polygon creation
    google.maps.event.addListener(drawingManager, "overlaycomplete", (event: any) => {
      if (event.type === google.maps.drawing.OverlayType.POLYGON) {
        const newPolygon = event.overlay;
        
        // Remove drawing mode after creating polygon
        drawingManager.setDrawingMode(null);

        // Calculate acres
        updatePolygonData(newPolygon, google);

        // Update polygon when edited
        google.maps.event.addListener(newPolygon.getPath(), "set_at", () => {
          updatePolygonData(newPolygon, google);
        });
        google.maps.event.addListener(newPolygon.getPath(), "insert_at", () => {
          updatePolygonData(newPolygon, google);
        });
      }
    });

    const updatePolygonData = (poly: google.maps.Polygon, google: typeof window.google) => {
      const path = poly.getPath();
      const coordinates: [number, number][] = [];
      
      for (let i = 0; i < path.getLength(); i++) {
        const point = path.getAt(i);
        coordinates.push([point.lng(), point.lat()]);
      }
      
      // Close the polygon by adding the first point at the end
      if (coordinates.length > 0) {
        coordinates.push(coordinates[0]);
      }

      // Calculate center point
      const bounds = new google.maps.LatLngBounds();
      path.forEach((point: google.maps.LatLng) => {
        bounds.extend(point);
      });
      const centerPoint = bounds.getCenter();

      // Calculate area in acres
      const area = google.maps.geometry.spherical.computeArea(path);
      const calculatedAcres = area * 0.000247105; // Convert square meters to acres

      setPolygon({
        type: "Polygon",
        coordinates: [coordinates],
      });
      setCenter({ lat: centerPoint.lat(), lng: centerPoint.lng() });
      setAcres(calculatedAcres);
    };
  }, [initialPolygon]);

  const handleSave = () => {
    if (!polygon || !center) {
      toast.error("Please draw a polygon on the map");
      return;
    }

    onSave(polygon, center.lat.toString(), center.lng.toString(), acres, sensitiveAreas);
    onOpenChange(false);
  };

  const addSensitiveArea = (map: google.maps.Map, type: string) => {
    const google = window.google;
    
    // Create a marker at the center of the map
    const center = map.getCenter();
    if (!center) return;

    const marker = new google.maps.marker.AdvancedMarkerElement({
      map,
      position: center,
      title: type,
    });

    const area = {
      type,
      lat: center.lat(),
      lng: center.lng(),
      notes: "",
    };

    setSensitiveAreas([...sensitiveAreas, area]);
    setMarkers([...markers, marker]);

    // Add click listener to remove marker
    marker.addListener("click", () => {
      marker.map = null;
      setSensitiveAreas(sensitiveAreas.filter(a => a.lat !== area.lat || a.lng !== area.lng));
      setMarkers(markers.filter(m => m !== marker));
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Draw Property Boundaries</DialogTitle>
          <DialogDescription>
            Use the polygon tool to draw the boundaries of this property. You can draw multiple polygons for complex areas. Acreage is calculated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="h-[500px] w-full rounded-lg overflow-hidden border">
          <MapView
            onMapReady={handleMapReady}
            initialCenter={initialCenter || { lat: 39.8283, lng: -98.5795 }} // Center of US
            initialZoom={initialCenter ? 15 : 4}
          />
        </div>
        {acres > 0 && (
          <div className="text-sm text-muted-foreground">
            <strong>Calculated Acres:</strong> {acres.toFixed(2)}
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Boundaries
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
