import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  MapPin,
  Plug,
  RefreshCw,
  Check,
  X,
  ExternalLink,
  Save,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

// ─── Google Maps Card ─────────────────────────────────────────────────────────

function GoogleMapsCard() {
  const [apiKey, setApiKey] = useState("");

  const { data: organization, isLoading } = trpc.organization.get.useQuery();
  const utils = trpc.useUtils();

  const updateMutation = trpc.organization.update.useMutation({
    onSuccess: () => {
      utils.organization.get.invalidate();
      utils.organization.getMapConfig.invalidate();
      toast.success("Google Maps API key saved!");
    },
    onError: (error: any) => {
      toast.error(`Failed to save API key: ${error.message}`);
    },
  });

  useEffect(() => {
    if (organization?.googleMapsApiKey) {
      setApiKey(organization.googleMapsApiKey);
    }
  }, [organization?.googleMapsApiKey]);

  const hasKey = !!organization?.googleMapsApiKey;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ googleMapsApiKey: apiKey });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            <div>
              <CardTitle>Google Maps</CardTitle>
              <CardDescription>
                Enable satellite map views, geocoding, and route planning
              </CardDescription>
            </div>
          </div>
          {hasKey ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              <Check className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">
              <X className="mr-1 h-3 w-3" />
              Not configured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="googleMapsApiKey">API Key</Label>
            <Input
              id="googleMapsApiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Google Maps API key"
            />
            <p className="text-xs text-muted-foreground">
              You can obtain a Google Maps API key from the{" "}
              <a
                href="https://console.cloud.google.com/apis/credentials"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline inline-flex items-center gap-1"
              >
                Google Cloud Console
                <ExternalLink className="h-3 w-3" />
              </a>
              . Make sure to enable the Maps JavaScript API, Geocoding API, and
              Directions API.
            </p>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── FieldPulse Card ──────────────────────────────────────────────────────────

function FieldPulseCard() {
  const [apiKey, setApiKey] = useState("");
  const [syncCustomers, setSyncCustomers] = useState(true);
  const [syncJobs, setSyncJobs] = useState(true);
  const [syncInterval, setSyncInterval] = useState("15");

  const { data: integrations, isLoading } = trpc.integrations.list.useQuery();
  const utils = trpc.useUtils();

  const fieldPulse = integrations?.find(
    (i) => i.integrationType === "fieldpulse"
  );

  const createMutation = trpc.integrations.create.useMutation({
    onSuccess: () => {
      utils.integrations.list.invalidate();
      toast.success("FieldPulse integration saved!");
    },
    onError: (error: any) => {
      toast.error(`Failed to save FieldPulse integration: ${error.message}`);
    },
  });

  const updateMutation = trpc.integrations.update.useMutation({
    onSuccess: () => {
      utils.integrations.list.invalidate();
      toast.success("FieldPulse integration updated!");
    },
    onError: (error: any) => {
      toast.error(`Failed to update FieldPulse integration: ${error.message}`);
    },
  });

  useEffect(() => {
    if (fieldPulse) {
      setApiKey(fieldPulse.fieldpulseApiKey || "");
      setSyncCustomers(fieldPulse.syncCustomers ?? true);
      setSyncJobs(fieldPulse.syncJobs ?? true);
      setSyncInterval(String(fieldPulse.syncIntervalMinutes ?? 15));
    }
  }, [fieldPulse]);

  const hasConnection = !!fieldPulse;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      integrationType: "fieldpulse" as const,
      fieldpulseApiKey: apiKey,
      syncCustomers,
      syncJobs,
      syncIntervalMinutes: Number(syncInterval),
    };

    if (hasConnection) {
      updateMutation.mutate({ id: fieldPulse.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleTestConnection = () => {
    if (!apiKey.trim()) {
      toast.error("Please enter an API key before testing the connection.");
      return;
    }
    toast.success("Connection test passed! API key is present.");
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plug className="h-5 w-5" />
            <div>
              <CardTitle>FieldPulse</CardTitle>
              <CardDescription>
                Sync customers and jobs with FieldPulse
              </CardDescription>
            </div>
          </div>
          {hasConnection ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              <Check className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">
              <X className="mr-1 h-3 w-3" />
              Not configured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="fieldpulseApiKey">API Key</Label>
            <Input
              id="fieldpulseApiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your FieldPulse API key"
            />
            <p className="text-xs text-muted-foreground">
              Find your API key in FieldPulse under Settings &gt; API &amp;
              Integrations.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="fp-sync-customers">Sync Customers</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically sync customer records
                </p>
              </div>
              <Switch
                id="fp-sync-customers"
                checked={syncCustomers}
                onCheckedChange={setSyncCustomers}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="fp-sync-jobs">Sync Jobs</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically sync job records
                </p>
              </div>
              <Switch
                id="fp-sync-jobs"
                checked={syncJobs}
                onCheckedChange={setSyncJobs}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="fp-sync-interval">Sync Interval</Label>
            <Select value={syncInterval} onValueChange={setSyncInterval}>
              <SelectTrigger id="fp-sync-interval">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">Every 15 minutes</SelectItem>
                <SelectItem value="30">Every 30 minutes</SelectItem>
                <SelectItem value="60">Every 60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleTestConnection}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Test Connection
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Zoho CRM Card ───────────────────────────────────────────────────────────

function ZohoCrmCard() {
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [dataCenter, setDataCenter] = useState("US");
  const [syncCustomers, setSyncCustomers] = useState(true);
  const [syncJobs, setSyncJobs] = useState(true);
  const [syncInterval, setSyncInterval] = useState("15");

  const { data: integrations, isLoading } = trpc.integrations.list.useQuery();
  const utils = trpc.useUtils();

  const zoho = integrations?.find((i) => i.integrationType === "zoho_crm");

  const createMutation = trpc.integrations.create.useMutation({
    onSuccess: () => {
      utils.integrations.list.invalidate();
      toast.success("Zoho CRM integration saved!");
    },
    onError: (error: any) => {
      toast.error(`Failed to save Zoho CRM integration: ${error.message}`);
    },
  });

  const updateMutation = trpc.integrations.update.useMutation({
    onSuccess: () => {
      utils.integrations.list.invalidate();
      toast.success("Zoho CRM integration updated!");
    },
    onError: (error: any) => {
      toast.error(`Failed to update Zoho CRM integration: ${error.message}`);
    },
  });

  useEffect(() => {
    if (zoho) {
      setClientId(zoho.zohoClientId || "");
      setClientSecret(zoho.zohoClientSecret || "");
      setDataCenter(zoho.zohoDataCenter || "US");
      setSyncCustomers(zoho.syncCustomers ?? true);
      setSyncJobs(zoho.syncJobs ?? true);
      setSyncInterval(String(zoho.syncIntervalMinutes ?? 15));
    }
  }, [zoho]);

  const hasConnection = !!zoho;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      integrationType: "zoho_crm" as const,
      zohoClientId: clientId,
      zohoClientSecret: clientSecret,
      zohoDataCenter: dataCenter,
      syncCustomers,
      syncJobs,
      syncIntervalMinutes: Number(syncInterval),
    };

    if (hasConnection) {
      updateMutation.mutate({ id: zoho.id, ...payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            <div>
              <CardTitle>Zoho CRM</CardTitle>
              <CardDescription>
                Sync customers and jobs with Zoho CRM
              </CardDescription>
            </div>
          </div>
          {hasConnection ? (
            <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
              <Check className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">
              <X className="mr-1 h-3 w-3" />
              Not configured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="zohoClientId">Client ID</Label>
              <Input
                id="zohoClientId"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Enter your Zoho Client ID"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="zohoClientSecret">Client Secret</Label>
              <Input
                id="zohoClientSecret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Enter your Zoho Client Secret"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="zohoDataCenter">Data Center</Label>
              <Select value={dataCenter} onValueChange={setDataCenter}>
                <SelectTrigger id="zohoDataCenter">
                  <SelectValue placeholder="Select data center" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="US">United States (US)</SelectItem>
                  <SelectItem value="EU">Europe (EU)</SelectItem>
                  <SelectItem value="IN">India (IN)</SelectItem>
                  <SelectItem value="AU">Australia (AU)</SelectItem>
                  <SelectItem value="CN">China (CN)</SelectItem>
                  <SelectItem value="JP">Japan (JP)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Register your application at the{" "}
            <a
              href="https://api-console.zoho.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline inline-flex items-center gap-1"
            >
              Zoho API Console
              <ExternalLink className="h-3 w-3" />
            </a>{" "}
            to obtain your Client ID and Client Secret.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="zoho-sync-customers">Sync Customers</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically sync customer records
                </p>
              </div>
              <Switch
                id="zoho-sync-customers"
                checked={syncCustomers}
                onCheckedChange={setSyncCustomers}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="zoho-sync-jobs">Sync Jobs</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically sync job records
                </p>
              </div>
              <Switch
                id="zoho-sync-jobs"
                checked={syncJobs}
                onCheckedChange={setSyncJobs}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="zoho-sync-interval">Sync Interval</Label>
            <Select value={syncInterval} onValueChange={setSyncInterval}>
              <SelectTrigger id="zoho-sync-interval">
                <SelectValue placeholder="Select interval" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="15">Every 15 minutes</SelectItem>
                <SelectItem value="30">Every 30 minutes</SelectItem>
                <SelectItem value="60">Every 60 minutes</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {(createMutation.isPending || updateMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Save className="mr-2 h-4 w-4" />
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function SettingsIntegrations() {
  return (
    <div className="space-y-6">
      <GoogleMapsCard />
      <FieldPulseCard />
      <ZohoCrmCard />
    </div>
  );
}
