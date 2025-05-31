'use client';

import { useState, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { MapPin, Navigation, Clock, Route, History, Trash2, X, ArrowRight } from 'lucide-react';

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
  html: `
    <div style="
      background: linear-gradient(135deg, #22c55e, #16a34a);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(34, 197, 94, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background-color: white;
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const endIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `
    <div style="
      background: linear-gradient(135deg, #ef4444, #dc2626);
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 8px;
        height: 8px;
        background-color: white;
        border-radius: 50%;
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
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
  const [isMinimized, setIsMinimized] = useState(false);
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

    // Check for duplicates (same start, end, transport mode, and route type)
    const isDuplicate = savedRoutes.some(route => 
      route.startLocation === newRoute.startLocation &&
      route.endLocation === newRoute.endLocation &&
      route.transportMode === newRoute.transportMode &&
      route.routeType === newRoute.routeType
    );

    if (!isDuplicate) {
      const updatedRoutes = [newRoute, ...savedRoutes].slice(0, 10);
      setSavedRoutes(updatedRoutes);
      localStorage.setItem('savedRoutes', JSON.stringify(updatedRoutes));
    }
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
          {}
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
            addressdetails: 1,
            countrycodes: 'us', // Focus on US locations
            viewbox: '-74.5,40.4,-73.5,41.0', // NYC bounding box
            bounded: 1
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
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }
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

  // Handle input blur with delay to allow for suggestion clicks
  const handleInputBlur = (isStart: boolean) => {
    setTimeout(() => {
      if (isStart) {
        setStartSuggestions([]);
      } else {
        setEndSuggestions([]);
      }
    }, 200);
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
        ? (routeType === 'safest' ? '#10b981' : '#3b82f6')
        : transportMode === 'cycling'
        ? (routeType === 'safest' ? '#f59e0b' : '#f97316')
        : (routeType === 'safest' ? '#8b5cf6' : '#6366f1');

      currentRouteRef.current = L.polyline(chosen.coords, {
        color,
        weight: 6,
        opacity: 0.8,
        dashArray: routeType === 'safest' ? '10,5' : undefined,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      map.fitBounds(currentRouteRef.current.getBounds(), { padding: [20, 20] });

      // Save the route after successful calculation
      saveRoute();

    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to calculate route.');
    } finally {
      setIsCalculating(false);
    }
  };

  const getTransportIcon = (mode: TransportMode) => {
    switch (mode) {
      case 'walking': return '🚶‍♂️';
      case 'cycling': return '🚴‍♂️';
      case 'driving': return '🚗';
    }
  };

  const getRouteTypeColor = (type: 'fastest' | 'safest') => {
    return type === 'fastest' ? 'from-blue-500 to-cyan-500' : 'from-green-500 to-emerald-500';
  };

  return (
    <div className={`absolute top-6 left-1/2 transform -translate-x-1/2 z-[1000] w-[95%] sm:w-[90%] md:max-w-lg transition-all duration-300 ${isMinimized ? '' : ''}`}>
      {/* Main Panel */}
      <div className={`bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 ${isMinimized ? 'p-2' : 'p-4 sm:p-6'}`}>
        {/* Always visible header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-1.5 sm:p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl">
              <Navigation className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Route Planner</h2>
          </div>
          <div className="flex items-center gap-2">
            {!isMinimized && (
              <button
                onClick={() => setShowSavedRoutes(!showSavedRoutes)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200 text-gray-700 text-xs sm:text-sm font-medium"
              >
                <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                History
              </button>
            )}
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="flex items-center justify-center w-7 h-7 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200 text-gray-700"
            >
              {isMinimized ? <ArrowRight className="w-4 h-4 rotate-90" /> : <ArrowRight className="w-4 h-4 -rotate-90" />}
            </button>
          </div>
        </div>

        {/* Minimized view */}
        {isMinimized && (
          <div className="mt-3 flex items-center gap-2">
            <select
              value={transportMode}
              onChange={(e) => setTransportMode(e.target.value as TransportMode)}
              className="flex-1 p-2 text-sm border border-gray-200 rounded-xl text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="walking">🚶‍♂️ Walking</option>
              <option value="cycling">🚴‍♂️ Cycling</option>
              <option value="driving">🚗 Driving</option>
            </select>
            <select
              value={routeType}
              onChange={(e) => setRouteType(e.target.value as 'fastest' | 'safest')}
              className="flex-1 p-2 text-sm border border-gray-200 rounded-xl text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
            >
              <option value="fastest">⚡ Fastest</option>
              <option value="safest">🛡️ Safest</option>
            </select>
            <button
              onClick={calculateRoute}
              disabled={!startLocation || !endLocation || isCalculating}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-2"
            >
              {isCalculating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <Navigation className="w-4 h-4" />
              )}
            </button>
          </div>
        )}

        {/* Full view */}
        <div className={`space-y-4 sm:space-y-6 ${isMinimized ? 'hidden' : 'mt-4'}`}>
          {/* Transport Mode & Route Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Transport</label>
              <select
                value={transportMode}
                onChange={(e) => setTransportMode(e.target.value as TransportMode)}
                className="w-full p-2 sm:p-3 text-sm border border-gray-200 rounded-xl text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="walking">🚶‍♂️ Walking</option>
                <option value="cycling">🚴‍♂️ Cycling</option>
                <option value="driving">🚗 Driving</option>
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">Priority</label>
              <select
                value={routeType}
                onChange={(e) => setRouteType(e.target.value as 'fastest' | 'safest')}
                className="w-full p-2 sm:p-3 text-sm border border-gray-200 rounded-xl text-gray-700 bg-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                <option value="fastest">⚡ Fastest</option>
                <option value="safest">🛡️ Safest</option>
              </select>
            </div>
          </div>

          {/* Location Inputs */}
          <div className="space-y-3 sm:space-y-4">
            {/* Quick Select Locations */}
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  setStartLocation("East 86th Street & Lexington Avenue at Southeast Corner, Lexington Avenue, Carnegie Hill, Manhattan Community Board 8, Manhattan, New York County, New York, 10035, United States");
                  setEndLocation("116th Street, West 116th Street, Manhattan Community Board 10, Manhattan, New York County, New York, 10026, United States");
                }}
                className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200 text-gray-700 font-medium flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Test Route: 86th to 116th
              </button>
              <button
                onClick={() => {
                  setStartLocation("Yankee Stadium, 1, East 161st Street, The Bronx, Bronx County, New York, 10451, United States");
                  setEndLocation("Lincoln Hospital, 234, East 149th Street, The Bronx, Bronx County, New York, 10451, United States");
                }}
                className="w-full px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors duration-200 text-gray-700 font-medium flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Test Route: Yankee Stadium to Lincoln Hospital
              </button>
            </div>

            {/* Start Location */}
            <div className="relative">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">From</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-green-500 rounded-full"></div>
                </div>
                <input
                  type="text"
                  value={startLocation}
                  onChange={(e) => {
                    setStartLocation(e.target.value);
                    debouncedSearch(e.target.value, setStartSuggestions);
                  }}
                  onBlur={() => handleInputBlur(true)}
                  placeholder="Enter starting location"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                />
              </div>
              {startSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 sm:mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-40 sm:max-h-48 overflow-y-auto">
                  {startSuggestions.map((location, index) => (
                    <div
                      key={index}
                      className="p-2 sm:p-3 text-sm hover:bg-blue-50 cursor-pointer text-gray-700 border-b border-gray-50 last:border-b-0 flex items-center gap-2 sm:gap-3 group"
                      onClick={() => handleLocationSelect(location, true)}
                      onMouseDown={(e) => e.preventDefault()} // Prevent blur
                    >
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0 transition-colors duration-200" />
                      <span className="truncate group-hover:text-blue-600 transition-colors duration-200">{location.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* End Location */}
            <div className="relative">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">To</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                </div>
                <input
                  type="text"
                  value={endLocation}
                  onChange={(e) => {
                    setEndLocation(e.target.value);
                    debouncedSearch(e.target.value, setEndSuggestions);
                  }}
                  onBlur={() => handleInputBlur(false)}
                  placeholder="Enter destination"
                  className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-sm border border-gray-200 rounded-xl text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-all duration-200"
                />
              </div>
              {endSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 sm:mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-40 sm:max-h-48 overflow-y-auto">
                  {endSuggestions.map((location, index) => (
                    <div
                      key={index}
                      className="p-2 sm:p-3 text-sm hover:bg-blue-50 cursor-pointer text-gray-700 border-b border-gray-50 last:border-b-0 flex items-center gap-2 sm:gap-3 group"
                      onClick={() => handleLocationSelect(location, false)}
                      onMouseDown={(e) => e.preventDefault()} // Prevent blur
                    >
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0 transition-colors duration-200" />
                      <span className="truncate group-hover:text-blue-600 transition-colors duration-200">{location.display_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Route Info */}
          {routeInfo && (
            <div className={`bg-gradient-to-r ${getRouteTypeColor(routeType)} p-3 sm:p-4 rounded-xl text-white`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-xl sm:text-2xl">{getTransportIcon(transportMode)}</div>
                  <div>
                    <p className="text-white/80 text-xs sm:text-sm font-medium">
                      {routeType === 'fastest' ? 'Fastest Route' : 'Safest Route'}
                    </p>
                    <div className="flex items-center gap-3 sm:gap-4 mt-0.5 sm:mt-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="text-sm sm:font-semibold">{formatDuration(routeInfo.duration)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Route className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        <span className="text-sm sm:font-semibold">{formatDistance(routeInfo.distance)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Find Route Button */}
          <button
            onClick={calculateRoute}
            disabled={!startLocation || !endLocation || isCalculating}
            className="w-full py-3 sm:py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:transform-none flex items-center justify-center gap-2 sm:gap-3"
          >
            {isCalculating ? (
              <>
                <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Calculating Route...</span>
              </>
            ) : (
              <>
                <Navigation className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>Find Best Route</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Saved Routes Panel */}
      {showSavedRoutes && savedRoutes.length > 0 && (
        <div className="mt-4 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 max-h-[80vh] flex flex-col">
          <div className="p-3 sm:p-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <h3 className="font-semibold text-sm sm:text-base text-gray-800 flex items-center gap-2">
              <History className="w-4 h-4 sm:w-5 sm:h-5" />
              Recent Routes
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const container = document.querySelector('.saved-routes-container');
                  if (container) {
                    container.scrollBy({ top: -100, behavior: 'smooth' });
                  }
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowRight className="w-4 h-4 text-gray-500 -rotate-90" />
              </button>
              <button
                onClick={() => {
                  const container = document.querySelector('.saved-routes-container');
                  if (container) {
                    container.scrollBy({ top: 100, behavior: 'smooth' });
                  }
                }}
                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <ArrowRight className="w-4 h-4 text-gray-500 rotate-90" />
              </button>
              <button
                onClick={() => setShowSavedRoutes(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-500" />
              </button>
            </div>
          </div>
          <div className="overflow-y-auto flex-1 saved-routes-container" onWheel={(e) => e.stopPropagation()}>
            {savedRoutes.map((route) => (
              <div
                key={route.timestamp}
                className="p-3 sm:p-4 border-b border-gray-50 last:border-b-0 hover:bg-gray-50 transition-colors duration-200"
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex-1 cursor-pointer space-y-1"
                    onClick={() => loadRoute(route)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base sm:text-lg">{getTransportIcon(route.transportMode)}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium text-white bg-gradient-to-r ${getRouteTypeColor(route.routeType)}`}>
                        {route.routeType}
                      </span>
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-800 font-medium truncate">{route.startLocation}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <ArrowRight className="w-3 h-3 text-gray-400 ml-0.5 flex-shrink-0" />
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                        <span className="text-gray-800 font-medium truncate">{route.endLocation}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(route.timestamp).toLocaleDateString()} at {new Date(route.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <button
                    onClick={() => deleteRoute(route.timestamp)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200 flex-shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 