import { NexTripResponse } from "./transit";

const NEXTRIP_BASE_URL = "https://svc.metrotransit.org";

export interface TransitRoute {
  route_id: string;
  agency_id: number;
  route_label: string;
}

export interface TransitDirection {
  direction_id: number;
  direction_name: string;
}

export interface TransitPlace {
  place_code: string;
  description: string;
}

export interface TransitVehicle {
  trip_id: string;
  direction_id: number;
  direction: string;
  location_time: number;
  route_id: string;
  terminal: string;
  latitude: number;
  longitude: number;
  bearing: number;
  odometer: number;
  speed: number;
}

export interface RouteShape {
  type: string;
  features?: Array<{
    type: string;
    properties?: {
      route_id?: string;
      alert_id?: string;
      direction_id?: number;
    };
    geometry?: {
      type: string;
      coordinates?: unknown;
    };
  }>;
}

export async function fetchTransitRoutes(
  signal?: AbortSignal,
): Promise<TransitRoute[]> {
  return fetchNexTrip<TransitRoute[]>("/nextrip/routes", signal);
}

export async function fetchRouteDirections(
  routeId: string,
  signal?: AbortSignal,
): Promise<TransitDirection[]> {
  return fetchNexTrip<TransitDirection[]>(
    `/nextrip/directions/${encodeURIComponent(routeId)}`,
    signal,
  );
}

export async function fetchRouteStops(
  routeId: string,
  directionId: number,
  signal?: AbortSignal,
): Promise<TransitPlace[]> {
  return fetchNexTrip<TransitPlace[]>(
    `/nextrip/stops/${encodeURIComponent(routeId)}/${directionId}`,
    signal,
  );
}

export async function fetchRouteVehicles(
  routeId: string,
  signal?: AbortSignal,
): Promise<TransitVehicle[]> {
  return fetchNexTrip<TransitVehicle[]>(
    `/nextrip/vehicles/${encodeURIComponent(routeId)}`,
    signal,
  );
}

export async function fetchRouteShape(
  routeId: string,
  signal?: AbortSignal,
): Promise<RouteShape> {
  return fetchNexTrip<RouteShape>(
    `/nextrip/shape/${encodeURIComponent(routeId)}`,
    signal,
  );
}

export async function fetchStopDepartures(
  routeId: string,
  directionId: number,
  placeCode: string,
  signal?: AbortSignal,
): Promise<NexTripResponse> {
  return fetchNexTrip<NexTripResponse>(
    `/nextrip/${encodeURIComponent(routeId)}/${directionId}/${encodeURIComponent(placeCode)}`,
    signal,
  );
}

export function isMetroNetworkRoute(route: TransitRoute): boolean {
  return /metro|line|shuttle/i.test(route.route_label);
}

export function getRouteAccent(route: TransitRoute): string {
  const label = route.route_label.toLowerCase();

  if (label.includes("green")) return "#39d477";
  if (label.includes("blue")) return "#4ba7ff";
  if (label.includes("gold")) return "#e5c14f";
  if (label.includes("orange")) return "#ff963d";
  if (label.includes("red")) return "#ff6477";
  if (label.includes("a line")) return "#59c8ff";
  if (label.includes("b line")) return "#ffd166";
  if (label.includes("c line")) return "#ff7b5c";
  if (label.includes("d line")) return "#bd8cff";
  if (label.includes("e line")) return "#2fd3bf";

  const fallbackColors = ["#2fd3bf", "#59c8ff", "#ffd166", "#bd8cff"];
  const colorIndex = [...route.route_id].reduce(
    (total, character) => total + character.charCodeAt(0),
    0,
  );

  return fallbackColors[colorIndex % fallbackColors.length];
}

async function fetchNexTrip<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(`${NEXTRIP_BASE_URL}${path}`, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Metro Transit returned ${response.status}.`);
  }

  return (await response.json()) as T;
}
