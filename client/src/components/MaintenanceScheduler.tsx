import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, CheckCircle2, AlertCircle, Plus, Wrench } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface MaintenanceSchedulerProps {
  equipmentId: number;
  equipmentName: string;
}

export function MaintenanceScheduler({ equipmentId, equipmentName }: MaintenanceSchedulerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    taskName: "",
    description: "",
    taskType: "inspection" as const,
    frequencyType: "days" as const,
    frequencyValue: 30,
    nextDueDate: "",
    isRecurring: true,
    estimatedCost: "",
    notes: "",
  });

  const [completeData, setCompleteData] = useState({
    actualCost: "",
    notes: "",
  });

  const { data: tasks = [], refetch } = trpc.maintenance.listByEquipment.useQuery({ equipmentId });
  const createMutation = trpc.maintenance.create.useMutation();
  const completeMutation = trpc.maintenance.complete.useMutation();
  const deleteMutation = trpc.maintenance.delete.useMutation();

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        equipmentId,
        ...formData,
      });
      toast.success("Maintenance task created");
      setIsCreateOpen(false);
      setFormData({
        taskName: "",
        description: "",
        taskType: "inspection",
        frequencyType: "days",
        frequencyValue: 30,
        nextDueDate: "",
        isRecurring: true,
        estimatedCost: "",
        notes: "",
      });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to create task");
    }
  };

  const handleComplete = async () => {
    if (!selectedTask) return;
    
    try {
      await completeMutation.mutateAsync({
        id: selectedTask.id,
        ...completeData,
      });
      toast.success("Maintenance task completed");
      setIsCompleteOpen(false);
      setSelectedTask(null);
      setCompleteData({ actualCost: "", notes: "" });
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to complete task");
    }
  };

  const handleDelete = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this maintenance task?")) return;
    
    try {
      await deleteMutation.mutateAsync({ id: taskId });
      toast.success("Maintenance task deleted");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete task");
    }
  };

  const isOverdue = (task: any) => {
    if (!task.nextDueDate || task.status === "completed") return false;
    return new Date(task.nextDueDate) < new Date();
  };

  const getStatusColor = (task: any) => {
    if (task.status === "completed") return "text-green-600";
    if (isOverdue(task)) return "text-red-600";
    return "text-yellow-600";
  };

  const getStatusIcon = (task: any) => {
    if (task.status === "completed") return <CheckCircle2 className="h-4 w-4" />;
    if (isOverdue(task)) return <AlertCircle className="h-4 w-4" />;
    return <Calendar className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wrench className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-lg font-semibold">Maintenance Schedule</h3>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Maintenance Task for {equipmentName}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taskName">Task Name *</Label>
                  <Input
                    id="taskName"
                    value={formData.taskName}
                    onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                    placeholder="e.g., 100-Hour Inspection"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="taskType">Task Type</Label>
                  <Select value={formData.taskType} onValueChange={(value: any) => setFormData({ ...formData, taskType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inspection">Inspection</SelectItem>
                      <SelectItem value="oil_change">Oil Change</SelectItem>
                      <SelectItem value="filter_replacement">Filter Replacement</SelectItem>
                      <SelectItem value="tire_rotation">Tire Rotation</SelectItem>
                      <SelectItem value="annual_certification">Annual Certification</SelectItem>
                      <SelectItem value="engine_overhaul">Engine Overhaul</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the maintenance task"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="frequencyType">Frequency Type</Label>
                  <Select value={formData.frequencyType} onValueChange={(value: any) => setFormData({ ...formData, frequencyType: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="one_time">One Time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequencyValue">Frequency Value</Label>
                  <Input
                    id="frequencyValue"
                    type="number"
                    value={formData.frequencyValue}
                    onChange={(e) => setFormData({ ...formData, frequencyValue: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nextDueDate">Next Due Date</Label>
                  <Input
                    id="nextDueDate"
                    type="date"
                    value={formData.nextDueDate}
                    onChange={(e) => setFormData({ ...formData, nextDueDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="estimatedCost">Estimated Cost</Label>
                  <Input
                    id="estimatedCost"
                    value={formData.estimatedCost}
                    onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                    placeholder="$0.00"
                  />
                </div>
                <div className="space-y-2 flex items-center gap-2 pt-8">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="isRecurring">Recurring Task</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
              <Button onClick={handleCreate} disabled={!formData.taskName}>Create Task</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Maintenance Tasks List */}
      <div className="space-y-2">
        {tasks.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No maintenance tasks scheduled</p>
            <p className="text-sm">Click "Add Task" to create a maintenance schedule</p>
          </div>
        ) : (
          tasks.map((task: any) => (
            <div
              key={task.id}
              className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={getStatusColor(task)}>{getStatusIcon(task)}</span>
                    <h4 className="font-semibold">{task.taskName}</h4>
                    <span className="text-xs px-2 py-1 rounded-full bg-secondary">
                      {task.taskType.replace("_", " ")}
                    </span>
                  </div>
                  {task.description && (
                    <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {task.nextDueDate && (
                      <div>
                        <span className="text-muted-foreground">Due: </span>
                        <span className={isOverdue(task) ? "text-red-600 font-semibold" : ""}>
                          {format(new Date(task.nextDueDate), "MMM d, yyyy")}
                        </span>
                      </div>
                    )}
                    {task.lastCompletedDate && (
                      <div>
                        <span className="text-muted-foreground">Last Completed: </span>
                        {format(new Date(task.lastCompletedDate), "MMM d, yyyy")}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Frequency: </span>
                      Every {task.frequencyValue} {task.frequencyType}
                    </div>
                    {task.estimatedCost && (
                      <div>
                        <span className="text-muted-foreground">Est. Cost: </span>
                        ${task.estimatedCost}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {task.status !== "completed" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsCompleteOpen(true);
                      }}
                    >
                      Complete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(task.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Complete Task Dialog */}
      <Dialog open={isCompleteOpen} onOpenChange={setIsCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Maintenance Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="actualCost">Actual Cost</Label>
              <Input
                id="actualCost"
                value={completeData.actualCost}
                onChange={(e) => setCompleteData({ ...completeData, actualCost: e.target.value })}
                placeholder="$0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="completeNotes">Completion Notes</Label>
              <Textarea
                id="completeNotes"
                value={completeData.notes}
                onChange={(e) => setCompleteData({ ...completeData, notes: e.target.value })}
                placeholder="Notes about the completed maintenance"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCompleteOpen(false)}>Cancel</Button>
            <Button onClick={handleComplete}>Mark Complete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
