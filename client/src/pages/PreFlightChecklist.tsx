import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { 
  ClipboardCheck, 
  Plane, 
  Cloud, 
  FileText, 
  ShieldCheck, 
  PenTool, 
  Loader2, 
  Download, 
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
}

export default function PreFlightChecklist() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const jobId = params.jobId ? parseInt(params.jobId) : 0;

  const { data: initialData, isLoading } = trpc.checklist.getForJob.useQuery(
    { jobId },
    { enabled: !!jobId }
  );

  const submitMutation = trpc.checklist.submit.useMutation({
    onSuccess: () => {
      toast.success("Pre-flight checklist submitted successfully");
      setLocation(`/jobs/${jobId}`);
    },
    onError: (err) => {
      toast.error(`Submission failed: ${err.message}`);
    }
  });

  const [pilotId, setPilotId] = useState<string>("");
  const [aircraftId, setAircraftId] = useState<string>("");
  
  const [aircraftItems, setAircraftItems] = useState<ChecklistItem[]>([
    { id: "fuel", label: "Fuel quantity verified", checked: false },
    { id: "oil", label: "Oil level checked", checked: false },
    { id: "surfaces", label: "Control surfaces inspected", checked: false },
    { id: "hopper", label: "Hopper/tank condition verified", checked: false },
    { id: "spray_system", label: "Spray system functional test", checked: false },
    { id: "nav", label: "Navigation equipment operational", checked: false },
    { id: "leaks", label: "No visible leaks", checked: false },
  ]);

  const [complianceItems, setComplianceItems] = useState<ChecklistItem[]>([
    { id: "pilot_cert", label: "Pilot certification current", checked: false },
    { id: "aircraft_cert", label: "Aircraft certification current", checked: false },
    { id: "label_review", label: "Product label requirements reviewed", checked: false },
    { id: "ppe", label: "PPE requirements confirmed", checked: false },
    { id: "drift_plan", label: "Drift mitigation plan reviewed", checked: false },
    { id: "emergency", label: "Emergency procedures reviewed", checked: false },
  ]);

  const [confirmed, setConfirmed] = useState(false);
  const [signedName, setSignedName] = useState("");

  // Pre-select pilot if current user is one
  useEffect(() => {
    if (initialData?.currentUser && initialData.pilots) {
      // Logic to auto-select if user is in pilot list could go here
      // For now we just default signedName
      setSignedName(initialData.currentUser.name || "");
    }
    if (initialData?.job?.personnelId) {
        setPilotId(initialData.job.personnelId.toString());
    }
    if (initialData?.job?.equipmentId) {
        setAircraftId(initialData.job.equipmentId.toString());
    }
  }, [initialData]);

  const handleAircraftCheck = (id: string, checked: boolean) => {
    setAircraftItems(items => items.map(item => item.id === id ? { ...item, checked } : item));
  };

  const handleComplianceCheck = (id: string, checked: boolean) => {
    setComplianceItems(items => items.map(item => item.id === id ? { ...item, checked } : item));
  };

  const handleSubmit = () => {
    if (!confirmed || !signedName) {
      toast.error("Please sign and confirm the checklist");
      return;
    }
    
    // Check if all items are checked
    const allAircraft = aircraftItems.every(i => i.checked);
    const allCompliance = complianceItems.every(i => i.checked);
    
    if (!allAircraft || !allCompliance) {
      if (!confirm("Some checklist items are not checked. Do you want to submit anyway?")) {
        return;
      }
    }

    submitMutation.mutate({
      jobId,
      pilotId: pilotId ? parseInt(pilotId) : undefined,
      aircraftId: aircraftId ? parseInt(aircraftId) : undefined,
      checklistData: {
        aircraftItems,
        complianceItems,
      },
      weatherSnapshot: initialData?.weather,
      signedBy: signedName,
    });
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Pre-Flight Checklist & Job Briefing", 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Job ID: #${jobId}`, 14, 30);
    doc.text(`Date: ${new Date().toLocaleString()}`, 14, 35);
    doc.text(`Pilot: ${signedName}`, 14, 40);
    
    // Aircraft
    doc.setFontSize(14);
    doc.text("Aircraft Inspection", 14, 55);
    autoTable(doc, {
      startY: 60,
      head: [['Item', 'Status']],
      body: aircraftItems.map(i => [i.label, i.checked ? 'CHECKED' : 'UNCHECKED']),
    });
    
    // Weather
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(14);
    doc.text("Weather Assessment", 14, finalY);
    
    const weatherData = initialData?.weather ? [
        ['Conditions', initialData.weather.conditions],
        ['Temperature', `${initialData.weather.temperature}°F`],
        ['Wind', `${initialData.weather.windSpeed} mph`],
        ['Spray Score', initialData.weather.sprayWindow?.score?.toString() || 'N/A'],
    ] : [['Weather Data', 'Not Available']];

    autoTable(doc, {
      startY: finalY + 5,
      head: [['Parameter', 'Value']],
      body: weatherData,
    });

    // Signoff
    const signY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    doc.text(`Signed by: ${signedName}`, 14, signY);
    doc.text(`Timestamp: ${new Date().toISOString()}`, 14, signY + 10);
    
    doc.save(`checklist-job-${jobId}.pdf`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!initialData) {
    return <div>Failed to load checklist data</div>;
  }

  const { job, weather, pilots, aircraft } = initialData;

  return (
    <div className="container max-w-4xl py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <ClipboardCheck className="h-8 w-8 text-primary" />
            Pre-Flight Checklist
          </h1>
          <p className="text-muted-foreground mt-2">
            Job #{jobId}: {job.title}
          </p>
        </div>
        <Button variant="outline" onClick={generatePDF}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Section A: Aircraft & Pilot */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plane className="h-5 w-5" />
              Operational Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Pilot in Command</Label>
              <Select value={pilotId} onValueChange={setPilotId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Pilot" />
                </SelectTrigger>
                <SelectContent>
                  {pilots.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Aircraft</Label>
              <Select value={aircraftId} onValueChange={setAircraftId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Aircraft" />
                </SelectTrigger>
                <SelectContent>
                  {aircraft.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>{a.name} ({a.tailNumber})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Section B: Weather */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Weather Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weather ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground">Conditions</div>
                  <div className="font-semibold">{weather.conditions}</div>
                </div>
                <div className="p-3 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground">Temp / Hum</div>
                  <div className="font-semibold">{weather.temperature}°F / {weather.humidity}%</div>
                </div>
                <div className="p-3 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground">Wind</div>
                  <div className="font-semibold">{weather.windSpeed} mph {weather.windDirection}°</div>
                </div>
                <div className="p-3 bg-secondary rounded-lg">
                  <div className="text-sm text-muted-foreground">Spray Score</div>
                  <div className={`font-bold ${weather.sprayWindow?.score && weather.sprayWindow.score >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                    {weather.sprayWindow?.score || "N/A"}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Weather data unavailable for this location.</p>
            )}
          </CardContent>
        </Card>

        {/* Checklist Tabs */}
        <Tabs defaultValue="aircraft" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="aircraft">Aircraft Inspection</TabsTrigger>
            <TabsTrigger value="job">Job Details</TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
          </TabsList>
          
          <TabsContent value="aircraft">
            <Card>
              <CardHeader>
                <CardDescription>Verify aircraft condition prior to flight</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {aircraftItems.map(item => (
                  <div key={item.id} className="flex items-center space-x-3 border p-3 rounded-md hover:bg-secondary/50 transition-colors">
                    <Checkbox 
                      id={item.id} 
                      checked={item.checked} 
                      onCheckedChange={(checked) => handleAircraftCheck(item.id, checked === true)} 
                    />
                    <label
                      htmlFor={item.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full"
                    >
                      {item.label}
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="job">
            <Card>
              <CardHeader>
                <CardDescription>Review mission parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-muted-foreground">Product</span>
                    <span className="font-medium">{job.product?.nickname || "Not specified"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-medium">{job.applicationRate || "As per label"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-muted-foreground">Location</span>
                    <span className="font-medium text-right max-w-[200px] truncate">{job.location || "Coordinates"}</span>
                  </div>
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="text-muted-foreground">Total Acres</span>
                    <span className="font-medium">{job.acres || "N/A"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compliance">
            <Card>
              <CardHeader>
                <CardDescription>Verify regulatory requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {complianceItems.map(item => (
                  <div key={item.id} className="flex items-center space-x-3 border p-3 rounded-md hover:bg-secondary/50 transition-colors">
                    <Checkbox 
                      id={item.id} 
                      checked={item.checked} 
                      onCheckedChange={(checked) => handleComplianceCheck(item.id, checked === true)} 
                    />
                    <label
                      htmlFor={item.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer w-full"
                    >
                      {item.label}
                    </label>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Signoff */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Pilot Signoff
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Pilot Name / Signature</Label>
              <Input 
                placeholder="Enter full name" 
                value={signedName}
                onChange={e => setSignedName(e.target.value)}
              />
            </div>
            
            <div className="flex items-center space-x-2 bg-secondary/30 p-4 rounded-md">
              <Checkbox 
                id="confirm" 
                checked={confirmed} 
                onCheckedChange={(c) => setConfirmed(c === true)} 
              />
              <label
                htmlFor="confirm"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I confirm that I have inspected the aircraft, reviewed the job details, and assessed the weather conditions. 
                I certify that it is safe to proceed with this operation.
              </label>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setLocation(`/jobs/${jobId}`)}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!confirmed || !signedName || submitMutation.isPending}
              className="w-full sm:w-auto"
            >
              {submitMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
              Submit Checklist
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
