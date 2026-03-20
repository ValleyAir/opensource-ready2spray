import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, Upload, ExternalLink, Trash2, Copy, Search, Pencil, Download, Eye } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import L from "leaflet";
import { MapView } from "@/components/Map";
import { MapEditor } from "@/components/map-editor/MapEditor";
import type { SiteAnnotations, MapAnnotation } from "@/components/map-editor/types";

export default function Maps() {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [mapName, setMapName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [useGpsSearch, setUseGpsSearch] = useState(false);
  const [gpsLat, setGpsLat] = useState("");
  const [gpsLng, setGpsLng] = useState("");
  const [viewingMapId, setViewingMapId] = useState<number | null>(null);
  const [showMapEditor, setShowMapEditor] = useState(false);

  const mapRef = useRef<L.Map | null>(null);
  const viewPolygonRef = useRef<L.GeoJSON | L.Polygon | null>(null);

  const { data: maps, isLoading } = trpc.maps.list.useQuery();
  const utils = trpc.useUtils();

  const uploadMapMutation = trpc.maps.upload.useMutation({
    onSuccess: () => {
      utils.maps.list.invalidate();
      setIsUploadDialogOpen(false);
      setMapName("");
      setSelectedFile(null);
      toast.success("Map uploaded successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to upload map: ${error.message}`);
    },
  });

  const deleteMapMutation = trpc.maps.delete.useMutation({
    onSuccess: () => {
      utils.maps.list.invalidate();
      toast.success("Map deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete map: ${error.message}`);
    },
  });

  const saveDrawnMutation = trpc.maps.saveDrawn.useMutation({
    onSuccess: () => {
      utils.maps.list.invalidate();
      toast.success("Drawn map saved successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to save drawn map: ${error.message}`);
    },
  });

  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;
  };

  const handleSearch = () => {
    if (useGpsSearch) {
      const lat = parseFloat(gpsLat);
      const lng = parseFloat(gpsLng);
      if (isNaN(lat) || isNaN(lng)) {
        toast.error("Please enter valid GPS coordinates");
        return;
      }
      mapRef.current?.setView([lat, lng], 15);
      return;
    }

    if (!mapRef.current || !searchQuery.trim()) return;

    // Use Nominatim for geocoding
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      searchQuery
    )}`;

    fetch(url)
      .then((res) => res.json())
      .then((results) => {
        if (results.length > 0) {
          const result = results[0];
          mapRef.current?.setView([parseFloat(result.lat), parseFloat(result.lon)], 15);
        } else {
          toast.error("Address not found");
        }
      })
      .catch(() => {
        toast.error("Failed to search address");
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (ext === "kml" || ext === "gpx" || ext === "geojson") {
        setSelectedFile(file);
      } else {
        toast.error("Please select a KML, GPX, or GeoJSON file");
        e.target.value = "";
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !mapName) {
      toast.error("Please provide a map name and select a file");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      const fileType = selectedFile.name.split(".").pop()?.toLowerCase() as "kml" | "gpx" | "geojson";
      uploadMapMutation.mutate({
        name: mapName,
        fileData: base64,
        fileType,
        fileName: selectedFile.name,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrawnMapSave = (kmlData: { name: string; kmlContent: string; fileSize: number }) => {
    saveDrawnMutation.mutate(kmlData);
  };

  const handleMapEditorSave = (data: { annotations: SiteAnnotations }) => {
    // Convert annotations to KML
    const kml = annotationsToKML(data.annotations, "Drawn Map");
    const kmlContent = kml;
    const name = `Map ${new Date().toLocaleDateString()}`;
    saveDrawnMutation.mutate({
      name,
      kmlContent,
      fileSize: new Blob([kmlContent]).size,
    });
  };

  function annotationsToKML(annotations: SiteAnnotations, docName: string): string {
    let placemarks = "";
    for (const ann of annotations.annotations) {
      const name = ann.name || "Shape";
      if (ann.type === "polygon" && ann.coordinates) {
        const coords = ann.coordinates.map((c) => `${c[1]},${c[0]},0`).join(" ");
        placemarks += `<Placemark><name>${name}</name><Polygon><outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>\n`;
      } else if (ann.type === "polyline" && ann.coordinates) {
        const coords = ann.coordinates.map((c) => `${c[1]},${c[0]},0`).join(" ");
        placemarks += `<Placemark><name>${name}</name><LineString><coordinates>${coords}</coordinates></LineString></Placemark>\n`;
      } else if (ann.type === "marker" && ann.coordinates?.[0]) {
        const c = ann.coordinates[0];
        placemarks += `<Placemark><name>${name}</name><Point><coordinates>${c[1]},${c[0]},0</coordinates></Point></Placemark>\n`;
      } else if (ann.type === "rectangle" && ann.bounds) {
        const { n, s, e, w } = ann.bounds;
        const coords = `${w},${n},0 ${e},${n},0 ${e},${s},0 ${w},${s},0 ${w},${n},0`;
        placemarks += `<Placemark><name>${name}</name><Polygon><outerBoundaryIs><LinearRing><coordinates>${coords}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>\n`;
      } else if (ann.type === "circle" && ann.coordinates?.[0] && ann.radius) {
        // Approximate circle as polygon
        const [lat, lng] = ann.coordinates[0];
        const points = 32;
        const coordParts: string[] = [];
        for (let i = 0; i <= points; i++) {
          const angle = (i / points) * 2 * Math.PI;
          const dLat = (ann.radius / 111320) * Math.cos(angle);
          const dLng = (ann.radius / (111320 * Math.cos((lat * Math.PI) / 180))) * Math.sin(angle);
          coordParts.push(`${lng + dLng},${lat + dLat},0`);
        }
        placemarks += `<Placemark><name>${name}</name><Polygon><outerBoundaryIs><LinearRing><coordinates>${coordParts.join(" ")}</coordinates></LinearRing></outerBoundaryIs></Polygon></Placemark>\n`;
      }
    }
    return `<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n<name>${docName}</name>\n${placemarks}</Document>\n</kml>`;
  }

  const handleViewMap = async (map: any) => {
    // Clear previous polygon
    if (viewPolygonRef.current && mapRef.current) {
      mapRef.current.removeLayer(viewPolygonRef.current);
      viewPolygonRef.current = null;
    }

    if (!map.fileUrl || !mapRef.current) return;

    setViewingMapId(map.id);

    try {
      const response = await fetch(map.fileUrl);
      const text = await response.text();

      // Parse KML to extract coordinates
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const coordinateElements = xmlDoc.getElementsByTagName("coordinates");

      if (coordinateElements.length === 0) {
        toast.error("No coordinates found in KML file");
        return;
      }

      const bounds = L.latLngBounds([]);
      let drewShape = false;

      for (let i = 0; i < coordinateElements.length; i++) {
        const coordText = coordinateElements[i].textContent?.trim();
        if (!coordText) continue;

        const coords = coordText
          .split(/\s+/)
          .map((coord) => {
            const [lng, lat] = coord.split(",").map(Number);
            return { lat, lng };
          })
          .filter((c) => !isNaN(c.lat) && !isNaN(c.lng));

        if (coords.length === 0) continue;

        coords.forEach((c) => bounds.extend([c.lat, c.lng]));

        if (coords.length >= 3) {
          // Draw as polygon
          const polygon = L.polygon(
            coords.map((c) => [c.lat, c.lng]),
            {
              color: "#7c3aed",
              weight: 2,
              fillColor: "#7c3aed",
              fillOpacity: 0.3,
            }
          ).addTo(mapRef.current);
          viewPolygonRef.current = polygon;
          drewShape = true;
        }
      }

      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds);
      }

      if (drewShape) {
        toast.success(`Viewing: ${map.name}`);
      }
    } catch (error) {
      toast.error("Failed to load KML file");
    }
  };

  const copyPublicLink = (url: string) => {
    navigator.clipboard.writeText(url);
    toast.success("Link copied to clipboard");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="h-8 w-8 text-green-600" />
            <h1 className="text-3xl font-bold tracking-tight">Map Manager</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            Upload, draw, and manage field boundary maps
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowMapEditor(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Draw New Map
          </Button>
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Upload className="mr-2 h-4 w-4" />
                Upload Map
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Map File</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="map-name">Map Name *</Label>
                  <Input
                    id="map-name"
                    placeholder="Enter map name"
                    value={mapName}
                    onChange={(e) => setMapName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file">File *</Label>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      KML, GPX, or GeoJSON files
                    </p>
                    <Input
                      id="file"
                      type="file"
                      accept=".kml,.gpx,.geojson"
                      onChange={handleFileChange}
                      className="max-w-xs mx-auto"
                    />
                    {selectedFile && (
                      <p className="text-sm text-green-600 mt-2">
                        Selected: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsUploadDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleUpload}
                    disabled={uploadMapMutation.isPending || !selectedFile || !mapName}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {uploadMapMutation.isPending ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Address/GPS Search Bar */}
      <Card className="p-4">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            {useGpsSearch ? (
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label className="text-xs mb-1 block">Latitude</Label>
                  <Input
                    placeholder="e.g., 39.8283"
                    value={gpsLat}
                    onChange={(e) => setGpsLat(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs mb-1 block">Longitude</Label>
                  <Input
                    placeholder="e.g., -98.5795"
                    value={gpsLng}
                    onChange={(e) => setGpsLng(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  />
                </div>
              </div>
            ) : (
              <div>
                <Label className="text-xs mb-1 block">Search Address</Label>
                <Input
                  placeholder="Enter address, city, or location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
            )}
          </div>
          <Button onClick={handleSearch} className="gap-2">
            <Search className="h-4 w-4" />
            Search
          </Button>
          <Button
            variant="outline"
            onClick={() => setUseGpsSearch(!useGpsSearch)}
            className="text-xs"
          >
            {useGpsSearch ? "Address" : "GPS"}
          </Button>
        </div>
      </Card>

      {/* Leaflet Map Display */}
      <Card className="overflow-hidden">
        <div className="h-[400px]">
          <MapView
            initialCenter={{ lat: 39.8283, lng: -98.5795 }}
            initialZoom={5}
            onMapReady={handleMapReady}
          />
        </div>
      </Card>

      {/* Map Files Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Map Files</h3>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : maps && maps.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>File Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maps.map((map: any) => (
                <TableRow
                  key={map.id}
                  className={viewingMapId === map.id ? "bg-primary/5" : ""}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-green-600" />
                      {map.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(map.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className="uppercase text-xs font-medium bg-muted px-2 py-1 rounded">
                      {map.fileType}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewMap(map)}
                        title="View on map"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {map.fileUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(map.fileUrl!, "_blank")}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      {map.publicUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyPublicLink(map.publicUrl!)}
                          title="Copy share link"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this map?")) {
                            deleteMapMutation.mutate({ id: map.id });
                            if (viewingMapId === map.id) {
                              if (viewPolygonRef.current && mapRef.current) {
                                mapRef.current.removeLayer(viewPolygonRef.current);
                              }
                              viewPolygonRef.current = null;
                              setViewingMapId(null);
                            }
                          }
                        }}
                        className="text-destructive hover:text-destructive"
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No map files yet</p>
            <p className="text-sm text-muted-foreground">
              Upload a file or draw a new map to get started
            </p>
          </div>
        )}
      </Card>

      {/* Map Editor for drawing new maps */}
      <MapEditor
        open={showMapEditor}
        onOpenChange={setShowMapEditor}
        mode="standalone"
        title="Draw New Map"
        onSave={handleMapEditorSave}
      />
    </div>
  );
}
