import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Wind, Droplets, Thermometer, AlertTriangle } from "lucide-react";
import { WeatherIcon } from "./WeatherIcon";

interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  precipitation: number;
  conditions: string;
  timestamp: Date;
}

interface SprayWindow {
  isIdeal: boolean;
  score: number;
  reasons: string[];
  recommendation: string;
}

interface WeatherCardProps {
  weather: WeatherData;
  sprayWindow: SprayWindow;
}

export function WeatherCard({ weather, sprayWindow }: WeatherCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600 dark:text-green-400";
    if (score >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-600">Ideal</Badge>;
    if (score >= 60) return <Badge className="bg-yellow-600">Acceptable</Badge>;
    if (score >= 40) return <Badge className="bg-orange-600">Marginal</Badge>;
    return <Badge className="bg-red-600">Unsafe</Badge>;
  };

  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Current Weather Conditions</CardTitle>
            <CardDescription>
              Updated {new Date(weather.timestamp).toLocaleTimeString()}
            </CardDescription>
          </div>
          <WeatherIcon condition={weather.conditions} className="h-12 w-12" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weather Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            <Thermometer className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{weather.temperature.toFixed(0)}°F</div>
              <div className="text-xs text-muted-foreground">Temperature</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Wind className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{weather.windSpeed.toFixed(1)} mph</div>
              <div className="text-xs text-muted-foreground">
                Wind {getWindDirection(weather.windDirection)}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-muted-foreground" />
            <div>
              <div className="text-2xl font-bold">{weather.humidity}%</div>
              <div className="text-xs text-muted-foreground">Humidity</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="h-5 w-5" />
            <div>
              <div className="text-2xl font-bold">{weather.conditions}</div>
              <div className="text-xs text-muted-foreground">Conditions</div>
            </div>
          </div>
        </div>

        {/* Spray Window Assessment */}
        <div className="border-t pt-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold">Spray Window Assessment</h3>
            {getScoreBadge(sprayWindow.score)}
          </div>

          <div className={`text-3xl font-bold mb-2 ${getScoreColor(sprayWindow.score)}`}>
            {sprayWindow.score}/100
          </div>

          <div className="flex items-start gap-2 mb-4">
            {sprayWindow.score >= 80 ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
            ) : sprayWindow.score >= 40 ? (
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0"
 />
            )}
            <p className="text-sm font-medium">{sprayWindow.recommendation}</p>
          </div>

          {/* Reasons List */}
          <div className="space-y-1">
            {sprayWindow.reasons.map((reason, index) => (
              <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>{reason}</span>
              

              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
