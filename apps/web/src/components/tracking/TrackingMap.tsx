import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet/Next.js
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: markerIcon.src || markerIcon,
  shadowUrl: markerShadow.src || markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

// Custom Motorbike Icon for Driver
const driverIcon = L.icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/171/171221.png', // Simple motorbike icon
  iconSize: [40, 40],
  iconAnchor: [20, 40],
  popupAnchor: [0, -40],
});

interface Coords {
  lat: number;
  lng: number;
}

interface TrackingMapProps {
  restaurantCoords: Coords;
  userCoords: Coords;
  driverCoords: Coords | null;
}

function MapRecenter({ coords }: { coords: Coords }) {
  const map = useMap();
  useEffect(() => {
    map.setView(coords, map.getZoom());
  }, [coords, map]);
  return null;
}

function SmoothDriverMarker({ coords }: { coords: Coords | null }) {
  const markerRef = useRef<L.Marker | null>(null);
  const currentCoordsRef = useRef<{ lat: number; lng: number } | null>(null);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!coords) return;

    if (!currentCoordsRef.current) {
      currentCoordsRef.current = { ...coords };
    }

    if (markerRef.current) {
      const start = { ...currentCoordsRef.current };
      const end = { ...coords };
      const duration = 1500; // 1.5 seconds interpolation
      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const lat = start.lat + (end.lat - start.lat) * progress;
        const lng = start.lng + (end.lng - start.lng) * progress;

        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        }

        currentCoordsRef.current = { lat, lng };

        if (progress < 1) {
          animationRef.current = requestAnimationFrame(animate);
        }
      };

      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      animationRef.current = requestAnimationFrame(animate);
    }
  }, [coords]);

  return (
    <Marker
      ref={(el) => {
        markerRef.current = el;
        if (el && !currentCoordsRef.current) {
          currentCoordsRef.current = { ...coords! };
        }
      }}
      position={[coords?.lat || 0, coords?.lng || 0]}
      icon={driverIcon}
    >
      <Popup>Your Driver</Popup>
    </Marker>
  );
}

export default function TrackingMap({ restaurantCoords, userCoords, driverCoords }: TrackingMapProps) {
  // Center the map on the destination (user) by default
  const center = userCoords || { lat: 3.848, lng: 11.502 }; // Default Yaoundé

  return (
    <div className="h-full w-full min-h-[400px] rounded-2xl overflow-hidden shadow-inner border border-gray-200">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Restaurant Marker */}
        <Marker position={[restaurantCoords.lat, restaurantCoords.lng]}>
          <Popup>Restaurant</Popup>
        </Marker>

        {/* User Marker */}
        <Marker position={[userCoords.lat, userCoords.lng]}>
          <Popup>Delivery Address</Popup>
        </Marker>

        {/* Driver Marker */}
        {driverCoords && (
          <>
            <SmoothDriverMarker coords={driverCoords} />
            <MapRecenter coords={driverCoords} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
