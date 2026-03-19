import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Upload, FileText, Trash2, Download, MapPin } from "lucide-react";
import { toast } from "sonner";
import { MapEditor } from "@/components/map-editor/MapEditor";
import type { SiteAnnotations } from "@/components/map-editor/types";

interface MapFilesSectionProps {
  jobId: number;
}

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

export function MapFilesSection({ jobId }: MapFilesSectionProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [showMapEditor, setShowMapEditor] = useState(false);
  const [mapName, setMapName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const utils = trpc.useUtils();
  const { data: mapFiles, isLoading } = trpc.jobsV2.getMapFiles.useQuery({ jobId });
  
  const uploadMutation = trpc.jobsV2.uploadMapFile.useMutation({
    onSuccess: () => {
      toast.success("Map file uploaded successfully");
      utils.jobsV2.getMapFiles.invalidate({ jobId });
      setIsUploadDialogOpen(false);
      setMapName("");
      setSelectedFile(null);
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });

  const deleteMutation = trpc.jobsV2.deleteMapFile.useMutation({
    onSuccess: () => {
      toast.success("Map file deleted");
      utils.jobsV2.getMapFiles.invalidate({ jobId });
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !['kml', 'gpx', 'geojson'].includes(extension)) {
      toast.error("Invalid file type. Please upload KML, GPX, or GeoJSON files.");
      return;
    }

    setSelectedFile(file);
    if (!mapName) {
      setMapName(file.name);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !mapName) {
      toast.error("Please select a file and enter a name");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64Content = e.target?.result as string;
        const base64Data = base64Content.split(',')[1]; // Remove data:*/*;base64, prefix
        
        const fileType = selectedFile.name.split('.').pop()?.toLowerCase() as "kml" | "gpx" | "geojson";
        
        uploadMutation.mutate({
          jobId,
          name: mapName,
          fileType,
          fileContent: base64Data,
          fileSize: selectedFile.size,
        });
      };
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast.error("Failed to read file");
    }
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this map file?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getFileIcon = (fileType: string) => {
    return <FileText className="w-5 h-5 text-primary" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Unknown size";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Map Files</h3>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowMapEditor(true)}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <MapPin className="w-4 h-4" />
              Create Map
            </Button>
            <Button
              onClick={() => setIsUploadDialogOpen(true)}
              size="sm"
              variant="outline"
              className="gap-2"
            >
              <Upload className="w-4 h-4" />
              Upload Map
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading map files...</p>
        ) : mapFiles && mapFiles.length > 0 ? (
          <div className="space-y-2">
            {mapFiles.map((file) => (
              <div
                key={file.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1">
                  {getFileIcon(file.fileType)}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {file.fileType.toUpperCase()} • {formatFileSize(file.fileSize || undefined)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(file.fileUrl, '_blank')}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(file.id)}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed rounded-lg">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No map files uploaded</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload KML, GPX, or GeoJSON files to visualize job locations
            </p>
          </div>
        )}

        {/* Upload Dialog */}
        <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Map File</DialogTitle>
              <DialogDescription>
                Upload KML, GPX, or GeoJSON files to visualize spray job locations
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="mapName">Map Name *</Label>
                <Input
                  id="mapName"
                  value={mapName}
                  onChange={(e) => setMapName(e.target.value)}
                  placeholder="Enter map name"
                />
              </div>

              <div>
                <Label htmlFor="fileUpload">File *</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {selectedFile
                      ? selectedFile.name
                      : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    KML, GPX, or GeoJSON files
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".kml,.gpx,.geojson"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsUploadDialogOpen(false);
                    setMapName("");
                    setSelectedFile(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !mapName || uploadMutation.isPending}
                >
                  {uploadMutation.isPending ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>

    {/* Full Map Editor for creating maps */}
    <MapEditor
      open={showMapEditor}
      onOpenChange={setShowMapEditor}
      mode="standalone"
      title="Create Map"
      onSave={(data) => {
        const kmlContent = annotationsToKML(data.annotations, "Job Map");
        const blob = new Blob([kmlContent], { type: "application/vnd.google-earth.kml+xml" });
        const file = new File([blob], "map.kml", { type: "application/vnd.google-earth.kml+xml" });
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64 = e.target?.result as string;
          await uploadMutation.mutateAsync({
            jobId,
            name: `Map ${new Date().toLocaleDateString()}`,
            fileType: "kml",
            fileContent: base64.split(',')[1],
            fileSize: blob.size,
          });
        };
        reader.readAsDataURL(file);
      }}
    />
    </>
  );
}
