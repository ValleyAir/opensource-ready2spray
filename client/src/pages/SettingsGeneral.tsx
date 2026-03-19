import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Building2, Save, GripVertical, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function Settings() {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    website: "",
    notes: "",
    mode: "ag_aerial" as "ag_aerial" | "residential_pest" | "both",
    featuresEnabled: [] as string[],
  });

  const { data: organization, isLoading } = trpc.organization.get.useQuery();
  const utils = trpc.useUtils();

  const updateMutation = trpc.organization.update.useMutation({
    onSuccess: () => {
      utils.organization.get.invalidate();
      toast.success("Organization updated successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to update organization: ${error.message}`);
    },
  });

  // Populate form when organization data loads
  useEffect(() => {
    if (organization) {
      setFormData({
        name: organization.name || "",
        address: organization.address || "",
        city: organization.city || "",
        state: organization.state || "",
        zipCode: organization.zipCode || "",
        phone: organization.phone || "",
        email: organization.email || "",
        website: organization.website || "",
        notes: organization.notes || "",
        mode: (organization.mode as "ag_aerial" | "residential_pest" | "both") || "ag_aerial",
        featuresEnabled: (organization.featuresEnabled as string[]) || [],
      });
    }
  }, [organization]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            <CardTitle>Organization Profile</CardTitle>
          </div>
          <CardDescription>
            Update your organization's information and contact details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                  placeholder="Your Company Name"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder="Street address"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2 col-span-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    placeholder="City"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                    placeholder="State"
                    maxLength={2}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) =>
                    setFormData({ ...formData, zipCode: e.target.value })
                  }
                  placeholder="ZIP Code"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="(555) 555-5555"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="contact@company.com"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  placeholder="https://www.company.com"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder="Additional information about your organization"
                  rows={4}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Organization Mode Section */}
      <Card>
        <CardHeader>
          <CardTitle>Organization Mode</CardTitle>
          <CardDescription>
            Select your organization type to customize the interface and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="mode">Organization Type *</Label>
                <Select
                  value={formData.mode}
                  onValueChange={(value: "ag_aerial" | "residential_pest" | "both") =>
                    setFormData({ ...formData, mode: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select organization type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ag_aerial">Ag Aerial (Aerial Application)</SelectItem>
                    <SelectItem value="residential_pest">Residential Pest Control</SelectItem>
                    <SelectItem value="both">Both (Ag Aerial + Pest Control)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {formData.mode === "ag_aerial" && "Optimized for aerial application operations with flight boards, load sheets, and field management."}
                  {formData.mode === "residential_pest" && "Optimized for pest control with service plans, zones, and route boards."}
                  {formData.mode === "both" && "Full platform with features for both aerial application and pest control operations."}
                </p>
              </div>

              <div className="grid gap-2">
                <Label>Enabled Features</Label>
                <div className="space-y-2">
                  {(formData.mode === "ag_aerial" || formData.mode === "both") && (
                    <>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="flight_board"
                          checked={formData.featuresEnabled.includes("flight_board")}
                          onChange={(e) => {
                            const features = e.target.checked
                              ? [...formData.featuresEnabled, "flight_board"]
                              : formData.featuresEnabled.filter((f) => f !== "flight_board");
                            setFormData({ ...formData, featuresEnabled: features });
                          }}
                          className="h-4 w-4"
                        />
                        <label htmlFor="flight_board" className="text-sm font-medium">
                          Flight Board (Pilot mobile view)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="load_sheets"
                          checked={formData.featuresEnabled.includes("load_sheets")}
                          onChange={(e) => {
                            const features = e.target.checked
                              ? [...formData.featuresEnabled, "load_sheets"]
                              : formData.featuresEnabled.filter((f) => f !== "load_sheets");
                            setFormData({ ...formData, featuresEnabled: features });
                          }}
                          className="h-4 w-4"
                        />
                        <label htmlFor="load_sheets" className="text-sm font-medium">
                          Load Sheets (Ground crew mobile view)
                        </label>
                      </div>
                    </>
                  )}
                  {(formData.mode === "residential_pest" || formData.mode === "both") && (
                    <>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="service_plans"
                          checked={formData.featuresEnabled.includes("service_plans")}
                          onChange={(e) => {
                            const features = e.target.checked
                              ? [...formData.featuresEnabled, "service_plans"]
                              : formData.featuresEnabled.filter((f) => f !== "service_plans");
                            setFormData({ ...formData, featuresEnabled: features });
                          }}
                          className="h-4 w-4"
                        />
                        <label htmlFor="service_plans" className="text-sm font-medium">
                          Service Plans (Recurring services)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="zones"
                          checked={formData.featuresEnabled.includes("zones")}
                          onChange={(e) => {
                            const features = e.target.checked
                              ? [...formData.featuresEnabled, "zones"]
                              : formData.featuresEnabled.filter((f) => f !== "zones");
                            setFormData({ ...formData, featuresEnabled: features });
                          }}
                          className="h-4 w-4"
                        />
                        <label htmlFor="zones" className="text-sm font-medium">
                          Zones (Treatment areas)
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="routes"
                          checked={formData.featuresEnabled.includes("routes")}
                          onChange={(e) => {
                            const features = e.target.checked
                              ? [...formData.featuresEnabled, "routes"]
                              : formData.featuresEnabled.filter((f) => f !== "routes");
                            setFormData({ ...formData, featuresEnabled: features });
                          }}
                          className="h-4 w-4"
                        />
                        <label htmlFor="routes" className="text-sm font-medium">
                          Route Board (Pest tech mobile view)
                        </label>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Integrations Section */}
      <IntegrationsSection />

      {/* Job Statuses Section */}
      <JobStatusesSection />
    </>
  );
}

// Sortable Status Item Component
function SortableStatusItem({ status, onEdit, onDelete }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: status.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors bg-background"
    >
      <div className="flex items-center gap-3">
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div
          className="w-4 h-4 rounded-full"
          style={{ backgroundColor: status.color }}
        />
        <div>
          <p className="font-medium">{status.name}</p>
          <p className="text-sm text-muted-foreground capitalize">
            {status.category.replace("_", " ")}
          </p>
        </div>
        {status.isDefault && (
          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
            Default
          </span>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(status)}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(status.id)}
          disabled={status.isDefault}
        >
          Delete
        </Button>
      </div>
    </div>
  );
}

// Google Maps API Key Component
function GoogleMapsSection() {
  const [apiKey, setApiKey] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  const { data: organization } = trpc.organization.get.useQuery();
  const utils = trpc.useUtils();

  const updateMutation = trpc.organization.update.useMutation({
    onSuccess: () => {
      utils.organization.get.invalidate();
      utils.organization.getMapConfig.invalidate();
      toast.success("Google Maps API key saved!");
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to save API key: ${error.message}`);
    },
  });

  useEffect(() => {
    if (organization?.googleMapsApiKey) {
      setApiKey(organization.googleMapsApiKey);
    }
  }, [organization?.googleMapsApiKey]);

  const hasKey = !!organization?.googleMapsApiKey;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ googleMapsApiKey: apiKey });
  };

  const handleRemove = () => {
    setApiKey("");
    updateMutation.mutate({ googleMapsApiKey: "" });
  };

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">Google Maps</h3>
            <p className="text-sm text-muted-foreground">
              {hasKey ? "Connected" : "Not configured"}
            </p>
          </div>
        </div>
        {hasKey && !isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleRemove} disabled={updateMutation.isPending}>
              Remove
            </Button>
          </div>
        ) : !isEditing ? (
          <Button onClick={() => setIsEditing(true)} size="sm">
            Configure
          </Button>
        ) : null}
      </div>

      {isEditing && (
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="googleMapsApiKey">API Key</Label>
            <Input
              id="googleMapsApiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google Maps API key"
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter your Google Maps API key to enable satellite map views and the map editor
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setApiKey(organization?.googleMapsApiKey || "");
              }}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

// Integrations Management Component
function IntegrationsSection() {
  const [isAddingZoho, setIsAddingZoho] = useState(false);
  const [isAddingFieldPulse, setIsAddingFieldPulse] = useState(false);
  const [zohoForm, setZohoForm] = useState({ clientId: "", clientSecret: "" });
  const [fieldPulseForm, setFieldPulseForm] = useState({ apiKey: "" });

  const { data: integrations, isLoading } = trpc.integrations.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.integrations.create.useMutation({
    onSuccess: () => {
      utils.integrations.list.invalidate();
      toast.success("Integration connected successfully!");
      setIsAddingZoho(false);
      setIsAddingFieldPulse(false);
      setZohoForm({ clientId: "", clientSecret: "" });
      setFieldPulseForm({ apiKey: "" });
    },
    onError: (error: any) => {
      toast.error(`Failed to connect integration: ${error.message}`);
    },
  });

  const updateMutation = trpc.integrations.update.useMutation({
    onSuccess: () => {
      utils.integrations.list.invalidate();
      toast.success("Integration settings updated!");
    },
    onError: (error: any) => {
      toast.error(`Failed to update integration: ${error.message}`);
    },
  });

  const deleteMutation = trpc.integrations.delete.useMutation({
    onSuccess: () => {
      utils.integrations.list.invalidate();
      toast.success("Integration disconnected!");
    },
    onError: (error: any) => {
      toast.error(`Failed to disconnect integration: ${error.message}`);
    },
  });

  const zohoConnection = integrations?.find(i => i.integrationType === 'zoho_crm');
  const fieldPulseConnection = integrations?.find(i => i.integrationType === 'fieldpulse');

  const handleZohoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      integrationType: 'zoho_crm',
      zohoClientId: zohoForm.clientId,
      zohoClientSecret: zohoForm.clientSecret,
      syncCustomers: true,
      syncJobs: true,
      syncIntervalMinutes: 15,
    });
  };

  const handleFieldPulseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      integrationType: 'fieldpulse',
      fieldpulseApiKey: fieldPulseForm.apiKey,
      syncCustomers: true,
      syncJobs: true,
      syncIntervalMinutes: 15,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrations</CardTitle>
        <CardDescription>
          Connect Zoho CRM and FieldPulse to sync customers and jobs
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Zoho CRM Integration */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Zoho CRM</h3>
              <p className="text-sm text-muted-foreground">
                {zohoConnection ? 'Connected' : 'Not connected'}
              </p>
            </div>
            {zohoConnection ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('Disconnect Zoho CRM?')) {
                      deleteMutation.mutate({ id: zohoConnection.id });
                    }
                  }}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsAddingZoho(!isAddingZoho)}
                variant={isAddingZoho ? "outline" : "default"}
                size="sm"
              >
                {isAddingZoho ? "Cancel" : "Connect"}
              </Button>
            )}
          </div>

          {isAddingZoho && !zohoConnection && (
            <form onSubmit={handleZohoSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="zohoClientId">Client ID</Label>
                <Input
                  id="zohoClientId"
                  value={zohoForm.clientId}
                  onChange={(e) => setZohoForm({ ...zohoForm, clientId: e.target.value })}
                  placeholder="Enter Zoho Client ID"
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="zohoClientSecret">Client Secret</Label>
                <Input
                  id="zohoClientSecret"
                  type="password"
                  value={zohoForm.clientSecret}
                  onChange={(e) => setZohoForm({ ...zohoForm, clientSecret: e.target.value })}
                  placeholder="Enter Zoho Client Secret"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddingZoho(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Connect Zoho CRM
                </Button>
              </div>
            </form>
          )}

          {zohoConnection && (
            <div className="space-y-2 text-sm">
              <p>Last sync: {zohoConnection.lastSyncAt ? new Date(zohoConnection.lastSyncAt).toLocaleString() : 'Never'}</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={zohoConnection.syncCustomers ?? false}
                    onChange={(e) => updateMutation.mutate({ id: zohoConnection.id, syncCustomers: e.target.checked })}
                  />
                  Sync Customers
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={zohoConnection.syncJobs ?? false}
                    onChange={(e) => updateMutation.mutate({ id: zohoConnection.id, syncJobs: e.target.checked })}
                  />
                  Sync Jobs
                </label>
              </div>
            </div>
          )}
        </div>

        {/* FieldPulse Integration */}
        <div className="border rounded-lg p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">FieldPulse</h3>
              <p className="text-sm text-muted-foreground">
                {fieldPulseConnection ? 'Connected' : 'Not connected'}
              </p>
            </div>
            {fieldPulseConnection ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (confirm('Disconnect FieldPulse?')) {
                      deleteMutation.mutate({ id: fieldPulseConnection.id });
                    }
                  }}
                >
                  Disconnect
                </Button>
              </div>
            ) : (
              <Button
                onClick={() => setIsAddingFieldPulse(!isAddingFieldPulse)}
                variant={isAddingFieldPulse ? "outline" : "default"}
                size="sm"
              >
                {isAddingFieldPulse ? "Cancel" : "Connect"}
              </Button>
            )}
          </div>

          {isAddingFieldPulse && !fieldPulseConnection && (
            <form onSubmit={handleFieldPulseSubmit} className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="fieldpulseApiKey">API Key</Label>
                <Input
                  id="fieldpulseApiKey"
                  type="password"
                  value={fieldPulseForm.apiKey}
                  onChange={(e) => setFieldPulseForm({ apiKey: e.target.value })}
                  placeholder="Enter FieldPulse API Key"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddingFieldPulse(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Connect FieldPulse
                </Button>
              </div>
            </form>
          )}

          {fieldPulseConnection && (
            <div className="space-y-2 text-sm">
              <p>Last sync: {fieldPulseConnection.lastSyncAt ? new Date(fieldPulseConnection.lastSyncAt).toLocaleString() : 'Never'}</p>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={fieldPulseConnection.syncCustomers ?? false}
                    onChange={(e) => updateMutation.mutate({ id: fieldPulseConnection.id, syncCustomers: e.target.checked })}
                  />
                  Sync Customers
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={fieldPulseConnection.syncJobs ?? false}
                    onChange={(e) => updateMutation.mutate({ id: fieldPulseConnection.id, syncJobs: e.target.checked })}
                  />
                  Sync Jobs
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Google Maps Integration */}
        <GoogleMapsSection />
      </CardContent>
    </Card>
  );
}

// Job Statuses Management Component
function JobStatusesSection() {
  const [isAddingStatus, setIsAddingStatus] = useState(false);
  const [editingStatus, setEditingStatus] = useState<any>(null);
  const [statusForm, setStatusForm] = useState({
    name: "",
    color: "#3B82F6",
    category: "pending" as "pending" | "active" | "completed" | "cancelled",
  });

  const { data: jobStatuses, isLoading } = trpc.jobStatuses.list.useQuery();
  const utils = trpc.useUtils();

  // Local state for drag-and-drop
  const [localStatuses, setLocalStatuses] = useState<any[]>([]);

  useEffect(() => {
    if (jobStatuses) {
      setLocalStatuses(jobStatuses);
    }
  }, [jobStatuses]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const createMutation = trpc.jobStatuses.create.useMutation({
    onSuccess: () => {
      utils.jobStatuses.list.invalidate();
      toast.success("Status created successfully!");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to create status: ${error.message}`);
    },
  });

  const updateMutation = trpc.jobStatuses.update.useMutation({
    onSuccess: () => {
      utils.jobStatuses.list.invalidate();
      toast.success("Status updated successfully!");
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  const deleteMutation = trpc.jobStatuses.delete.useMutation({
    onSuccess: () => {
      utils.jobStatuses.list.invalidate();
      toast.success("Status deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete status: ${error.message}`);
    },
  });

  const reorderMutation = trpc.jobStatuses.reorder.useMutation({
    onSuccess: () => {
      utils.jobStatuses.list.invalidate();
      toast.success("Status order updated!");
    },
    onError: (error: any) => {
      toast.error(`Failed to reorder statuses: ${error.message}`);
      // Revert to original order on error
      if (jobStatuses) {
        setLocalStatuses(jobStatuses);
      }
    },
  });

  const resetForm = () => {
    setStatusForm({ name: "", color: "#3B82F6", category: "pending" });
    setIsAddingStatus(false);
    setEditingStatus(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingStatus) {
      updateMutation.mutate({ id: editingStatus.id, ...statusForm });
    } else {
      // Get the highest display order and add 1
      const maxOrder = Math.max(...(jobStatuses?.map(s => s.displayOrder) || [0]));
      createMutation.mutate({ ...statusForm, displayOrder: maxOrder + 1 });
    }
  };

  const handleEdit = (status: any) => {
    setEditingStatus(status);
    setStatusForm({
      name: status.name,
      color: status.color,
      category: status.category,
    });
    setIsAddingStatus(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this status?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalStatuses((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Send reorder mutation with new order
        const statusIds = newOrder.map(s => s.id);
        reorderMutation.mutate({ statusIds });
        
        return newOrder;
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Job Statuses</CardTitle>
            <CardDescription>
              Customize your job workflow stages (drag to reorder)
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsAddingStatus(!isAddingStatus)}
            variant={isAddingStatus ? "outline" : "default"}
          >
            {isAddingStatus ? "Cancel" : "+ Add Status"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAddingStatus && (
          <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="statusName">Status Name</Label>
                <Input
                  id="statusName"
                  value={statusForm.name}
                  onChange={(e) =>
                    setStatusForm({ ...statusForm, name: e.target.value })
                  }
                  placeholder="e.g., Scheduled, In Progress, Completed"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="statusColor">Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="statusColor"
                      type="color"
                      value={statusForm.color}
                      onChange={(e) =>
                        setStatusForm({ ...statusForm, color: e.target.value })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={statusForm.color}
                      onChange={(e) =>
                        setStatusForm({ ...statusForm, color: e.target.value })
                      }
                      placeholder="#3B82F6"
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="statusCategory">Category</Label>
                  <Select
                    value={statusForm.category}
                    onValueChange={(value: any) =>
                      setStatusForm({ ...statusForm, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending (Not Started)</SelectItem>
                      <SelectItem value="active">Active (In Progress)</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {(createMutation.isPending || updateMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {editingStatus ? "Update Status" : "Create Status"}
              </Button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localStatuses.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {localStatuses.map((status) => (
                  <SortableStatusItem
                    key={status.id}
                    status={status}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
