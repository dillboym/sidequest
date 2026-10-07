'use client'

import { useEffect } from 'react'
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

type Point = { name?: string; latitude?: number; longitude?: number; formattedAddress?: string; category?: string; activity?: string; postcode?: string | null }

function FitBounds({ points }: { points: Point[] }) {
  const map = useMap()
  useEffect(() => {
    const valid = points.filter((point) => point.latitude != null && point.longitude != null).map((point) => [point.latitude!, point.longitude!] as [number, number])
    if (valid.length > 1) map.fitBounds(valid, { padding: [28, 28] })
    else if (valid[0]) map.setView(valid[0], 15)
  }, [map, points])
  return null
}

const markerIcon = (label: string, color: string) => L.divIcon({ className: '', html: `<span style="display:grid;place-items:center;width:32px;height:32px;border-radius:999px;background:${color};border:3px solid white;box-shadow:0 3px 10px rgba(0,0,0,.25);font:800 11px system-ui;color:#111b24">${label}</span>`, iconSize: [32, 32], iconAnchor: [16, 16] })

export default function LiveMap({ points }: { points: Point[] }) {
  const valid = points.filter((point) => point.latitude != null && point.longitude != null)
  const center: [number, number] = valid[0] ? [valid[0].latitude!, valid[0].longitude!] : [51.5072, -0.1276]
  return <div className="relative h-[330px] overflow-hidden rounded-3xl border border-[#cbd8d7] bg-[#dfe9e4]" aria-label="Interactive map of this SideQuest">
    <MapContainer center={center} zoom={14} scrollWheelZoom className="size-full">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <FitBounds points={valid} />
      {valid.map((point, index) => <Marker key={`${point.name}-${index}`} position={[point.latitude!, point.longitude!]} icon={markerIcon(index === 0 ? 'S' : String(index).padStart(2, '0'), index === 0 ? '#e9ff65' : '#bd5a46')}><Popup><strong>{point.name}</strong><br />{point.activity ?? point.category ?? 'SideQuest stop'}<br />{point.formattedAddress ?? 'Location details unavailable'}{point.postcode && !(point.formattedAddress ?? '').includes(point.postcode) ? <><br />{point.postcode}</> : null}</Popup></Marker>)}
      {valid.length > 1 && <Polyline positions={valid.map((point) => [point.latitude!, point.longitude!] as [number, number])} pathOptions={{ color: '#8e2f28', weight: 4, dashArray: '8 8' }} />}
    </MapContainer>
    <span className="pointer-events-none absolute left-4 top-4 z-[400] rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#111b24]">Live route map</span>
  </div>
}
