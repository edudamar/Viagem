import type { Coord, Viagem } from "@/types";

export function googleMapsUrl(coord: Coord): string {
  return `https://www.google.com/maps?q=${coord.lat},${coord.lng}`;
}

export function googleMapsRouteUrl(coords: Coord[]): string {
  if (coords.length === 0) return "";
  if (coords.length === 1) return googleMapsUrl(coords[0]);
  const origin = coords[0];
  const dest = coords[coords.length - 1];
  const waypoints = coords.slice(1, -1).map((c) => `${c.lat},${c.lng}`).join("|");
  let url = `https://www.google.com/maps/dir/${origin.lat},${origin.lng}/${dest.lat},${dest.lng}`;
  if (waypoints) url += `/${waypoints}`;
  return url;
}

const DAY_COLORS = [
  "0x0d9488",
  "0xe11d48",
  "0x2563eb",
  "0xf59e0b",
  "0x7c3aed",
  "0xdb2777",
  "0x16a34a",
  "0x0891b2",
  "0x7c2d12",
  "0xfb923c",
];

function getBoundingBox(coords: Coord[]) {
  const padding = 0.005;
  const lats = coords.map((c) => c.lat);
  const lngs = coords.map((c) => c.lng);
  const minLat = Math.min(...lats) - padding;
  const maxLat = Math.max(...lats) + padding;
  const minLng = Math.min(...lngs) - padding;
  const maxLng = Math.max(...lngs) + padding;
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;
  const latDiff = maxLat - minLat;
  const lngDiff = maxLng - minLng;
  const zoomLat = Math.floor(Math.log2(360 / latDiff));
  const zoomLng = Math.floor(Math.log2(360 / lngDiff));
  const zoom = Math.min(Math.max(Math.min(zoomLat, zoomLng), 1), 18);
  return { centerLat, centerLng, zoom };
}

export function staticMapUrl(coords: Coord[], width = 600, height = 350): string {
  if (coords.length === 0) return "";

  const { centerLat, centerLng, zoom } = getBoundingBox(coords);

  const markers = coords.map((c, i) =>
    `markers=color:red|label:${i + 1}|${c.lat},${c.lng}`
  ).join("&");

  let path = "";
  if (coords.length > 1) {
    const pathCoords = coords.map((c) => `${c.lat},${c.lng}`).join(",");
    path = `&path=color:0x0d9488|weight:4|${pathCoords}`;
  }

  return `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat},${centerLng}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik&${markers}${path}`;
}

export function staticMapUrlPerDay(viagem: Viagem, width = 760, height = 400): string {
  const allCoords: Coord[] = viagem.dias.flatMap((d) =>
    d.atividades.filter((a) => a.coord).map((a) => a.coord!)
  );
  if (allCoords.length === 0) return "";

  const { centerLat, centerLng, zoom } = getBoundingBox(allCoords);

  const markers: string[] = [];
  const paths: string[] = [];
  let markerIdx = 1;

  viagem.dias.forEach((dia, dayIdx) => {
    const dayCoords = dia.atividades
      .filter((a) => a.coord)
      .map((a) => a.coord!);
    if (dayCoords.length === 0) return;

    const color = DAY_COLORS[dayIdx % DAY_COLORS.length];

    dayCoords.forEach((c) => {
      markers.push(`markers=color:${color}|label:${markerIdx}|${c.lat},${c.lng}`);
      markerIdx++;
    });

    if (dayCoords.length > 1) {
      const pathCoords = dayCoords.map((c) => `${c.lat},${c.lng}`).join(",");
      paths.push(`&path=color:${color}|weight:4|${pathCoords}`);
    }
  });

  const allMarkers = markers.join("&");
  const allPaths = paths.join("");

  return `https://staticmap.openstreetmap.de/staticmap.php?center=${centerLat},${centerLng}&zoom=${zoom}&size=${width}x${height}&maptype=mapnik&${allMarkers}${allPaths}`;
}

export function getDayColors(): string[] {
  return [...DAY_COLORS];
}
