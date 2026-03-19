import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Wrench, Plane, Truck, Loader2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MaintenanceScheduler } from "@/components/MaintenanceScheduler";

type EquipmentFormData = {
  name: string;
  equipmentType: "plane" | "helicopter" | "ground_rig" | "truck" | "backpack" | "hand_sprayer" | "ulv" | "other";
  tailNumber: string;
  licensePlate: string;
  serialNumber: string;
  tankCapacity: string;
  swathWidth: string;
  maxSpeed: string;
  status: "active" | "maintenance" | "inactive";
  lastMaintenanceDate: string;
  nextMaintenanceDate: string;
  maintenanceNotes: string;
  notes: string;
};

const initialFormData: EquipmentFormData = {
  name: "",
  equipmentType: "plane",
  tailNumber: "",
  licensePlate: "",
  serialNumber: "",
  tankCapacity: "",
  swathWidth: "",
  maxSpeed: "",
  status: "active",
  lastMaintenanceDate: "",
  nextMaintenanceDate: "",
  maintenanceNotes: "",
  notes: "",
};

export default function Equipment() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<any>(null);
  const [formData, setFormData] = useState<EquipmentFormData>(initialFormData);
  const [filterType, setFilterType] = useState<string>("all");
  const [maintenanceEquipment, setMaintenanceEquipment] = useState<any>(null);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);

  const { data: equipment, isLoading } = trpc.equipment.list.useQuery();
  const utils = trpc.useUtils();

  const createMutation = trpc.equipment.create.useMutation({
    onSuccess: () => {
      utils.equipment.list.invalidate();
      toast.success("Equipment created successfully!");
      setDialogOpen(false);
      setFormData(initialFormData);
    },
    onError: (error: any) => {
      toast.error(`Failed to create equipment: ${error.message}`);
    },
  });

  const updateMutation = trpc.equipment.update.useMutation({
    onSuccess: () => {
      utils.equipment.list.invalidate();
      toast.success("Equipment updated successfully!");
      setDialogOpen(false);
      setEditingEquipment(null);
      setFormData(initialFormData);
    },
    onError: (error: any) => {
      toast.error(`Failed to update equipment: ${error.message}`);
    },
  });

  const deleteMutation = trpc.equipment.delete.useMutation({
    onSuccess: () => {
      utils.equipment.list.invalidate();
      toast.success("Equipment deleted successfully!");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete equipment: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingEquipment) {
      updateMutation.mutate({
        id: editingEquipment.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (equip: any) => {
    setEditingEquipment(equip);
    setFormData({
      name: equip.name || "",
      equipmentType: equip.equipmentType || "plane",
      tailNumber: equip.tailNumber || "",
      licensePlate: equip.licensePlate || "",
      serialNumber: equip.serialNumber || "",
      tankCapacity: equip.tankCapacity || "",
      swathWidth: equip.swathWidth || "",
      maxSpeed: equip.maxSpeed || "",
      status: equip.status || "active",
      lastMaintenanceDate: equip.lastMaintenanceDate || "",
      nextMaintenanceDate: equip.nextMaintenanceDate || "",
      maintenanceNotes: equip.maintenanceNotes || "",
      notes: equip.notes || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingEquipment(null);
    setFormData(initialFormData);
  };

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case "plane":
      case "helicopter":
        return <Plane className="h-5 w-5" />;
      case "truck":
      case "ground_rig":
        return <Truck className="h-5 w-5" />;
      default:
        return <Wrench className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600 bg-green-50";
      case "maintenance":
        return "text-yellow-600 bg-yellow-50";
      case "inactive":
        return "text-gray-600 bg-gray-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const filteredEquipment = equipment?.filter((equip) => {
    if (filterType === "all") return true;
    return equip.equipmentType === filterType;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Equipment</h1>
          <p className="text-muted-foreground">
            Manage planes, trucks, and spray equipment
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleDialogClose()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingEquipment ? "Edit Equipment" : "Add New Equipment"}
              </DialogTitle>
              <DialogDescription>
                {editingEquipment
                  ? "Update equipment information and maintenance records"
                  : "Add a new piece of equipment to your fleet"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <Label htmlFor="name">Equipment Name *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Air Tractor 502B"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="equipmentType">Type *</Label>
                    <Select
                      value={formData.equipmentType}
                      onValueChange={(value) => setFormData({ ...formData, equipmentType: value as EquipmentFormData["equipmentType"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="plane">Plane</SelectItem>
                        <SelectItem value="helicopter">Helicopter</SelectItem>
                        <SelectItem value="ground_rig">Ground Rig</SelectItem>
                        <SelectItem value="truck">Truck</SelectItem>
                        <SelectItem value="backpack">Backpack Sprayer</SelectItem>
                        <SelectItem value="hand_sprayer">Hand Sprayer</SelectItem>
                        <SelectItem value="ulv">ULV Fogger</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData({ ...formData, status: value as EquipmentFormData["status"] })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Identification */}
              <div className="space-y-4">
                <h3 className="font-semibold">Identification</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="tailNumber">Tail Number / N-Number</Label>
                    <Input
                      id="tailNumber"
                      value={formData.tailNumber}
                      onChange={(e) => setFormData({ ...formData, tailNumber: e.target.value })}
                      placeholder="N12345"
                    />
                  </div>
                  <div>
                    <Label htmlFor="licensePlate">License Plate</Label>
                    <Input
                      id="licensePlate"
                      value={formData.licensePlate}
                      onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                      placeholder="ABC-1234"
                    />
                  </div>
                  <div>
                    <Label htmlFor="serialNumber">Serial Number</Label>
                    <Input
                      id="serialNumber"
                      value={formData.serialNumber}
                      onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
                      placeholder="SN123456"
                    />
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div className="space-y-4">
                <h3 className="font-semibold">Specifications</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="tankCapacity">Tank Capacity (gal)</Label>
                    <Input
                      id="tankCapacity"
                      type="number"
                      step="0.01"
                      value={formData.tankCapacity}
                      onChange={(e) => setFormData({ ...formData, tankCapacity: e.target.value })}
                      placeholder="500"
                    />
                  </div>
                  <div>
                    <Label htmlFor="swathWidth">Swath Width (ft)</Label>
                    <Input
                      id="swathWidth"
                      type="number"
                      step="0.01"
                      value={formData.swathWidth}
                      onChange={(e) => setFormData({ ...formData, swathWidth: e.target.value })}
                      placeholder="60"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxSpeed">Max Speed (mph)</Label>
                    <Input
                      id="maxSpeed"
                      type="number"
                      step="0.01"
                      value={formData.maxSpeed}
                      onChange={(e) => setFormData({ ...formData, maxSpeed: e.target.value })}
                      placeholder="140"
                    />
                  </div>
                </div>
              </div>

              {/* Maintenance */}
              <div className="space-y-4">
                <h3 className="font-semibold">Maintenance</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="lastMaintenanceDate">Last Maintenance Date</Label>
                    <Input
                      id="lastMaintenanceDate"
                      type="date"
                      value={formData.lastMaintenanceDate}
                      onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="nextMaintenanceDate">Next Maintenance Due</Label>
                    <Input
                      id="nextMaintenanceDate"
                      type="date"
                      value={formData.nextMaintenanceDate}
                      onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="maintenanceNotes">Maintenance Notes</Label>
                    <Textarea
                      id="maintenanceNotes"
                      value={formData.maintenanceNotes}
                      onChange={(e) => setFormData({ ...formData, maintenanceNotes: e.target.value })}
                      placeholder="Record maintenance history, issues, or upcoming work..."
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Any additional information about this equipment..."
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingEquipment ? "Update Equipment" : "Add Equipment"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Equipment</SelectItem>
            <SelectItem value="plane">Planes</SelectItem>
            <SelectItem value="helicopter">Helicopters</SelectItem>
            <SelectItem value="ground_rig">Ground Rigs</SelectItem>
            <SelectItem value="truck">Trucks</SelectItem>
            <SelectItem value="backpack">Backpack Sprayers</SelectItem>
            <SelectItem value="hand_sprayer">Hand Sprayers</SelectItem>
            <SelectItem value="ulv">ULV Foggers</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Equipment Grid */}
      {filteredEquipment && filteredEquipment.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((equip) => (
            <Card key={equip.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {getEquipmentIcon(equip.equipmentType)}
                    <CardTitle className="text-lg">{equip.name}</CardTitle>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      equip.status || "active"
                    )}`}
                  >
                    {equip.status || "active"}
                  </span>
                </div>
                <CardDescription className="capitalize">
                  {equip.equipmentType.replace("_", " ")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {equip.tailNumber && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tail Number:</span>
                      <span className="font-medium">{equip.tailNumber}</span>
                    </div>
                  )}
                  {equip.licensePlate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">License Plate:</span>
                      <span className="font-medium">{equip.licensePlate}</span>
                    </div>
                  )}
                  {equip.tankCapacity && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tank Capacity:</span>
                      <span className="font-medium">{equip.tankCapacity} gal</span>
                    </div>
                  )}
                  {equip.nextMaintenanceDate && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Next Maintenance:</span>
                      <span className="font-medium">
                        {new Date(equip.nextMaintenanceDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {equip.nextMaintenanceDate &&
                    new Date(equip.nextMaintenanceDate) < new Date() && (
                      <Alert variant="destructive" className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          Maintenance overdue!
                        </AlertDescription>
                      </Alert>
                    )}
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEdit(equip)}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(equip.id, equip.name)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      setMaintenanceEquipment(equip);
                      setMaintenanceDialogOpen(true);
                    }}
                  >
                    <Wrench className="h-4 w-4 mr-1" />
                    Maintenance
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Wrench className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {filterType === "all"
                ? "No equipment found. Add your first piece of equipment to get started."
                : `No ${filterType.replace("_", " ")} equipment found.`}
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Equipment
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Maintenance Dialog */}
      <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Maintenance Schedule - {maintenanceEquipment?.name}</DialogTitle>
            <DialogDescription>
              Manage maintenance tasks and history for this equipment
            </DialogDescription>
          </DialogHeader>
          {maintenanceEquipment && (
            <MaintenanceScheduler
              equipmentId={maintenanceEquipment.id}
              equipmentName={maintenanceEquipment.name}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
