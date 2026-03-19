import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Brain, Cpu, Download, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function AISettings() {
  const [pullModelName, setPullModelName] = useState("");
  
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = trpc.models.getProviderStatus.useQuery();
  const { data: models, isLoading: modelsLoading, refetch: refetchModels } = trpc.models.listAvailable.useQuery();
  const { data: config, isLoading: configLoading } = trpc.models.getConfig.useQuery();
  
  const updateConfigMutation = trpc.models.updateConfig.useMutation({
    onSuccess: () => {
      toast.success("AI configuration updated");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const pullModelMutation = trpc.models.pullModel.useMutation({
    onSuccess: () => {
      toast.success(`Started pulling model ${pullModelName}. This may take a while.`);
      setPullModelName("");
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleUpdateConfig = (key: string, value: string) => {
    updateConfigMutation.mutate({ [key]: value });
  };

  const handlePullModel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pullModelName) return;
    pullModelMutation.mutate({ name: pullModelName });
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "N/A";
    const gb = bytes / (1024 * 1024 * 1024);
    return `${gb.toFixed(2)} GB`;
  };

  return (
    <div className="space-y-6 container max-w-6xl py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Model Configuration</h1>
          <p className="text-muted-foreground">
            Manage AI models and providers for your organization
          </p>
        </div>
        <Button variant="outline" onClick={() => { refetchStatus(); refetchModels(); }}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Provider Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Current Provider Status
          </CardTitle>
          <CardDescription>Status of the active AI inference provider</CardDescription>
        </CardHeader>
        <CardContent>
          {statusLoading ? (
            <div className="flex items-center space-x-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking provider status...</span>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg capitalize">{status?.provider || "Unknown"}</span>
                  {status?.healthy ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Healthy
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <XCircle className="mr-1 h-3 w-3" />
                      Unhealthy
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{status?.message}</p>
                {status?.provider === 'ollama' && !status?.healthy && (
                  <p className="text-xs text-amber-600 mt-1">
                    Ollama is offline. AI will automatically fall back to Anthropic if configured.
                  </p>
                )}
                {status?.provider === 'ollama' && status.details?.url && (
                  <p className="text-xs text-muted-foreground font-mono bg-muted p-1 rounded inline-block">
                    {status.details.url}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Model Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Default Model Configuration
          </CardTitle>
          <CardDescription>Select which models to use for specific tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configLoading || modelsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Chat Assistant Model</Label>
                  <Select 
                    value={config?.chatModel || ""} 
                    onValueChange={(val) => handleUpdateConfig("chatModel", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models?.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} {model.size ? `(${formatSize(model.size)})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Used for general chat and Q&A.</p>
                </div>

                <div className="space-y-2">
                  <Label>Analysis Model</Label>
                  <Select 
                    value={config?.analysisModel || ""} 
                    onValueChange={(val) => handleUpdateConfig("analysisModel", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models?.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} {model.size ? `(${formatSize(model.size)})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Used for weather and spray window analysis.</p>
                </div>

                <div className="space-y-2">
                  <Label>Compliance Model</Label>
                  <Select 
                    value={config?.complianceModel || ""} 
                    onValueChange={(val) => handleUpdateConfig("complianceModel", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {models?.map((model) => (
                        <SelectItem key={model.id} value={model.id}>
                          {model.name} {model.size ? `(${formatSize(model.size)})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Used for EPA label checking and compliance.</p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Ollama Management (Only if Ollama is provider) */}
      {status?.provider === 'ollama' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Ollama Model Management
            </CardTitle>
            <CardDescription>Manage local models installed on your Ollama instance</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-sm font-medium">Installed Models</h3>
              <div className="border rounded-md divide-y">
                {models?.map((model) => (
                  <div key={model.id} className="p-3 flex items-center justify-between text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium">{model.name}</span>
                      <span className="text-xs text-muted-foreground">
                        Updated: {new Date(model.modified || "").toLocaleDateString()}
                      </span>
                    </div>
                    <div className="font-mono text-xs bg-secondary px-2 py-1 rounded">
                      {formatSize(model.size)}
                    </div>
                  </div>
                ))}
                {(!models || models.length === 0) && (
                  <div className="p-4 text-center text-muted-foreground text-sm">
                    No models found. Pull a model to get started.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-sm font-medium">Pull New Model</h3>
              <form onSubmit={handlePullModel} className="flex gap-2">
                <div className="flex-1">
                  <Input 
                    placeholder="e.g. llama3, mistral, codellama" 
                    value={pullModelName}
                    onChange={(e) => setPullModelName(e.target.value)}
                  />
                </div>
                <Button type="submit" disabled={pullModelMutation.isPending || !pullModelName}>
                  {pullModelMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Pull Model
                </Button>
              </form>
              <p className="text-xs text-muted-foreground">
                Enter the name of a model from the <a href="https://ollama.com/library" target="_blank" rel="noreferrer" className="underline hover:text-primary">Ollama Library</a>. 
                Large models may take several minutes to download.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
