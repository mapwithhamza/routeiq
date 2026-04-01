import { useState, useEffect, useMemo } from 'react';
import Map, { Marker, Popup, Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type { Delivery, Rider, Waypoint } from '../../types';

interface MainMapProps {
  deliveries: Delivery[];
  rider: Rider | null;
  routeWaypoints: Waypoint[];
  isAddMode: boolean;
  onMapClick: (lat: number, lon: number) => void;
  isBlockedRoadMode?: boolean;
  osrmCoordinates?: [number, number][];
  showHeatmap?: boolean;
  simulationPosition?: [number, number] | null;
}

export default function MainMap({
  deliveries,
  rider,
  routeWaypoints,
  isAddMode,
  onMapClick,
  isBlockedRoadMode,
  osrmCoordinates,
  showHeatmap = false,
  simulationPosition = null,
}: MainMapProps) {
  const [popupInfo, setPopupInfo] = useState<Delivery | null>(null);
  const [dashOffset, setDashOffset] = useState(0);

  // Animate the route line
  useEffect(() => {
    if (routeWaypoints.length < 2) return;
    let animationId: number;
    let offset = 0;
    const animate = () => {
      offset = (offset + 1) % 4; // Animate step
      setDashOffset(offset);
      // use setTimeout to slow down the requestAnimationFrame line dash effect
      setTimeout(() => {
        animationId = requestAnimationFrame(animate);
      }, 50);
    };
    animate();
    return () => cancelAnimationFrame(animationId);
  }, [routeWaypoints.length]);

  const heatmapGeoJSON = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: deliveries.map(d => ({
      type: 'Feature' as const,
      properties: {
        weight: d.priority === 'urgent' ? 1 : d.priority === 'high' ? 0.8 : d.priority === 'normal' ? 0.6 : 0.4,
      },
      geometry: { type: 'Point' as const, coordinates: [d.lon, d.lat] },
    })),
  }), [deliveries]);

  const geojsonRoute = useMemo(() => {
    if (routeWaypoints.length < 2) return null;
    return {
      type: 'Feature' as const,
      properties: {},
      geometry: {
        type: 'LineString' as const,
        coordinates: osrmCoordinates && osrmCoordinates.length > 0 
          ? osrmCoordinates 
          : routeWaypoints.map(w => [w.lon, w.lat]),
      },
    };
  }, [routeWaypoints, osrmCoordinates]);

  const getPriorityColor = (prio: string) => {
    switch (prio) {
      case 'high':
      case 'urgent': return 'bg-red-500';
      case 'normal': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStopSequence = (d: Delivery) => {
    // If routing is active, find index
    const idx = routeWaypoints.findIndex(w => Math.abs(w.lat - d.lat) < 0.0001 && Math.abs(w.lon - d.lon) < 0.0001);
    // Since Rider is usually the 0th stop, delivery sequences might be idx + 1 minus rider
    return idx > 0 ? idx : null;
  };

  return (
    <div className="w-full h-full relative group">
      <Map
        initialViewState={{
          longitude: 73.0479,
          latitude: 33.6844,
          zoom: 11
        }}
        mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json"
        cursor={isAddMode ? 'crosshair' : (isBlockedRoadMode ? 'not-allowed' : 'grab')}
        onClick={(e) => {
          if (isAddMode || isBlockedRoadMode) {
            onMapClick(e.lngLat.lat, e.lngLat.lng);
          }
        }}
        interactiveLayerIds={geojsonRoute ? ['route-line-base'] : []}
      >
        <NavigationControl position="bottom-right" />

        {/* Delivery Heatmap Layer */}
        {showHeatmap && heatmapGeoJSON.features.length > 0 && (
          <Source id="heatmap-source" type="geojson" data={heatmapGeoJSON}>
            <Layer
              id="delivery-heatmap"
              type="heatmap"
              paint={{
                'heatmap-weight': ['get', 'weight'],
                'heatmap-intensity': 1.5,
                'heatmap-radius': 35,
                'heatmap-opacity': 0.75,
                'heatmap-color': [
                  'interpolate',
                  ['linear'],
                  ['heatmap-density'],
                  0, 'rgba(0,0,0,0)',
                  0.2, 'rgba(6,182,212,0.4)',
                  0.5, 'rgba(99,102,241,0.7)',
                  0.8, 'rgba(239,68,68,0.85)',
                  1, 'rgba(255,100,50,1)',
                ],
              }}
            />
          </Source>
        )}

        {/* Route Polyline base and animated dashed overlay */}
        {geojsonRoute && (
          <Source id="route-source" type="geojson" data={geojsonRoute}>
            <Layer 
              id="route-line-base" 
              type="line" 
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{ 'line-color': '#4f46e5', 'line-width': 4, 'line-opacity': 0.4 }} 
            />
            <Layer 
              id="route-line-animated" 
              type="line" 
              layout={{ 'line-join': 'round', 'line-cap': 'round' }}
              paint={{ 
                'line-color': '#818cf8', 
                'line-width': 5,
                // Array elements map to: [dash, gap, dash, gap...] 
                // We use dashOffset to shift the gaps visually by exploiting empty blocks
                'line-dasharray': [0, 4 - dashOffset, 2, dashOffset]  
              }} 
            />
          </Source>
        )}

        {/* Rider Start Marker */}
        {rider?.current_lat && rider?.current_lon && (
          <Marker 
            longitude={rider.current_lon} 
            latitude={rider.current_lat} 
            anchor="bottom"
          >
            <div className="flex flex-col items-center">
              <div className="bg-gray-900 border-2 border-indigo-500 text-xs font-bold px-2 py-0.5 rounded-md text-white shadow-lg mb-1">
                Start
              </div>
              <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-white flex items-center justify-center shadow-lg">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
            </div>
          </Marker>
        )}

        {/* Delivery Markers */}
        {deliveries.map(d => {
          const seq = getStopSequence(d);
          return (
             <Marker
                key={d.id}
                longitude={d.lon}
                latitude={d.lat}
                anchor="bottom"
                onClick={e => {
                  e.originalEvent.stopPropagation();
                  setPopupInfo(d);
                }}
             >
                <div className="relative flex flex-col items-center cursor-pointer hover:scale-110 transition-transform">
                  {seq !== null && (
                    <div className="absolute -top-3 -right-3 w-5 h-5 bg-indigo-600 rounded-full text-[10px] font-bold text-white flex items-center justify-center shadow-md animate-bounce">
                      {seq}
                    </div>
                  )}
                  <div className={`w-6 h-6 rounded-full ${getPriorityColor(d.priority)} border-2 border-white shadow-lg flex items-center justify-center`}>
                     <div className="w-2 h-2 rounded-full bg-white opacity-60"></div>
                  </div>
                </div>
             </Marker>
          );
        })}

        {/* Simulation Rider Marker */}
        {simulationPosition && (
          <Marker
            longitude={simulationPosition[0]}
            latitude={simulationPosition[1]}
            anchor="center"
          >
            <div className="relative flex flex-col items-center">
              <div className="whitespace-nowrap bg-cyan-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow mb-1">
                {rider?.name || 'LIVE'}
              </div>
              {(!rider?.vehicle_type || rider.vehicle_type === 'bike') && (
                <svg width="32" height="32" viewBox="0 0 24 24" fill="#06b6d4" xmlns="http://www.w3.org/2000/svg" style={{filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'}}>
                  <circle cx="6" cy="17" r="3" stroke="white" strokeWidth="1.5" fill="#06b6d4"/>
                  <circle cx="18" cy="17" r="3" stroke="white" strokeWidth="1.5" fill="#06b6d4"/>
                  <path d="M6 17l3-6h5l2 3h2" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9 11l1-4h2l3 4" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  <circle cx="13" cy="7" r="1.5" fill="white"/>
                </svg>
              )}
              {rider?.vehicle_type === 'car' && (
                <svg width="36" height="36" viewBox="0 0 24 24" fill="#06b6d4" xmlns="http://www.w3.org/2000/svg" style={{filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'}}>
                  <rect x="2" y="11" width="20" height="7" rx="2" fill="#06b6d4" stroke="white" strokeWidth="1.5"/>
                  <path d="M4 11l2-5h12l2 5" fill="#0891b2" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                  <circle cx="7" cy="18" r="2" fill="white"/>
                  <circle cx="17" cy="18" r="2" fill="white"/>
                  <rect x="6" y="7" width="4" height="3" rx="0.5" fill="white" opacity="0.6"/>
                  <rect x="14" y="7" width="4" height="3" rx="0.5" fill="white" opacity="0.6"/>
                </svg>
              )}
              {(rider?.vehicle_type === 'truck' || rider?.vehicle_type === 'van') && (
                <svg width="40" height="36" viewBox="0 0 32 24" fill="#06b6d4" xmlns="http://www.w3.org/2000/svg" style={{filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))'}}>
                  <rect x="1" y="8" width="22" height="10" rx="1.5" fill="#06b6d4" stroke="white" strokeWidth="1.5"/>
                  <rect x="23" y="11" width="8" height="7" rx="1.5" fill="#0891b2" stroke="white" strokeWidth="1.5"/>
                  <path d="M23 12h5l1 3h-6z" fill="white" opacity="0.3"/>
                  <circle cx="7" cy="19" r="2.5" fill="white"/>
                  <circle cx="18" cy="19" r="2.5" fill="white"/>
                  <circle cx="27" cy="19" r="2.5" fill="white"/>
                  <rect x="3" y="10" width="8" height="5" rx="0.5" fill="white" opacity="0.2"/>
                </svg>
              )}
            </div>
          </Marker>
        )}

        {/* Popup */}
        {popupInfo && (
          <Popup
            anchor="bottom"
            longitude={popupInfo.lon}
            latitude={popupInfo.lat}
            onClose={() => setPopupInfo(null)}
            closeButton={false}
            offset={15}
            className="rounded-2xl shadow-2xl"
          >
            <div className="text-gray-900 w-48 p-2 rounded-lg -m-1">
              <h3 className="font-bold text-sm mb-1">{popupInfo.title}</h3>
              <p className="text-xs text-gray-600 mb-2 truncate">{popupInfo.address || 'No address'}</p>
              
              <div className="flex justify-between items-center text-xs">
                <span className="font-medium text-gray-500">Priority:</span>
                <span className={`px-2 py-0.5 rounded-full text-white font-semibold ${getPriorityColor(popupInfo.priority)}`}>
                  {popupInfo.priority}
                </span>
              </div>
              <div className="mt-1 flex justify-between items-center text-xs">
                <span className="font-medium text-gray-500">Status:</span>
                <span className="bg-gray-100 px-2 py-0.5 rounded-full capitalize">
                  {popupInfo.status.replace('_', ' ')}
                </span>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Mode Overlay Badge */}
      {(isAddMode || isBlockedRoadMode) && (
        <div className="absolute top-4 left-4 bg-indigo-600/90 text-white px-4 py-2 rounded-lg shadow-lg font-medium text-sm backdrop-blur block animate-pulse border border-indigo-400">
          {isAddMode ? 'Click on map to add delivery location' : 'Click on map to toggle blocked road (Phase 9)'}
        </div>
      )}
    </div>
  );
}
