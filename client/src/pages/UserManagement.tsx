import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, UserPlus } from "lucide-react";
import { toast } from "sonner";

const USER_ROLES = [
  {
    value: "admin",
    label: "Admin",
    description: "Full system access and user management",
  },
  {
    value: "manager",
    label: "Manager",
    description: "Manage jobs, personnel, and view reports",
  },
  {
    value: "technician",
    label: "Technician",
    description: "View and update job status, manage equipment",
  },
  {
    value: "pilot",
    label: "Pilot",
    description: "View flight board and update job status",
  },
  {
    value: "sales",
    label: "Sales",
    description: "Manage customers and create quotes",
  },
];

export default function UserManagement() {
  const utils = trpc.useUtils();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    phone: "",
    licenseNumber: "",
    commission: false,
    userRole: "technician" as "admin" | "manager" | "technician" | "pilot" | "sales",
  });

  const { data: users, isLoading } = trpc.users.list.useQuery();
  
  const createUser = trpc.users.create.useMutation({
    onSuccess: () => {
      toast.success("User added successfully");
      utils.users.list.invalidate();
      setIsAddDialogOpen(false);
      setNewUser({ name: "", email: "", phone: "", licenseNumber: "", commission: false, userRole: "technician" });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add user");
    },
  });

  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("User role updated successfully");
      utils.users.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update user role");
    },
  });

  const handleRoleChange = (userId: number, newRole: string) => {
    updateRole.mutate({
      userId,
      userRole: newRole as "admin" | "manager" | "technician" | "pilot" | "sales",
    });
  };

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) {
      toast.error("Please fill in all fields");
      return;
    }
    createUser.mutate(newUser);
  };

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="flex items-center gap-2 mb-6">
          <Shield className="h-8 w-8" />
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>
        <p>Loading users...</p>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Shield className="h-8 w-8" />
          <h1 className="text-3xl font-bold">User Management</h1>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>
                Create a new user account and assign a role. Users will be able to sign in with their email.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="John Doe"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="licenseNumber">License Number</Label>
                <Input
                  id="licenseNumber"
                  placeholder="ABC-12345"
                  value={newUser.licenseNumber}
                  onChange={(e) => setNewUser({ ...newUser, licenseNumber: e.target.value })}
                />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="commission"
                  checked={newUser.commission}
                  onChange={(e) => setNewUser({ ...newUser, commission: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="commission" className="cursor-pointer">Commission</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.userRole}
                  onValueChange={(value) => setNewUser({ ...newUser, userRole: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {USER_ROLES.map((role) => (
                      <SelectItem key={role.value} value={role.value}>
                        {role.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddUser} disabled={createUser.isPending}>
                {createUser.isPending ? "Adding..." : "Add User"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Roles & Permissions
            </CardTitle>
            <CardDescription>
              Assign roles to control what users can access and manage in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>License #</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name || "Unnamed User"}</TableCell>
                      <TableCell>{user.email || "No email"}</TableCell>
                      <TableCell>{user.phone || "-"}</TableCell>
                      <TableCell>{user.licenseNumber || "-"}</TableCell>
                      <TableCell>
                        {user.commission ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Yes</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">No</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {user.userRole || "No role assigned"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={user.userRole || undefined}
                          onValueChange={(value) => handleRoleChange(user.id, value)}
                          disabled={updateRole.isPending}
                        >
                          <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Assign role" />
                          </SelectTrigger>
                          <SelectContent>
                            {USER_ROLES.map((role) => (
                              <SelectItem key={role.value} value={role.value}>
                                {role.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No users found. Click "Add User" to create your first user.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Role Descriptions</CardTitle>
            <CardDescription>Understanding each role's permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {USER_ROLES.map((role) => (
                <div key={role.value} className="flex gap-3">
                  <Shield className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <h3 className="font-semibold">{role.label}</h3>
                    <p className="text-sm text-muted-foreground">{role.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
