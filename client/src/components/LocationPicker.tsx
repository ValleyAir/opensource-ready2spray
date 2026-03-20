import { useState, useRef, useEffect } from "react";
import L from "leaflet";
import { MapView } from "@/components/Map";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search } from "lucide-react";

// Fix default marker icons for bundled environments
const DefaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

interface LocationPickerProps {
  value?: {
    address: string;
    latitude: number | null;
    longitude: number | null;
  };
  onChange: (location: {
    address: string;
    latitude: number | null;
    longitude: number | null;
  }) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState(value?.address || "");
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(
    value?.latitude && value?.longitude
      ? { lat: Number(value.latitude), lng: Number(value.longitude) }
      : null
  );

  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (value?.address) {
      setSearchQuery(value.address);
    }
    if (value?.latitude && value?.longitude) {
      setSelectedLocation({
        lat: Number(value.latitude),
        lng: Number(value.longitude),
      });
    }
  }, [value]);

  const handleMapReady = (map: L.Map) => {
    mapRef.current = map;

    // If there's an initial location, place marker
    if (selectedLocation) {
      placeMarker(selectedLocation);
      map.setView([selectedLocation.lat, selectedLocation.lng], 15);
    }

    // Add click listener to map
    map.on("click", (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      const location = { lat, lng };

      placeMarker(location);
      setSelectedLocation(location);

      // Reverse geocode to get address
      reverseGeocode(location);
    });
  };

  const placeMarker = (location: { lat: number; lng: number }) => {
    if (!mapRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      mapRef.current.removeLayer(markerRef.current);
    }

    // Create new marker
    markerRef.current = L.marker([location.lat, location.lng], {
      icon: DefaultIcon,
    }).addTo(mapRef.current);
    markerRef.current.bindPopup("Job Location");
  };

  const reverseGeocode = async (location: { lat: number; lng: number }) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) return;

      const data = await response.json();
      const address = data.address?.display_name || data.display_name || "";

      setSearchQuery(address);
      onChange({
        address,
        latitude: location.lat,
        longitude: location.lng,
      });
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
    }
  };

  const handleSearch = async () => {
    if (!mapRef.current || !searchQuery.trim()) return;

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) return;

      const results = await response.json();

      if (results && results.length > 0) {
        const result = results[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        const pos = { lat, lng };

        mapRef.current.setView([lat, lng], 15);
        placeMarker(pos);
        setSelectedLocation(pos);

        onChange({
          address: result.display_name,
          latitude: lat,
          longitude: lng,
        });
      }
    } catch (error) {
      console.error("Geocoding failed:", error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="location-search">Search Location</Label>
        <div className="flex gap-2 mt-1">
          <Input
            id="location-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter address or place name"
          />
          <Button type="button" onClick={handleSearch} size="icon">
            <Search className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Search for a location or click on the map to select
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <MapView
            className="w-full h-[250px] sm:h-[300px] md:h-[400px] rounded-lg"
            initialCenter={
              selectedLocation || { lat: 39.8283, lng: -98.5795 }
            }
            initialZoom={selectedLocation ? 15 : 4}
            onMapReady={handleMapReady}
          />
        </CardContent>
      </Card>

      {selectedLocation && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="w-4 h-4" />
          <span>
            Selected: {selectedLocation.lat.toFixed(6)},{" "}
            {selectedLocation.lng.toFixed(6)}
          </span>
        </div>
      )}
    </div>
  );
}
