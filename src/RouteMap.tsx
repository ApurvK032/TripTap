import type { GeoJsonObject } from "geojson";
import L, {
  type GeoJSON as LeafletGeoJSON,
  type LayerGroup,
  type Map as LeafletMap,
} from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { RouteShape, TransitVehicle } from "./explorer";

const TWIN_CITIES_CENTER: [number, number] = [44.955, -93.18];

interface RouteMapProps {
  accent: string;
  routeId: string;
  shape?: RouteShape;
  vehicles: TransitVehicle[];
}

export function RouteMap({
  accent,
  routeId,
  shape,
  vehicles,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const routeLayerRef = useRef<LeafletGeoJSON | null>(null);
  const vehicleLayerRef = useRef<LayerGroup | null>(null);
  const fittedVehiclesRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      attributionControl: true,
      zoomControl: true,
    }).setView(TWIN_CITIES_CENTER, 11);

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    mapRef.current = map;
    vehicleLayerRef.current = L.layerGroup().addTo(map);
    window.setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      routeLayerRef.current = null;
      vehicleLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    fittedVehiclesRef.current = false;
  }, [routeId]);

  useEffect(() => {
    const map = mapRef.current;

    if (!map) {
      return;
    }

    if (routeLayerRef.current) {
      routeLayerRef.current.removeFrom(map);
      routeLayerRef.current = null;
    }

    if (!shape?.features?.length) {
      return;
    }

    try {
      const routeLayer = L.geoJSON(shape as GeoJsonObject, {
        style: {
          color: accent,
          opacity: 0.92,
          weight: 5,
        },
      }).addTo(map);
      const bounds = routeLayer.getBounds();

      routeLayerRef.current = routeLayer;

      if (bounds.isValid()) {
        map.fitBounds(bounds, { maxZoom: 14, padding: [24, 24] });
      }
    } catch {
      routeLayerRef.current = null;
    }
  }, [accent, shape]);

  useEffect(() => {
    const map = mapRef.current;
    const vehicleLayer = vehicleLayerRef.current;

    if (!map || !vehicleLayer) {
      return;
    }

    vehicleLayer.clearLayers();
    const vehicleBounds = L.latLngBounds([]);

    vehicles.forEach((vehicle, index) => {
      if (!Number.isFinite(vehicle.latitude) || !Number.isFinite(vehicle.longitude)) {
        return;
      }

      const location = L.latLng(vehicle.latitude, vehicle.longitude);
      vehicleBounds.extend(location);

      L.circleMarker(location, {
        color: "#07100c",
        fillColor: accent,
        fillOpacity: 1,
        radius: 9,
        weight: 3,
      })
        .bindTooltip(`Live vehicle ${index + 1}`)
        .addTo(vehicleLayer);
    });

    if (
      vehicleBounds.isValid() &&
      !routeLayerRef.current &&
      !fittedVehiclesRef.current
    ) {
      map.fitBounds(vehicleBounds, { maxZoom: 14, padding: [36, 36] });
      fittedVehiclesRef.current = true;
    }
  }, [accent, vehicles]);

  return (
    <div
      aria-label="Interactive route map with live vehicle locations"
      className="route-map"
      ref={containerRef}
      role="region"
    />
  );
}
