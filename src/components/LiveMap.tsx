import React, { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useFoodFlow } from '../context/FoodFlowContext';
import { Truck, Play, Pause, Crosshair, Radio, AlertCircle, Layers, Globe, Map as MapIcon } from 'lucide-react';

// Fix Leaflet's default marker asset loading path in client bundlers
import 'leaflet/dist/leaflet.css';

// Tile Layer URLs map
const MAP_TILE_CONFIGS = {
  osm: {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    name: 'OSM Bright'
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
    name: 'Real Satellite'
  },
  voyager: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    name: 'Carto Voyager'
  }
};

// Haversine distance formula (in km)
const calculateHaversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
};

// Custom HTML Pin Generator for standard roles
const createPinIcon = (type: 'user' | 'restaurant' | 'ngo' | 'food' | 'gps', colorClass: string) => {
  let svgContent = '';
  if (type === 'gps') {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4 text-emerald-400"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/></svg>`;
  } else if (type === 'user') {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4 text-violet-400"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>`;
  } else if (type === 'restaurant') {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4 text-amber-500"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>`;
  } else if (type === 'ngo') {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4 text-rose-400"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;
  } else {
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-4 h-4 text-sky-400"><path d="M6 2 3 6v14a2 2 0 0 0 2-2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>`;
  }

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-9 h-9 rounded-full bg-slate-950 border border-slate-800 shadow-xl transition-all duration-300 hover:scale-110">
        <div class="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full ${colorClass} animate-pulse"></div>
        <div class="flex items-center justify-center w-5 h-5">
          ${svgContent}
        </div>
      </div>
    `,
    className: 'custom-leaflet-icon',
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

// Custom Driver Pin Generator with pulsing radar effect
const createDriverIcon = () => {
  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-11 h-11 rounded-full bg-emerald-950 border-2 border-emerald-400 shadow-2xl shadow-emerald-500/40 animate-bounce">
        <div class="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping"></div>
        <div class="flex items-center justify-center w-6 h-6 text-emerald-300">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="w-5 h-5"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.24-4.04A1 1 0 0 0 17.76 8H14"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
        </div>
      </div>
    `,
    className: 'driver-leaflet-icon',
    iconSize: [44, 44],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44]
  });
};

// Component to dynamically re-center map when coordinates change
const ChangeMapView: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

interface LiveMapProps {
  highlightRoute?: {
    from: [number, number];
    to: [number, number];
    driverName?: string;
  };
  centerPosition?: [number, number];
  zoomLevel?: number;
}

export const LiveMap: React.FC<LiveMapProps> = ({ 
  highlightRoute, 
  centerPosition = [12.965, 77.615], // Bangalore Center default
  zoomLevel = 13 
}) => {
  const { users, discountListings, currentRole, currentUser } = useFoodFlow();

  // Find other entities to plot
  const restaurants = users.filter(u => u.role === 'restaurant');
  const ngos = users.filter(u => u.role === 'ngo');

  // Map Style state ('osm' | 'satellite' | 'voyager')
  const [mapStyle, setMapStyle] = useState<'osm' | 'satellite' | 'voyager'>('osm');

  // Real Browser Geolocation GPS State
  const [realUserCoords, setRealUserCoords] = useState<[number, number] | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(50);
  const [isGeoTracking, setIsGeoTracking] = useState<boolean>(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [activeMapCenter, setActiveMapCenter] = useState<[number, number]>(centerPosition);

  // Animated Driver state along polyline
  const [progress, setProgress] = useState(0.25);
  const [isSimulating, setIsSimulating] = useState(true);

  // Active Route setup
  const activeRoute = highlightRoute || {
    from: [12.9716, 77.5946] as [number, number], // Spice Garden
    to: [12.9352, 77.6245] as [number, number],   // Hope Food Shelter
    driverName: 'Ramesh V. (FoodFlow Logistics)'
  };

  // Enable Browser GPS Location Tracking
  const requestRealGPSLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation API is not supported by your browser.');
      return;
    }

    setGeoError(null);
    setIsGeoTracking(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setRealUserCoords(coords);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
        setActiveMapCenter(coords);
      },
      (err) => {
        console.warn('GPS location error:', err.message);
        setGeoError('GPS access denied or unavailable. Showing simulated city pins.');
        setIsGeoTracking(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // Auto-request live location on mount
  useEffect(() => {
    requestRealGPSLocation();
  }, [requestRealGPSLocation]);

  // Watch position when geo tracking is enabled
  useEffect(() => {
    if (!isGeoTracking || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        setRealUserCoords(coords);
        setGpsAccuracy(Math.round(pos.coords.accuracy));
      },
      (err) => {
        console.warn('Watch position error:', err.message);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isGeoTracking]);

  // Interpolated driver position along route polyline
  const driverLat = activeRoute.from[0] + (activeRoute.to[0] - activeRoute.from[0]) * progress;
  const driverLng = activeRoute.from[1] + (activeRoute.to[1] - activeRoute.from[1]) * progress;

  // Real distance calculations using Haversine formula
  const totalRouteDistKm = calculateHaversineDistance(
    activeRoute.from[0],
    activeRoute.from[1],
    activeRoute.to[0],
    activeRoute.to[1]
  );
  const distRemainingKm = parseFloat((totalRouteDistKm * (1 - progress)).toFixed(2));
  const etaMinutes = Math.max(1, Math.round((distRemainingKm / 25) * 60)); // Avg 25 km/h urban speed

  // Route movement loop animation - Realistic, smooth vehicle speed
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 0.98) return 0.05; // Loop route seamlessly
        return prev + 0.0025; // Smooth, realistic movement speed
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="w-full flex flex-col bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Integrated Header Toolbar (Near & Above Map Canvas) */}
      <div className="p-3 sm:p-3.5 bg-slate-900/95 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-10">
        {/* Real Tracking Engine Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 font-black text-emerald-400 text-xs tracking-wider uppercase">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span>REAL TRACKING ENGINE</span>
          </div>

          <div className="h-4 w-px bg-slate-800 hidden sm:block mx-0.5" />

          {/* GPS Locate Button */}
          <button
            onClick={requestRealGPSLocation}
            className={`py-1.5 px-3 rounded-xl font-bold text-[11px] flex items-center gap-1.5 border transition-all active-press ${
              isGeoTracking
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-900/30'
                : 'bg-slate-800/80 hover:bg-slate-800 border-slate-700 text-slate-200'
            }`}
          >
            <Crosshair size={13} className={isGeoTracking ? 'animate-spin text-emerald-400' : 'text-slate-400'} />
            <span>{isGeoTracking ? `GPS Live (~${gpsAccuracy}m)` : 'Enable Browser GPS'}</span>
          </button>

          {/* Motion Simulation Play/Pause Toggle */}
          <button 
            onClick={() => setIsSimulating(!isSimulating)} 
            className="py-1.5 px-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white transition-all text-[11px] flex items-center gap-1.5 font-semibold"
            title={isSimulating ? "Pause Delivery Motion" : "Resume Delivery Motion"}
          >
            {isSimulating ? <Pause size={13} className="text-amber-400" /> : <Play size={13} className="text-emerald-400" />}
            <span>{isSimulating ? 'Pause Motion' : 'Play Motion'}</span>
          </button>
        </div>

        {/* Map Tiles Style Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-300 mr-1">
            <Radio className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span className="hidden sm:inline">Map Tiles Style:</span>
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => setMapStyle('osm')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 active-press ${
                mapStyle === 'osm' ? 'bg-sky-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapIcon size={12} />
              <span>OSM Bright</span>
            </button>
            <button 
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 active-press ${
                mapStyle === 'satellite' ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe size={12} />
              <span>Satellite</span>
            </button>
            <button 
              onClick={() => setMapStyle('voyager')}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1.5 active-press ${
                mapStyle === 'voyager' ? 'bg-purple-500 text-slate-950 shadow-md font-extrabold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers size={12} />
              <span>Voyager</span>
            </button>
          </div>
        </div>
      </div>

      {geoError && (
        <div className="px-3.5 py-2 bg-amber-950/70 border-b border-amber-800/50 text-[10px] text-amber-300 flex items-center gap-1.5">
          <AlertCircle size={13} className="flex-shrink-0 text-amber-400" />
          <span>{geoError}</span>
        </div>
      )}

      {/* Main Map Viewport Canvas - Clean & Unobstructed */}
      <div className="w-full h-[320px] sm:h-[360px] relative isolate z-0">
        <MapContainer 
          center={activeMapCenter} 
          zoom={zoomLevel} 
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <ChangeMapView center={activeMapCenter} zoom={zoomLevel} />
          
          {/* Dynamic bright map tiles */}
          <TileLayer
            key={mapStyle}
            attribution={MAP_TILE_CONFIGS[mapStyle].attribution}
            url={MAP_TILE_CONFIGS[mapStyle].url}
          />

          {/* Real Device GPS Marker & Accuracy Halo Circle */}
          {realUserCoords && (
            <>
              <Circle 
                center={realUserCoords} 
                radius={gpsAccuracy} 
                pathOptions={{
                  color: '#10b981',
                  fillColor: '#10b981',
                  fillOpacity: 0.15,
                  weight: 1.5,
                  dashArray: '4, 4'
                }}
              />
              <Marker 
                position={realUserCoords} 
                icon={createPinIcon('gps', 'bg-emerald-400')}
              >
                <Popup>
                  <div className="text-slate-900 p-1 text-xs font-sans">
                    <strong className="block text-emerald-800 font-bold flex items-center gap-1">
                      <Radio size={12} className="text-emerald-600" />
                      <span>Real Device GPS Position</span>
                    </strong>
                    <span className="text-slate-600 text-[10px] block mt-0.5">
                      Lat: {realUserCoords[0].toFixed(4)}, Lng: {realUserCoords[1].toFixed(4)}
                    </span>
                    <span className="text-emerald-600 font-bold text-[10px] block mt-0.5">
                      GPS Accuracy: ~{gpsAccuracy}m
                    </span>
                  </div>
                </Popup>
              </Marker>
            </>
          )}

          {/* Plot Static User profile location */}
          <Marker 
            position={[currentUser.lat, currentUser.lng]} 
            icon={createPinIcon('user', 'bg-violet-500')}
          >
            <Popup>
              <div className="text-slate-900 p-1 text-xs">
                <strong className="block text-slate-800">{currentUser.name} (Registered Base)</strong>
                <span className="text-[10px] text-slate-500">{currentUser.address}</span>
              </div>
            </Popup>
          </Marker>

          {/* Plot Restaurants */}
          {currentRole !== 'restaurant' && restaurants.map(r => (
            r.id !== currentUser.id && (
              <Marker 
                key={r.id} 
                position={[r.lat, r.lng]} 
                icon={createPinIcon('restaurant', 'bg-amber-500')}
              >
                <Popup>
                  <div className="text-slate-900 p-1 text-xs">
                    <strong className="block text-slate-800">{r.name}</strong>
                    <span className="text-slate-500 text-[10px]">Partner Restaurant • Verified</span>
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {/* Plot NGOs */}
          {currentRole !== 'ngo' && ngos.map(n => (
            n.id !== currentUser.id && (
              <Marker 
                key={n.id} 
                position={[n.lat, n.lng]} 
                icon={createPinIcon('ngo', n.verified ? 'bg-teal-400' : 'bg-amber-400')}
              >
                <Popup>
                  <div className="text-slate-900 p-1 text-xs">
                    <strong className="block text-slate-800">{n.name}</strong>
                    <span className="text-slate-500 text-[10px]">
                      NGO Shelter • {n.verified ? 'Verified ✓' : 'Verification Pending'}
                    </span>
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {/* Plot Active Marketplace Discounts */}
          {discountListings.map(d => {
            const available = d.quantityAvailable - d.quantityReserved;
            if (available <= 0) return null;
            return (
              <Marker 
                key={d.id} 
                position={[d.lat, d.lng]} 
                icon={createPinIcon('food', 'bg-sky-400')}
              >
                <Popup>
                  <div className="text-slate-900 p-1.5 text-xs font-sans">
                    <strong className="block text-slate-900 font-bold">{d.dishName}</strong>
                    <span className="text-slate-700 text-[10px] block">Shop: {d.restaurantName}</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="bg-sky-100 text-sky-800 font-bold px-1.5 py-0.5 rounded text-[10px]">
                        ₹{d.discountedPrice}
                      </span>
                      <span className="text-slate-400 line-through text-[10px]">₹{d.originalPrice}</span>
                      <span className="text-emerald-700 font-bold text-[10px]">{d.discountPercent}% OFF</span>
                    </div>
                    <div className="text-slate-500 text-[10px] mt-1 font-semibold">
                      Portions Left: {available}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {/* Plot Route Polyline & Driver Marker */}
          <Polyline 
            positions={[activeRoute.from, activeRoute.to]} 
            color="#10b981" 
            weight={5}
            dashArray="10, 10"
            className="animate-dashFlow"
          />
          
          <Marker position={activeRoute.from} icon={createPinIcon('restaurant', 'bg-amber-500')} />
          <Marker position={activeRoute.to} icon={createPinIcon('ngo', 'bg-rose-500')} />

          {/* Animated Live Driver Marker */}
          <Marker 
            position={[driverLat, driverLng]} 
            icon={createDriverIcon()}
          >
            <Popup>
              <div className="text-slate-900 p-1.5 text-xs font-sans">
                <strong className="block text-emerald-800 font-bold flex items-center gap-1">
                  <Truck size={12} className="text-emerald-600" />
                  <span>{activeRoute.driverName}</span>
                </strong>
                <span className="text-slate-600 text-[10px] block mt-0.5">
                  Surplus Dispatch Route ({totalRouteDistKm} km total)
                </span>
                <div className="mt-1 text-[11px] font-semibold text-emerald-600">
                  Remaining: {distRemainingKm} km • ETA {etaMinutes} mins
                </div>
              </div>
            </Popup>
          </Marker>

        </MapContainer>
      </div>

      {/* Integrated Footer Status Bar (Near & Below Map Canvas) */}
      <div className="p-3 sm:p-3.5 bg-slate-900/95 border-t border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs z-10">
        {/* Live Driver Progress Metrics */}
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="w-8 h-8 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center flex-shrink-0 text-emerald-400 shadow-md">
            <Truck size={16} />
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="font-bold text-slate-100 truncate text-xs flex items-center gap-1.5">
                <span>{activeRoute.driverName}</span>
                <span className="text-[10px] font-normal text-slate-400">
                  ({progress < 0.3 ? 'Food Collected' : progress < 0.85 ? 'In Transit' : 'Arriving Soon'})
                </span>
              </div>
              <div className="text-[11px] font-bold text-emerald-400 flex items-center gap-2 flex-shrink-0">
                <span>{distRemainingKm} km left</span>
                <span>•</span>
                <span>ETA {etaMinutes}m</span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-400 h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Map Legend */}
        <div className="flex items-center gap-3 flex-wrap text-[10px] text-slate-400 border-t md:border-t-0 md:border-l border-slate-800 pt-2 md:pt-0 md:pl-4">
          {realUserCoords && (
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Real GPS</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live Driver</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-violet-500" />
            <span>Registered Base</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Restaurants</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            <span>Verified NGOs</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span>Food Deals</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMap;
