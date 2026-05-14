import { useEffect, useRef } from 'react';

interface Props { lat: number; lng: number; restaurantLat?: number; restaurantLng?: number; clientLat?: number; clientLng?: number; }

export function TrackingMap({ lat, lng, restaurantLat, restaurantLng, clientLat, clientLng }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (typeof window === 'undefined' || !mapRef.current) return;
    import('leaflet').then((L) => {
      const map = L.default.map(mapRef.current!).setView([lat, lng], 14);
      L.default.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; OpenStreetMap' }).addTo(map);
      L.default.marker([lat, lng]).addTo(map).bindPopup('Vous');
      if (restaurantLat && restaurantLng) L.default.marker([restaurantLat, restaurantLng]).addTo(map).bindPopup('Restaurant');
      if (clientLat && clientLng) L.default.marker([clientLat, clientLng]).addTo(map).bindPopup('Client');
    });
  }, [lat, lng, restaurantLat, restaurantLng, clientLat, clientLng]);
  return <div ref={mapRef} className="w-full h-72 rounded-[24px] border border-[#E8E0D4] shadow-warm overflow-hidden" />;
}
