import { useState, useRef, useEffect } from "react";
import { MapView } from "@/components/Map";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search } from "lucide-react";

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
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.marker.AdvancedMarkerElement | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    if (value?.address) {
      setSearchQuery(value.address);
    }
    if (value?.latitude && value?.longitude) {
      setSelectedLocation({ lat: Number(value.latitude), lng: Number(value.longitude) });
    }
  }, [value]);

  const handleMapReady = (map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new window.google.maps.Geocoder();

    // If there's an initial location, place marker
    if (selectedLocation) {
      placeMarker(selectedLocation);
      map.setCenter(selectedLocation);
    }

    // Add click listener to map
    map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const location = { lat, lng };
        
        placeMarker(location);
        setSelectedLocation(location);
        
        // Reverse geocode to get address
        reverseGeocode(location);
      }
    });
  };

  const placeMarker = (location: { lat: number; lng: number }) => {
    if (!mapRef.current) return;

    // Remove existing marker
    if (markerRef.current) {
      markerRef.current.map = null;
    }

    // Create new marker
    markerRef.current = new window.google.maps.marker.AdvancedMarkerElement({
      map: mapRef.current,
      position: location,
      title: "Job Location",
    });
  };

  const reverseGeocode = (location: { lat: number; lng: number }) => {
    if (!geocoderRef.current) return;

    geocoderRef.current.geocode(
      { location },
      (results, status) => {
        if (status === "OK" && results && results[0]) {
          const address = results[0].formatted_address;
          setSearchQuery(address);
          onChange({
            address,
            latitude: location.lat,
            longitude: location.lng,
          });
        }
      }
    );
  };

  const handleSearch = () => {
    if (!geocoderRef.current || !mapRef.current || !searchQuery.trim()) return;

    geocoderRef.current.geocode(
      { address: searchQuery },
      (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          const lat = location.lat();
          const lng = location.lng();
          const pos = { lat, lng };
          
          mapRef.current?.setCenter(pos);
          mapRef.current?.setZoom(15);
          placeMarker(pos);
          setSelectedLocation(pos);
          
          onChange({
            address: results[0].formatted_address,
            latitude: lat,
            longitude: lng,
          });
        }
      }
    );
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
              selectedLocation || { lat: 39.8283, lng: -98.5795 } // Center of US
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
            Selected: {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}
          </span>
        </div>
      )}
    </div>
  );
}
