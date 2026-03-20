import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { FeatureGroup } from "react-leaflet";
import "@leaflet/draw/dist/leaflet.draw.css";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { MapView } from "./Map";
import { Download, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";

interface KMLDrawingManagerProps {
  jobId?: number;
  initialLocation?: { lat: number; lng: number };
  onSave?: (kmlData: {
    name: string;
    kmlContent: string;
    fileSize: number;
  }) => void;
}

export function KMLDrawingManager({
  jobId,
  initialLocation,
  onSave,
}: KMLDrawingManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mapName, setMapName] = useState("");
  const [shapeCount, setShapeCount] = useState(0);
  const mapRef = useRef<L.Map | null>(null);
  const featureGroupRef = useRef<L.FeatureGroup | null>(null);

  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;

    // Create feature group for drawn items
    const featureGroup = new L.FeatureGroup();
    featureGroupRef.current = featureGroup;
    map.addLayer(featureGroup);

    // Initialize Leaflet Draw
    const drawControl = new (L.Control as any).Draw({
      position: "topleft",
      draw: {
        polygon: {
          shapeOptions: {
            color: "#7c3aed",
            weight: 2,
            opacity: 0.8,
            fill: true,
            fillColor: "#7c3aed",
            fillOpacity: 0.3,
          },
          allowIntersection: true,
          drawError: {
            color: "#b91c1c",
            message: "<strong>Oh snap!</strong> you can't draw that!",
          },
          guidelineDistance: 25,
        },
        polyline: {
          shapeOptions: {
            color: "#7c3aed",
            weight: 3,
            opacity: 0.8,
          },
          metric: true,
          feet: false,
        },
        rectangle: {
          shapeOptions: {
            color: "#7c3aed",
            weight: 2,
            opacity: 0.8,
            fill: true,
            fillColor: "#7c3aed",
            fillOpacity: 0.3,
          },
        },
        circle: {
          shapeOptions: {
            color: "#7c3aed",
            weight: 2,
            opacity: 0.8,
            fill: true,
            fillColor: "#7c3aed",
            fillOpacity: 0.3,
          },
          metric: true,
        },
        marker: {
          icon: L.icon({
            iconUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
            iconRetinaUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
            shadowUrl:
              "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41],
          }),
        },
      },
      edit: {
        featureGroup: featureGroup,
        poly: {
          allowIntersection: false,
        },
      },
    });

    map.addControl(drawControl);

    // Listen for shape creation
    map.on("draw:created", (e: any) => {
      const layer = e.layer;
      featureGroup.addLayer(layer);
      updateShapeCount();
    });

    // Listen for shape edits
    map.on("draw:edited", (e: any) => {
      updateShapeCount();
    });

    // Listen for shape deletions
    map.on("draw:deleted", (e: any) => {
      updateShapeCount();
    });
  };

  const updateShapeCount = () => {
    if (featureGroupRef.current) {
      const count = (Object.keys(featureGroupRef.current._layers) || []).length;
      setShapeCount(count);
    }
  };

  const clearAllShapes = () => {
    if (featureGroupRef.current) {
      featureGroupRef.current.eachLayer((layer) => {
        featureGroupRef.current?.removeLayer(layer);
      });
      updateShapeCount();
      toast.success("All shapes cleared");
    }
  };

  const generateKML = (): string => {
    let placemarks = "";
    let shapeIndex = 0;

    if (featureGroupRef.current) {
      featureGroupRef.current.eachLayer((layer: any) => {
        shapeIndex++;

        // Handle Marker
        if (layer instanceof L.Marker) {
          const latlng = layer.getLatLng();
          placemarks += `
    <Placemark>
      <name>Marker ${shapeIndex}</name>
      <Point>
        <coordinates>${latlng.lng},${latlng.lat},0</coordinates>
      </Point>
    </Placemark>`;
        }
        // Handle Polygon
        else if (layer instanceof L.Polygon && !(layer instanceof L.Rectangle)) {
          const latLngs = layer.getLatLngs()[0] || [];
          const coords = (latLngs as L.LatLng[])
            .map((point) => `${point.lng},${point.lat},0`)
            .concat(`${(latLngs as L.LatLng[])[0].lng},${(latLngs as L.LatLng[])[0].lat},0`);

          placemarks += `
    <Placemark>
      <name>Polygon ${shapeIndex}</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${coords.join("\n              ")}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
        }
        // Handle Polyline
        else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
          const latLngs = layer.getLatLngs() as L.LatLng[];
          const coords = latLngs.map((point) => `${point.lng},${point.lat},0`);

          placemarks += `
    <Placemark>
      <name>Path ${shapeIndex}</name>
      <LineString>
        <coordinates>
          ${coords.join("\n          ")}
        </coordinates>
      </LineString>
    </Placemark>`;
        }
        // Handle Rectangle
        else if (layer instanceof L.Rectangle) {
          const bounds = layer.getBounds();
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          const coords = [
            `${sw.lng},${sw.lat},0`,
            `${ne.lng},${sw.lat},0`,
            `${ne.lng},${ne.lat},0`,
            `${sw.lng},${ne.lat},0`,
            `${sw.lng},${sw.lat},0`,
          ];

          placemarks += `
    <Placemark>
      <name>Rectangle ${shapeIndex}</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${coords.join("\n              ")}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
        }
        // Handle Circle
        else if (layer instanceof L.Circle && !(layer instanceof L.Rectangle)) {
          const center = layer.getLatLng();
          const radius = layer.getRadius();

          // Convert circle to polygon (approximate with 32 points)
          const coords = [];
          const numPoints = 32;
          for (let i = 0; i <= numPoints; i++) {
            const angle = (i / numPoints) * 2 * Math.PI;
            const lat = center.lat + (radius / 111320) * Math.cos(angle);
            const lng =
              center.lng +
              (radius / (111320 * Math.cos((center.lat * Math.PI) / 180))) *
                Math.sin(angle);
            coords.push(`${lng},${lat},0`);
          }

          placemarks += `
    <Placemark>
      <name>Circle ${shapeIndex}</name>
      <Polygon>
        <outerBoundaryIs>
          <LinearRing>
            <coordinates>
              ${coords.join("\n              ")}
            </coordinates>
          </LinearRing>
        </outerBoundaryIs>
      </Polygon>
    </Placemark>`;
        }
      });
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
  <Document>
    <name>${mapName || "Spray Area Map"}</name>
    <description>Created with Ready2Spray AI</description>${placemarks}
  </Document>
</kml>`;
  };

  const downloadKML = () => {
    if (shapeCount === 0) {
      toast.error("Please draw at least one shape on the map");
      return;
    }

    if (!mapName.trim()) {
      toast.error("Please enter a map name");
      return;
    }

    const kmlContent = generateKML();
    const blob = new Blob([kmlContent], {
      type: "application/vnd.google-earth.kml+xml",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mapName
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase()}.kml`;
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
    if (shapeCount === 0) {
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
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        className="gap-2"
      >
        <Pencil className="h-4 w-4" />
        Create Map
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create KML Map</DialogTitle>
            <DialogDescription>
              Draw spray areas, boundaries, or markers on the map to create a
              KML file
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
                  initialCenter={initialLocation || { lat: 37.422, lng: -122.0841 }}
                  initialZoom={15}
                  onMapReady={handleMapReady}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Use the drawing tools at the top of the map to add shapes.
                Shapes can be edited and moved after creation.
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={clearAllShapes}
                disabled={shapeCount === 0}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear All ({shapeCount})
              </Button>
              <Button
                variant="outline"
                onClick={downloadKML}
                disabled={shapeCount === 0}
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
            <Button
              onClick={saveAndUpload}
              disabled={shapeCount === 0 || !mapName.trim()}
            >
              Save & Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
