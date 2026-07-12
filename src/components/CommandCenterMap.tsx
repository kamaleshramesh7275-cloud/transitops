import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import type { TripDoc } from '../types';
import { geocodeAddress } from '../utils/geocoding';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapPoint {
  lat: number;
  lon: number;
  name: string;
}

interface MapRoute {
  tripId: string;
  tripNumber: string;
  origin: MapPoint;
  destination: MapPoint;
}

interface CommandCenterMapProps {
  activeTrips: TripDoc[];
  fullHeight?: boolean;
}

export const CommandCenterMap: React.FC<CommandCenterMapProps> = ({ activeTrips, fullHeight = false }) => {
  const [routes, setRoutes] = useState<MapRoute[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadRoutes = async () => {
      if (activeTrips.length === 0) {
        setRoutes([]);
        return;
      }

      setLoading(true);
      const newRoutes: MapRoute[] = [];

      for (const trip of activeTrips) {
        const originCoord = await geocodeAddress(trip.origin);
        const destCoord = await geocodeAddress(trip.destination);

        if (originCoord && destCoord) {
          newRoutes.push({
            tripId: trip.id,
            tripNumber: trip.tripNumber,
            origin: { lat: originCoord.lat, lon: originCoord.lon, name: trip.origin },
            destination: { lat: destCoord.lat, lon: destCoord.lon, name: trip.destination }
          });
        }
      }

      if (isMounted) {
        setRoutes(newRoutes);
        setLoading(false);
      }
    };

    loadRoutes();

    return () => {
      isMounted = false;
    };
  }, [activeTrips]);

  // Center on US by default
  const defaultCenter: [number, number] = [39.8283, -98.5795];

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden glassmorphism border border-[#27272a]">
      {loading && (
        <div className="absolute inset-0 bg-[#121212]/50 backdrop-blur-sm z-[1000] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary"></div>
        </div>
      )}
      
      <MapContainer 
        center={defaultCenter} 
        zoom={4} 
        scrollWheelZoom={false}
        className={`w-full z-10 bg-[#121212] ${fullHeight ? 'h-full' : 'h-[400px]'}`}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {routes.map((route) => (
          <React.Fragment key={route.tripId}>
            {/* Origin Marker */}
            <Marker position={[route.origin.lat, route.origin.lon]}>
              <Tooltip>{route.origin.name} (Origin)</Tooltip>
            </Marker>
            
            {/* Destination Marker */}
            <Marker position={[route.destination.lat, route.destination.lon]}>
              <Tooltip>{route.destination.name} (Destination)</Tooltip>
            </Marker>
            
            {/* Connecting Route */}
            <Polyline 
              positions={[
                [route.origin.lat, route.origin.lon],
                [route.destination.lat, route.destination.lon]
              ]} 
              color="#bef264" // neon lime
              weight={3}
              dashArray="5, 10"
              className="animate-pulse-soft"
            >
              <Tooltip sticky>
                Trip: {route.tripNumber}
              </Tooltip>
            </Polyline>
          </React.Fragment>
        ))}
      </MapContainer>
    </div>
  );
};
