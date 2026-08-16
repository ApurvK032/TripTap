import {
  ArrowRight,
  Bus,
  GraduationCap,
  Home,
  RefreshCw,
  Signal,
  Train,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { RouteExplorer } from "./RouteExplorer";
import {
  FeedConfig,
  FeedState,
  feedSections,
  fetchBoardFeeds,
  isFeedError,
  NexTripDeparture,
  TripSectionId,
} from "./transit";

type BoardViewId = TripSectionId | "other-stops";

interface TripOption {
  accessibleLabel: string;
  id: BoardViewId;
  label?: string;
}

const REFRESH_INTERVAL_MS = 25_000;
const DEFAULT_VIEW_ID: BoardViewId = "university-to-home";

const tripOptions: readonly TripOption[] = [
  {
    accessibleLabel: "Home to university",
    id: "home-to-university",
  },
  {
    accessibleLabel: "University to home",
    id: "university-to-home",
  },
  {
    accessibleLabel: "Other stops",
    id: "other-stops",
    label: "Other stops",
  },
];

type LoadPhase = "idle" | "loading" | "ready";

interface BoardSnapshot {
  phase: LoadPhase;
  feeds: Record<string, FeedState>;
  lastUpdated?: Date;
  isRefreshing: boolean;
}

const initialSnapshot: BoardSnapshot = {
  phase: "idle",
  feeds: {},
  isRefreshing: false,
};

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
  second: "2-digit",
});

export function App() {
  const [activeViewId, setActiveViewId] =
    useState<BoardViewId>(DEFAULT_VIEW_ID);
  const [snapshot, setSnapshot] = useState<BoardSnapshot>(initialSnapshot);
  const abortRef = useRef<AbortController | null>(null);

  const loadDepartures = useCallback(async (mode: "initial" | "refresh") => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setSnapshot((current) => ({
      ...current,
      phase: current.phase === "idle" ? "loading" : current.phase,
      isRefreshing: mode === "refresh",
    }));

    const feedStates = await fetchBoardFeeds(controller.signal);

    if (controller.signal.aborted) {
      return;
    }

    setSnapshot({
      phase: "ready",
      feeds: Object.fromEntries(
        feedStates.map((feedState) => [feedState.feed.id, feedState]),
      ),
      lastUpdated: new Date(),
      isRefreshing: false,
    });
  }, []);

  useEffect(() => {
    void loadDepartures("initial");

    const intervalId = window.setInterval(() => {
      if (!document.hidden) {
        void loadDepartures("refresh");
      }
    }, REFRESH_INTERVAL_MS);

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        void loadDepartures("refresh");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      abortRef.current?.abort();
    };
  }, [loadDepartures]);

  const activeSection =
    feedSections.find((section) => section.id === activeViewId) ??
    feedSections[0];
  const activeFeedStates = activeSection.feeds
    .map((feed) => snapshot.feeds[feed.id])
    .filter((state): state is FeedState => Boolean(state));
  const sortedActiveFeeds = sortFeedsByNextDeparture(
    activeSection.feeds,
    snapshot.feeds,
  );
  const activeSectionFailed =
    snapshot.phase === "ready" &&
    activeFeedStates.length === activeSection.feeds.length &&
    activeFeedStates.every((state) => isFeedError(state));

  const renderTripOption = (option: TripOption) => (
    <button
      aria-label={option.accessibleLabel}
      aria-pressed={activeViewId === option.id}
      className={`trip-option ${
        option.id === "other-stops"
          ? "other-stops-option"
          : "route-icon-option"
      }`}
      key={option.id}
      onClick={() => setActiveViewId(option.id)}
      type="button"
    >
      {option.id === "home-to-university" ? (
        <TripRouteIcons from="home" to="university" />
      ) : option.id === "university-to-home" ? (
        <TripRouteIcons from="university" to="home" />
      ) : (
        <>
          <Train aria-hidden="true" size={15} />
          <span>{option.label}</span>
        </>
      )}
    </button>
  );

  return (
    <div className="app-shell">
      <header className="board-header">
        <div className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            T
          </span>
          <div className="title-block">
            <p className="kicker">Prospect Park transit</p>
            <h1>
              Trip<span>Tap</span>
            </h1>
          </div>
        </div>
        <button
          className="refresh-button"
          disabled={snapshot.isRefreshing || snapshot.phase === "loading"}
          onClick={() => void loadDepartures("refresh")}
          title="Refresh departures"
          aria-label="Refresh departures"
        >
          <RefreshCw
            aria-hidden="true"
            className={snapshot.isRefreshing ? "spin" : undefined}
            size={20}
          />
          <span>Refresh</span>
        </button>
      </header>

      <div className="board-status" aria-live="polite">
        <span className="live-status">
          <span className="status-beacon" aria-hidden="true" />
          Live board
        </span>
        <span className="updated">
          {snapshot.lastUpdated
            ? `Updated ${timeFormatter.format(snapshot.lastUpdated)}`
            : "Connecting to Metro Transit"}
        </span>
        <span className="refresh-cycle">Auto-refresh · 25 sec</span>
      </div>

      <nav className="trip-switcher" aria-label="Choose a trip board">
        {tripOptions.map(renderTripOption)}
      </nav>

      <main>
        {activeViewId === "other-stops" ? (
          <RouteExplorer />
        ) : (
          <>
            {activeSectionFailed ? (
              <div className="notice error-notice" role="alert">
                <WifiOff aria-hidden="true" size={20} />
                <span>This trip board is unavailable right now.</span>
              </div>
            ) : null}

            <section className="trip-section" key={activeSection.id}>
              <div className="section-heading">
                <div className="section-title">
                  <span className="section-icon" aria-hidden="true">
                    <SectionIcon id={activeSection.id} />
                  </span>
                  <div>
                    <span className="section-kicker">
                      {activeSection.subtitle}
                    </span>
                    <h2>{activeSection.title}</h2>
                  </div>
                </div>
                <span className="section-count">
                  {activeSection.feeds.length}{" "}
                  {activeSection.feeds.length === 1 ? "stop" : "stops"}
                </span>
              </div>
              <div className="feed-grid">
                {sortedActiveFeeds.map((feed) => (
                  <FeedCard
                    feed={feed}
                    isLoading={snapshot.phase === "loading"}
                    key={feed.id}
                    state={snapshot.feeds[feed.id]}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

function sortFeedsByNextDeparture(
  feeds: FeedConfig[],
  feedStates: Record<string, FeedState>,
) {
  return feeds
    .map((feed, originalIndex) => {
      const state = feedStates[feed.id];
      const nextDepartureTime =
        state && !isFeedError(state) && state.departures.length > 0
          ? state.departures[0].departure_time
          : Number.POSITIVE_INFINITY;

      return { feed, nextDepartureTime, originalIndex };
    })
    .sort((a, b) => {
      if (a.nextDepartureTime !== b.nextDepartureTime) {
        return a.nextDepartureTime - b.nextDepartureTime;
      }

      return a.originalIndex - b.originalIndex;
    })
    .map(({ feed }) => feed);
}

function TripRouteIcons({
  from,
  to,
}: {
  from: "home" | "university";
  to: "home" | "university";
}) {
  const renderEndpoint = (endpoint: "home" | "university") =>
    endpoint === "home" ? (
      <Home aria-hidden="true" size={19} strokeWidth={1.9} />
    ) : (
      <GraduationCap aria-hidden="true" size={20} strokeWidth={1.9} />
    );

  return (
    <span className="trip-route-icons" aria-hidden="true">
      {renderEndpoint(from)}
      <ArrowRight className="trip-route-arrow" size={17} strokeWidth={1.8} />
      {renderEndpoint(to)}
    </span>
  );
}

function FeedCard({
  feed,
  isLoading,
  state,
}: {
  feed: FeedConfig;
  isLoading: boolean;
  state?: FeedState;
}) {
  const routeTone = feed.routeId === "902" ? "green-line" : "e-line";
  const displayStopName = feed.stopNickname ?? feed.stopName;

  return (
    <article className={`feed-card ${routeTone}`}>
      <div className="feed-heading">
        <span className={`route-pill ${routeTone}`}>
          {routeTone === "green-line" ? (
            <Train aria-hidden="true" size={14} />
          ) : (
            <Bus aria-hidden="true" size={14} />
          )}
          {feed.routeName}
        </span>
        <span className="direction-pill">
          {feed.expectedDirection} · {feed.directionLabel}
        </span>
      </div>

      <div className="stop-title">
        <span className="stop-label">Departures from</span>
        <h3>{displayStopName}</h3>
        {feed.stopNickname ? <span>{feed.stopName}</span> : null}
      </div>

      {isLoading ? <LoadingRows /> : null}

      {!isLoading && state && isFeedError(state) ? (
        <div className="feed-error" role="alert">
          <WifiOff aria-hidden="true" size={18} />
          <span>{state.error}</span>
        </div>
      ) : null}

      {!isLoading && state && !isFeedError(state) ? (
        <>
          <div className="departures">
            {state.departures.length > 0 ? (
              state.departures.map((departure, index) => (
                <DepartureRow
                  departure={departure}
                  expectedDirection={feed.expectedDirection}
                  isNext={index === 0}
                  key={`${departure.trip_id}-${departure.departure_time}`}
                  orderLabel={getDepartureOrderLabel(index)}
                />
              ))
            ) : (
              <p className="empty-state">
                No upcoming {feed.routeName} departures in this direction.
              </p>
            )}
          </div>
          <div className="card-footer">
            <span>{state.departures.length} upcoming departures</span>
            <span>
              {state.departures.some((departure) => departure.actual)
                ? "Realtime service"
                : "Scheduled service"}
            </span>
          </div>
        </>
      ) : null}
    </article>
  );
}

function DepartureRow({
  departure,
  expectedDirection,
  isNext,
  orderLabel,
}: {
  departure: NexTripDeparture;
  expectedDirection: string;
  isNext: boolean;
  orderLabel: string;
}) {
  return (
    <div className={`departure-row ${isNext ? "is-next" : ""}`}>
      <div className="departure-time-cell">
        <span className="departure-order">{orderLabel}</span>
        <DepartureTime text={departure.departure_text} />
      </div>
      <div className="departure-details">
        <span className="destination">{departure.description}</span>
        <span className="route-meta">
          {departure.route_short_name} {departure.direction_text || expectedDirection}
        </span>
      </div>
      <span className={`status-pill ${departure.actual ? "live" : "scheduled"}`}>
        {departure.actual ? (
          <Signal aria-hidden="true" size={14} />
        ) : null}
        {departure.actual ? "Live" : "Scheduled"}
      </span>
    </div>
  );
}

function getDepartureOrderLabel(index: number) {
  return ["Next", "Then", "Later"][index] ?? "Later";
}

function DepartureTime({ text }: { text: string }) {
  const minuteMatch = text.match(/^(\d+)\s*Min$/i);

  if (minuteMatch) {
    return (
      <div className="departure-time">
        {minuteMatch[1]}
        <span>min</span>
      </div>
    );
  }

  return (
    <div className={`departure-time ${/^due$/i.test(text) ? "is-due" : ""}`}>
      {text}
    </div>
  );
}

function SectionIcon({ id }: { id: TripSectionId }) {
  if (id === "home-to-university") {
    return <GraduationCap aria-hidden="true" size={15} />;
  }

  return <Home aria-hidden="true" size={15} />;
}

function LoadingRows() {
  return (
    <div className="departures" aria-label="Loading departures">
      {[0, 1, 2].map((row) => (
        <div
          className={`departure-row skeleton-row ${row === 0 ? "is-next" : ""}`}
          key={row}
        >
          <span className="skeleton time-skeleton" />
          <span className="skeleton destination-skeleton" />
          <span className="skeleton status-skeleton" />
        </div>
      ))}
    </div>
  );
}
