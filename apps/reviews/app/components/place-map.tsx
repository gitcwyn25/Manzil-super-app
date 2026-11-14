"use client";
import { useEffect, useRef } from "react";
import { type Business, coordinates } from "../lib/api";
import type { Map as LeafletMap } from "leaflet";
export default function PlaceMap({ businesses, location }: { businesses: Business[]; location?: [number, number] }) {
  const element = useRef<HTMLDivElement>(null), map = useRef<LeafletMap | null>(null);
  const points = businesses.filter(coordinates);
  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then(L => {
      if (cancelled || !element.current) return;
      const instance = L.map(element.current, { scrollWheelZoom: false }).setView(location || [41.3111, 69.2797], 12);
      map.current = instance;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' }).addTo(instance);
      const bounds: [number, number][] = [];
      for (const b of businesses.filter(coordinates)) {
        const point: [number, number] = [b.lat!, b.lng!]; bounds.push(point);
        const content = document.createElement("div"), name = document.createElement("a"), detail = document.createElement("p");
        name.textContent = b.name; name.href = `/business/${encodeURIComponent(b.slug)}`; name.className = "map-place-link";
        detail.textContent = `${b.address}${b.reviewCount ? ` · ${b.avgRating.toFixed(1)} ★ (${b.reviewCount})` : ""}`;
        content.append(name, detail);
        L.marker(point, { icon: L.divIcon({ className: "map-pin", html: '<span aria-hidden="true">m</span>', iconSize: [32, 38], iconAnchor: [16, 38] }), title: b.name }).bindPopup(content).addTo(instance);
      }
      if (location) { L.circleMarker(location, { color: "#0065cf", fillOpacity: 1, radius: 7 }).bindPopup("Your location").addTo(instance); bounds.push(location); }
      if (bounds.length) instance.fitBounds(L.latLngBounds(bounds), { padding: [32, 32], maxZoom: 15 });
    });
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
  }, [businesses, location]);
  return <div className="map-panel"><div ref={element} className="place-map" aria-label="Map of business locations"/><p className="map-caption">{points.length} of {businesses.length} places have a map location. Select a pin to open its profile.</p></div>;
}
