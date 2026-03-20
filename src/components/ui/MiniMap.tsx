'use client';

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Next.js
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

// Component to update map view when coordinates change
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

interface MiniMapProps {
  lat: number;
  lon: number;
  address?: string;
  height?: string | number;
  zoom?: number;
  onClick?: () => void;
  showPopup?: boolean;
}

export function MiniMap({ 
  lat, 
  lon, 
  address, 
  height = 176, 
  zoom = 16,
  onClick,
  showPopup = false
}: MiniMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const heightValue = typeof height === 'number' ? `${height}px` : height;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div 
        style={{ height: heightValue }} 
        className="w-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center"
      >
        <div className="animate-pulse">Karte wird geladen...</div>
      </div>
    );
  }

  return (
    <div 
      style={{ height: heightValue }} 
      className="w-full relative"
      onClick={onClick}
    >
      <MapContainer
        center={[lat, lon]}
        zoom={zoom}
        scrollWheelZoom={false}
        dragging={false}
        doubleClickZoom={false}
        touchZoom={false}
        zoomControl={false}
        attributionControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lon]}>
          {showPopup && address && (
            <Popup>{address}</Popup>
          )}
        </Marker>
        <MapUpdater center={[lat, lon]} />
      </MapContainer>
      {onClick && (
        <div className="absolute inset-0 bg-transparent cursor-pointer z-[400]" />
      )}
    </div>
  );
}

// Larger interactive map for detail view
interface DetailMapProps {
  lat: number;
  lon: number;
  address?: string;
  height?: string | number;
  onClick?: () => void;
}

export function DetailMap({ 
  lat, 
  lon, 
  address, 
  height = 224,
  onClick
}: DetailMapProps) {
  const [isMounted, setIsMounted] = useState(false);
  const heightValue = typeof height === 'number' ? `${height}px` : height;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div 
        style={{ height: heightValue }} 
        className="w-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center"
      >
        <div className="animate-pulse">Karte wird geladen...</div>
      </div>
    );
  }

  return (
    <div 
      style={{ height: heightValue }} 
      className="w-full relative"
    >
      <MapContainer
        center={[lat, lon]}
        zoom={15}
        scrollWheelZoom={true}
        dragging={true}
        doubleClickZoom={true}
        touchZoom={true}
        zoomControl={true}
        attributionControl={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[lat, lon]}>
          {address && (
            <Popup>{address}</Popup>
          )}
        </Marker>
        <MapUpdater center={[lat, lon]} />
      </MapContainer>
      {onClick && (
        <div 
          className="absolute inset-0 bg-transparent cursor-pointer z-[400]" 
          onClick={onClick}
          title="Auf Google Maps öffnen"
        />
      )}
    </div>
  );
}

export default MiniMap;
