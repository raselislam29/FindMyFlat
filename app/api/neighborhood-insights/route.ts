import { NextRequest, NextResponse } from "next/server";

type TransitStop = {
  name: string;
  type: string;
  distanceMeters: number;
};

type CommuteHub = {
  name: string;
  durationMinutes: number;
};

const HUBS = [
  { name: "Downtown", lat: 40.7128, lng: -74.006 },
  { name: "Midtown", lat: 40.7549, lng: -73.984 },
  { name: "Central Business District", lat: 40.7411, lng: -73.9897 },
];

const toRad = (value: number) => (value * Math.PI) / 180;

const haversineDistanceKm = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
) => {
  const earthRadiusKm = 6371;
  const deltaLat = toRad(toLat - fromLat);
  const deltaLng = toRad(toLng - fromLng);
  const lat1 = toRad(fromLat);
  const lat2 = toRad(toLat);

  const sinDeltaLat = Math.sin(deltaLat / 2);
  const sinDeltaLng = Math.sin(deltaLng / 2);

  const a =
    sinDeltaLat * sinDeltaLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDeltaLng * sinDeltaLng;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
};

const estimateDurationMinutes = (
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
) => {
  const distanceKm = haversineDistanceKm(fromLat, fromLng, toLat, toLng);
  const averageUrbanSpeedKmh = 28;
  return Math.max(5, Math.round((distanceKm / averageUrbanSpeedKmh) * 60));
};

const classifyTransitType = (stop: any) => {
  if (stop.tags?.railway === "station") return "Rail Station";
  if (stop.tags?.public_transport === "platform") return "Transit Platform";
  return "Bus Stop";
};

const stopName = (stop: any) =>
  stop.tags?.name ||
  stop.tags?.['name:en'] ||
  `${classifyTransitType(stop)} #${stop.id}`;

const distanceMeters = (lat: number, lng: number, toLat: number, toLng: number) =>
  Math.round(haversineDistanceKm(lat, lng, toLat, toLng) * 1000);

const fetchNearbyData = async (lat: number, lng: number) => {
  const overpassQuery = `
[out:json][timeout:20];
(
  node(around:1200,${lat},${lng})[highway=bus_stop];
  node(around:1200,${lat},${lng})[railway=station];
  node(around:1200,${lat},${lng})[public_transport=platform];
  node(around:1000,${lat},${lng})[amenity~"school|hospital|pharmacy|supermarket|cafe|restaurant|bank|library"];
  node(around:1000,${lat},${lng})[leisure=park];
);
out body;
`;

  const response = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: overpassQuery,
    next: { revalidate: 1800 },
  });

  if (!response.ok) {
    throw new Error(`Overpass failed with status ${response.status}`);
  }

  return (await response.json()) as { elements?: any[] };
};

const fetchCommute = async (
  lat: number,
  lng: number,
  hubLat: number,
  hubLng: number,
) => {
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${lng},${lat};${hubLng},${hubLat}?overview=false`;

  try {
    const response = await fetch(osrmUrl, { next: { revalidate: 1800 } });
    if (!response.ok) {
      return estimateDurationMinutes(lat, lng, hubLat, hubLng);
    }

    const payload = (await response.json()) as {
      routes?: Array<{ duration?: number }>;
    };

    const seconds = payload.routes?.[0]?.duration;
    if (!seconds) {
      return estimateDurationMinutes(lat, lng, hubLat, hubLng);
    }

    return Math.max(5, Math.round(seconds / 60));
  } catch {
    return estimateDurationMinutes(lat, lng, hubLat, hubLng);
  }
};

export async function GET(request: NextRequest) {
  const latParam = request.nextUrl.searchParams.get("lat");
  const lngParam = request.nextUrl.searchParams.get("lng");

  if (!latParam || !lngParam) {
    return NextResponse.json(
      { message: "lat and lng query parameters are required" },
      { status: 400 },
    );
  }

  const lat = Number(latParam);
  const lng = Number(lngParam);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    return NextResponse.json(
      { message: "lat and lng must be valid numbers" },
      { status: 400 },
    );
  }

  try {
    const nearbyData = await fetchNearbyData(lat, lng);
    const elements = nearbyData.elements || [];

    const transitCandidates = elements.filter(
      (item) =>
        item.tags?.highway === "bus_stop" ||
        item.tags?.railway === "station" ||
        item.tags?.public_transport === "platform",
    );

    const transitStops: TransitStop[] = transitCandidates
      .map((item) => ({
        name: stopName(item),
        type: classifyTransitType(item),
        distanceMeters: distanceMeters(lat, lng, item.lat, item.lon),
      }))
      .sort((a, b) => a.distanceMeters - b.distanceMeters)
      .slice(0, 5);

    const amenityCandidates = elements.filter(
      (item) => item.tags?.amenity || item.tags?.leisure === "park",
    );

    const amenityKinds = new Set(
      amenityCandidates.map((item) => item.tags?.amenity || item.tags?.leisure),
    );

    const walkabilityScore = Math.min(
      100,
      Math.round(
        amenityCandidates.length * 3.2 +
          transitStops.length * 8 +
          amenityKinds.size * 5,
      ),
    );

    const commuteTimes: CommuteHub[] = await Promise.all(
      HUBS.map(async (hub) => ({
        name: hub.name,
        durationMinutes: await fetchCommute(lat, lng, hub.lat, hub.lng),
      })),
    );

    return NextResponse.json({
      walkabilityScore,
      nearbyTransitStops: transitStops,
      commuteTimes,
      calculatedFrom: {
        transitStopsCount: transitCandidates.length,
        nearbyAmenitiesCount: amenityCandidates.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        message: "Failed to fetch neighborhood insights",
        details: error?.message || "Unknown error",
      },
      { status: 500 },
    );
  }
}