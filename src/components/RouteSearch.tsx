'use client';

import { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';

interface Location {
  display_name: string;
  lat: string;
  lon: string;
}

interface CrimeData {
  latitude: string;
  longitude: string;
  ofns_desc: string;
}

interface RouteInfo {
  duration: number;
  distance: number;
}

type TransportMode = 'walking' | 'cycling' | 'driving';

interface ScoredRoute {
  coords: [number, number][];
  duration: number;
  distance: number;
  score: number;
}

interface SavedRoute {
  startLocation: string;
  endLocation: string;
  transportMode: TransportMode;
  routeType: 'fastest' | 'safest';
  timestamp: number;
}

// Custom marker icons
const startIcon = L.divIcon({
  className: 'custom-div-icon',
  html: '<div style="background-color: white; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #2196F3;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

const endIcon = L.divIcon({
  className: 'custom-div-icon',
  html: '<div style="background-color: #FF4444; width: 12px; height: 12px; border-radius: 50%; border: 2px solid #CC0000;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6]
});

export default function RouteSearch() {
  const map = useMap();
  const [startLocation, setStartLocation] = useState('');
  const [endLocation, setEndLocation] = useState('');
  const [startSuggestions, setStartSuggestions] = useState<Location[]>([]);
  const [endSuggestions, setEndSuggestions] = useState<Location[]>([]);
  const [routeType, setRouteType] = useState<'fastest' | 'safest'>('fastest');
  const [transportMode, setTransportMode] = useState<TransportMode>('walking');
  const [isCalculating, setIsCalculating] = useState(false);
  const [crimeData, setCrimeData] = useState<CrimeData[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteInfo | null>(null);
  const [savedRoutes, setSavedRoutes] = useState<SavedRoute[]>([]);
  const [showSavedRoutes, setShowSavedRoutes] = useState(false);
  const currentRouteRef = useRef<L.Polyline | null>(null);
  const startMarkerRef = useRef<L.Marker | null>(null);
  const endMarkerRef = useRef<L.Marker | null>(null);

  // Load saved routes from localStorage on component mount
  useEffect(() => {
    const saved = localStorage.getItem('savedRoutes');
    if (saved) {
      setSavedRoutes(JSON.parse(saved));
    }
  }, []);

  // Save route to localStorage
  const saveRoute = () => {
    if (!startLocation || !endLocation) return;

    const newRoute: SavedRoute = {
      startLocation,
      endLocation,
      transportMode,
      routeType,
      timestamp: Date.now()
    };

    const updatedRoutes = [newRoute, ...savedRoutes].slice(0, 10); // Keep only last 10 routes
    setSavedRoutes(updatedRoutes);
    localStorage.setItem('savedRoutes', JSON.stringify(updatedRoutes));
  };

  // Load a saved route
  const loadRoute = (route: SavedRoute) => {
    setStartLocation(route.startLocation);
    setEndLocation(route.endLocation);
    setTransportMode(route.transportMode);
    setRouteType(route.routeType);
    setShowSavedRoutes(false);
  };

  // Delete a saved route
  const deleteRoute = (timestamp: number) => {
    const updatedRoutes = savedRoutes.filter(route => route.timestamp !== timestamp);
    setSavedRoutes(updatedRoutes);
    localStorage.setItem('savedRoutes', JSON.stringify(updatedRoutes));
  };

  // Clear route and markers when route type changes
  useEffect(() => {
    clearCurrentRoute();
  }, [routeType]);

  // Function to clear current route and markers
  const clearCurrentRoute = () => {
    if (currentRouteRef.current) {
      map.removeLayer(currentRouteRef.current);
      currentRouteRef.current = null;
    }
    if (startMarkerRef.current) {
      map.removeLayer(startMarkerRef.current);
      startMarkerRef.current = null;
    }
    if (endMarkerRef.current) {
      map.removeLayer(endMarkerRef.current);
      endMarkerRef.current = null;
    }
  };

  // Fetch crime data
  useEffect(() => {
    const fetchCrimeData = async () => {
      try {
        const response = await axios.get(
          'https://data.cityofnewyork.us/resource/qgea-i56i.json',
          {
            params: {
              $limit: 2000,
              $where: "latitude IS NOT NULL AND longitude IS NOT NULL",
              $select: "latitude,longitude,ofns_desc"
            }
          }
        );
        setCrimeData(response.data);
      } catch (error) {
        console.error('Error fetching crime data:', error);
      }
    };
    fetchCrimeData();
  }, []);

  // Debounce function for search
  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Search locations using OpenStreetMap Nominatim API
  const searchLocations = async (query: string) => {
    if (!query) return [];
    try {
      const response = await axios.get(
        `https://nominatim.openstreetmap.org/search`,
        {
          params: {
            q: query,
            format: 'json',
            limit: 5,
            addressdetails: 1
          },
          headers: {
            'Accept-Language': 'en'
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Error searching locations:', error);
      return [];
    }
  };

  const debouncedSearch = debounce(async (query: string, setSuggestions: (locations: Location[]) => void) => {
    const results = await searchLocations(query);
    setSuggestions(results);
  }, 300);

  // Handle location selection
  const handleLocationSelect = (location: Location, isStart: boolean) => {
    if (isStart) {
      setStartLocation(location.display_name);
      setStartSuggestions([]);
      map.setView([parseFloat(location.lat), parseFloat(location.lon)], 15);
    } else {
      setEndLocation(location.display_name);
      setEndSuggestions([]);
    }
  };

  // Calculate crime density for a point
  const calculateCrimeDensity = (lat: number, lon: number, radius: number = 0.003) => {
    return crimeData.reduce((sum, crime) => {
      const dLat = parseFloat(crime.latitude) - lat;
      const dLon = parseFloat(crime.longitude) - lon;
      const distance = Math.sqrt(dLat*dLat + dLon*dLon);
      if (distance > radius) return sum;
      const desc = crime.ofns_desc.toLowerCase();
      const weight = desc.includes('assault') || desc.includes('robbery') ? 8
                   : desc.includes('burglary') || desc.includes('theft')  ? 5
                   : 1;
      return sum + weight;
    }, 0);
  };

  // Format duration in minutes and seconds
  const formatDuration = (seconds: number) => {
    const walkingSpeedMph = 2.6;
    const distanceInMiles = seconds / 3600 * walkingSpeedMph;
    const minutes = Math.floor(distanceInMiles * 60 / walkingSpeedMph);
    const remainingSeconds = Math.round((distanceInMiles * 60 / walkingSpeedMph - minutes) * 60);
    return `${minutes} min ${remainingSeconds} sec`;
  };

  // Format distance in miles
  const formatDistance = (meters: number) => {
    const miles = meters * 0.000621371;
    return `${miles.toFixed(1)} mi`;
  };

  // Get routing API endpoint based on transport mode
  const getRoutingEndpoint = (mode: TransportMode) => {
    switch (mode) {
      case 'walking': return 'https://routing.openstreetmap.de/routed-foot/route/v1/foot';
      case 'cycling': return 'https://routing.openstreetmap.de/routed-bike/route/v1/bike';
      case 'driving': return 'https://routing.openstreetmap.de/routed-car/route/v1/driving';
    }
  };

  // Calculate route
  const calculateRoute = async () => {
    if (!startLocation || !endLocation || isCalculating) return;
    setIsCalculating(true);
    clearCurrentRoute();
    setRouteInfo(null);

    try {
      // 1. Geocode start/end
      const [startResp, endResp] = await Promise.all([
        axios.get('https://nominatim.openstreetmap.org/search', { params: { q: startLocation, format: 'json', limit: 1 }}),
        axios.get('https://nominatim.openstreetmap.org/search', { params: { q: endLocation, format: 'json', limit: 1 }})
      ]);
      if (!startResp.data.length || !endResp.data.length) throw new Error('Could not find one of the locations.');

      const start = startResp.data[0], end = endResp.data[0];
      startMarkerRef.current = L.marker([+start.lat, +start.lon], { icon: startIcon }).addTo(map);
      endMarkerRef.current = L.marker([+end.lat, +end.lon], { icon: endIcon }).addTo(map);

      // 2. Fetch routes from the correct profile
      const routeUrl = `${getRoutingEndpoint(transportMode)}/${start.lon},${start.lat};${end.lon},${end.lat}`;
      const resp = await axios.get(routeUrl, {
        params: {
          overview: 'full',
          geometries: 'geojson',
          alternatives: routeType === 'safest' ? 'true' : 'false',
          steps: 'true',
          annotations: 'true',
          continue_straight: routeType === 'fastest'
        }
      });
      const routes = resp.data.routes;
      if (!routes || !routes.length) throw new Error('No routes returned.');

      let chosen: any;

      if (routeType === 'safest' && routes.length > 1) {
        // Score each route by crime + distance
        const scored = routes.map((r: any) => {
          const coords = r.geometry.coordinates.map(([lon,lat]: [number,number]) => [lat,lon]);
          // Crime score with sampling
          const crimeScore = coords.reduce((tot: number, [lat,lon]: [number,number], i: number) => {
            if (i % 2 === 0) {
              const dens = calculateCrimeDensity(lat, lon);
              return tot + (dens>0 ? Math.pow(dens, 2.5) : 0);
            }
            return tot;
          }, 0);
          // Max and average density
          const maxD = Math.max(...coords.map(([lat,lon]: [number,number]) => calculateCrimeDensity(lat,lon)));
          const avgD = crimeScore / coords.length;
          const distP = r.distance * 0.0001; // small distance penalty
          return {
            coords,
            duration: r.duration,
            distance: r.distance,
            score: crimeScore + maxD*15 + avgD*8 + distP
          };
        });
        chosen = scored.reduce((a: ScoredRoute, b: ScoredRoute) => b.score < a.score ? b : a);
      } else {
        // Fastest = shortest distance
        const shortest = routes.reduce((a: any, b: any) => b.distance < a.distance ? b : a);
        chosen = {
          coords: shortest.geometry.coordinates.map(([lon,lat]: [number,number]) => [lat,lon]),
          duration: shortest.duration,
          distance: shortest.distance
        };
      }

      // 3. Draw it
      setRouteInfo({ duration: chosen.duration, distance: chosen.distance });
      const color = transportMode === 'walking'
        ? (routeType === 'safest' ? '#4CAF50' : '#2196F3')
        : transportMode === 'cycling'
        ? (routeType === 'safest' ? '#FF9800' : '#FF5722')
        : (routeType === 'safest' ? '#9C27B0' : '#673AB7');

      currentRouteRef.current = L.polyline(chosen.coords, {
        color,
        weight: routeType === 'safest' ? 5 : 4,
        opacity: routeType === 'safest' ? 0.8 : 0.7,
        dashArray: routeType === 'safest' ? '5,10' : undefined
      }).addTo(map);

      map.fitBounds(currentRouteRef.current.getBounds());

      // Save the route after successful calculation
      saveRoute();

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to calculate route.');
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-md p-4 rounded-xl shadow-xl w-[90%] max-w-sm border border-gray-100">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-800">Route Planning</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSavedRoutes(!showSavedRoutes)}
              className="p-1.5 text-sm border rounded-lg text-gray-700 bg-white shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {showSavedRoutes ? 'Hide History' : 'Show History'}
            </button>
            <select
              value={transportMode}
              onChange={(e) => setTransportMode(e.target.value as TransportMode)}
              className="p-1.5 text-sm border rounded-lg text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="walking">🚶 Walking</option>
              <option value="cycling">🚲 Cycling</option>
              <option value="driving">🚗 Driving</option>
            </select>
            <select
              value={routeType}
              onChange={(e) => setRouteType(e.target.value as 'fastest' | 'safest')}
              className="p-1.5 text-sm border rounded-lg text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="fastest">Fastest</option>
              <option value="safest">Safest</option>
            </select>
          </div>
        </div>

        {/* Saved Routes Dropdown */}
        {showSavedRoutes && savedRoutes.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg border border-gray-100 max-h-48 overflow-y-auto">
            {savedRoutes.map((route) => (
              <div
                key={route.timestamp}
                className="p-2 text-sm border-b border-gray-100 last:border-b-0 hover:bg-gray-50"
              >
                <div className="flex justify-between items-center">
                  <div className="flex-1 cursor-pointer" onClick={() => loadRoute(route)}>
                    <div className="font-medium text-gray-800">{route.startLocation}</div>
                    <div className="text-gray-600">→ {route.endLocation}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(route.timestamp).toLocaleString()} • {route.transportMode} • {route.routeType}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteRoute(route.timestamp)}
                    className="p-1 text-gray-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Start Location */}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={startLocation}
              onChange={(e) => {
                setStartLocation(e.target.value);
                debouncedSearch(e.target.value, setStartSuggestions);
              }}
              placeholder="Start location"
              className="w-full p-2 text-sm border rounded-lg text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
            {startSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 max-h-48 overflow-y-auto">
                {startSuggestions.map((location, index) => (
                  <div
                    key={index}
                    className="p-2 text-sm hover:bg-blue-50 cursor-pointer text-gray-700 border-b border-gray-100 last:border-b-0"
                    onClick={() => handleLocationSelect(location, true)}
                  >
                    {location.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* End Location */}
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={endLocation}
              onChange={(e) => {
                setEndLocation(e.target.value);
                debouncedSearch(e.target.value, setEndSuggestions);
              }}
              placeholder="End location"
              className="w-full p-2 text-sm border rounded-lg text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
            />
            {endSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-100 max-h-48 overflow-y-auto">
                {endSuggestions.map((location, index) => (
                  <div
                    key={index}
                    className="p-2 text-sm hover:bg-blue-50 cursor-pointer text-gray-700 border-b border-gray-100 last:border-b-0"
                    onClick={() => handleLocationSelect(location, false)}
                  >
                    {location.display_name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Route Info */}
        {routeInfo && (
          <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
            <div className="flex justify-between items-center text-sm">
              <div>
                <p className="text-gray-600">Time</p>
                <p className="font-semibold text-gray-800">{formatDuration(routeInfo.duration)}</p>
              </div>
              <div>
                <p className="text-gray-600">Distance</p>
                <p className="font-semibold text-gray-800">{formatDistance(routeInfo.distance)}</p>
              </div>
            </div>
          </div>
        )}

        {/* Find Route Button */}
        <button
          onClick={calculateRoute}
          disabled={!startLocation || !endLocation || isCalculating}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
        >
          {isCalculating ? (
            <>
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Calculating...</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span>Find Route</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
} 