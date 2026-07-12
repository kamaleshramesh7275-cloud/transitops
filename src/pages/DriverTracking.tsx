import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const MAPTILER_KEY = '4CWye0StCRHPZY8ccbH0';

// Mock drivers to demonstrate the MapTiler integration
const MOCK_DRIVERS = [
  { id: '1', name: 'John Doe', status: 'On Trip', location: [40.7128, -74.0060] as [number, number], vehicle: 'Truck A1', speed: '55 mph' },
  { id: '2', name: 'Jane Smith', status: 'Available', location: [34.0522, -118.2437] as [number, number], vehicle: 'Van B2', speed: '0 mph' },
  { id: '3', name: 'Mike Johnson', status: 'Off Duty', location: [41.8781, -87.6298] as [number, number], vehicle: 'Truck C3', speed: '0 mph' },
  { id: '4', name: 'Sarah Williams', status: 'On Trip', location: [29.7604, -95.3698] as [number, number], vehicle: 'Van D4', speed: '45 mph' },
  { id: '5', name: 'Robert Chen', status: 'On Trip', location: [39.7392, -104.9903] as [number, number], vehicle: 'Truck E5', speed: '62 mph' },
];

export const DriverTracking: React.FC = () => {
  const [drivers] = useState(MOCK_DRIVERS);

  // Center roughly on US
  const defaultCenter: [number, number] = [39.8283, -98.5795];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <MapPin className="text-emerald-500" />
            Live Driver Tracking
          </h1>
          <p className="text-slate-400 text-sm mt-1">Real-time driver locations powered by MapTiler</p>
        </div>
      </div>

      <div className="w-full h-[70vh] rounded-xl overflow-hidden glassmorphism border border-slate-800/80 relative">
        <MapContainer 
          center={defaultCenter} 
          zoom={4} 
          scrollWheelZoom={true}
          className="w-full h-full z-10 bg-slate-900"
        >
          {/* MapTiler TileLayer using the provided API key */}
          <TileLayer
            attribution='&copy; <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
            url={`https://api.maptiler.com/maps/streets-v2/256/{z}/{x}/{y}.png?key=${MAPTILER_KEY}`}
          />
          
          {drivers.map((driver) => (
            <Marker key={driver.id} position={driver.location}>
              <Popup>
                <div className="p-1 min-w-[150px]">
                  <h3 className="font-bold text-slate-800 text-lg mb-2">{driver.name}</h3>
                  <div className="flex flex-col gap-1.5 text-sm text-slate-600">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className={`w-2.5 h-2.5 rounded-full ${driver.status === 'On Trip' ? 'bg-emerald-500' : driver.status === 'Available' ? 'bg-blue-500' : 'bg-slate-400'}`}></span>
                      {driver.status}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin size={14} className="text-slate-400" />
                      {driver.vehicle}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Navigation size={14} className="text-slate-400" />
                      {driver.speed}
                    </span>
                  </div>
                </div>
              </Popup>
              <Tooltip>{driver.name} - {driver.status}</Tooltip>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};
