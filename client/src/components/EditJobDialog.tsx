import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";

interface EditJobDialogProps {
  job: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditJobDialog({ job, open, onOpenChange, onSuccess }: EditJobDialogProps) {
  const [formData, setFormData] = useState({
    title: job.title || "",
    description: job.description || "",
    jobType: job.jobType || "",
    priority: job.priority || "medium",
    status: job.status || "pending",
    customerId: job.customerId || "",
    personnelId: job.personnelId || "",
    equipmentId: job.equipmentId || "",
    location: job.location || "",
    latitude: job.latitude || null,
    longitude: job.longitude || null,
    scheduledStart: job.scheduledStart ? new Date(job.scheduledStart).toISOString().slice(0, 16) : "",
    scheduledEnd: job.scheduledEnd ? new Date(job.scheduledEnd).toISOString().slice(0, 16) : "",
  });

  const { data: customers } = trpc.jobsV2.getCustomers.useQuery();
  const { data: personnel } = trpc.jobsV2.getPersonnel.useQuery();
  const { data: equipment } = trpc.jobsV2.getEquipment.useQuery();

  const updateJobMutation = trpc.jobsV2.update.useMutation({
    onSuccess: () => {
      toast.success("Job updated successfully");
      onSuccess();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(`Failed to update job: ${error.message}`);
    },
  });

  useEffect(() => {
    if (job) {
      setFormData({
        title: job.title || "",
        description: job.description || "",
        jobType: job.jobType || "",
        priority: job.priority || "medium",
        status: job.status || "pending",
        customerId: job.customerId || "",
        personnelId: job.personnelId || "",
        equipmentId: job.equipmentId || "",
        location: job.location || "",
        latitude: job.latitude || null,
        longitude: job.longitude || null,
        scheduledStart: job.scheduledStart ? new Date(job.scheduledStart).toISOString().slice(0, 16) : "",
        scheduledEnd: job.scheduledEnd ? new Date(job.scheduledEnd).toISOString().slice(0, 16) : "",
      });
    }
  }, [job]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    updateJobMutation.mutate({
      id: job.id,
      title: formData.title,
      description: formData.description || null,
      jobType: formData.jobType || null,
      priority: formData.priority as any,
      status: formData.status as any,
      customerId: formData.customerId ? parseInt(formData.customerId) : null,
      personnelId: formData.personnelId ? parseInt(formData.personnelId) : null,
      equipmentId: formData.equipmentId ? parseInt(formData.equipmentId) : null,
      location: formData.location || null,
      latitude: formData.latitude || null,
      longitude: formData.longitude || null,
      scheduledStart: formData.scheduledStart || null,
      scheduledEnd: formData.scheduledEnd || null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Job</DialogTitle>
          <DialogDescription>
            Update job details, assignments, and scheduling
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Job Information</h3>
            
            <div>
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Corn Field Spraying - Section A"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="jobType">Job Type</Label>
                <Select
                  value={formData.jobType}
                  onValueChange={(value) => setFormData({ ...formData, jobType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="aerial_application">Aerial Application</SelectItem>
                    <SelectItem value="pest_control">Pest Control</SelectItem>
                    <SelectItem value="fertilization">Fertilization</SelectItem>
                    <SelectItem value="herbicide">Herbicide Application</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="ready">Ready</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Job details, special instructions, etc."
                rows={3}
              />
            </div>
          </div>

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Customer Information</h3>
            
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select
                value={formData.customerId.toString()}
                onValueChange={(value) => setFormData({ ...formData, customerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select customer (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {customers?.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id.toString()}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Assignment & Scheduling */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Assignment & Scheduling</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="personnel">Assigned Personnel</Label>
                <Select
                  value={formData.personnelId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, personnelId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select personnel (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {personnel?.map((person) => (
                      <SelectItem key={person.id} value={person.id.toString()}>
                        {person.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="equipment">Assigned Equipment</Label>
                <Select
                  value={formData.equipmentId.toString()}
                  onValueChange={(value) => setFormData({ ...formData, equipmentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select equipment (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment?.map((equip) => (
                      <SelectItem key={equip.id} value={equip.id.toString()}>
                        {equip.name} - {equip.equipmentType}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Job Location</Label>
              <LocationPicker
                value={{ address: formData.location, latitude: formData.latitude, longitude: formData.longitude }}
                onChange={(loc) => setFormData({ ...formData, location: loc.address, latitude: loc.latitude, longitude: loc.longitude })}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="scheduledStart">Scheduled Start</Label>
                <Input
                  id="scheduledStart"
                  type="datetime-local"
                  value={formData.scheduledStart}
                  onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="scheduledEnd">Scheduled End</Label>
                <Input
                  id="scheduledEnd"
                  type="datetime-local"
                  value={formData.scheduledEnd}
                  onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateJobMutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={updateJobMutation.isPending}>
              {updateJobMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
