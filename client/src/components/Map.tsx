/**
 * GOOGLE MAPS FRONTEND INTEGRATION - ESSENTIAL GUIDE
 *
 * USAGE FROM PARENT COMPONENT:
 * ======
 *
 * const mapRef = useRef<google.maps.Map | null>(null);
 *
 * <MapView
 *   initialCenter={{ lat: 40.7128, lng: -74.0060 }}
 *   initialZoom={15}
 *   onMapReady={(map) => {
 *     mapRef.current = map; // Store to control map from parent anytime, google map itself is in charge of the re-rendering, not react state.
 * </MapView>
 *
 * ======
 * Available Libraries and Core Features:
 * -------------------------------
 * 📍 MARKER (from `marker` library)
 * - Attaches to map using { map, position }
 * new google.maps.marker.AdvancedMarkerElement({
 *   map,
 *   position: { lat: 37.7749, lng: -122.4194 },
 *   title: "San Francisco",
 * });
 *
 * -------------------------------
 * 🏢 PLACES (from `places` library)
 * - Does not attach directly to map; use data with your map manually.
 * const place = new google.maps.places.Place({ id: PLACE_ID });
 * await place.fetchFields({ fields: ["displayName", "location"] });
 * map.setCenter(place.location);
 * new google.maps.marker.AdvancedMarkerElement({ map, position: place.location });
 *
 * -------------------------------
 * 🧭 GEOCODER (from `geocoding` library)
 * - Standalone service; manually apply results to map.
 * const geocoder = new google.maps.Geocoder();
 * geocoder.geocode({ address: "New York" }, (results, status) => {
 *   if (status === "OK" && results[0]) {
 *     map.setCenter(results[0].geometry.location);
 *     new google.maps.marker.AdvancedMarkerElement({
 *       map,
 *       position: results[0].geometry.location,
 *     });
 *   }
 * });
 *
 * -------------------------------
 * 📐 GEOMETRY (from `geometry` library)
 * - Pure utility functions; not attached to map.
 * const dist = google.maps.geometry.spherical.computeDistanceBetween(p1, p2);
 *
 * -------------------------------
 * 🛣️ ROUTES (from `routes` library)
 * - Combines DirectionsService (standalone) + DirectionsRenderer (map-attached)
 * const directionsService = new google.maps.DirectionsService();
 * const directionsRenderer = new google.maps.DirectionsRenderer({ map });
 * directionsService.route(
 *   { origin, destination, travelMode: "DRIVING" },
 *   (res, status) => status === "OK" && directionsRenderer.setDirections(res)
 * );
 *
 * -------------------------------
 * 🌦️ MAP LAYERS (attach directly to map)
 * - new google.maps.TrafficLayer().setMap(map);
 * - new google.maps.TransitLayer().setMap(map);
 * - new google.maps.BicyclingLayer().setMap(map);
 *
 * -------------------------------
 * ✅ SUMMARY
 * - “map-attached” → AdvancedMarkerElement, DirectionsRenderer, Layers.
 * - “standalone” → Geocoder, DirectionsService, DistanceMatrixService, ElevationService.
 * - “data-only” → Place, Geometry utilities.
 */

/// <reference types="@types/google.maps" />

import { useEffect, useRef, useState } from "react";
import { usePersistFn } from "@/hooks/usePersistFn";
import { cn } from "@/lib/utils";
import { trpc } from "@/lib/trpc";

declare global {
  interface Window {
    google?: typeof google;
  }
}

const FORGE_API_KEY = import.meta.env.VITE_FRONTEND_FORGE_API_KEY;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const FORGE_BASE_URL =
  import.meta.env.VITE_FRONTEND_FORGE_API_URL ||
  "https://forge.butterfly-effect.dev";
const MAPS_PROXY_URL = `${FORGE_BASE_URL}/v1/maps/proxy`;

function loadMapScript(dbKey?: string | null): Promise<void> {
  // Already loaded — skip
  if (window.google?.maps) return Promise.resolve();

  return new Promise((resolve, reject) => {
    let src: string;
    if (dbKey) {
      // DB-stored key takes highest priority — use Google Maps directly
      src = `https://maps.googleapis.com/maps/api/js?key=${dbKey}&v=weekly&libraries=marker,places,geocoding,geometry,drawing`;
    } else if (FORGE_API_KEY) {
      src = `${MAPS_PROXY_URL}/maps/api/js?key=${FORGE_API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry,drawing`;
    } else if (GOOGLE_API_KEY) {
      src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_API_KEY}&v=weekly&libraries=marker,places,geocoding,geometry,drawing`;
    } else {
      console.error("No Google Maps API key configured. Set one in Settings > Integrations, or set VITE_GOOGLE_MAPS_API_KEY in .env");
      reject(new Error("No Google Maps API key"));
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onload = () => {
      resolve();
      script.remove();
    };
    script.onerror = () => {
      console.error("Failed to load Google Maps script");
      reject(new Error("Failed to load Google Maps script"));
    };
    document.head.appendChild(script);
  });
}

interface MapViewProps {
  className?: string;
  initialCenter?: google.maps.LatLngLiteral;
  initialZoom?: number;
  mapTypeId?: string;
  mapTypeControl?: boolean;
  onMapReady?: (map: google.maps.Map) => void;
}

export function MapView({
  className,
  initialCenter = { lat: 37.7749, lng: -122.4194 },
  initialZoom = 12,
  mapTypeId,
  mapTypeControl = true,
  onMapReady,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const loadFailed = useRef(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch DB-stored Google Maps API key
  const { data: mapConfig, isLoading: isLoadingConfig } = trpc.organization.getMapConfig.useQuery(
    undefined,
    { staleTime: 5 * 60 * 1000 } // Cache for 5 minutes
  );

  const init = usePersistFn(async (dbKey?: string | null) => {
    try {
      await loadMapScript(dbKey);
    } catch {
      loadFailed.current = true;
      setError("Failed to load Google Maps. Please configure an API key in Settings > Integrations.");
      return;
    }
    if (!mapContainer.current) {
      console.error("Map container not found");
      return;
    }
    map.current = new window.google!.maps.Map(mapContainer.current, {
      zoom: initialZoom,
      center: initialCenter,
      mapTypeId: mapTypeId as google.maps.MapTypeId | undefined,
      mapTypeControl,
      fullscreenControl: true,
      zoomControl: true,
      streetViewControl: true,
      mapId: "DEMO_MAP_ID",
    });
    if (onMapReady) {
      onMapReady(map.current);
    }
  });

  useEffect(() => {
    // Wait for config to load before initializing (unless maps already loaded)
    if (window.google?.maps) {
      init();
    } else if (!isLoadingConfig) {
      init(mapConfig?.googleMapsApiKey);
    }
  }, [init, isLoadingConfig, mapConfig?.googleMapsApiKey]);

  if (isLoadingConfig && !window.google?.maps) {
    return (
      <div className={cn("w-full h-[500px] flex items-center justify-center bg-muted/30", className)}>
        <p className="text-muted-foreground text-sm">Loading map configuration...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("w-full h-[500px] flex items-center justify-center bg-muted/30", className)}>
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div ref={mapContainer} className={cn("w-full h-[500px]", className)} />
  );
}
