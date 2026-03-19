import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Plus, Briefcase, Calendar, MapPin, User, Wrench } from "lucide-react";
import { LocationPicker } from "@/components/LocationPicker";

export default function JobsV2() {
  const [, navigate] = useLocation();
  const [isCreating, setIsCreating] = useState(false);
  
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [jobType, setJobType] = useState<string>("");
  const [priority, setPriority] = useState<string>("medium");
  const [status, setStatus] = useState<string>("pending");
  const [customerId, setCustomerId] = useState<string>("");
  const [personnelId, setPersonnelId] = useState<string>("");
  const [equipmentId, setEquipmentId] = useState<string>("");
  const [location, setLocation] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [scheduledStart, setScheduledStart] = useState("");
  const [scheduledEnd, setScheduledEnd] = useState("");

  const utils = trpc.useUtils();
  
  // Queries
  const { data: jobs, isLoading } = trpc.jobsV2.list.useQuery();
  const { data: customers } = trpc.jobsV2.getCustomers.useQuery();
  const { data: personnel } = trpc.jobsV2.getPersonnel.useQuery();
  const { data: equipment } = trpc.jobsV2.getEquipment.useQuery();
  
  const createMutation = trpc.jobsV2.create.useMutation({
    onSuccess: () => {
      toast.success("Job created successfully!");
      resetForm();
      setIsCreating(false);
      utils.jobsV2.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create job");
    },
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setJobType("");
    setPriority("medium");
    setStatus("pending");
    setCustomerId("");
    setPersonnelId("");
    setEquipmentId("");
    setLocation("");
    setLatitude(null);
    setLongitude(null);
    setScheduledStart("");
    setScheduledEnd("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a job title");
      return;
    }
    
    createMutation.mutate({
      title,
      description: description || undefined,
      jobType: jobType as any || undefined,
      priority: priority as any,
      status: status as any,
      customerId: customerId ? parseInt(customerId) : undefined,
      personnelId: personnelId ? parseInt(personnelId) : undefined,
      equipmentId: equipmentId ? parseInt(equipmentId) : undefined,
      location: location || undefined,
      latitude: latitude || undefined,
      longitude: longitude || undefined,
      scheduledStart: scheduledStart || undefined,
      scheduledEnd: scheduledEnd || undefined,
    });
  };

  return (
    <>
      <div className="container mx-auto py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Jobs</h1>
            <p className="text-muted-foreground mt-1">
              Comprehensive job management system
            </p>
          </div>
          <Button
            onClick={() => {
              setIsCreating(!isCreating);
              if (isCreating) resetForm();
            }}
            variant={isCreating ? "outline" : "default"}
          >
            {isCreating ? (
              "Cancel"
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                New Job
              </>
            )}
          </Button>
        </div>

        {/* Create Job Form */}
        {isCreating && (
          <Card>
            <CardHeader>
              <CardTitle>Create New Job</CardTitle>
              <CardDescription>
                Schedule a new service job for your team
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Job Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Job Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="title">Job Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Corn Field Spraying - Section A"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jobType">Job Type</Label>
                      <Select value={jobType} onValueChange={setJobType}>
                        <SelectTrigger id="jobType">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aerial_application">Aerial Application</SelectItem>
                          <SelectItem value="pest_control">Pest Control</SelectItem>
                          <SelectItem value="fertilization">Fertilization</SelectItem>
                          <SelectItem value="herbicide">Herbicide</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger id="priority">
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

                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={status} onValueChange={setStatus}>
                        <SelectTrigger id="status">
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

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Job details, special instructions, etc."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Customer Information Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Customer Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="customer">Customer</Label>
                    <Select value={customerId} onValueChange={setCustomerId}>
                      <SelectTrigger id="customer">
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

                {/* Assignment & Scheduling Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Assignment & Scheduling</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="personnel">Assigned Personnel</Label>
                      <Select value={personnelId} onValueChange={setPersonnelId}>
                        <SelectTrigger id="personnel">
                          <SelectValue placeholder="Select personnel (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {personnel?.map((person) => (
                            <SelectItem key={person.id} value={person.id.toString()}>
                              {person.name} {person.role && `(${person.role})`}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="equipment">Assigned Equipment</Label>
                      <Select value={equipmentId} onValueChange={setEquipmentId}>
                        <SelectTrigger id="equipment">
                          <SelectValue placeholder="Select equipment (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {equipment?.map((equip) => (
                            <SelectItem key={equip.id} value={equip.id.toString()}>
                              {equip.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Job Location</Label>
                    <LocationPicker
                      value={{ address: location, latitude: latitude, longitude: longitude }}
                      onChange={(loc) => {
                        setLocation(loc.address);
                        setLatitude(loc.latitude);
                        setLongitude(loc.longitude);
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="scheduledStart">Scheduled Start</Label>
                      <Input
                        id="scheduledStart"
                        type="datetime-local"
                        value={scheduledStart}
                        onChange={(e) => setScheduledStart(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="scheduledEnd">Scheduled End</Label>
                      <Input
                        id="scheduledEnd"
                        type="datetime-local"
                        value={scheduledEnd}
                        onChange={(e) => setScheduledEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="flex-1"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create Job"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreating(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Jobs List */}
        <Card>
          <CardHeader>
            <CardTitle>All Jobs</CardTitle>
            <CardDescription>
              View and manage your spray jobs
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : jobs && jobs.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {jobs.map((job) => (
                  <Card
                    key={job.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                    onClick={() => navigate(`/jobs/${job.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg line-clamp-2">
                            {job.title}
                          </CardTitle>
                          {job.customerName && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {job.customerName}
                            </p>
                          )}
                        </div>
                        {job.statusId && (
                          <span className={`text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800`}>
                            Status: {job.statusId}
                          </span>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {job.jobType && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Briefcase className="w-4 h-4 mr-2" />
                          {job.jobType?.replace('_', ' ')}
                        </div>
                      )}
                      {job.location && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="w-4 h-4 mr-2" />
                          {job.location}
                        </div>
                      )}
                      {job.scheduledStart && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4 mr-2" />
                          {new Date(job.scheduledStart).toLocaleDateString()}
                        </div>
                      )}
                      {job.personnelName && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <User className="w-4 h-4 mr-2" />
                          {job.personnelName}
                        </div>
                      )}
                      {job.equipmentName && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Wrench className="w-4 h-4 mr-2" />
                          {job.equipmentName}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground pt-2">
                        Created {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No jobs yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first job to get started
                </p>
                <Button onClick={() => setIsCreating(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Job
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
