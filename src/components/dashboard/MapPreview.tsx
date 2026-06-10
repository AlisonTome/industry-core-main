import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Maximize2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

declare global {
  interface Window {
    L?: any;
  }
}

export type MapPoint = {
  id: string;
  label: string;
  location: string;
};

type GeoPoint = MapPoint & {
  lat: number;
  lon: number;
};

const LEAFLET_CSS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
const LEAFLET_JS = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
let leafletLoad: Promise<any> | null = null;

function loadLeaflet() {
  if (window.L) return Promise.resolve(window.L);
  if (leafletLoad) return leafletLoad;

  leafletLoad = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LEAFLET_CSS;
      document.head.appendChild(link);
    }

    const script = document.createElement("script");
    script.src = LEAFLET_JS;
    script.async = true;
    script.onload = () => resolve(window.L);
    script.onerror = reject;
    document.body.appendChild(script);
  });

  return leafletLoad;
}

async function geocode(point: MapPoint, signal: AbortSignal): Promise<GeoPoint | null> {
  const attempts = [
    point.location,
    point.location.replace(/\s-\s[^,]+,/, ","),
    point.location.replace(/,\s*\d{5}-?\d{3}/, ""),
  ];

  for (const query of [...new Set(attempts)]) {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(query)}`, { signal });
    const data = await response.json();
    const first = Array.isArray(data) ? data[0] : null;
    if (first?.lat && first?.lon) return { ...point, location: query, lat: Number(first.lat), lon: Number(first.lon) };
  }

  return null;
}

function LeafletMap({ points, large }: { points: GeoPoint[]; large?: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerLayerRef = useRef<any>(null);

  useEffect(() => {
    let disposed = false;

    loadLeaflet().then((L) => {
      if (disposed || !containerRef.current) return;

      if (!mapRef.current) {
        mapRef.current = L.map(containerRef.current, { scrollWheelZoom: true, zoomControl: true });
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "&copy; OpenStreetMap",
        }).addTo(mapRef.current);
        markerLayerRef.current = L.layerGroup().addTo(mapRef.current);
      }

      markerLayerRef.current.clearLayers();
      points.forEach((point) => {
        L.marker([point.lat, point.lon]).bindPopup(`<strong>${point.label}</strong><br>${point.location}`).addTo(markerLayerRef.current);
      });

      if (points.length === 1) {
        mapRef.current.setView([points[0].lat, points[0].lon], 12);
      } else {
        const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lon]));
        mapRef.current.fitBounds(bounds, { padding: [36, 36], maxZoom: 12 });
      }

      setTimeout(() => mapRef.current?.invalidateSize(), 80);
    });

    return () => {
      disposed = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerLayerRef.current = null;
      }
    };
  }, [points]);

  return <div ref={containerRef} className={large ? "h-[70vh] w-full" : "h-64 w-full"} />;
}

export function MapPreview({ title = "Mapa", emptyMessage = "Nenhum ponto para exibir no mapa.", points }: { title?: string; emptyMessage?: string; points: MapPoint[] }) {
  const [geoPoints, setGeoPoints] = useState<GeoPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const normalizedPoints = useMemo(() => points.filter((p) => p.location.trim()), [points]);

  useEffect(() => {
    const controller = new AbortController();
    if (!normalizedPoints.length) {
      setGeoPoints([]);
      return () => controller.abort();
    }

    setLoading(true);
    Promise.all(normalizedPoints.slice(0, 12).map((point) => geocode(point, controller.signal).catch(() => null)))
      .then((results) => setGeoPoints(results.filter(Boolean) as GeoPoint[]))
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [normalizedPoints]);

  const content = (large = false) => (
    <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
      {geoPoints.length ? (
        <LeafletMap points={geoPoints} large={large} />
      ) : (
        <div className={large ? "grid h-[70vh] place-items-center px-6 text-center text-sm text-muted-foreground" : "grid h-64 place-items-center px-6 text-center text-sm text-muted-foreground"}>
          {loading ? "Localizando pontos no mapa..." : emptyMessage}
        </div>
      )}
      <Button type="button" size="sm" variant="outline" className="absolute right-3 top-3 z-[500] bg-background/95" onClick={() => setExpanded(true)}>
        <Maximize2 className="mr-1 h-3.5 w-3.5" /> Expandir
      </Button>
    </div>
  );

  return (
    <>
      {content()}
      <Dialog open={expanded} onOpenChange={setExpanded}>
        <DialogContent className="max-w-6xl">
          <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
          {content(true)}
        </DialogContent>
      </Dialog>
    </>
  );
}
