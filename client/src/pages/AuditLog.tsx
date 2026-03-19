import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Filter, X, Eye } from "lucide-react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function AuditLog() {
  const [filters, setFilters] = useState<{
    action?: "create" | "update" | "delete" | "login" | "logout" | "role_change" | "status_change" | "export" | "import" | "view";
    entityType?: "user" | "customer" | "personnel" | "job" | "site" | "equipment" | "product" | "service_plan" | "maintenance_task" | "organization" | "integration" | "job_status";
    startDate?: string;
    endDate?: string;
  }>({});

  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);

  const { data: auditLogs, isLoading, refetch } = trpc.auditLogs.list.useQuery(filters);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }) as typeof filters);
  };

  const clearFilters = () => {
    setFilters({});
    refetch();
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      create: "bg-green-500",
      update: "bg-blue-500",
      delete: "bg-red-500",
      login: "bg-purple-500",
      logout: "bg-gray-500",
      role_change: "bg-orange-500",
      status_change: "bg-yellow-500",
      export: "bg-cyan-500",
      import: "bg-indigo-500",
      view: "bg-slate-500",
    };
    return colors[action] || "bg-gray-500";
  };

  const formatEntityType = (type: string) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Activity Audit Log</h1>
          <p className="text-muted-foreground">
            Track all user actions and system changes
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter className="h-4 w-4 mr-2" />
          {showFilters ? "Hide" : "Show"} Filters
        </Button>
      </div>

      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>
              Filter audit logs by action, entity type, or date range
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="action">Action</Label>
                <Select
                  value={filters.action || ""}
                  onValueChange={(value) => handleFilterChange("action", value)}
                >
                  <SelectTrigger id="action">
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    <SelectItem value="create">Create</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                    <SelectItem value="delete">Delete</SelectItem>
                    <SelectItem value="login">Login</SelectItem>
                    <SelectItem value="logout">Logout</SelectItem>
                    <SelectItem value="role_change">Role Change</SelectItem>
                    <SelectItem value="status_change">Status Change</SelectItem>
                    <SelectItem value="export">Export</SelectItem>
                    <SelectItem value="import">Import</SelectItem>
                    <SelectItem value="view">View</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="entityType">Entity Type</Label>
                <Select
                  value={filters.entityType || ""}
                  onValueChange={(value) => handleFilterChange("entityType", value)}
                >
                  <SelectTrigger id="entityType">
                    <SelectValue placeholder="All entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All entities</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="personnel">Personnel</SelectItem>
                    <SelectItem value="job">Job</SelectItem>
                    <SelectItem value="site">Site</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                    <SelectItem value="service_plan">Service Plan</SelectItem>
                    <SelectItem value="maintenance_task">Maintenance Task</SelectItem>
                    <SelectItem value="organization">Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={filters.startDate || ""}
                  onChange={(e) => handleFilterChange("startDate", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={filters.endDate || ""}
                  onChange={(e) => handleFilterChange("endDate", e.target.value)}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={() => refetch()}>Apply Filters</Button>
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !auditLogs || auditLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No audit logs found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity Type</TableHead>
                  <TableHead>Entity Name</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditLogs.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-sm">
                      {format(new Date(log.createdAt), "MMM dd, yyyy HH:mm:ss")}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{log.userName || "Unknown"}</div>
                        <div className="text-sm text-muted-foreground">
                          {log.userEmail}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getActionColor(log.action)}>
                        {log.action.replace("_", " ").toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatEntityType(log.entityType)}</TableCell>
                    <TableCell>
                      {log.entityName || `ID: ${log.entityId || "N/A"}`}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ipAddress || "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed information about this activity
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Timestamp</Label>
                  <p className="font-mono">
                    {format(new Date(selectedLog.createdAt), "PPpp")}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User</Label>
                  <p>{selectedLog.userName || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.userEmail}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Action</Label>
                  <p>
                    <Badge className={getActionColor(selectedLog.action)}>
                      {selectedLog.action.replace("_", " ").toUpperCase()}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Entity</Label>
                  <p>{formatEntityType(selectedLog.entityType)}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLog.entityName || `ID: ${selectedLog.entityId || "N/A"}`}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">IP Address</Label>
                  <p className="font-mono">{selectedLog.ipAddress || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">User Agent</Label>
                  <p className="text-sm break-all">
                    {selectedLog.userAgent || "N/A"}
                  </p>
                </div>
              </div>

              {selectedLog.changes && (
                <div>
                  <Label className="text-muted-foreground">Changes</Label>
                  <Card className="mt-2">
                    <CardContent className="p-4">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(selectedLog.changes, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <Label className="text-muted-foreground">Metadata</Label>
                  <Card className="mt-2">
                    <CardContent className="p-4">
                      <pre className="text-sm overflow-x-auto">
                        {JSON.stringify(selectedLog.metadata, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
