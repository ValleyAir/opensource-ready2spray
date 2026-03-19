import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Key, Plus, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ApiKeys() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const { data: apiKeys, isLoading, refetch } = trpc.apiKeys.list.useQuery();
  const createMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => {
      setGeneratedKey(data.plainKey);
      toast.success("API key created successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create API key: ${error.message}`);
    },
  });

  const deleteMutation = trpc.apiKeys.delete.useMutation({
    onSuccess: () => {
      toast.success("API key deleted");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete API key: ${error.message}`);
    },
  });

  const handleCreateKey = () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a key name");
      return;
    }

    createMutation.mutate({
      name: newKeyName,
      description: newKeyDescription,
      permissions: ["read", "write"],
    });
  };

  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard");
  };

  const handleDeleteKey = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete the API key "${name}"? This action cannot be undone.`)) {
      deleteMutation.mutate({ id });
    }
  };

  const closeCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setNewKeyName("");
    setNewKeyDescription("");
    setGeneratedKey(null);
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">API Keys</h1>
          <p className="text-muted-foreground mt-1">
            Manage API keys for external integrations with n8n, Zapier, and other tools
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            {generatedKey ? (
              <>
                <DialogHeader>
                  <DialogTitle>API Key Created</DialogTitle>
                  <DialogDescription>
                    Copy this key now. You won't be able to see it again!
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Store this key securely. It provides full access to your organization's data.
                    </AlertDescription>
                  </Alert>
                  <div className="flex items-center gap-2">
                    <Input
                      value={generatedKey}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleCopyKey(generatedKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={closeCreateDialog}>Done</Button>
                </DialogFooter>
              </>
            ) : (
              <>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Generate a new API key for external integrations
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Key Name *</Label>
                    <Input
                      id="name"
                      placeholder="e.g., n8n Production"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="What will this key be used for?"
                      value={newKeyDescription}
                      onChange={(e) => setNewKeyDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={closeCreateDialog}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateKey}
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create Key"}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active API Keys</CardTitle>
          <CardDescription>
            API keys allow external services to access your Ready2Spray data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading API keys...
            </div>
          ) : !apiKeys || apiKeys.length === 0 ? (
            <div className="text-center py-8">
              <Key className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">No API keys yet</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First API Key
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Key Prefix</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Usage Count</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {key.description || "—"}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {key.keyPrefix}...
                      </code>
                    </TableCell>
                    <TableCell>
                      {key.isActive ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {key.lastUsedAt
                        ? new Date(key.lastUsedAt).toLocaleDateString()
                        : "Never"}
                    </TableCell>
                    <TableCell>{key.usageCount || 0}</TableCell>
                    <TableCell className="text-sm">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteKey(key.id, key.name)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>API Endpoints</CardTitle>
          <CardDescription>
            Use these endpoints with your API key for external integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Authentication</h3>
              <p className="text-sm text-muted-foreground mb-2">
                Include your API key in the Authorization header:
              </p>
              <code className="block bg-muted p-3 rounded text-sm">
                Authorization: Bearer rts_live_your_api_key_here
              </code>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Available Endpoints</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">POST</Badge>
                  <code>/api/webhook/jobs/create</code>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">POST</Badge>
                  <code>/api/webhook/jobs/update</code>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">GET</Badge>
                  <code>/api/webhook/jobs/list</code>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">POST</Badge>
                  <code>/api/webhook/customers/create</code>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">GET</Badge>
                  <code>/api/webhook/customers/list</code>
                </div>
                <p className="text-muted-foreground mt-2">
                  And more... See full documentation for all available endpoints.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
