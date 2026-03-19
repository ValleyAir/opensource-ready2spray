import { useEffect, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { MapView } from "./Map";
import { Download, Trash2, Square, Pencil, MapPin } from "lucide-react";
import { toast } from "sonner";

interface KMLDrawingManagerProps {
  jobId?: number;
  initialLocation?: { lat: number; lng: number };
  onSave?: (kmlData: { name: string; kmlContent: string; fileSize: number }) => void;
}

export function KMLDrawingManager({ jobId, initialLocation, onSave }: KMLDrawingManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mapName, setMapName] = useState("");
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null);
  const [shapes, setShapes] = useState<google.maps.MVCObject[]>([]);
  const mapRef = useRef<google.maps.Map | null>(null);

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;

    // Initialize Drawing Manager
    const manager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [
          google.maps.drawing.OverlayType.MARKER,
          google.maps.drawing.OverlayType.POLYGON,
          google.maps.drawing.OverlayType.POLYLINE,
          google.maps.drawing.OverlayType.RECTANGLE,
          google.maps.drawing.OverlayType.CIRCLE,
        ],
      },
      markerOptions: {
        draggable: true,
      },
      polygonOptions: {
        editable: true,
        draggable: true,
        strokeColor: "#7c3aed",
        strokeWeight: 2,
        fillColor: "#7c3aed",
        fillOpacity: 0.3,
      },
      polylineOptions: {
        editable: true,
        draggable: true,
        strokeColor: "#7c3aed",
        strokeWeight: 3,
      },
      rectangleOptions: {
        editable: true,
        draggable: true,
        strokeColor: "#7c3aed",
        strokeWeight: 2,
        fillColor: "#7c3aed",
        fillOpacity: 0.3,
      },
      circleOptions: {
        editable: true,
        draggable: true,
        strokeColor: "#7c3aed",
        strokeWeight: 2,
        fillColor: "#7c3aed",
        fillOpacity: 0.3,
      },
    });

    manager.setMap(map);
    setDrawingManager(manager);

    // Listen for shape creation
    google.maps.event.addListener(manager, "overlaycomplete", (event: google.maps.drawing.OverlayCompleteEvent) => {
      setShapes(prev => [...prev, event.overlay]);
      // Switch back to hand mode after drawing
      manager.setDrawingMode(null);
    });
  };

  const clearAllShapes = () => {
    shapes.forEach(shape => {
      if ('setMap' in shape && typeof shape.setMap === 'function') {
        shape.setMap(null);
      }
    });
    setShapes([]);
    toast.success("All shapes cleared");
  };

  const generateKML = (): string => {
    let placemarks = "";

    shapes.forEach((shape, index) => {
      if (shape instanceof google.maps.Marker) {
        const pos = shape.getPosition();
        if (pos) {
          placemarks += `
    <Placemark>
      <name>Marker ${index + 1}</name>
      <Point>
        <coordinates>${pos.lng()},${pos.lat()},0</coordinates>
      </Point>
    </Placemark>`;
        }
      } else if (shape instanceof google.maps.Polygon) {
        const path = shape.getPath();
        const coords = [];
        for (let i = 0; i < path.getLength(); i++) {
          const point = path.getAt(i);
          coords.push(`${point.lng()},${point.lat()},0`);
        }
        // Close the polygon by repeating the first point
        if (coords.length > 0) {
          const firstPoint = path.getAt(0);
          coords.push(`${firstPoint.lng()},${firstPoint.lat()},0`);
        }
        placemarks += `
    <Placemark>
      <name>Polygon ${index + 1}</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${coords.join('\n              ')}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
      } else if (shape instanceof google.maps.Polyline) {
        const path = shape.getPath();
        const coords = [];
        for (let i = 0; i < path.getLength(); i++) {
          const point = path.getAt(i);
          coords.push(`${point.lng()},${point.lat()},0`);
        }
        placemarks += `
    <Placemark>
      <name>Path ${index + 1}</name>
      <LineString>
        <coordinates>
          ${coords.join('\n          ')}
        </coordinates>
      </LineString>
    </Placemark>`;
      } else if (shape instanceof google.maps.Rectangle) {
        const bounds = shape.getBounds();
        if (bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          const coords = [
            `${sw.lng()},${sw.lat()},0`,
            `${ne.lng()},${sw.lat()},0`,
            `${ne.lng()},${ne.lat()},0`,
            `${sw.lng()},${ne.lat()},0`,
            `${sw.lng()},${sw.lat()},0`, // Close the rectangle
          ];
          placemarks += `
    <Placemark>
      <name>Rectangle ${index + 1}</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${coords.join('\n              ')}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
        }
      } else if (shape instanceof google.maps.Circle) {
        const center = shape.getCenter();
        const radius = shape.getRadius();
        if (center) {
          // Convert circle to polygon (approximate with 32 points)
          const coords = [];
          const numPoints = 32;
          for (let i = 0; i <= numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            const lat = center.lat() + (radius / 111320) * Math.cos(angle);
            const lng = center.lng() + (radius / (111320 * Math.cos(center.lat() * Math.PI / 180))) * Math.sin(angle);
            coords.push(`${lng},${lat},0`);
          }
          placemarks += `
    <Placemark>
      <name>Circle ${index + 1}</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${coords.join('\n              ')}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
        }
      }
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${mapName || 'Spray Area Map'}</name>
    <description>Created with Ready2Spray AI</description>${placemarks}
  </Document>
</kml>`;
  };

  const downloadKML = () => {
    if (shapes.length === 0) {
      toast.error("Please draw at least one shape on the map");
      return;
    }

    if (!mapName.trim()) {
      toast.error("Please enter a map name");
      return;
    }

    const kmlContent = generateKML();
    const blob = new Blob([kmlContent], { type: "application/vnd.google-earth.kml+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mapName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.kml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("KML file downloaded successfully");

    // Call onSave callback if provided
    if (onSave) {
      onSave({
        name: mapName,
        kmlContent,
        fileSize: new Blob([kmlContent]).size,
      });
    }
  };

  const saveAndUpload = () => {
    if (shapes.length === 0) {
      toast.error("Please draw at least one shape on the map");
      return;
    }

    if (!mapName.trim()) {
      toast.error("Please enter a map name");
      return;
    }

    const kmlContent = generateKML();
    
    // Call onSave callback
    if (onSave) {
      onSave({
        name: mapName,
        kmlContent,
        fileSize: new Blob([kmlContent]).size,
      });
    }

    // Close dialog
    setIsOpen(false);
    setMapName("");
    clearAllShapes();
  };

  return (
    <>
      <Button onClick={() => setIsOpen(true)} variant="outline" className="gap-2">
        <Pencil className="h-4 w-4" />
        Create Map
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create KML Map</DialogTitle>
            <DialogDescription>
              Draw spray areas, boundaries, or markers on the map to create a KML file
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="mapName">Map Name *</Label>
              <Input
                id="mapName"
                value={mapName}
                onChange={(e) => setMapName(e.target.value)}
                placeholder="e.g., North Field Spray Area"
              />
            </div>

            <div className="space-y-2">
              <Label>Drawing Tools</Label>
              <div className="h-[500px] rounded-lg overflow-hidden border">
                <MapView
                  initialCenter={initialLocation || { lat: 37.4220, lng: -122.0841 }}
                  initialZoom={15}
                  onMapReady={handleMapReady}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Use the drawing tools at the top of the map to add shapes. Shapes can be edited and moved after creation.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearAllShapes}
                disabled={shapes.length === 0}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All ({shapes.length})
              </Button>
              <Button
                variant="outline"
                onClick={downloadKML}
                disabled={shapes.length === 0}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download KML
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveAndUpload} disabled={shapes.length === 0 || !mapName.trim()}>
              Save & Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
