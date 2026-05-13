'use client';

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type DeliveryArea = {
  id: string;
  distancia_min: number;
  distancia_max: number;
  valor: number;
  tempo_estimado?: number;
};

type DeliveryMapProps = {
  latitude: number;
  longitude: number;
  areas: DeliveryArea[];
};

const ZONE_COLORS = ['#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function DeliveryMap({ latitude, longitude, areas }: DeliveryMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current || !latitude || !longitude) return;

    // Destroy previous instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      center: [latitude, longitude],
      zoom: 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Store marker
    const storeIcon = L.divIcon({
      className: '',
      html: `<div style="
        width: 28px; height: 28px; 
        background: #1a1a1a; 
        border: 3px solid white; 
        border-radius: 50%; 
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex; align-items: center; justify-content: center;
      "><div style="width: 8px; height: 8px; background: #E28743; border-radius: 50%;"></div></div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    L.marker([latitude, longitude], { icon: storeIcon }).addTo(map);

    // Delivery area circles (largest first so smaller ones render on top)
    const sortedAreas = [...areas].sort((a, b) => b.distancia_max - a.distancia_max);

    sortedAreas.forEach((area, idx) => {
      const colorIndex = areas.findIndex(a => a.id === area.id);
      const color = ZONE_COLORS[colorIndex % ZONE_COLORS.length];

      L.circle([latitude, longitude], {
        radius: area.distancia_max * 1000,
        color: color,
        weight: 2,
        opacity: 0.6,
        fillColor: color,
        fillOpacity: 0.08,
        dashArray: '6 4',
      }).addTo(map);
    });

    // Fit bounds to largest area
    if (areas.length > 0) {
      const maxKm = Math.max(...areas.map(a => a.distancia_max));
      const bounds = L.latLng(latitude, longitude).toBounds(maxKm * 2000 * 1.3);
      map.fitBounds(bounds);
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, areas]);

  return (
    <div className="rounded-xl border-2 border-[var(--cp-line-strong)] overflow-hidden relative" style={{ height: 280 }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      
      {/* Legend */}
      {areas.length > 0 && (
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg border border-zinc-200 px-3 py-2 z-[1000]">
          {areas.map((area, idx) => (
            <div key={area.id} className="flex items-center gap-2 py-0.5">
              <div 
                className="w-2.5 h-2.5 rounded-full flex-none" 
                style={{ backgroundColor: ZONE_COLORS[idx % ZONE_COLORS.length] }} 
              />
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-600">
                {area.distancia_min}–{area.distancia_max}km · R$ {area.valor.toFixed(2).replace('.', ',')}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
