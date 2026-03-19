import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { WeatherCard } from "@/components/weather/WeatherCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

export default function Weather() {
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  const { data: weatherData, isLoading, error } = trpc.weather.current.useQuery(
    {
      latitude: coordinates?.lat ?? 0,
      longitude: coordinates?.lng ?? 0,
    },
    {
      enabled: coordinates !== null,
      refetchInterval: 5 * 60 * 1000,
    }
  );

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        setCoordinates({ lat, lng });
        toast.success("Location detected successfully");
      },
      (error) => {
        toast.error("Error getting location: " + error.message);
      }
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lng)) {
      toast.error("Please enter valid coordinates");
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error("Coordinates out of range");
      return;
    }

    setCoordinates({ lat, lng });
  };

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Weather Conditions</h1>
        <p className="text-muted-foreground">
          Check current weather conditions and spray window recommendations
        </p>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>
              Enter coordinates or use your current location
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="39.7392"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="-104.9903"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">Get Weather</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGetCurrentLocation}
                >
                  <MapPin className="mr-2 h-4 w-4" />
                  Use Current Location
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {error && (
          <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
            <CardContent className="pt-6">
              <p className="text-red-600 dark:text-red-400">
                Error loading weather data: {error.message}
              </p>
            </CardContent>
          </Card>
        )}

        {weatherData && !isLoading && (
          <WeatherCard weather={weatherData.weather} sprayWindow={weatherData.sprayWindow} />
        )}
      </div>
    </div>
  );
}
