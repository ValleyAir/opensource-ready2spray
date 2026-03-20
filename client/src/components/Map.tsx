import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapViewProps {
  className?: string;
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
  mapTypeId?: string;
  mapTypeControl?: boolean;
  onMapReady?: (map: L.Map) => void;
}

const TILE_LAYERS = {
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    name: 'Satellite',
    attribution: '&copy; Esri',
  },
  terrain: {
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    name: 'Terrain',
    attribution: '&copy; OpenTopoMap',
  },
  street: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    name: 'Street',
    attribution: '&copy; OpenStreetMap contributors',
  },
};

export const MapView: React.FC<MapViewProps> = ({
  className = '',
  initialCenter = { lat: 40.7128, lng: -74.006 },
  initialZoom = 13,
  mapTypeId = 'satellite',
  mapTypeControl = true,
  onMapReady,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayersRef = useRef<Map<string, L.TileLayer>>(new Map());

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Create the map instance
    const map = L.map(mapContainerRef.current).setView(
      [initialCenter.lat, initialCenter.lng],
      initialZoom
    );

    mapRef.current = map;

    // Add all tile layers
    const satelliteLayer = L.tileLayer(TILE_LAYERS.satellite.url, {
      attribution: TILE_LAYERS.satellite.attribution,
      maxZoom: 19,
    });

    const terrainLayer = L.tileLayer(TILE_LAYERS.terrain.url, {
      attribution: TILE_LAYERS.terrain.attribution,
      maxZoom: 17,
    });

    const streetLayer = L.tileLayer(TILE_LAYERS.street.url, {
      attribution: TILE_LAYERS.street.attribution,
      maxZoom: 19,
    });

    tileLayersRef.current.set('satellite', satelliteLayer);
    tileLayersRef.current.set('terrain', terrainLayer);
    tileLayersRef.current.set('street', streetLayer);

    // Add default layer
    const defaultLayer = tileLayersRef.current.get(mapTypeId) || satelliteLayer;
    defaultLayer.addTo(map);

    // Add layer control if enabled
    if (mapTypeControl) {
      const baseLayers = {
        [TILE_LAYERS.satellite.name]: satelliteLayer,
        [TILE_LAYERS.terrain.name]: terrainLayer,
        [TILE_LAYERS.street.name]: streetLayer,
      };

      L.control.layers(baseLayers, {}).addTo(map);
    }

    // Call the onMapReady callback with the L.Map instance
    if (onMapReady) {
      onMapReady(map);
    }

    // Cleanup on unmount
    return () => {
      map.remove();
      mapRef.current = null;
      tileLayersRef.current.clear();
    };
  }, [initialCenter, initialZoom, mapTypeId, mapTypeControl, onMapReady]);

  return (
    <div
      ref={mapContainerRef}
      className={`map-container ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
