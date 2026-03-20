import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/Map";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-draw/dist/leaflet.draw.css';

interface SiteMapDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (polygon: any, centerLat: string, centerLng: string, acres: number, sensitiveAreas?: any[]) => void;
  initialPolygon?: any;
  initialCenter?: { lat: number; lng: number };
  initialSensitiveAreas?: any[];
}

function calculateAreaSqMeters(coords: [number, number][]): number {
  const R = 6371000;
  let area = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const lat1 = (coords[i][1] * Math.PI) / 180;
    const lat2 = (coords[j][1] * Math.PI) / 180;
    const dLng = ((coords[j][0] - coords[i][0]) * Math.PI) / 180;
    area += dLng * (2 + Math.sin(lat1) + Math.sin(lat2));
  }
  return Math.abs((area * R * R) / 2);
}

export function SiteMapDrawer({ open, onOpenChange, onSave, initialPolygon, initialCenter, initialSensitiveAreas }: SiteMapDrawerProps) {
  const [polygon, setPolygon] = useState<any>(initialPolygon || null);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(initialCenter || null);
  const [acres, setAcres] = useState<number>(0);
  const [sensitiveAreas, setSensitiveAreas] = useState<any[]>(initialSensitiveAreas || []);
  const [featureGroupRef, setFeatureGroupRef] = useState<L.FeatureGroup | null>(null);
  const [drawnItemsRef, setDrawnItemsRef] = useState<Map<string, L.Layer>>(new Map());

  const handleMapReady = useCallback((map: L.Map) => {
    // Import leaflet-draw dynamically
    const DrawControl = (L.Control as any).Draw || require('leaflet-draw').Control.Draw;

    // Create a feature group to store editable layers
    const featureGroup = new L.FeatureGroup();
    map.addLayer(featureGroup);
    setFeatureGroupRef(featureGroup);

    // Add leaflet-draw control
    const drawControl = new DrawControl({
      position: 'topleft',
      draw: {
        polygon: {
          shapeOptions: {
            color: '#22c55e',
            weight: 2,
            opacity: 0.8,
            fill: true,
            fillColor: '#22c55e',
            fillOpacity: 0.3,
          },
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: featureGroup,
        edit: true,
        remove: true,
      },
    });
    map.addControl(drawControl);

    // If there's an initial polygon, render it as editable
    if (initialPolygon && initialPolygon.coordinates) {
      const rings = initialPolygon.type === "MultiPolygon"
        ? initialPolygon.coordinates.map((poly: number[][][]) => poly[0])
        : [initialPolygon.coordinates[0]];

      let totalArea = 0;
      rings.forEach((ring: [number, number][]) => {
        if (!ring) return;

        // Convert [lng, lat] to [lat, lng] for Leaflet
        const latLngArray = ring.map((coord: [number, number]) => [coord[1], coord[0]]);

        const leafletPolygon = L.polygon(latLngArray as L.LatLngExpression[], {
          color: '#16a34a',
          weight: 2,
          opacity: 0.8,
          fill: true,
          fillColor: '#22c55e',
          fillOpacity: 0.3,
        });

        featureGroup.addLayer(leafletPolygon);

        // Calculate area for this ring
        const areaSqm = calculateAreaSqMeters(ring);
        totalArea += areaSqm;
      });

      const calculatedAcres = totalArea * 0.000247105;
      setAcres(calculatedAcres);

      // Calculate and set center
      const bounds = featureGroup.getBounds();
      if (bounds.isValid()) {
        const centerPoint = bounds.getCenter();
        setCenter({ lat: centerPoint.lat, lng: centerPoint.lng });
      }
    }

    // Handle polygon drawing and editing
    const updatePolygonFromLayer = (layer: L.Layer) => {
      if (layer instanceof L.Polygon) {
        const latLngs = layer.getLatLngs();
        const coordinates: [number, number][] = [];

        // Handle simple polygon
        const handleRing = (ring: any) => {
          ring.forEach((latLng: L.LatLng | any) => {
            const lat = typeof latLng.lat === 'function' ? latLng.lat() : latLng.lat;
            const lng = typeof latLng.lng === 'function' ? latLng.lng() : latLng.lng;
            coordinates.push([lng, lat]);
          });
        };

        if (Array.isArray(latLngs[0])) {
          // Multi-polygon or polygon with holes
          (latLngs as any[]).forEach(ring => handleRing(ring));
        } else {
          // Simple polygon
          handleRing(latLngs);
        }

        // Close the polygon
        if (coordinates.length > 0 && (coordinates[0][0] !== coordinates[coordinates.length - 1][0] || coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
          coordinates.push(coordinates[0]);
        }

        const areaSqm = calculateAreaSqMeters(coordinates);
        const calculatedAcres = areaSqm * 0.000247105;

        setPolygon({
          type: "Polygon",
          coordinates: [coordinates],
        });
        setAcres(calculatedAcres);

        // Calculate center from bounds
        const bounds = featureGroup.getBounds();
        if (bounds.isValid()) {
          const centerPoint = bounds.getCenter();
          setCenter({ lat: centerPoint.lat, lng: centerPoint.lng });
        }
      }
    };

    map.on('draw:created', (event: any) => {
      const layer = event.layer;
      featureGroup.addLayer(layer);
      updatePolygonFromLayer(layer);
    });

    map.on('draw:edited', (event: any) => {
      event.layers.eachLayer((layer: L.Layer) => {
        updatePolygonFromLayer(layer);
      });
    });

    map.on('draw:deleted', () => {
      setPolygon(null);
      setCenter(null);
      setAcres(0);
    });
  }, [initialPolygon]);

  const handleSave = () => {
    if (!polygon || !center) {
      toast.error("Please draw a polygon on the map");
      return;
    }

    onSave(polygon, center.lat.toString(), center.lng.toString(), acres, sensitiveAreas);
    onOpenChange(false);
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
