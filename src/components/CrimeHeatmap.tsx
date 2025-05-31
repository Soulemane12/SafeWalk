'use client';

import { useEffect, useState } from 'react';
import { useMap } from 'react-leaflet';
import axios from 'axios';
import L from 'leaflet';
import 'leaflet.heat';

interface CrimeData {
  latitude: string;
  longitude: string;
  ofns_desc: string;
  cmplnt_fr_dt: string;
  boro_nm: string;
}

export default function CrimeHeatmap() {
  const map = useMap();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crimeCount, setCrimeCount] = useState(0);

  // Function to calculate radius based on zoom level
  const getRadius = (zoom: number) => {
    // Scale radius with zoom to maintain physical size on map
    return 2 * Math.pow(2, zoom - 12);
  };

  useEffect(() => {
    const fetchCrimeData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await axios.get(
          'https://data.cityofnewyork.us/resource/qgea-i56i.json',
          {
            params: {
              $where: "latitude IS NOT NULL AND longitude IS NOT NULL",
              $select: "latitude,longitude,ofns_desc,cmplnt_fr_dt,boro_nm"
            }
          }
        );

        const crimeData: CrimeData[] = response.data;
        setCrimeCount(crimeData.length);
        
        const heatPoints = crimeData.map(crime => {
          let intensity = 0.6;
          const crimeType = crime.ofns_desc.toLowerCase();
          
          if (crimeType.includes('assault') || crimeType.includes('robbery')) {
            intensity = 1.0;
          } else if (crimeType.includes('burglary') || crimeType.includes('theft')) {
            intensity = 0.8;
          }
          
          return [
            parseFloat(crime.latitude),
            parseFloat(crime.longitude),
            intensity
          ] as [number, number, number];
        });

        // Create initial heatmap layer
        const initialHeatLayer = (L as any).heatLayer(heatPoints, {
          radius: getRadius(map.getZoom()),
          blur: 2,
          maxZoom: 18,
          max: 1.0,
          gradient: {
            0.2: 'rgba(44, 123, 182, 0.3)',
            0.4: 'rgba(0, 166, 202, 0.4)',
            0.6: 'rgba(127, 188, 65, 0.5)',
            0.8: 'rgba(244, 165, 130, 0.6)',
            1.0: 'rgba(215, 25, 28, 0.7)'
          },
          minOpacity: 0.2,
          pane: 'overlayPane' // Ensure heatmap is always on top of base map
        }).addTo(map);

        // Update heatmap on zoom
        const updateHeatmap = () => {
          if (initialHeatLayer) {
            initialHeatLayer.setOptions({
              radius: getRadius(map.getZoom()),
              blur: 2
            });
            initialHeatLayer.redraw(); // Force redraw to ensure visibility
          }
        };

        map.on('zoomend', updateHeatmap);
        map.on('moveend', updateHeatmap); // Update on pan as well

        return () => {
          map.off('zoomend', updateHeatmap);
          map.off('moveend', updateHeatmap);
          if (initialHeatLayer) {
            map.removeLayer(initialHeatLayer);
          }
        };
      } catch (err) {
        console.error('Error fetching crime data:', err);
        setError('Failed to load crime data. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCrimeData();
  }, [map]);

  return (
    <>
      {isLoading && (
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
          <p className="text-sm">Loading crime data...</p>
        </div>
      )}
      {error && (
        <div className="absolute top-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
        <h3 className="text-sm font-semibold mb-2">Crime Density</h3>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-[rgba(44,123,182,0.3)] rounded"></div>
          <span className="text-xs">Low</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-[rgba(0,166,202,0.4)] rounded"></div>
          <span className="text-xs">Medium-Low</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-[rgba(127,188,65,0.5)] rounded"></div>
          <span className="text-xs">Medium</span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <div className="w-4 h-4 bg-[rgba(244,165,130,0.6)] rounded"></div>
          <span className="text-xs">Medium-High</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[rgba(215,25,28,0.7)] rounded"></div>
          <span className="text-xs">High</span>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-200">
          <p className="text-xs text-gray-600">Showing {crimeCount} recent incidents</p>
        </div>
      </div>
    </>
  );
} 