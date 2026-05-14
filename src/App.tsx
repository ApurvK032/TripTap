import { RefreshCw, Route, Signal, WifiOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FeedConfig,
  FeedState,
  feedSections,
  fetchBoardFeeds,
  isFeedError,
  NexTripDeparture,
} from "./transit";

const REFRESH_INTERVAL_MS = 25_000;

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

  const anySuccessfulFeeds = useMemo(
    () =>
      Object.values(snapshot.feeds).some((feedState) => !isFeedError(feedState)),
    [snapshot.feeds],
  );
  const allFeedsFailed =
    snapshot.phase === "ready" &&
    Object.keys(snapshot.feeds).length > 0 &&
    !anySuccessfulFeeds;

  return (
    <div className="app-shell">
      <header className="board-header">
        <div>
          <p className="kicker">Prospect Park Transit Board</p>
          <h1>TripTap</h1>
          <p className="updated" aria-live="polite">
            {snapshot.lastUpdated
              ? `Last updated ${timeFormatter.format(snapshot.lastUpdated)}`
              : "Loading departures"}
          </p>
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

      <main>
        {allFeedsFailed ? (
          <div className="notice error-notice" role="alert">
            <WifiOff aria-hidden="true" size={20} />
            <span>Metro Transit departures are unavailable right now.</span>
          </div>
        ) : null}

        {feedSections.map((section) => (
          <section className="trip-section" key={section.id}>
            <h2>{section.title}</h2>
            <div className="feed-grid">
              {section.feeds.map((feed) => (
                <FeedCard
                  feed={feed}
                  isLoading={snapshot.phase === "loading"}
                  key={feed.id}
                  state={snapshot.feeds[feed.id]}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </div>
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

  return (
    <article className="feed-card">
      <div className="feed-heading">
        <div>
          <div className="route-line">
            <span className={`route-pill ${routeTone}`}>{feed.routeName}</span>
            <span className="direction-pill">{feed.expectedDirection}</span>
          </div>
          <h3>{feed.stopName}</h3>
        </div>
        <Route aria-hidden="true" className="route-icon" size={22} />
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
              state.departures.map((departure) => (
                <DepartureRow
                  departure={departure}
                  expectedDirection={feed.expectedDirection}
                  key={`${departure.trip_id}-${departure.departure_time}`}
                />
              ))
            ) : (
              <p className="empty-state">
                No upcoming {feed.routeName} departures in this direction.
              </p>
            )}
          </div>
          <p className="filter-note">
            Showing {state.departures.length} of {state.filteredCount} matching
            departures
            {state.rawCount !== state.filteredCount
              ? ` from ${state.rawCount} total`
              : ""}
            .
          </p>
        </>
      ) : null}
    </article>
  );
}

function DepartureRow({
  departure,
  expectedDirection,
}: {
  departure: NexTripDeparture;
  expectedDirection: string;
}) {
  return (
    <div className="departure-row">
      <div className="departure-time">{departure.departure_text}</div>
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

function LoadingRows() {
  return (
    <div className="departures" aria-label="Loading departures">
      {[0, 1, 2].map((row) => (
        <div className="departure-row skeleton-row" key={row}>
          <span className="skeleton time-skeleton" />
          <span className="skeleton destination-skeleton" />
          <span className="skeleton status-skeleton" />
        </div>
      ))}
    </div>
  );
}
