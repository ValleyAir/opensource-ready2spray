import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Mail, Phone, MapPin, Building2, Smartphone } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const defaultFormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  notes: "",
  companyName: "",
  customerType: "agricultural" as "agricultural" | "commercial" | "residential" | "government" | "other",
  accountStatus: "active" as "active" | "inactive" | "lead" | "prospect",
  cellPhone: "",
  website: "",
  billingAddress: "",
  billingCity: "",
  billingState: "",
  billingZip: "",
};

export default function Customers() {
  const [open, setOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<any>(null);
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({ ...defaultFormData });

  const { data: customers, isLoading } = trpc.customers.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.customers.create.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate();
      toast.success("Customer created successfully!");
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to create customer: ${error.message}`);
    },
  });

  const updateMutation = trpc.customers.update.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate();
      toast.success("Customer updated successfully!");
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(`Failed to update customer: ${error.message}`);
    },
  });

  const deleteMutation = trpc.customers.delete.useMutation({
    onSuccess: () => {
      utils.customers.list.invalidate();
      toast.success("Customer deleted successfully!");
    },
  });

  const resetForm = () => {
    setFormData({ ...defaultFormData });
    setEditingCustomer(null);
  };

  const handleOpenDialog = (customer?: any) => {
    if (customer) {
      setEditingCustomer(customer);
      setFormData({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        zipCode: customer.zipCode || "",
        notes: customer.notes || "",
        companyName: customer.companyName || "",
        customerType: customer.customerType || "agricultural",
        accountStatus: customer.accountStatus || "active",
        cellPhone: customer.cellPhone || "",
        website: customer.website || "",
        billingAddress: customer.billingAddress || "",
        billingCity: customer.billingCity || "",
        billingState: customer.billingState || "",
        billingZip: customer.billingZip || "",
      });
    } else {
      resetForm();
    }
    setOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  const accountStatusColor = (s: string | null) => {
    switch (s) {
      case "active": return "default";
      case "inactive": return "secondary";
      default: return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer database
          </p>
        </div>
        <Dialog open={open} onOpenChange={(isOpen) => {
          setOpen(isOpen);
          if (!isOpen) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              New Customer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingCustomer ? "Edit Customer" : "Add New Customer"}
                </DialogTitle>
                <DialogDescription>
                  {editingCustomer
                    ? "Update customer information"
                    : "Create a new customer record"}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                {/* Name + Company */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    />
                  </div>
                </div>

                {/* Type + Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Customer Type</Label>
                    <Select value={formData.customerType} onValueChange={(v: typeof formData.customerType) => setFormData({ ...formData, customerType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agricultural">Agricultural</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="government">Government</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Account Status</Label>
                    <Select value={formData.accountStatus} onValueChange={(v: typeof formData.accountStatus) => setFormData({ ...formData, accountStatus: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="lead">Lead</SelectItem>
                        <SelectItem value="prospect">Prospect</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Contact info */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="cellPhone">Cell Phone</Label>
                    <Input
                      id="cellPhone"
                      value={formData.cellPhone}
                      onChange={(e) => setFormData({ ...formData, cellPhone: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                </div>

                {/* Service Address */}
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="zipCode">ZIP Code</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })}
                    />
                  </div>
                </div>

                {/* Billing Address */}
                <div className="grid gap-2">
                  <Label htmlFor="billingAddress">Billing Address</Label>
                  <Input
                    id="billingAddress"
                    value={formData.billingAddress}
                    onChange={(e) => setFormData({ ...formData, billingAddress: e.target.value })}
                    placeholder="Same as above if blank"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label>Billing City</Label>
                    <Input
                      value={formData.billingCity}
                      onChange={(e) => setFormData({ ...formData, billingCity: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Billing State</Label>
                    <Input
                      value={formData.billingState}
                      onChange={(e) => setFormData({ ...formData, billingState: e.target.value })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Billing ZIP</Label>
                    <Input
                      value={formData.billingZip}
                      onChange={(e) => setFormData({ ...formData, billingZip: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingCustomer ? "Update Customer" : "Create Customer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : customers && customers.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <Card
              key={customer.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => navigate(`/customers/${customer.id}`)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{customer.name}</CardTitle>
                  <Badge variant={accountStatusColor(customer.accountStatus) as any} className="text-xs">
                    {customer.accountStatus || "active"}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-2">
                  {customer.companyName && (
                    <>
                      <Building2 className="h-3 w-3" />
                      <span>{customer.companyName}</span>
                      <span className="text-muted-foreground">|</span>
                    </>
                  )}
                  #{customer.id}
                  {customer.customerType && (
                    <Badge variant="outline" className="text-xs ml-1">{customer.customerType}</Badge>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {customer.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{customer.email}</span>
                  </div>
                )}
                {customer.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{customer.phone}</span>
                  </div>
                )}
                {customer.cellPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{customer.cellPhone}</span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div className="text-muted-foreground">
                      <div>{customer.address}</div>
                      {(customer.city || customer.state || customer.zipCode) && (
                        <div>
                          {customer.city && `${customer.city}, `}
                          {customer.state} {customer.zipCode}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {customer.notes && (
                  <p className="text-sm text-muted-foreground line-clamp-2 pt-2 border-t">
                    {customer.notes}
                  </p>
                )}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={(e) => { e.stopPropagation(); handleOpenDialog(customer); }}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => { e.stopPropagation(); deleteMutation.mutate({ id: customer.id }); }}
                    disabled={deleteMutation.isPending}
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">
              No customers yet. Add your first customer to get started!
            </p>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Customer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
