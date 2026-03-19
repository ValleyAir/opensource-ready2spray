import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, UserPlus, Calendar, FileUp, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function Personnel() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPerson, setEditingPerson] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "technician" as "pilot" | "ground_crew" | "manager" | "technician",
    status: "active" as "active" | "on_leave" | "inactive",
    certifications: "",
    notes: "",
  });

  const { data: personnel, isLoading } = trpc.personnel.list.useQuery();
  const utils = trpc.useUtils();

  const createPersonnelMutation = trpc.personnel.create.useMutation({
    onSuccess: () => {
      utils.personnel.list.invalidate();
      setIsAddDialogOpen(false);
      resetForm();
      toast.success("Personnel added successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to add personnel: ${error.message}`);
    },
  });

  const updatePersonnelMutation = trpc.personnel.update.useMutation({
    onSuccess: () => {
      utils.personnel.list.invalidate();
      setIsAddDialogOpen(false);
      resetForm();
      toast.success("Personnel updated successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to update personnel: ${error.message}`);
    },
  });

  const deletePersonnelMutation = trpc.personnel.delete.useMutation({
    onSuccess: () => {
      utils.personnel.list.invalidate();
      toast.success("Personnel deleted successfully");
    },
    onError: (error: any) => {
      toast.error(`Failed to delete personnel: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "technician",
      status: "active",
      certifications: "",
      notes: "",
    });
    setEditingPerson(null);
  };

  const handleOpenDialog = (person?: any) => {
    if (person) {
      setEditingPerson(person);
      setFormData({
        name: person.name || "",
        email: person.email || "",
        phone: person.phone || "",
        role: person.role || "technician",
        status: person.status || "active",
        certifications: person.certifications || "",
        notes: person.notes || "",
      });
    } else {
      resetForm();
    }
    setIsAddDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPerson) {
      updatePersonnelMutation.mutate({ id: editingPerson.id, ...formData });
    } else {
      createPersonnelMutation.mutate(formData);
    }
  };

  const filteredPersonnel = personnel?.filter((person) => {
    const matchesSearch =
      search === "" ||
      person.name.toLowerCase().includes(search.toLowerCase()) ||
      person.email?.toLowerCase().includes(search.toLowerCase()) ||
      person.phone?.includes(search) ||
      person.role.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || person.status === statusFilter;

    const matchesRole = roleFilter === "all" || person.role === roleFilter;

    return matchesSearch && matchesStatus && matchesRole;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Personnel</h1>
          <p className="text-muted-foreground">
            Manage your team members and their information
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => toast.info("Training feature coming soon")}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Training
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.info("Schedule feature coming soon")}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Schedule
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.info("Bulk upload feature coming soon")}
          >
            <FileUp className="mr-2 h-4 w-4" />
            Bulk upload
          </Button>
          <Button
            variant="outline"
            onClick={() => toast.info("Raw upload feature coming soon")}
          >
            <Upload className="mr-2 h-4 w-4" />
            Raw upload
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={(isOpen) => {
            setIsAddDialogOpen(isOpen);
            if (!isOpen) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <Plus className="mr-2 h-4 w-4" />
                Add person
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingPerson ? "Edit person" : "Add person"}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name*</Label>
                    <Input
                      id="name"
                      placeholder="Full name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role*</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value: any) =>
                        setFormData({ ...formData, role: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pilot">Pilot</SelectItem>
                        <SelectItem value="ground_crew">Ground Crew</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="technician">Technician</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      placeholder="(555) 555-5555"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pilot-license">Pilot License # (Optional)</Label>
                    <Input
                      id="pilot-license"
                      placeholder="Optional"
                      value={formData.certifications?.split(",")[0] || ""}
                      onChange={(e) => {
                        const certs = formData.certifications?.split(",") || ["", ""];
                        certs[0] = e.target.value;
                        setFormData({ ...formData, certifications: certs.join(",") });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="applicator-license">
                      Applicator License # (Optional)
                    </Label>
                    <Input
                      id="applicator-license"
                      placeholder="Optional"
                      value={formData.certifications?.split(",")[1] || ""}
                      onChange={(e) => {
                        const certs = formData.certifications?.split(",") || ["", ""];
                        certs[1] = e.target.value;
                        setFormData({ ...formData, certifications: certs.join(",") });
                      }}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createPersonnelMutation.isPending || updatePersonnelMutation.isPending}>
                    {(createPersonnelMutation.isPending || updatePersonnelMutation.isPending) ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, phone, or role"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on_leave">On Leave</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="pilot">Pilot</SelectItem>
              <SelectItem value="ground_crew">Ground Crew</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="technician">Technician</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Pilot License #</TableHead>
              <TableHead>Applicator License #</TableHead>
              <TableHead>Last seen</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredPersonnel && filteredPersonnel.length > 0 ? (
              filteredPersonnel.map((person) => {
                const certs = person.certifications?.split(",") || ["", ""];
                return (
                  <TableRow key={person.id}>
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell className="capitalize">{person.role}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          person.status === "active"
                            ? "bg-green-100 text-green-800"
                            : person.status === "on_leave"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {person.status.replace("_", " ")}
                      </span>
                    </TableCell>
                    <TableCell>{person.email || "-"}</TableCell>
                    <TableCell>{person.phone || "-"}</TableCell>
                    <TableCell>{certs[0] || "-"}</TableCell>
                    <TableCell>{certs[1] || "-"}</TableCell>
                    <TableCell>
                      {person.updatedAt
                        ? new Date(person.updatedAt).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(person)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deletePersonnelMutation.mutate({ id: person.id })}
                          disabled={deletePersonnelMutation.isPending}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <UserPlus className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No personnel found</p>
                    {search && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSearch("")}
                      >
                        Clear search
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
