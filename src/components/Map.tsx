'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import CrimeHeatmap from './CrimeHeatmap';
import RouteSearch from './RouteSearch';

// Fix for default marker icons in Leaflet with Next.js
const DefaultIcon = L.icon({
  iconUrl: '/images/marker-icon.png',
  iconRetinaUrl: '/images/marker-icon-2x.png',
  shadowUrl: '/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

function LocationMarker() {
  const map = useMap();
  const [position, setPosition] = useState<L.LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    map.locate({ setView: true, maxZoom: 16 });

    map.on('locationfound', (e) => {
      setPosition(e.latlng);
      setError(null);
    });

    map.on('locationerror', (e) => {
      setError('Unable to get your location. Please enable location services.');
      console.error('Geolocation error:', e.message);
    });
  }, [map]);

  return position === null ? null : (
    <Marker position={position}>
      <Popup>You are here</Popup>
    </Marker>
  );
}

export default function Map() {
  return (
    <div className="h-screen w-full">
      <MapContainer
        center={[40.7128, -74.0060]} // NYC coordinates
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker />
        <CrimeHeatmap />
        <RouteSearch />
      </MapContainer>
    </div>
  );
} 