import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, Users, FileText, Key, CreditCard, Plug } from "lucide-react";
import SettingsGeneral from "./SettingsGeneral";
import SettingsIntegrations from "./SettingsIntegrations";
import UserManagement from "./UserManagement";
import AuditLog from "./AuditLog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Copy, Key as KeyIcon, Plus, Trash2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyDescription, setNewKeyDescription] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const { data: apiKeys, isLoading: apiKeysLoading, refetch: refetchApiKeys } = trpc.apiKeys.list.useQuery(undefined, {
    enabled: activeTab === "api",
  });

  const createApiKeyMutation = trpc.apiKeys.create.useMutation({
    onSuccess: (data) => {
      setGeneratedKey(data.plainKey);
      toast.success("API key created successfully");
      refetchApiKeys();
    },
    onError: (error) => {
      toast.error(`Failed to create API key: ${error.message}`);
    },
  });

  const deleteApiKeyMutation = trpc.apiKeys.delete.useMutation({
    onSuccess: () => {
      toast.success("API key deleted");
      refetchApiKeys();
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

    createApiKeyMutation.mutate({
      name: newKeyName,
      description: newKeyDescription || undefined,
      permissions: ["read", "write"],
    });
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setNewKeyName("");
    setNewKeyDescription("");
    setGeneratedKey(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleDeleteKey = (id: number, name: string) => {
    if (confirm(`Are you sure you want to delete the API key "${name}"? This action cannot be undone.`)) {
      deleteApiKeyMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your organization, users, and system configuration
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            <span className="hidden sm:inline">General</span>
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Users</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Audit Log</span>
          </TabsTrigger>
          <TabsTrigger value="api" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            <span className="hidden sm:inline">API Keys</span>
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            <span className="hidden sm:inline">Integrations</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Billing</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <SettingsGeneral />
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <UserManagement />
        </TabsContent>

        <TabsContent value="audit" className="space-y-6">
          <AuditLog />
        </TabsContent>


        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Manage API keys for external integrations like n8n, Zapier, and custom applications
                  </CardDescription>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Create API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New API Key</DialogTitle>
                      <DialogDescription>
                        {generatedKey ? "Save this API key - you won't be able to see it again!" : "Create a new API key for external integrations"}
                      </DialogDescription>
                    </DialogHeader>
                    {generatedKey ? (
                      <div className="space-y-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            Make sure to copy your API key now. You won't be able to see it again!
                          </AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                          <Label>Your API Key</Label>
                          <div className="flex gap-2">
                            <Input value={generatedKey} readOnly className="font-mono text-sm" />
                            <Button variant="outline" size="icon" onClick={() => copyToClipboard(generatedKey)}>
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="key-name">Key Name *</Label>
                          <Input
                            id="key-name"
                            placeholder="e.g., n8n Integration"
                            value={newKeyName}
                            onChange={(e) => setNewKeyName(e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="key-description">Description (Optional)</Label>
                          <Textarea
                            id="key-description"
                            placeholder="What will this key be used for?"
                            value={newKeyDescription}
                            onChange={(e) => setNewKeyDescription(e.target.value)}
                            rows={3}
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter>
                      {generatedKey ? (
                        <Button onClick={handleCloseCreateDialog}>Done</Button>
                      ) : (
                        <>
                          <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handleCreateKey} disabled={createApiKeyMutation.isPending}>
                            {createApiKeyMutation.isPending ? "Creating..." : "Create Key"}
                          </Button>
                        </>
                      )}
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {apiKeysLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading API keys...</div>
              ) : !apiKeys || apiKeys.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <KeyIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">No API keys yet</p>
                  <p className="text-sm mt-2">Create your first API key to start integrating with external services</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Permissions</TableHead>
                      <TableHead>Last Used</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium">{key.name}</TableCell>
                        <TableCell className="text-muted-foreground">{key.description || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {(key.permissions as string[]).map((perm: string) => (
                              <Badge key={perm} variant="secondary" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(key.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteKey(key.id, key.name)}
                            disabled={deleteApiKeyMutation.isPending}
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

          <Card>
            <CardHeader>
              <CardTitle>API Documentation</CardTitle>
              <CardDescription>
                Use these endpoints with your API key for external integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Authentication</h4>
                <p className="text-sm text-muted-foreground mb-2">Include your API key in the Authorization header:</p>
                <code className="block bg-muted p-3 rounded text-sm">Authorization: Bearer YOUR_API_KEY</code>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Available Endpoints</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <Badge variant="outline">POST</Badge>
                    <code>/api/webhook/jobs</code>
                    <span className="text-muted-foreground">- Create or update jobs</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline">POST</Badge>
                    <code>/api/webhook/customers</code>
                    <span className="text-muted-foreground">- Create or update customers</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline">POST</Badge>
                    <code>/api/webhook/sites</code>
                    <span className="text-muted-foreground">- Create or update sites</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline">POST</Badge>
                    <code>/api/webhook/personnel</code>
                    <span className="text-muted-foreground">- Create or update personnel</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Badge variant="outline">POST</Badge>
                    <code>/api/webhook/equipment</code>
                    <span className="text-muted-foreground">- Create or update equipment</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="space-y-6">
          <SettingsIntegrations />
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Billing & Subscription</CardTitle>
              <CardDescription>
                Manage your subscription and payment methods (coming soon)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Billing management will be available in Phase 5 of the MVP sprint
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
