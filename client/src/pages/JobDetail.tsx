import { useState } from "react";
import { useParams, useLocation } from "wouter";
import L from "leaflet";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Loader2, 
  ArrowLeft, 
  Link as LinkIcon, 
  Package, 
  AlertTriangle, 
  Clock, 
  Droplets, 
  Sprout,
  MapPin,
  User,
  Wrench,
  Calendar,
  Briefcase,
  Flag,
  Pencil,
  Trash2,
  Share2,
  Copy,
  Check,
  Wind,
  ClipboardCheck
} from "lucide-react";
import { EditJobDialog } from "@/components/EditJobDialog";
import { MapEditor } from "@/components/map-editor/MapEditor";
import { MapView } from "@/components/Map";
import { MapFilesSection } from "@/components/MapFilesSection";

export default function JobV2Detail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const jobId = params.id ? parseInt(params.id) : 0;
  const { data: job, isLoading, refetch } = trpc.jobsV2.getById.useQuery({ id: jobId });
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showMapDrawer, setShowMapDrawer] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const deleteJobMutation = trpc.jobsV2.delete.useMutation({
    onSuccess: () => {
      toast.success("Job deleted successfully");
      navigate("/jobs");
    },
    onError: (error) => {
      toast.error(`Failed to delete job: ${error.message}`);
    },
  });

  const createShareMutation = trpc.jobShares.create.useMutation({
    onSuccess: (data) => {
      const fullUrl = `${window.location.origin}/share/${data.shareToken}`;
      setShareLink(fullUrl);
      toast.success("Share link created");
    },
    onError: (error) => {
      toast.error(`Failed to create share link: ${error.message}`);
    },
  });

  const updatePolygonMutation = trpc.jobsV2.update.useMutation({
    onSuccess: () => {
      toast.success("Treatment area saved");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to save treatment area: ${error.message}`);
    },
  });

  const handleSavePolygon = (data: { polygon?: any; annotations: any; centerLat?: string; centerLng?: string; acres?: number }) => {
    if (data.polygon) {
      updatePolygonMutation.mutate({
        id: jobId,
        treatmentPolygon: data.polygon,
        acres: data.acres || 0,
      });
    }
  };

  const handleDelete = () => {
    deleteJobMutation.mutate({ id: jobId });
  };

  const handleShare = () => {
    createShareMutation.mutate({ jobId: jobId });
  };

  const handleCopyLink = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      toast.success("Link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLinkProduct = () => {
    navigate(`/product-lookup?jobV2Id=${jobId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="container mx-auto py-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">Job not found</p>
            <Button onClick={() => navigate("/jobs")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'ready':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <>
      <div className="container mx-auto py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/jobs")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">{job.title}</h1>
                {job.statusId && (
                  <Badge className={getStatusColor(String(job.statusId))}>
                    Status ID: {job.statusId}
                  </Badge>
                )}
                {job.priority && (
                  <Badge className={getPriorityColor(job.priority)}>
                    {job.priority}
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground mt-1">
                Created {new Date(job.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/jobs/${jobId}/preflight`)}>
              <ClipboardCheck className="w-4 h-4 mr-2" />
              Pre-Flight
            </Button>
            <Button variant="outline" onClick={() => navigate(`/tools/drift-calculator?jobId=${jobId}`)}>
              <Wind className="w-4 h-4 mr-2" />
              Drift Risk
            </Button>
            <Button onClick={() => setShowEditDialog(true)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit Job
            </Button>
            <Button variant="outline" onClick={() => setShowShareDialog(true)}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>

        {/* Edit Job Dialog */}
        <EditJobDialog
          job={job}
          open={showEditDialog}
          onOpenChange={setShowEditDialog}
          onSuccess={() => refetch()}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Job</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{job.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-2 mt-4">
              <Button
                variant="outline"
                onClick={() => setShowDeleteDialog(false)}
                disabled={deleteJobMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteJobMutation.isPending}
              >
                {deleteJobMutation.isPending && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Delete Job
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Share Job Dialog */}
        <Dialog open={showShareDialog} onOpenChange={(open) => {
          setShowShareDialog(open);
          if (!open) {
            setShareLink(null);
            setCopied(false);
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Share Job</DialogTitle>
              <DialogDescription>
                Create a shareable link for "{job.title}" that allows view-only access and file downloads.
              </DialogDescription>
            </DialogHeader>
            {shareLink ? (
              <div className="space-y-4">
                <div>
                  <Label>Share Link</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={shareLink}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={handleCopyLink}
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Anyone with this link can view the job details and download files.
                  </p>
                </div>
                <div className="flex justify-end">
                  <Button onClick={() => setShowShareDialog(false)}>
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This will create a public link that allows anyone to view this job's details and download associated files.
                </p>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowShareDialog(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleShare}
                    disabled={createShareMutation.isPending}
                  >
                    {createShareMutation.isPending && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Create Share Link
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Job Map Editor */}
        <MapEditor
          open={showMapDrawer}
          onOpenChange={setShowMapDrawer}
          mode="site"
          title={job.title || "Treatment Area"}
          onSave={handleSavePolygon}
          initialPolygon={job.treatmentPolygon as any}
          initialCenter={
            job.locationLat && job.locationLng
              ? { lat: parseFloat(job.locationLat.toString()), lng: parseFloat(job.locationLng.toString()) }
              : undefined
          }
        />

        {/* Job Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Job Information</CardTitle>
            <CardDescription>Basic details about this spray job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Title</label>
                <p className="text-lg">{job.title}</p>
              </div>
              
              {job.jobType && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Briefcase className="w-4 h-4" />
                    Job Type
                  </label>
                  <p className="text-lg capitalize">{job.jobType.replace('_', ' ')}</p>
                </div>
              )}
            </div>
            
            {job.description && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="text-base whitespace-pre-wrap">{job.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Customer & Assignment Card */}
        <Card>
          <CardHeader>
            <CardTitle>Customer & Assignment</CardTitle>
            <CardDescription>Who is involved in this job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {job.customerId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Customer
                  </label>
                  <p className="text-lg">Customer #{job.customerId}</p>
                </div>
              )}
              
              {job.assignedPersonnelId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Assigned Personnel
                  </label>
                  <p className="text-lg">Personnel #{job.assignedPersonnelId}</p>
                </div>
              )}
              
              {job.equipmentId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Wrench className="w-4 h-4" />
                    Assigned Equipment
                  </label>
                  <p className="text-lg">Equipment #{job.equipmentId}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Location & Scheduling Card */}
        <Card>
          <CardHeader>
            <CardTitle>Location & Scheduling</CardTitle>
            <CardDescription>Where and when this job takes place</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {job.locationAddress && (
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Job Location
                </label>
                <p className="text-lg">{job.locationAddress}</p>
                
                {/* Show map if coordinates are available */}
                {job.locationLat && job.locationLng && (
                  <div className="mt-4 rounded-lg overflow-hidden border">
                    <MapView
                      initialCenter={{ lat: parseFloat(job.locationLat.toString()), lng: parseFloat(job.locationLng.toString()) }}
                      initialZoom={15}
                      onMapReady={(map) => {
                        // Add marker at job location using Leaflet
                        const position = [parseFloat(job.locationLat!.toString()), parseFloat(job.locationLng!.toString())];
                        L.circleMarker(position as L.LatLngExpression, {
                          radius: 10,
                          fillColor: "#8b5cf6",
                          fillOpacity: 1,
                          weight: 2,
                          color: "#7c3aed",
                        }).addTo(map).bindPopup(job.title);

                        // Render treatment polygon if available
                        if (job.treatmentPolygon && (job.treatmentPolygon as any).coordinates) {
                          const poly = job.treatmentPolygon as any;
                          const ring = poly.coordinates[0];
                          if (ring) {
                            const paths = ring.map((coord: [number, number]) => [coord[1], coord[0]]);
                            L.polygon(paths as L.LatLngExpression[], {
                              fillColor: "#8b5cf6",
                              fillOpacity: 0.2,
                              weight: 2,
                              color: "#7c3aed",
                            }).addTo(map);
                          }
                        }
                      }}
                      className="h-[300px] w-full"
                    />
                  </div>
                )}

                {/* Treatment area info and button */}
                <div className="flex items-center justify-between mt-3">
                  <div>
                    {job.acres && (
                      <p className="text-sm text-muted-foreground">
                        <strong>Treatment Area:</strong> {parseFloat(job.acres).toFixed(2)} acres
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowMapDrawer(true)}
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    {job.treatmentPolygon ? "Edit Treatment Area" : "Draw Treatment Area"}
                  </Button>
                </div>
              </div>
            )}

            {/* Show draw button even without location */}
            {!job.locationAddress && (
              <div className="flex items-center justify-between">
                <div>
                  {job.acres && (
                    <p className="text-sm text-muted-foreground">
                      <strong>Treatment Area:</strong> {parseFloat(job.acres).toFixed(2)} acres
                    </p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMapDrawer(true)}
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  {job.treatmentPolygon ? "Edit Treatment Area" : "Draw Treatment Area"}
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {job.scheduledStart && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Scheduled Start
                  </label>
                  <p className="text-lg">
                    {new Date(job.scheduledStart).toLocaleString()}
                  </p>
                </div>
              )}
              
              {job.scheduledEnd && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Scheduled End
                  </label>
                  <p className="text-lg">
                    {new Date(job.scheduledEnd).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Map Files Section */}
        <MapFilesSection jobId={job.id} />

        {/* Product Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Chemical Product
                </CardTitle>
                <CardDescription>
                  Link a product to view EPA compliance and agricultural details
                </CardDescription>
              </div>
              <Button onClick={handleLinkProduct}>
                <LinkIcon className="w-4 h-4 mr-2" />
                {job.productId ? "Change Product" : "Link Product"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {job.product ? (
              <div className="space-y-6">
                {/* Product Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Product Name</label>
                    <p className="text-lg font-semibold">{job.product.nickname || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">EPA Number</label>
                    <p className="text-lg">EPA {job.product.epaNumber || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Manufacturer</label>
                    <p className="text-lg">{job.product.manufacturer || "N/A"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Active Ingredients</label>
                    <p className="text-lg">{job.product.activeIngredients || "N/A"}</p>
                  </div>
                </div>

                <Separator />

                {/* EPA Compliance */}
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5" />
                    EPA Compliance Requirements
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Re-Entry Interval (REI)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {job.product.hoursReentry ? `${job.product.hoursReentry} hours` : "N/A"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Sprout className="w-4 h-4" />
                          Pre-Harvest Interval (PHI)
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          {job.product.daysPreharvest ? `${job.product.daysPreharvest} days` : "N/A"}
                        </p>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Droplets className="w-4 h-4" />
                          Max Applications/Season
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold">
                          N/A
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <Separator />

                {/* Safety & PPE Information */}
                {(job.product.labelSignalWord || job.product.reentryPpe) && (
                  <div>
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-orange-500" />
                      Safety & PPE Information
                    </h3>
                    <div className="space-y-4">
                      {job.product.labelSignalWord && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Label Signal Word</label>
                          <p className="text-lg font-semibold uppercase text-orange-600">{job.product.labelSignalWord}</p>
                        </div>
                      )}
                      {job.product.reentryPpe && (
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">PPE Requirements</label>
                          <p className="text-base whitespace-pre-wrap bg-muted p-4 rounded-md">{job.product.reentryPpe}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No product linked yet</h3>
                <p className="text-muted-foreground mb-4">
                  Link a chemical product to view EPA compliance and agricultural details
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
