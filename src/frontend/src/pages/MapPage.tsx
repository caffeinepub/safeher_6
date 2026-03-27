import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import L from "leaflet";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Filter,
  Loader2,
  MapPin,
  Phone,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { toast } from "sonner";
import { getNearestContacts } from "../data/emergencyContacts";
import type {
  AlertRecord,
  DangerZone,
  IndiaOfficialContact,
  RiskLevel,
} from "../types";

// Fix Leaflet default icon
(L.Icon.Default.prototype as any)._getIconUrl = undefined;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const userIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const dangerIcon = new L.DivIcon({
  className: "",
  html: `<div style="width:28px;height:28px;background:#DC2626;border:2px solid #991b1b;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;">⚠️</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const RISK_STYLES: Record<RiskLevel, { color: string; fillOpacity: number }> = {
  critical: { color: "#7f1d1d", fillOpacity: 0.25 },
  high: { color: "#DC2626", fillOpacity: 0.18 },
  medium: { color: "#f97316", fillOpacity: 0.15 },
  low: { color: "#eab308", fillOpacity: 0.12 },
};

const RISK_DOT_COLORS: Record<RiskLevel, string> = {
  critical: "#7f1d1d",
  high: "#DC2626",
  medium: "#f97316",
  low: "#eab308",
};

function getZoneStyle(riskLevel?: RiskLevel) {
  const style = RISK_STYLES[riskLevel ?? "high"];
  return {
    color: style.color,
    fillColor: style.color,
    fillOpacity: style.fillOpacity,
    weight: 2,
  };
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function RecenterButton({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  return (
    <button
      type="button"
      onClick={() => map.flyTo([lat, lng], 15)}
      className="absolute bottom-20 right-4 z-[1000] w-10 h-10 bg-card border border-border rounded-lg flex items-center justify-center shadow-card"
      aria-label="Recenter map"
      data-ocid="map.recenter.button"
    >
      <Crosshair className="w-5 h-5 text-foreground" />
    </button>
  );
}

/** Check if point is inside radius-based zone */
function isInRadiusZone(lat: number, lng: number, zone: DangerZone): boolean {
  try {
    const R = 6371000;
    const dLat = ((zone.lat - lat) * Math.PI) / 180;
    const dLng = ((zone.lng - lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat * Math.PI) / 180) *
        Math.cos((zone.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return dist <= zone.radius;
  } catch (err) {
    console.error(
      `[SafeHer] Geofence error checking zone "${zone.name}" (${zone.id}):`,
      err,
    );
    return false;
  }
}

/** Ray-casting algorithm for point-in-polygon */
function isInPolygon(
  lat: number,
  lng: number,
  polygon: [number, number][],
): boolean {
  try {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][1];
      const yi = polygon[i][0];
      const xj = polygon[j][1];
      const yj = polygon[j][0];
      const intersect =
        yi > lat !== yj > lat &&
        lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  } catch (err) {
    console.error("[SafeHer] Polygon geofence error:", err);
    return false;
  }
}

function isInDangerZone(lat: number, lng: number, zone: DangerZone): boolean {
  if (zone.polygon && zone.polygon.length >= 3) {
    return isInPolygon(lat, lng, zone.polygon);
  }
  return isInRadiusZone(lat, lng, zone);
}

interface MapPageProps {
  zones: DangerZone[];
  onAlertAdded: (a: AlertRecord) => void;
  officialContacts: IndiaOfficialContact[];
}

function DangerZoneLayer({ zone }: { zone: DangerZone }) {
  const style = getZoneStyle(zone.riskLevel);
  try {
    if (zone.polygon && zone.polygon.length >= 3) {
      return (
        <>
          <Polygon positions={zone.polygon} pathOptions={style}>
            <Popup>
              <strong>⚠️ {zone.name}</strong>
              <br />
              Risk: {zone.riskLevel ?? "high"} | {zone.city ?? ""}
              {zone.state ? `, ${zone.state}` : ""}
            </Popup>
          </Polygon>
          <Marker position={[zone.lat, zone.lng]} icon={dangerIcon}>
            <Popup>
              <strong>⚠️ {zone.name}</strong>
              <br />
              High-risk polygon area
            </Popup>
          </Marker>
        </>
      );
    }
    return (
      <>
        <Circle
          center={[zone.lat, zone.lng]}
          radius={zone.radius}
          pathOptions={style}
        >
          <Popup>
            <strong>⚠️ {zone.name}</strong>
            <br />
            Risk: {zone.riskLevel ?? "high"} | Radius: {zone.radius}m
            <br />
            {zone.city ?? ""}
            {zone.state ? `, ${zone.state}` : ""}
          </Popup>
        </Circle>
        <Marker position={[zone.lat, zone.lng]} icon={dangerIcon}>
          <Popup>
            <strong>⚠️ {zone.name}</strong>
            <br />
            {zone.city}, {zone.state}
          </Popup>
        </Marker>
      </>
    );
  } catch (err) {
    console.error(
      `[SafeHer] Failed to render zone "${zone.name}" (${zone.id}):`,
      err,
    );
    return null;
  }
}

// MapBoundsListener: updates bounds state on map move/zoom
function MapBoundsListener({
  onBoundsChange,
}: {
  onBoundsChange: (bounds: L.LatLngBounds, center: L.LatLng) => void;
}) {
  const map = useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds(), map.getCenter());
    },
    zoomend: () => {
      onBoundsChange(map.getBounds(), map.getCenter());
    },
  });
  return null;
}

const CONTACT_TYPE_LABELS: Record<string, string> = {
  police_station: "Police",
  police_control_room: "Control Room",
  women_helpline: "Women Helpline",
  ambulance: "Ambulance",
  national_emergency: "National",
};

const CONTACT_TYPE_COLORS: Record<string, string> = {
  police_station: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  police_control_room: "bg-blue-700/20 text-blue-300 border-blue-700/30",
  women_helpline: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  ambulance: "bg-green-500/20 text-green-400 border-green-500/30",
  national_emergency: "bg-orange-500/20 text-orange-400 border-orange-500/30",
};

export default function MapPage({
  zones,
  onAlertAdded,
  officialContacts,
}: MapPageProps) {
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [activeZones, setActiveZones] = useState<DangerZone[]>([]);
  const alertedZones = useRef<Set<string>>(new Set());

  // Filter state
  const [filterState, setFilterState] = useState<string>("all");
  const [filterRisk, setFilterRisk] = useState<string>("all");
  const [filterNearby, setFilterNearby] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  // Map viewport state
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([
    20.5937, 78.9629,
  ]);

  // Unique states for dropdown
  const uniqueStates = useMemo(() => {
    const s = new Set<string>();
    for (const z of zones) if (z.state) s.add(z.state);
    return Array.from(s).sort();
  }, [zones]);

  // Compute visible zones based on filters + viewport
  const visibleZones = useMemo(() => {
    let filtered = zones;

    // State filter
    if (filterState !== "all") {
      filtered = filtered.filter((z) => z.state === filterState);
    }

    // Risk level filter
    if (filterRisk !== "all") {
      filtered = filtered.filter((z) => (z.riskLevel ?? "high") === filterRisk);
    }

    // Nearby filter: 10km from user
    if (filterNearby && userPos) {
      filtered = filtered.filter(
        (z) => distanceKm(userPos[0], userPos[1], z.lat, z.lng) <= 10,
      );
    }

    // Viewport filter with 20% buffer
    if (mapBounds) {
      const ne = mapBounds.getNorthEast();
      const sw = mapBounds.getSouthWest();
      const latBuf = (ne.lat - sw.lat) * 0.2;
      const lngBuf = (ne.lng - sw.lng) * 0.2;
      const expanded = L.latLngBounds(
        [sw.lat - latBuf, sw.lng - lngBuf],
        [ne.lat + latBuf, ne.lng + lngBuf],
      );
      filtered = filtered.filter((z) => expanded.contains([z.lat, z.lng]));
    }

    // Cap at 80 zones — take closest to center
    if (filtered.length > 80) {
      const [cLat, cLng] = mapCenter;
      filtered = [...filtered]
        .sort(
          (a, b) =>
            distanceKm(cLat, cLng, a.lat, a.lng) -
            distanceKm(cLat, cLng, b.lat, b.lng),
        )
        .slice(0, 80);
    }

    return filtered;
  }, [
    zones,
    filterState,
    filterRisk,
    filterNearby,
    userPos,
    mapBounds,
    mapCenter,
  ]);

  const isFiltered =
    filterState !== "all" || filterRisk !== "all" || filterNearby;

  // Zones grouped by state for summary panel
  const zonesByState = useMemo(() => {
    const map: Record<string, { count: number; topRisk: RiskLevel }> = {};
    for (const z of visibleZones) {
      const state = z.state ?? "Unknown";
      const risk = (z.riskLevel ?? "high") as RiskLevel;
      if (!map[state]) map[state] = { count: 0, topRisk: "low" };
      map[state].count++;
      const riskOrder: RiskLevel[] = ["low", "medium", "high", "critical"];
      if (riskOrder.indexOf(risk) > riskOrder.indexOf(map[state].topRisk)) {
        map[state].topRisk = risk;
      }
    }
    return Object.entries(map).sort((a, b) => b[1].count - a[1].count);
  }, [visibleZones]);

  // Nearby official contacts (excluding All India)
  const nearbyOfficialContacts = useMemo(() => {
    if (!userPos) return [];
    return getNearestContacts(userPos[0], userPos[1], officialContacts, 3);
  }, [userPos, officialContacts]);

  // Nearest police + women helpline for danger zone banner
  const nearestHelp = useMemo(() => {
    if (!userPos || activeZones.length === 0) return null;
    const police = officialContacts
      .filter(
        (c) =>
          c.state !== "All India" &&
          (c.type === "police_station" || c.type === "police_control_room"),
      )
      .map((c) => ({
        ...c,
        distanceKm: distanceKm(userPos[0], userPos[1], c.lat, c.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];
    const helpline = officialContacts
      .filter((c) => c.type === "women_helpline")
      .map((c) => ({
        ...c,
        distanceKm: distanceKm(userPos[0], userPos[1], c.lat, c.lng),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)[0];
    return { police, helpline };
  }, [userPos, activeZones, officialContacts]);

  useEffect(() => {
    console.group("[SafeHer] Danger Zones Loaded");
    console.log(`Total zones: ${zones.length}`);
    console.groupEnd();
  }, [zones]);

  const checkDangerZones = useCallback(
    (lat: number, lng: number) => {
      const entered: DangerZone[] = [];
      for (const zone of zones) {
        try {
          if (isInDangerZone(lat, lng, zone)) {
            entered.push(zone);
            if (!alertedZones.current.has(zone.id)) {
              alertedZones.current.add(zone.id);
              const alert: AlertRecord = {
                id: `${Date.now()}-${zone.id}`,
                type: "RedZone",
                timestamp: Date.now(),
                location: zone.name,
                lat,
                lng,
                contactsNotified: 0,
              };
              onAlertAdded(alert);
              toast.warning(`⚠️ Danger zone: ${zone.name}`, { duration: 6000 });
              console.warn(
                `[SafeHer] Geofence: Entered danger zone "${zone.name}" (${zone.id}) at ${lat}, ${lng}`,
              );
            }
          } else {
            alertedZones.current.delete(zone.id);
          }
        } catch (err) {
          console.error(
            `[SafeHer] Geofence check failed for zone "${zone.name}" (${zone.id}):`,
            err,
          );
        }
      }
      setActiveZones(entered);
    },
    [zones, onAlertAdded],
  );

  const requestLocation = useCallback(() => {
    setRequesting(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setUserPos(coords);
        setMapCenter(coords);
        setRequesting(false);
        checkDangerZones(coords[0], coords[1]);
        toast.success("Location enabled");
      },
      () => {
        setLocationDenied(true);
        setRequesting(false);
        toast.error("Location access denied");
      },
    );
  }, [checkDangerZones]);

  useEffect(() => {
    if (!navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        const coords: [number, number] = [
          pos.coords.latitude,
          pos.coords.longitude,
        ];
        setUserPos(coords);
        checkDangerZones(coords[0], coords[1]);
      },
      (err) => {
        console.error("[SafeHer] watchPosition error:", err);
      },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [checkDangerZones]);

  const initialCenter: [number, number] = userPos || [20.5937, 78.9629];

  return (
    <div className="space-y-3 -mx-4">
      {/* Danger Zone Warning Banner */}
      <AnimatePresence>
        {activeZones.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 bg-primary/20 border border-primary/50 rounded-xl p-3"
            data-ocid="map.danger_alert.panel"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-primary font-semibold text-sm">
                  Warning! High-Risk Area
                </p>
                <p className="text-xs text-foreground/80">
                  You have entered: {activeZones.map((z) => z.name).join(", ")}
                </p>
                {nearestHelp && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {nearestHelp.police && (
                      <a
                        href={`tel:${nearestHelp.police.phone}`}
                        className="flex items-center gap-1 text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-lg px-2 py-1"
                      >
                        <Phone className="w-3 h-3" />
                        {nearestHelp.police.name} ({nearestHelp.police.phone})
                      </a>
                    )}
                    {nearestHelp.helpline && (
                      <a
                        href={`tel:${nearestHelp.helpline.phone}`}
                        className="flex items-center gap-1 text-xs bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-lg px-2 py-1"
                      >
                        <Phone className="w-3 h-3" />
                        {nearestHelp.helpline.name} (
                        {nearestHelp.helpline.phone})
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Filter Panel */}
      <div className="mx-4">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="flex items-center gap-2 text-xs text-muted-foreground mb-2"
          data-ocid="map.filter.toggle"
        >
          <Filter className="w-3.5 h-3.5" />
          Filters
          {isFiltered && (
            <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30 ml-1">
              Active
            </Badge>
          )}
          {showFilters ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card border border-border rounded-xl p-3 space-y-3">
                {/* State dropdown */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">State</p>
                  <Select value={filterState} onValueChange={setFilterState}>
                    <SelectTrigger
                      className="h-8 text-xs"
                      data-ocid="map.filter.select"
                    >
                      <SelectValue placeholder="All states" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All States</SelectItem>
                      {uniqueStates.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Risk level buttons */}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Risk Level
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {(
                      ["all", "low", "medium", "high", "critical"] as const
                    ).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFilterRisk(r)}
                        data-ocid={`map.filter.risk.${r === "all" ? "button" : "toggle"}`}
                        className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                          filterRisk === r
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-card border-border text-muted-foreground"
                        }`}
                      >
                        {r === "all"
                          ? "All"
                          : r.charAt(0).toUpperCase() + r.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nearby toggle */}
                {userPos && (
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="nearby-toggle"
                      checked={filterNearby}
                      onChange={(e) => setFilterNearby(e.target.checked)}
                      className="w-4 h-4 accent-primary"
                      data-ocid="map.filter.nearby.checkbox"
                    />
                    <label
                      htmlFor="nearby-toggle"
                      className="text-xs text-foreground"
                    >
                      Show only nearby (within 10km)
                    </label>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map */}
      <div className="relative h-[calc(100vh-260px)] min-h-[400px]">
        {!userPos && !locationDenied && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-4">
            <MapPin className="w-12 h-12 text-primary" />
            <p className="text-foreground font-semibold">
              Enable location to view map
            </p>
            <Button
              data-ocid="map.enable_location.button"
              onClick={requestLocation}
              disabled={requesting}
              className="bg-primary text-primary-foreground"
            >
              {requesting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                "Enable Location"
              )}
            </Button>
          </div>
        )}
        {locationDenied && (
          <div className="absolute inset-0 z-[500] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-4 text-center px-8">
            <AlertTriangle className="w-12 h-12 text-warning" />
            <p className="text-foreground font-semibold">
              Location access denied
            </p>
            <p className="text-sm text-muted-foreground">
              Please enable location in your browser settings.
            </p>
          </div>
        )}
        <MapContainer
          center={initialCenter}
          zoom={5}
          style={{ height: "100%", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {userPos && (
            <Marker position={userPos} icon={userIcon}>
              <Popup>📍 You are here</Popup>
            </Marker>
          )}
          {visibleZones.map((zone) => (
            <DangerZoneLayer key={zone.id} zone={zone} />
          ))}
          {userPos && <RecenterButton lat={userPos[0]} lng={userPos[1]} />}
          <MapBoundsListener
            onBoundsChange={(bounds, center) => {
              setMapBounds(bounds);
              setMapCenter([center.lat, center.lng]);
            }}
          />
        </MapContainer>
      </div>

      {/* Danger Zones Summary */}
      <div className="mx-4 space-y-2">
        <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide">
          {isFiltered
            ? `Filtered: ${visibleZones.length} zones visible`
            : `Marked Danger Zones (${zones.length} total)`}
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {zonesByState.slice(0, 10).map(([state, info], i) => (
            <div
              key={state}
              className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2"
              data-ocid={`map.zone.item.${i + 1}`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: RISK_DOT_COLORS[info.topRisk] }}
              />
              <div className="min-w-0">
                <p className="text-xs font-medium truncate">{state}</p>
                <p className="text-[10px] text-muted-foreground">
                  {info.count} zones
                </p>
              </div>
            </div>
          ))}
        </div>
        {zonesByState.length > 10 && (
          <p className="text-xs text-muted-foreground text-center">
            +{zonesByState.length - 10} more states
          </p>
        )}
      </div>

      {/* Nearby Official Help */}
      {userPos && (
        <div className="mx-4 space-y-2" data-ocid="map.official_help.panel">
          <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Nearby Official Help
          </h3>

          {/* National quick-call cards */}
          <div className="grid grid-cols-3 gap-2">
            <a
              href="tel:112"
              className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex flex-col gap-1 active:scale-95 transition-transform"
              data-ocid="map.national_112.button"
            >
              <span className="text-lg">🆘</span>
              <p className="text-xs font-semibold leading-tight">
                National Emergency
              </p>
              <p className="text-xs text-safe flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" /> 112
              </p>
            </a>
            <a
              href="tel:1091"
              className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex flex-col gap-1 active:scale-95 transition-transform"
              data-ocid="map.women_helpline.button"
            >
              <span className="text-lg">💜</span>
              <p className="text-xs font-semibold leading-tight">
                Women Helpline
              </p>
              <p className="text-xs text-safe flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" /> 1091
              </p>
            </a>
            <a
              href="tel:181"
              className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-3 flex flex-col gap-1 active:scale-95 transition-transform"
              data-ocid="map.sakhi.button"
            >
              <span className="text-lg">🌸</span>
              <p className="text-xs font-semibold leading-tight">Sakhi</p>
              <p className="text-xs text-safe flex items-center gap-1">
                <Phone className="w-2.5 h-2.5" /> 181
              </p>
            </a>
          </div>

          {/* Nearest contacts */}
          {nearbyOfficialContacts.length > 0 && (
            <div className="space-y-2">
              {nearbyOfficialContacts.map((c, i) => (
                <div
                  key={c.id}
                  className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3"
                  data-ocid={`map.official_contact.item.${i + 1}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <Badge
                        className={`text-[10px] ${CONTACT_TYPE_COLORS[c.type]}`}
                      >
                        {CONTACT_TYPE_LABELS[c.type]}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {c.city}, {c.district} — {c.distanceKm.toFixed(1)} km away
                    </p>
                  </div>
                  <a
                    href={`tel:${c.phone}`}
                    className="w-9 h-9 rounded-full bg-safe/20 flex items-center justify-center flex-shrink-0"
                    aria-label={`Call ${c.name}`}
                    data-ocid={`map.official_contact.button.${i + 1}`}
                  >
                    <Phone className="w-4 h-4 text-safe" />
                  </a>
                </div>
              ))}
            </div>
          )}

          {nearbyOfficialContacts.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-3 text-center text-xs text-muted-foreground">
              No nearby official contacts found in database for your area.
            </div>
          )}
        </div>
      )}

      {/* Show national help even without location */}
      {!userPos && (
        <div className="mx-4" data-ocid="map.national_help.panel">
          <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
            National Emergency Numbers
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <a
              href="tel:112"
              className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex flex-col gap-1"
              data-ocid="map.national_112_fallback.button"
            >
              <span className="text-lg">🆘</span>
              <p className="text-xs font-semibold">Emergency</p>
              <p className="text-xs text-safe">112</p>
            </a>
            <a
              href="tel:1091"
              className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-3 flex flex-col gap-1"
              data-ocid="map.women_helpline_fallback.button"
            >
              <span className="text-lg">💜</span>
              <p className="text-xs font-semibold">Women</p>
              <p className="text-xs text-safe">1091</p>
            </a>
            <a
              href="tel:181"
              className="bg-pink-500/10 border border-pink-500/20 rounded-xl p-3 flex flex-col gap-1"
              data-ocid="map.sakhi_fallback.button"
            >
              <span className="text-lg">🌸</span>
              <p className="text-xs font-semibold">Sakhi</p>
              <p className="text-xs text-safe">181</p>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
