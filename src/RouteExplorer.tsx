import {
  ArrowLeft,
  BusFront,
  ChevronRight,
  MapPin,
  RefreshCw,
  Search,
  Signal,
  Train,
  WifiOff,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchRouteDirections,
  fetchRouteShape,
  fetchRouteStops,
  fetchRouteVehicles,
  fetchStopDepartures,
  fetchTransitRoutes,
  getRouteAccent,
  isMetroNetworkRoute,
  RouteShape,
  TransitDirection,
  TransitPlace,
  TransitRoute,
  TransitVehicle,
} from "./explorer";
import { RouteMap } from "./RouteMap";
import type { NexTripDeparture } from "./transit";

const VEHICLE_REFRESH_MS = 15_000;
const ARRIVAL_REFRESH_MS = 25_000;

export function RouteExplorer() {
  const [routes, setRoutes] = useState<TransitRoute[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<TransitRoute>();
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const controller = new AbortController();

    void fetchTransitRoutes(controller.signal)
      .then((routeResults) => {
        setRoutes(routeResults);
        setError(undefined);
      })
      .catch((routeError: unknown) => {
        if (!isAbortError(routeError)) {
          setError(toErrorMessage(routeError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    return () => controller.abort();
  }, []);

  const filteredRoutes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return routes;
    }

    return routes.filter(
      (route) =>
        route.route_label.toLowerCase().includes(normalizedQuery) ||
        route.route_id.toLowerCase().includes(normalizedQuery),
    );
  }, [query, routes]);

  const metroRoutes = filteredRoutes.filter(isMetroNetworkRoute);
  const busRoutes = filteredRoutes.filter(
    (route) => !isMetroNetworkRoute(route),
  );

  if (selectedRoute) {
    return (
      <RouteDetail
        key={selectedRoute.route_id}
        onBack={() => setSelectedRoute(undefined)}
        route={selectedRoute}
      />
    );
  }

  return (
    <section className="route-explorer" aria-labelledby="route-explorer-title">
      <div className="explorer-hero">
        <span className="section-kicker">Metro Transit network</span>
        <h2 id="route-explorer-title">Choose any route</h2>
        <p>
          Pick a rail or bus line to see its live vehicles, directions, stops,
          and upcoming departures.
        </p>
      </div>

      <label className="route-search">
        <Search aria-hidden="true" size={18} />
        <span className="visually-hidden">Search routes</span>
        <input
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search Green Line, E Line, Route 2…"
          type="search"
          value={query}
        />
        {query ? (
          <button
            aria-label="Clear route search"
            onClick={() => setQuery("")}
            type="button"
          >
            <X aria-hidden="true" size={16} />
          </button>
        ) : null}
      </label>

      {isLoading ? <RouteCatalogSkeleton /> : null}

      {error ? (
        <div className="explorer-message explorer-error" role="alert">
          <WifiOff aria-hidden="true" size={18} />
          <span>{error}</span>
        </div>
      ) : null}

      {!isLoading && !error && filteredRoutes.length === 0 ? (
        <div className="explorer-message">
          No routes match “{query.trim()}”.
        </div>
      ) : null}

      {!isLoading && !error && metroRoutes.length > 0 ? (
        <RouteGroup
          icon="train"
          onSelect={setSelectedRoute}
          routes={metroRoutes}
          subtitle="Light rail and bus rapid transit"
          title="METRO network"
        />
      ) : null}

      {!isLoading && !error && busRoutes.length > 0 ? (
        <RouteGroup
          icon="bus"
          onSelect={setSelectedRoute}
          routes={busRoutes}
          subtitle="Local and regional service"
          title="Bus routes"
        />
      ) : null}
    </section>
  );
}

function RouteGroup({
  icon,
  onSelect,
  routes,
  subtitle,
  title,
}: {
  icon: "bus" | "train";
  onSelect: (route: TransitRoute) => void;
  routes: TransitRoute[];
  subtitle: string;
  title: string;
}) {
  return (
    <section className="route-group">
      <div className="route-group-heading">
        <span className="route-group-icon" aria-hidden="true">
          {icon === "train" ? <Train size={17} /> : <BusFront size={17} />}
        </span>
        <div>
          <h3>{title}</h3>
          <span>{subtitle}</span>
        </div>
      </div>
      <div className="route-catalog">
        {routes.map((route) => (
          <button
            className="route-choice"
            key={`${route.agency_id}-${route.route_id}`}
            onClick={() => onSelect(route)}
            type="button"
          >
            <span
              className="route-choice-mark"
              style={{ backgroundColor: getRouteAccent(route) }}
            />
            <span className="route-choice-copy">
              <strong>{route.route_label}</strong>
              <small>Route {route.route_id}</small>
            </span>
            <ChevronRight aria-hidden="true" size={17} />
          </button>
        ))}
      </div>
    </section>
  );
}

function RouteDetail({
  onBack,
  route,
}: {
  onBack: () => void;
  route: TransitRoute;
}) {
  const accent = getRouteAccent(route);
  const [directions, setDirections] = useState<TransitDirection[]>([]);
  const [selectedDirectionId, setSelectedDirectionId] = useState<number>();
  const [stops, setStops] = useState<TransitPlace[]>([]);
  const [selectedStopCode, setSelectedStopCode] = useState("");
  const [departures, setDepartures] = useState<NexTripDeparture[]>([]);
  const [vehicles, setVehicles] = useState<TransitVehicle[]>([]);
  const [shape, setShape] = useState<RouteShape>();
  const [isLoadingDirections, setIsLoadingDirections] = useState(true);
  const [isLoadingStops, setIsLoadingStops] = useState(false);
  const [isLoadingDepartures, setIsLoadingDepartures] = useState(false);
  const [directionError, setDirectionError] = useState<string>();
  const [stopError, setStopError] = useState<string>();
  const [departureError, setDepartureError] = useState<string>();
  const [vehicleError, setVehicleError] = useState<string>();
  const [shapeUnavailable, setShapeUnavailable] = useState(false);
  const [vehiclesUpdatedAt, setVehiclesUpdatedAt] = useState<Date>();

  useEffect(() => {
    const controller = new AbortController();

    void fetchRouteDirections(route.route_id, controller.signal)
      .then((directionResults) => {
        setDirections(directionResults);
        setSelectedDirectionId(directionResults[0]?.direction_id);
        setDirectionError(undefined);
      })
      .catch((routeError: unknown) => {
        if (!isAbortError(routeError)) {
          setDirectionError(toErrorMessage(routeError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingDirections(false);
        }
      });

    return () => controller.abort();
  }, [route.route_id]);

  useEffect(() => {
    const controller = new AbortController();

    void fetchRouteShape(route.route_id, controller.signal)
      .then((routeShape) => {
        setShape(routeShape);
        setShapeUnavailable(false);
      })
      .catch((routeError: unknown) => {
        if (!isAbortError(routeError)) {
          setShapeUnavailable(true);
        }
      });

    return () => controller.abort();
  }, [route.route_id]);

  const loadVehicles = useCallback(
    async (signal?: AbortSignal) => {
      try {
        const vehicleResults = await fetchRouteVehicles(route.route_id, signal);
        setVehicles(vehicleResults);
        setVehiclesUpdatedAt(new Date());
        setVehicleError(undefined);
      } catch (routeError) {
        if (!isAbortError(routeError)) {
          setVehicleError(toErrorMessage(routeError));
        }
      }
    },
    [route.route_id],
  );

  useEffect(() => {
    const controller = new AbortController();
    void loadVehicles(controller.signal);

    const intervalId = window.setInterval(() => {
      if (!document.hidden) {
        void loadVehicles(controller.signal);
      }
    }, VEHICLE_REFRESH_MS);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [loadVehicles]);

  useEffect(() => {
    if (selectedDirectionId === undefined) {
      return;
    }

    const controller = new AbortController();
    setIsLoadingStops(true);
    setSelectedStopCode("");
    setDepartures([]);

    void fetchRouteStops(
      route.route_id,
      selectedDirectionId,
      controller.signal,
    )
      .then((stopResults) => {
        setStops(stopResults);
        setStopError(undefined);
      })
      .catch((routeError: unknown) => {
        if (!isAbortError(routeError)) {
          setStopError(toErrorMessage(routeError));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoadingStops(false);
        }
      });

    return () => controller.abort();
  }, [route.route_id, selectedDirectionId]);

  const loadDepartures = useCallback(
    async (signal?: AbortSignal) => {
      if (!selectedStopCode || selectedDirectionId === undefined) {
        return;
      }

      setIsLoadingDepartures(true);

      try {
        const stopResult = await fetchStopDepartures(
          route.route_id,
          selectedDirectionId,
          selectedStopCode,
          signal,
        );
        setDepartures(stopResult.departures.slice(0, 5));
        setDepartureError(undefined);
      } catch (routeError) {
        if (!isAbortError(routeError)) {
          setDepartureError(toErrorMessage(routeError));
        }
      } finally {
        if (!signal?.aborted) {
          setIsLoadingDepartures(false);
        }
      }
    },
    [route.route_id, selectedDirectionId, selectedStopCode],
  );

  useEffect(() => {
    if (!selectedStopCode) {
      return;
    }

    const controller = new AbortController();
    void loadDepartures(controller.signal);

    const intervalId = window.setInterval(() => {
      if (!document.hidden) {
        void loadDepartures(controller.signal);
      }
    }, ARRIVAL_REFRESH_MS);

    return () => {
      controller.abort();
      window.clearInterval(intervalId);
    };
  }, [loadDepartures, selectedStopCode]);

  const selectedStop = stops.find(
    (stop) => stop.place_code === selectedStopCode,
  );

  return (
    <section className="route-detail" aria-labelledby="route-detail-title">
      <div className="route-detail-header">
        <button className="back-button" onClick={onBack} type="button">
          <ArrowLeft aria-hidden="true" size={18} />
          All routes
        </button>
        <div className="selected-route-title">
          <span
            className="selected-route-mark"
            style={{ backgroundColor: accent }}
          />
          <div>
            <span>Route {route.route_id}</span>
            <h2 id="route-detail-title">{route.route_label}</h2>
          </div>
        </div>
      </div>

      <section className="map-card" aria-labelledby="live-map-title">
        <div className="map-card-heading">
          <div>
            <span className="section-kicker">Updates every 15 sec</span>
            <h3 id="live-map-title">Live route map</h3>
          </div>
          <span className="vehicle-count">
            <Signal aria-hidden="true" size={14} />
            {vehicles.length} live
          </span>
        </div>
        <RouteMap
          accent={accent}
          routeId={route.route_id}
          shape={shape}
          vehicles={vehicles}
        />
        <div className="map-caption">
          <span>
            {vehicleError
              ? vehicleError
              : vehicles.length > 0
                ? `${vehicles.length} vehicle${vehicles.length === 1 ? "" : "s"} reporting live positions`
                : "No vehicles are reporting on this route right now"}
          </span>
          {vehiclesUpdatedAt ? (
            <span>
              Updated {vehiclesUpdatedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
            </span>
          ) : null}
        </div>
        {shapeUnavailable ? (
          <p className="shape-note">
            Metro Transit’s route line is temporarily unavailable; live vehicle
            markers still appear when vehicles are in service.
          </p>
        ) : null}
      </section>

      <section className="stop-finder" aria-labelledby="stop-finder-title">
        <div className="stop-finder-heading">
          <div>
            <span className="section-kicker">Next departures</span>
            <h3 id="stop-finder-title">Choose a stop</h3>
          </div>
          <MapPin aria-hidden="true" size={19} />
        </div>

        {isLoadingDirections ? (
          <div className="explorer-message">Loading directions…</div>
        ) : null}

        {directionError ? (
          <div className="explorer-message explorer-error" role="alert">
            {directionError}
          </div>
        ) : null}

        {directions.length > 0 ? (
          <div className="direction-options" aria-label="Route direction">
            {directions.map((direction) => (
              <button
                aria-pressed={selectedDirectionId === direction.direction_id}
                key={direction.direction_id}
                onClick={() => setSelectedDirectionId(direction.direction_id)}
                type="button"
              >
                {direction.direction_name}
              </button>
            ))}
          </div>
        ) : null}

        <label className="stop-select-label">
          <span>Stop or station</span>
          <select
            disabled={
              selectedDirectionId === undefined ||
              isLoadingStops ||
              stops.length === 0
            }
            onChange={(event) => setSelectedStopCode(event.target.value)}
            value={selectedStopCode}
          >
            <option value="">
              {isLoadingStops ? "Loading stops…" : "Select a stop"}
            </option>
            {stops.map((stop) => (
              <option key={stop.place_code} value={stop.place_code}>
                {stop.description}
              </option>
            ))}
          </select>
        </label>

        {stopError ? (
          <div className="explorer-message explorer-error" role="alert">
            {stopError}
          </div>
        ) : null}

        {selectedStop ? (
          <div className="selected-stop-board" aria-live="polite">
            <div className="selected-stop-heading">
              <div>
                <span>Departures from</span>
                <h4>{selectedStop.description}</h4>
              </div>
              <button
                aria-label="Refresh stop departures"
                disabled={isLoadingDepartures}
                onClick={() => void loadDepartures()}
                type="button"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={isLoadingDepartures ? "spin" : undefined}
                  size={17}
                />
              </button>
            </div>

            {departureError ? (
              <div className="explorer-message explorer-error" role="alert">
                {departureError}
              </div>
            ) : null}

            {!departureError && isLoadingDepartures && departures.length === 0 ? (
              <div className="explorer-message">Loading departures…</div>
            ) : null}

            {!departureError && !isLoadingDepartures && departures.length === 0 ? (
              <div className="explorer-message">
                No upcoming departures at this stop.
              </div>
            ) : null}

            {departures.length > 0 ? (
              <div className="explorer-departures">
                {departures.map((departure) => (
                  <div
                    className="explorer-departure-row"
                    key={`${departure.trip_id}-${departure.departure_time}`}
                  >
                    <strong>{departure.departure_text}</strong>
                    <span>
                      {departure.description}
                      <small>
                        {departure.route_short_name} · {departure.direction_text}
                      </small>
                    </span>
                    <em className={departure.actual ? "live" : "scheduled"}>
                      {departure.actual ? "Live" : "Scheduled"}
                    </em>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </section>
    </section>
  );
}

function RouteCatalogSkeleton() {
  return (
    <div className="route-catalog route-catalog-skeleton" aria-label="Loading routes">
      {["route-a", "route-b", "route-c", "route-d", "route-e", "route-f"].map(
        (item) => <span className="skeleton" key={item} />,
      )}
    </div>
  );
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Metro Transit request failed.";
}
