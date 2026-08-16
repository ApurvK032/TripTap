const NEXTRIP_BASE_URL = "https://svc.metrotransit.org";
const MAX_DEPARTURES_PER_CARD = 3;

export type TripSectionId =
  | "home-to-university"
  | "university-to-home";

export type RouteId = "925" | "902";

export interface FeedConfig {
  id: string;
  routeId: RouteId;
  directionId: 0 | 1;
  expectedDirection: string;
  directionLabel: string;
  routeName: string;
  stopName: string;
  stopNickname?: string;
  url: string;
  maxDepartures: number;
}

export interface FeedSection {
  id: TripSectionId;
  title: string;
  subtitle: string;
  feeds: FeedConfig[];
}

export interface NexTripStop {
  stop_id: number;
  latitude: number;
  longitude: number;
  description: string;
}

export interface NexTripDeparture {
  actual: boolean;
  trip_id: string;
  stop_id: number;
  departure_text: string;
  departure_time: number;
  description: string;
  route_id: string;
  route_short_name: string;
  direction_id: number;
  direction_text: string;
  agency_id: number;
  schedule_relationship?: string;
}

export interface NexTripResponse {
  stops: NexTripStop[];
  alerts: unknown[];
  departures: NexTripDeparture[];
}

export interface FeedResult {
  feed: FeedConfig;
  departures: NexTripDeparture[];
  filteredCount: number;
  rawCount: number;
  stopDescription: string;
}

export interface FeedError {
  feed: FeedConfig;
  error: string;
}

export type FeedState = FeedResult | FeedError;

export const feedSections: FeedSection[] = [
  {
    id: "home-to-university",
    title: "Home to University",
    subtitle: "Morning ride in",
    feeds: [
      {
        id: "eline-home-university",
        routeId: "925",
        directionId: 1,
        expectedDirection: "SB",
        directionLabel: "Southbound",
        routeName: "E Line",
        stopName: "University & 27th Ave Station",
        stopNickname: "Accolade",
        url: `${NEXTRIP_BASE_URL}/nextrip/56521`,
        maxDepartures: MAX_DEPARTURES_PER_CARD,
      },
      {
        id: "eline-wahu-university",
        routeId: "925",
        directionId: 1,
        expectedDirection: "SB",
        directionLabel: "Southbound",
        routeName: "E Line",
        stopName: "University & 23rd Ave Station",
        stopNickname: "Wahu",
        url: `${NEXTRIP_BASE_URL}/nextrip/16569`,
        maxDepartures: MAX_DEPARTURES_PER_CARD,
      },
      {
        id: "eline-ridder-university",
        routeId: "925",
        directionId: 1,
        expectedDirection: "SB",
        directionLabel: "Southbound",
        routeName: "E Line",
        stopName: "4th St & Ridder Arena Station",
        stopNickname: "Ridder Arena",
        url: `${NEXTRIP_BASE_URL}/nextrip/16154`,
        maxDepartures: MAX_DEPARTURES_PER_CARD,
      },
      {
        id: "green-prospect-park-westbound",
        routeId: "902",
        directionId: 1,
        expectedDirection: "WB",
        directionLabel: "Westbound",
        routeName: "Green Line",
        stopName: "Prospect Park Station",
        url: `${NEXTRIP_BASE_URL}/nextrip/902/1/PSPK`,
        maxDepartures: MAX_DEPARTURES_PER_CARD,
      },
      {
        id: "green-stadium-village-westbound",
        routeId: "902",
        directionId: 1,
        expectedDirection: "WB",
        directionLabel: "Westbound",
        routeName: "Green Line",
        stopName: "Stadium Village Station",
        url: `${NEXTRIP_BASE_URL}/nextrip/902/1/STVI`,
        maxDepartures: MAX_DEPARTURES_PER_CARD,
      },
    ],
  },
  {
    id: "university-to-home",
    title: "University to Home",
    subtitle: "Evening ride back",
    feeds: [
      {
        id: "eline-dinkytown-home",
        routeId: "925",
        directionId: 0,
        expectedDirection: "NB",
        directionLabel: "Northbound",
        routeName: "E Line",
        stopName: "University & 15th Ave Station",
        stopNickname: "Dinkytown",
        url: `${NEXTRIP_BASE_URL}/nextrip/16137`,
        maxDepartures: MAX_DEPARTURES_PER_CARD,
      },
      {
        id: "eline-rec-center-home",
        routeId: "925",
        directionId: 0,
        expectedDirection: "NB",
        directionLabel: "Northbound",
        routeName: "E Line",
        stopName: "University & U of M Rec Center Station",
        stopNickname: "Rec Center",
        url: `${NEXTRIP_BASE_URL}/nextrip/16142`,
        maxDepartures: MAX_DEPARTURES_PER_CARD,
      },
      {
        id: "eline-huron-home",
        routeId: "925",
        directionId: 0,
        expectedDirection: "NB",
        directionLabel: "Northbound",
        routeName: "E Line",
        stopName: "University & Huron Station",
        stopNickname: "Wahu",
        url: `${NEXTRIP_BASE_URL}/nextrip/16143`,
        maxDepartures: MAX_DEPARTURES_PER_CARD,
      },
      {
        id: "green-east-bank-eastbound",
        routeId: "902",
        directionId: 0,
        expectedDirection: "EB",
        directionLabel: "Eastbound",
        routeName: "Green Line",
        stopName: "East Bank Station",
        url: `${NEXTRIP_BASE_URL}/nextrip/902/0/EABK`,
        maxDepartures: MAX_DEPARTURES_PER_CARD,
      },
      {
        id: "green-stadium-village-eastbound",
        routeId: "902",
        directionId: 0,
        expectedDirection: "EB",
        directionLabel: "Eastbound",
        routeName: "Green Line",
        stopName: "Stadium Village Station",
        url: `${NEXTRIP_BASE_URL}/nextrip/902/0/STVI`,
        maxDepartures: MAX_DEPARTURES_PER_CARD,
      },
      {
        id: "green-prospect-park-eastbound",
        routeId: "902",
        directionId: 0,
        expectedDirection: "EB",
        directionLabel: "Eastbound",
        routeName: "Green Line",
        stopName: "Prospect Park Station",
        url: `${NEXTRIP_BASE_URL}/nextrip/902/0/PSPK`,
        maxDepartures: MAX_DEPARTURES_PER_CARD,
      },
    ],
  },
];

export const allFeeds = feedSections.flatMap((section) => section.feeds);

export function isFeedError(state: FeedState): state is FeedError {
  return "error" in state;
}

export async function fetchBoardFeeds(signal?: AbortSignal): Promise<FeedState[]> {
  return Promise.all(
    allFeeds.map(async (feed) => {
      try {
        return await fetchFeed(feed, signal);
      } catch (error) {
        return {
          feed,
          error:
            error instanceof Error
              ? error.message
              : "Metro Transit request failed.",
        } satisfies FeedError;
      }
    }),
  );
}

async function fetchFeed(
  feed: FeedConfig,
  signal?: AbortSignal,
): Promise<FeedResult> {
  const response = await fetch(feed.url, {
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Metro Transit returned ${response.status}.`);
  }

  const data = (await response.json()) as NexTripResponse;
  const matchingDepartures = data.departures
    .filter(
      (departure) =>
        departure.route_id === feed.routeId &&
        departure.direction_id === feed.directionId,
    )
    .sort((a, b) => a.departure_time - b.departure_time);

  return {
    feed,
    departures: matchingDepartures.slice(0, feed.maxDepartures),
    filteredCount: matchingDepartures.length,
    rawCount: data.departures.length,
    stopDescription: data.stops[0]?.description ?? feed.stopName,
  };
}
