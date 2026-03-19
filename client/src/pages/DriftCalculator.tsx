import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Wind, Thermometer, Droplets, AlertTriangle, ArrowRight, Gauge, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function DriftCalculator() {
  const [location] = useLocation();
  const searchString = useSearch();
  const searchParams = new URLSearchParams(searchString);
  const jobId = searchParams.get("jobId") ? parseInt(searchParams.get("jobId")!) : undefined;

  // Pre-fill if jobId provided
  const { data: job } = trpc.jobsV2.getById.useQuery(
    { id: jobId! },
    { enabled: !!jobId }
  );

  const [formData, setFormData] = useState({
    windSpeed: 5,
    windDirection: 0,
    temperature: 70,
    humidity: 50,
    boomHeight: 10,
    dropletSize: "Medium" as "Fine" | "Medium" | "Coarse" | "Very Coarse" | "Extra Coarse",
    aircraftSpeed: 120,
    distanceToSensitiveArea: 100,
  });

  const [result, setResult] = useState<any>(null);

  // Pre-fill from job data
  useEffect(() => {
    if (job) {
      setFormData(prev => ({
        ...prev,
        // If job has saved weather data, use it (job.windSpeedMph is string/numeric)
        windSpeed: job.windSpeedMph ? Number(job.windSpeedMph) : prev.windSpeed,
        temperature: job.temperatureF ? Number(job.temperatureF) : prev.temperature,
        // Default aerial params
        aircraftSpeed: 120, 
        boomHeight: 12,
      }));
    }
  }, [job]);

  const calculateMutation = trpc.drift.calculate.useMutation({
    onSuccess: (data) => {
      setResult(data);
      if (data.riskLevel === 'Critical') {
        toast.error("Critical Drift Risk detected! Review recommendations.");
      } else if (data.riskLevel === 'Low') {
        toast.success("Drift risk is Low. Conditions look good.");
      } else {
        toast.info("Drift calculation complete.");
      }
    },
    onError: (err) => {
      toast.error(`Calculation failed: ${err.message}`);
    }
  });

  const handleCalculate = () => {
    calculateMutation.mutate({
      ...formData,
      jobId,
    });
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Critical': return "bg-red-500 text-white";
      case 'High': return "bg-orange-500 text-white";
      case 'Moderate': return "bg-yellow-500 text-white";
      case 'Low': return "bg-green-500 text-white";
      default: return "bg-gray-500";
    }
  };

  return (
    <div className="container max-w-6xl py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Wind className="h-8 w-8 text-blue-500" />
            Spray Drift Risk Assessment
          </h1>
          <p className="text-muted-foreground mt-2">
            Calculate drift potential based on weather, equipment, and flight parameters.
            {jobId && <span className="ml-2 font-medium text-primary">Assesssing for Job #{jobId}</span>}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle>Assessment Parameters</CardTitle>
            <CardDescription>Enter current conditions and application details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                <Thermometer className="h-4 w-4" /> Weather Conditions
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Wind Speed (mph)</Label>
                  <Input 
                    type="number" 
                    value={formData.windSpeed}
                    onChange={e => setFormData({...formData, windSpeed: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Wind Direction (°)</Label>
                  <Input 
                    type="number" 
                    value={formData.windDirection}
                    onChange={e => setFormData({...formData, windDirection: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Temperature (°F)</Label>
                  <Input 
                    type="number" 
                    value={formData.temperature}
                    onChange={e => setFormData({...formData, temperature: parseFloat(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Humidity (%)</Label>
                  <Input 
                    type="number" 
                    value={formData.humidity}
                    onChange={e => setFormData({...formData, humidity: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-wider">
                <Droplets className="h-4 w-4" /> Equipment & Flight
              </h3>
              
              <div className="space-y-2">
                <Label>Boom / Release Height (ft)</Label>
                <div className="flex items-center gap-4">
                  <Slider 
                    value={[formData.boomHeight]} 
                    min={2} max={30} step={1}
                    onValueChange={vals => setFormData({...formData, boomHeight: vals[0]})}
                    className="flex-1"
                  />
                  <span className="w-12 font-mono text-right">{formData.boomHeight} ft</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Droplet Size (ASABE)</Label>
                  <Select 
                    value={formData.dropletSize}
                    onValueChange={(val: any) => setFormData({...formData, dropletSize: val})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fine">Fine (High Risk)</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Coarse">Coarse</SelectItem>
                      <SelectItem value="Very Coarse">Very Coarse</SelectItem>
                      <SelectItem value="Extra Coarse">Extra Coarse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Aircraft Speed (mph)</Label>
                  <Input 
                    type="number" 
                    value={formData.aircraftSpeed}
                    onChange={e => setFormData({...formData, aircraftSpeed: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <Button 
              className="w-full" 
              size="lg" 
              onClick={handleCalculate}
              disabled={calculateMutation.isPending}
            >
              {calculateMutation.isPending ? "Calculating..." : "Calculate Risk Score"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

          </CardContent>
        </Card>

        {/* Results Section */}
        <div className="space-y-6">
          {result ? (
            <>
              <Card className="border-2 overflow-hidden">
                <div className={`h-2 w-full ${getRiskColor(result.riskLevel)}`} />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Assessment Result</CardTitle>
                    <Badge className={`${getRiskColor(result.riskLevel)} text-base px-4 py-1`}>
                      {result.riskLevel} Risk
                    </Badge>
                  </div>
                  <CardDescription>
                    Calculated based on EPA Drift Reduction Technology guidelines
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                      <div className="text-3xl font-bold">{result.riskScore}<span className="text-sm text-muted-foreground font-normal">/100</span></div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Risk Score</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
                      <div className="text-3xl font-bold">{result.requiredBufferZone} <span className="text-sm text-muted-foreground font-normal">ft</span></div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mt-1">Req. Buffer Zone</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      Recommendations
                    </h4>
                    {result.recommendations.length > 0 ? (
                      <ul className="space-y-2">
                        {result.recommendations.map((rec: string, i: number) => (
                          <li key={i} className="text-sm flex gap-2 items-start bg-slate-50 dark:bg-slate-900 p-2 rounded">
                            <span className="text-primary mt-0.5">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        No specific mitigation needed. Conditions are optimal.
                      </p>
                    )}
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-300 text-sm mb-1">Estimated Drift Distance</h4>
                    <p className="text-2xl font-mono text-blue-600 dark:text-blue-400">
                      ~{result.estimatedDriftDistance} feet
                    </p>
                    <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                      Theoretical downwind displacement of median droplet size.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="h-full flex items-center justify-center p-12 border-2 border-dashed rounded-lg bg-slate-50/50 dark:bg-slate-900/20">
              <div className="text-center text-muted-foreground">
                <Gauge className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Enter parameters and click Calculate<br/>to see risk assessment</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
