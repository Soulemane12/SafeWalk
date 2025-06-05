'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
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

interface MapProps {
  onRouteUpdate?: (routeData: any) => void;
}

const Map: React.FC<MapProps> = ({ onRouteUpdate }) => {
  const [routeData, setRouteData] = useState<any>(null);
  const initialRouteSet = useRef(false);

  useEffect(() => {
    if (initialRouteSet.current) return;
    
    // Example route data - replace with your actual route data
    const exampleRoute = {
      start: {
        lat: 40.7128,
        lng: -74.0060,
        address: "Starting Point"
      },
      end: {
        lat: 40.7589,
        lng: -73.9851,
        address: "Ending Point"
      },
      distance: "2.0 mi",
      duration: "42 min 16 sec",
      path: [
        [40.7128, -74.0060],
        [40.7589, -73.9851]
      ],
      safetyScore: 75,
      highRiskAreas: [
        {
          lat: 40.7300,
          lng: -73.9900,
          risk: "medium",
          description: "Area with moderate crime rate"
        }
      ],
      wellLitAreas: [
        {
          lat: 40.7200,
          lng: -73.9950,
          description: "Well-lit commercial area"
        }
      ]
    };

    setRouteData(exampleRoute);
    if (onRouteUpdate) {
      onRouteUpdate(exampleRoute);
    }
    initialRouteSet.current = true;
  }, []); // Empty dependency array since we only want to set initial route once

  const handleRouteUpdate = (newRouteData: any) => {
    setRouteData(newRouteData);
    if (onRouteUpdate) {
      onRouteUpdate(newRouteData);
    }
  };

  return (
    <div className="h-screen w-full">
      <MapContainer
        center={[40.7128, -74.0060]} // NYC coordinates
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        <LocationMarker />
        <CrimeHeatmap />
        <RouteSearch onRouteUpdate={handleRouteUpdate} />
      </MapContainer>
    </div>
  );
};

export default Map; 