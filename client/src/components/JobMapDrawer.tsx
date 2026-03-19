import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/Map";
import { useState, useCallback } from "react";
import { toast } from "sonner";

interface JobMapDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (polygon: any, acres: number) => void;
  initialPolygon?: any;
  initialCenter?: { lat: number; lng: number };
}

export function JobMapDrawer({ open, onOpenChange, onSave, initialPolygon, initialCenter }: JobMapDrawerProps) {
  const [polygon, setPolygon] = useState<any>(initialPolygon || null);
  const [acres, setAcres] = useState<number>(0);

  const handleMapReady = useCallback((map: google.maps.Map) => {
    const google = window.google;
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: initialPolygon ? null : google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillColor: "#8b5cf6",
        fillOpacity: 0.3,
        strokeWeight: 2,
        strokeColor: "#7c3aed",
        clickable: true,
        editable: true,
        zIndex: 1,
      },
    });

    drawingManager.setMap(map);

    // If there's an initial polygon, render it as editable
    if (initialPolygon && initialPolygon.coordinates) {
      const ring = initialPolygon.coordinates[0];
      if (ring) {
        const paths = ring.map((coord: [number, number]) => ({
          lat: coord[1],
          lng: coord[0],
        }));

        const existingPolygon = new google.maps.Polygon({
          paths,
          fillColor: "#8b5cf6",
          fillOpacity: 0.3,
          strokeWeight: 2,
          strokeColor: "#7c3aed",
          editable: true,
          map,
        });

        const area = google.maps.geometry.spherical.computeArea(existingPolygon.getPath());
        setAcres(area * 0.000247105);

        google.maps.event.addListener(existingPolygon.getPath(), "set_at", () => {
          updatePolygonData(existingPolygon, google);
        });
        google.maps.event.addListener(existingPolygon.getPath(), "insert_at", () => {
          updatePolygonData(existingPolygon, google);
        });

        // Disable drawing mode since we already have a polygon
        drawingManager.setDrawingMode(null);
      }
    }

    // Handle new polygon creation
    google.maps.event.addListener(drawingManager, "overlaycomplete", (event: any) => {
      if (event.type === google.maps.drawing.OverlayType.POLYGON) {
        const newPolygon = event.overlay;
        drawingManager.setDrawingMode(null);
        updatePolygonData(newPolygon, google);

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

      // Close the polygon
      if (coordinates.length > 0) {
        coordinates.push(coordinates[0]);
      }

      const area = google.maps.geometry.spherical.computeArea(path);
      const calculatedAcres = area * 0.000247105;

      setPolygon({
        type: "Polygon",
        coordinates: [coordinates],
      });
      setAcres(calculatedAcres);
    };
  }, [initialPolygon]);

  const handleSave = () => {
    if (!polygon) {
      toast.error("Please draw a treatment area polygon on the map");
      return;
    }
    onSave(polygon, acres);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{initialPolygon ? "Edit Treatment Area" : "Draw Treatment Area"}</DialogTitle>
          <DialogDescription>
            Use the polygon tool to outline the treatment area for this job. Acreage is calculated automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="h-[500px] w-full rounded-lg overflow-hidden border">
          <MapView
            onMapReady={handleMapReady}
            initialCenter={initialCenter || { lat: 39.8283, lng: -98.5795 }}
            initialZoom={initialCenter ? 15 : 4}
          />
        </div>
        {acres > 0 && (
          <div className="text-sm text-muted-foreground">
            <strong>Treatment Area:</strong> {acres.toFixed(2)} acres
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Treatment Area
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
