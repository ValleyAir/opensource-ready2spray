import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, MapPin, Navigation } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MapEditor } from "@/components/map-editor/MapEditor";
import type { SiteAnnotations } from "@/components/map-editor/types";

interface PropertyFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  customerId?: number;
  initialData?: any;
  onSuccess?: () => void;
}

export function PropertyFormDialog({ open, onOpenChange, mode, customerId, initialData, onSuccess }: PropertyFormDialogProps) {
  const [showMapEditor, setShowMapEditor] = useState(false);
  const [useGpsInput, setUseGpsInput] = useState(false);
  const [formData, setFormData] = useState({
    customerId: undefined as number | undefined,
    name: "",
    siteType: "field" as "field" | "orchard" | "vineyard" | "pivot" | "property" | "commercial_building",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    centerLat: "",
    centerLng: "",
    acres: "",
    polygon: null as any,
    annotations: null as SiteAnnotations | null,
    sensitiveAreas: [] as any[],
    crop: "",
    variety: "",
    growthStage: "",
    propertyType: undefined as "residential" | "commercial" | "multi_family" | "industrial" | undefined,
    units: "",
    notes: "",
    latitude: "",
    longitude: "",
  });

  const { data: customers } = trpc.customers.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.sites.create.useMutation({
    onSuccess: () => {
      utils.sites.list.invalidate();
      if (customerId) {
        utils.customers.getSites.invalidate({ customerId });
      }
      toast.success("Property created successfully!");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(`Failed to create property: ${error.message}`);
    },
  });

  const updateMutation = trpc.sites.update.useMutation({
    onSuccess: () => {
      utils.sites.list.invalidate();
      if (customerId) {
        utils.customers.getSites.invalidate({ customerId });
      }
      toast.success("Property updated successfully!");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(`Failed to update property: ${error.message}`);
    },
  });

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialData) {
        setFormData({
          customerId: initialData.customerId || customerId || undefined,
          name: initialData.name || "",
          siteType: initialData.siteType || "field",
          address: initialData.address || "",
          city: initialData.city || "",
          state: initialData.state || "",
          zipCode: initialData.zipCode || "",
          centerLat: initialData.centerLat || "",
          centerLng: initialData.centerLng || "",
          acres: initialData.acres || "",
          polygon: initialData.polygon || null,
          annotations: initialData.annotations || null,
          sensitiveAreas: initialData.sensitiveAreas || [],
          crop: initialData.crop || "",
          variety: initialData.variety || "",
          growthStage: initialData.growthStage || "",
          propertyType: initialData.propertyType || undefined,
          units: initialData.units?.toString() || "",
          notes: initialData.notes || "",
          latitude: "",
          longitude: "",
        });
      } else {
        setFormData({
          customerId: customerId || undefined,
          name: "",
          siteType: "field",
          address: "",
          city: "",
          state: "",
          zipCode: "",
          centerLat: "",
          centerLng: "",
          acres: "",
          polygon: null,
          annotations: null,
          sensitiveAreas: [],
          crop: "",
          variety: "",
          growthStage: "",
          propertyType: undefined,
          units: "",
          notes: "",
          latitude: "",
          longitude: "",
        });
      }
      setUseGpsInput(false);
    }
  }, [open, mode, initialData, customerId]);

  const handleSubmit = () => {
    const payload: any = {
      ...formData,
      customerId: formData.customerId || undefined,
      acres: formData.acres ? parseFloat(formData.acres) : undefined,
      units: formData.units ? parseInt(formData.units) : undefined,
      polygon: formData.polygon || undefined,
      annotations: formData.annotations || undefined,
      sensitiveAreas: formData.sensitiveAreas.length > 0 ? formData.sensitiveAreas : undefined,
      latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
      longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
    };

    if (mode === "edit" && initialData) {
      updateMutation.mutate({ id: initialData.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{mode === "edit" ? "Edit Property" : "Create New Property"}</DialogTitle>
            <DialogDescription>
              {mode === "edit" ? "Update property information" : "Add a new field, property, or treatment location"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {!customerId && (
              <div className="grid gap-2">
                <Label>Customer</Label>
                <Select
                  value={formData.customerId?.toString() || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, customerId: value ? parseInt(value) : undefined })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((customer: any) => (
                      <SelectItem key={customer.id} value={customer.id.toString()}>
                        {customer.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-2">
              <Label>Property Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., North Field, Main Property"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label>Property Type *</Label>
              <Select
                value={formData.siteType}
                onValueChange={(value: any) => setFormData({ ...formData, siteType: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="field">Field</SelectItem>
                  <SelectItem value="orchard">Orchard</SelectItem>
                  <SelectItem value="vineyard">Vineyard</SelectItem>
                  <SelectItem value="pivot">Pivot</SelectItem>
                  <SelectItem value="property">Property</SelectItem>
                  <SelectItem value="commercial_building">Commercial Building</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Address</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Street address"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="grid gap-2 col-span-2">
                <Label>City</Label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="City"
                />
              </div>
              <div className="grid gap-2">
                <Label>State</Label>
                <Input
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="State"
                  maxLength={2}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>ZIP Code</Label>
              <Input
                value={formData.zipCode}
                onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                placeholder="ZIP Code"
              />
            </div>

            <div className="flex items-center gap-3 py-2">
              <Switch
                checked={useGpsInput}
                onCheckedChange={setUseGpsInput}
              />
              <Label className="flex items-center gap-2 cursor-pointer">
                <Navigation className="h-4 w-4" />
                Use GPS Coordinates
              </Label>
            </div>

            {useGpsInput && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Latitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    placeholder="e.g., 39.8283"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Longitude</Label>
                  <Input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    placeholder="e.g., -98.5795"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowMapEditor(true)}
                className="w-full"
              >
                <MapPin className="mr-2 h-4 w-4" />
                {formData.polygon ? "Edit Boundaries & Annotations" : "Draw Boundaries & Add Annotations"}
              </Button>
              {formData.acres && (
                <p className="text-sm text-muted-foreground">
                  Calculated acres: {formData.acres}
                </p>
              )}
            </div>

            {(formData.siteType === "field" || formData.siteType === "orchard" || formData.siteType === "vineyard" || formData.siteType === "pivot") && (
              <>
                <div className="grid gap-2">
                  <Label>Acres</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.acres}
                    onChange={(e) => setFormData({ ...formData, acres: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Crop</Label>
                  <Input
                    value={formData.crop}
                    onChange={(e) => setFormData({ ...formData, crop: e.target.value })}
                    placeholder="e.g., Corn, Soybeans, Wheat"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Variety</Label>
                  <Input
                    value={formData.variety}
                    onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                    placeholder="e.g., Variety name"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Growth Stage</Label>
                  <Input
                    value={formData.growthStage}
                    onChange={(e) => setFormData({ ...formData, growthStage: e.target.value })}
                    placeholder="e.g., V6, R3"
                  />
                </div>
              </>
            )}

            {(formData.siteType === "property" || formData.siteType === "commercial_building") && (
              <>
                <div className="grid gap-2">
                  <Label>Property Type</Label>
                  <Select
                    value={formData.propertyType || ""}
                    onValueChange={(value: any) => setFormData({ ...formData, propertyType: value || undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select property type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="multi_family">Multi-Family</SelectItem>
                      <SelectItem value="industrial">Industrial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Units</Label>
                  <Input
                    type="number"
                    value={formData.units}
                    onChange={(e) => setFormData({ ...formData, units: e.target.value })}
                    placeholder="Number of units"
                  />
                </div>
              </>
            )}

            <div className="grid gap-2">
              <Label>Notes</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Additional notes about this site"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || !formData.name}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {mode === "edit" ? "Update Property" : "Create Property"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <MapEditor
        open={showMapEditor}
        onOpenChange={setShowMapEditor}
        mode="site"
        title={formData.name || "Property Map"}
        initialPolygon={formData.polygon}
        initialCenter={
          formData.centerLat && formData.centerLng
            ? { lat: parseFloat(formData.centerLat), lng: parseFloat(formData.centerLng) }
            : undefined
        }
        initialAnnotations={formData.annotations}
        onSave={(data) => {
          setFormData({
            ...formData,
            polygon: data.polygon || formData.polygon,
            annotations: data.annotations,
            centerLat: data.centerLat || formData.centerLat,
            centerLng: data.centerLng || formData.centerLng,
            acres: data.acres ? data.acres.toFixed(2) : formData.acres,
          });
        }}
      />
    </>
  );
}
