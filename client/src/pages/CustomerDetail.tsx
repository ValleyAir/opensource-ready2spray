import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PropertyFormDialog } from "@/components/PropertyFormDialog";
import {
  ArrowLeft, Mail, Phone, MapPin, Plus, Download, Pencil, Loader2,
  Building2, Trees, Briefcase, CalendarCheck, Globe, Smartphone, X, Check, Tag,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";

export default function CustomerDetail() {
  const params = useParams();
  const [, navigate] = useLocation();
  const customerId = params.id ? parseInt(params.id) : 0;

  const [propertyDialogOpen, setPropertyDialogOpen] = useState(false);
  const [propertyDialogMode, setPropertyDialogMode] = useState<"create" | "edit">("create");
  const [editingProperty, setEditingProperty] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);
  const [tagInput, setTagInput] = useState("");

  const { data: customer, isLoading: customerLoading } = trpc.customers.getById.useQuery({ id: customerId });
  const { data: sites } = trpc.customers.getSites.useQuery({ customerId });
  const { data: jobs } = trpc.customers.getJobs.useQuery({ customerId });
  const { data: servicePlans } = trpc.customers.getServicePlans.useQuery({ customerId });

  const utils = trpc.useUtils();

  const updateMutation = trpc.customers.update.useMutation({
    onSuccess: () => {
      utils.customers.getById.invalidate({ id: customerId });
      utils.customers.list.invalidate();
      toast.success("Customer updated!");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error(`Failed to update: ${error.message}`);
    },
  });

  useEffect(() => {
    if (customer && isEditing) {
      setEditData({
        name: customer.name || "",
        companyName: customer.companyName || "",
        email: customer.email || "",
        phone: customer.phone || "",
        cellPhone: customer.cellPhone || "",
        fax: customer.fax || "",
        website: customer.website || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        zipCode: customer.zipCode || "",
        billingAddress: customer.billingAddress || "",
        billingCity: customer.billingCity || "",
        billingState: customer.billingState || "",
        billingZip: customer.billingZip || "",
        customerType: customer.customerType || "agricultural",
        accountStatus: customer.accountStatus || "active",
        preferredContactMethod: customer.preferredContactMethod || "",
        taxId: customer.taxId || "",
        accountNumber: customer.accountNumber || "",
        referralSource: customer.referralSource || "",
        tags: (customer.tags as string[]) || [],
        latitude: customer.latitude || "",
        longitude: customer.longitude || "",
        notes: customer.notes || "",
      });
    }
  }, [customer, isEditing]);

  const handleSave = () => {
    if (!editData) return;
    updateMutation.mutate({
      id: customerId,
      ...editData,
      preferredContactMethod: editData.preferredContactMethod || undefined,
      customerType: editData.customerType || undefined,
      accountStatus: editData.accountStatus || undefined,
      latitude: editData.latitude ? parseFloat(editData.latitude) : undefined,
      longitude: editData.longitude ? parseFloat(editData.longitude) : undefined,
      tags: editData.tags?.length > 0 ? editData.tags : undefined,
    });
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && editData && !editData.tags.includes(tag)) {
      setEditData({ ...editData, tags: [...editData.tags, tag] });
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    if (editData) {
      setEditData({ ...editData, tags: editData.tags.filter((t: string) => t !== tag) });
    }
  };

  const handleDownloadKML = async (siteId: number) => {
    try {
      const result = await utils.client.sites.downloadKML.query({ siteId });
      const blob = new Blob([result.kml], { type: "application/vnd.google-earth.kml+xml" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("KML downloaded!");
    } catch (error: any) {
      toast.error(error.message || "Failed to download KML");
    }
  };

  if (customerLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/customers")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Customers
        </Button>
        <div className="text-center py-12 text-muted-foreground">Customer not found</div>
      </div>
    );
  }

  const priorityColor = (p: string) => {
    switch (p) {
      case "urgent": return "destructive";
      case "high": return "default";
      case "medium": return "secondary";
      default: return "outline";
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "completed": return "default";
      case "in_progress": return "secondary";
      case "cancelled": return "destructive";
      default: return "outline";
    }
  };

  const accountStatusColor = (s: string | null) => {
    switch (s) {
      case "active": return "default";
      case "inactive": return "secondary";
      case "lead": return "outline";
      case "prospect": return "outline";
      default: return "outline";
    }
  };

  const formatAddress = (addr?: string | null, city?: string | null, state?: string | null, zip?: string | null) => {
    const parts = [addr, [city, state].filter(Boolean).join(", "), zip].filter(Boolean);
    return parts.join(", ") || "—";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/customers")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
              {customer.companyName && (
                <span className="text-lg text-muted-foreground">| {customer.companyName}</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={accountStatusColor(customer.accountStatus) as any}>
                {customer.accountStatus || "active"}
              </Badge>
              {customer.customerType && (
                <Badge variant="outline">{customer.customerType}</Badge>
              )}
              <span className="text-sm text-muted-foreground">#{customer.id}</span>
            </div>
          </div>
        </div>
        {!isEditing ? (
          <Button variant="outline" onClick={() => setIsEditing(true)}>
            <Pencil className="h-4 w-4 mr-2" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          </div>
        )}
      </div>

      {/* Contact Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Contact Information</CardTitle>
        </CardHeader>
        <CardContent>
          {isEditing && editData ? (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Name *</Label>
                  <Input value={editData.name} onChange={(e) => setEditData({ ...editData, name: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Company Name</Label>
                  <Input value={editData.companyName} onChange={(e) => setEditData({ ...editData, companyName: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Email</Label>
                  <Input value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Phone</Label>
                  <Input value={editData.phone} onChange={(e) => setEditData({ ...editData, phone: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Cell Phone</Label>
                  <Input value={editData.cellPhone} onChange={(e) => setEditData({ ...editData, cellPhone: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Website</Label>
                  <Input value={editData.website} onChange={(e) => setEditData({ ...editData, website: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fax</Label>
                  <Input value={editData.fax} onChange={(e) => setEditData({ ...editData, fax: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Preferred Contact</Label>
                  <Select value={editData.preferredContactMethod} onValueChange={(v) => setEditData({ ...editData, preferredContactMethod: v })}>
                    <SelectTrigger className="h-9"><SelectValue placeholder="Select..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="mail">Mail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Customer Type</Label>
                  <Select value={editData.customerType} onValueChange={(v) => setEditData({ ...editData, customerType: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agricultural">Agricultural</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="residential">Residential</SelectItem>
                      <SelectItem value="government">Government</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Account Status</Label>
                  <Select value={editData.accountStatus} onValueChange={(v) => setEditData({ ...editData, accountStatus: v })}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="lead">Lead</SelectItem>
                      <SelectItem value="prospect">Prospect</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {/* Address */}
              <div className="border-t pt-3">
                <Label className="text-xs font-semibold text-muted-foreground">SERVICE ADDRESS</Label>
                <div className="grid gap-2 mt-2">
                  <Input placeholder="Address" value={editData.address} onChange={(e) => setEditData({ ...editData, address: e.target.value })} />
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="City" value={editData.city} onChange={(e) => setEditData({ ...editData, city: e.target.value })} />
                    <Input placeholder="State" value={editData.state} onChange={(e) => setEditData({ ...editData, state: e.target.value })} />
                    <Input placeholder="ZIP" value={editData.zipCode} onChange={(e) => setEditData({ ...editData, zipCode: e.target.value })} />
                  </div>
                </div>
              </div>
              {/* Billing Address */}
              <div className="border-t pt-3">
                <Label className="text-xs font-semibold text-muted-foreground">BILLING ADDRESS</Label>
                <div className="grid gap-2 mt-2">
                  <Input placeholder="Billing Address" value={editData.billingAddress} onChange={(e) => setEditData({ ...editData, billingAddress: e.target.value })} />
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="City" value={editData.billingCity} onChange={(e) => setEditData({ ...editData, billingCity: e.target.value })} />
                    <Input placeholder="State" value={editData.billingState} onChange={(e) => setEditData({ ...editData, billingState: e.target.value })} />
                    <Input placeholder="ZIP" value={editData.billingZip} onChange={(e) => setEditData({ ...editData, billingZip: e.target.value })} />
                  </div>
                </div>
              </div>
              {/* Business fields */}
              <div className="grid grid-cols-3 gap-4 border-t pt-3">
                <div className="space-y-1">
                  <Label className="text-xs">Tax ID</Label>
                  <Input value={editData.taxId} onChange={(e) => setEditData({ ...editData, taxId: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Account #</Label>
                  <Input value={editData.accountNumber} onChange={(e) => setEditData({ ...editData, accountNumber: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Referral Source</Label>
                  <Input value={editData.referralSource} onChange={(e) => setEditData({ ...editData, referralSource: e.target.value })} />
                </div>
              </div>
              {/* GPS */}
              <div className="grid grid-cols-2 gap-4 border-t pt-3">
                <div className="space-y-1">
                  <Label className="text-xs">Latitude</Label>
                  <Input type="number" step="any" value={editData.latitude} onChange={(e) => setEditData({ ...editData, latitude: e.target.value })} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Longitude</Label>
                  <Input type="number" step="any" value={editData.longitude} onChange={(e) => setEditData({ ...editData, longitude: e.target.value })} />
                </div>
              </div>
              {/* Tags */}
              <div className="border-t pt-3">
                <Label className="text-xs">Tags</Label>
                <div className="flex flex-wrap gap-1 mt-1 mb-2">
                  {editData.tags?.map((tag: string) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Add tag..."
                    className="h-8 text-xs"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {/* Notes */}
              <div className="border-t pt-3">
                <Label className="text-xs">Notes</Label>
                <Textarea value={editData.notes} onChange={(e) => setEditData({ ...editData, notes: e.target.value })} rows={3} className="mt-1" />
              </div>
            </div>
          ) : (
            /* Read-only view */
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.phone}</span>
                  </div>
                )}
                {customer.cellPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.cellPhone}</span>
                  </div>
                )}
                {customer.website && (
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span>{customer.website}</span>
                  </div>
                )}
                {customer.fax && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>Fax: {customer.fax}</span>
                  </div>
                )}
                {customer.preferredContactMethod && (
                  <div className="text-sm text-muted-foreground">
                    Preferred: {customer.preferredContactMethod}
                  </div>
                )}
              </div>

              {/* Addresses */}
              <div className="grid gap-3 sm:grid-cols-2 border-t pt-3">
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">Service Address</div>
                    <div>{formatAddress(customer.address, customer.city, customer.state, customer.zipCode)}</div>
                  </div>
                </div>
                {(customer.billingAddress || customer.billingCity) && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div>
                      <div className="text-xs text-muted-foreground font-medium">Billing Address</div>
                      <div>{formatAddress(customer.billingAddress, customer.billingCity, customer.billingState, customer.billingZip)}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Business fields */}
              {(customer.taxId || customer.accountNumber || customer.referralSource) && (
                <div className="grid gap-3 sm:grid-cols-3 border-t pt-3">
                  {customer.taxId && (
                    <div className="text-sm">
                      <span className="text-xs text-muted-foreground">Tax ID:</span> {customer.taxId}
                    </div>
                  )}
                  {customer.accountNumber && (
                    <div className="text-sm">
                      <span className="text-xs text-muted-foreground">Account #:</span> {customer.accountNumber}
                    </div>
                  )}
                  {customer.referralSource && (
                    <div className="text-sm">
                      <span className="text-xs text-muted-foreground">Referral:</span> {customer.referralSource}
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {customer.tags && (customer.tags as string[]).length > 0 && (
                <div className="border-t pt-3 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1">
                    {(customer.tags as string[]).map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {customer.notes && (
                <div className="text-sm text-muted-foreground border-t pt-3">
                  {customer.notes}
                </div>
              )}

              {!customer.email && !customer.phone && !customer.address && !customer.notes && (
                <div className="text-sm text-muted-foreground">No contact information on file.</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Properties Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">Properties</CardTitle>
          <Button
            size="sm"
            onClick={() => {
              setPropertyDialogMode("create");
              setEditingProperty(null);
              setPropertyDialogOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Property
          </Button>
        </CardHeader>
        <CardContent>
          {sites && sites.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sites.map((site: any) => (
                <Card key={site.id} className="border">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {site.siteType === "field" || site.siteType === "orchard" || site.siteType === "vineyard" ? (
                          <Trees className="h-4 w-4 text-green-600" />
                        ) : (
                          <Building2 className="h-4 w-4 text-blue-600" />
                        )}
                        <span className="font-medium">{site.name}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {site.siteType.replace("_", " ")}
                      </Badge>
                    </div>
                    {site.address && (
                      <div className="text-sm text-muted-foreground">
                        {site.address}{site.city && `, ${site.city}`}{site.state && `, ${site.state}`}
                      </div>
                    )}
                    {site.acres && (
                      <div className="text-sm text-muted-foreground">{site.acres} acres</div>
                    )}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setPropertyDialogMode("edit");
                          setEditingProperty(site);
                          setPropertyDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-3 w-3 mr-1" /> Edit
                      </Button>
                      {site.polygon && (
                        <Button variant="outline" size="sm" onClick={() => handleDownloadKML(site.id)}>
                          <Download className="h-3 w-3 mr-1" /> KML
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No properties yet. Add the first property for this customer.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jobs Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <Briefcase className="h-5 w-5" /> Jobs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jobs && jobs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Scheduled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job: any) => (
                  <TableRow
                    key={job.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{job.jobType?.replace("_", " ") || "—"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColor(job.status)}>{job.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={priorityColor(job.priority)}>{job.priority}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {job.scheduledStart
                        ? new Date(job.scheduledStart).toLocaleDateString()
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No jobs for this customer yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Service Plans Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarCheck className="h-5 w-5" /> Service Plans
          </CardTitle>
        </CardHeader>
        <CardContent>
          {servicePlans && servicePlans.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Service</TableHead>
                  <TableHead>Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {servicePlans.map((plan: any) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.planName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{plan.planType?.replace("_", " ")}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plan.status === "active" ? "default" : "secondary"}>
                        {plan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {plan.nextServiceDate
                        ? new Date(plan.nextServiceDate).toLocaleDateString()
                        : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {plan.pricePerService
                        ? `$${parseFloat(plan.pricePerService).toFixed(2)}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No service plans for this customer yet.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Property Form Dialog */}
      <PropertyFormDialog
        open={propertyDialogOpen}
        onOpenChange={setPropertyDialogOpen}
        mode={propertyDialogMode}
        customerId={customerId}
        initialData={editingProperty}
      />
    </div>
  );
}
