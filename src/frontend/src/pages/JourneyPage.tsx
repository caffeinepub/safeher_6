import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle,
  Clock,
  MapPin,
  Navigation,
  Send,
  Shield,
  Users,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useSafeHer } from "../context/SafeHerContext";
import type { JourneySession } from "../types";

const STATUS_CONFIG = {
  active: {
    label: "Active",
    cls: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  completed: {
    label: "Completed",
    cls: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  missed: {
    label: "Missed ETA",
    cls: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  cancelled: {
    label: "Cancelled",
    cls: "bg-muted text-muted-foreground border-border",
  },
};

const THRESHOLDS = [200, 500, 1000] as const;
type Threshold = (typeof THRESHOLDS)[number];

function haversine(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function ETACountdown({ eta }: { eta: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, []);

  const remaining = Math.max(0, eta - now);
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const isOverdue = now > eta;

  if (isOverdue) {
    return <span className="text-orange-400 font-semibold">ETA Overdue</span>;
  }
  return (
    <span className="font-mono font-bold text-foreground">
      {hours > 0 ? `${hours}h ` : ""}
      {minutes}m remaining
    </span>
  );
}

export default function JourneyPage() {
  const {
    journeys,
    addJourney,
    updateJourney,
    contacts,
    addNotification,
    addAlert,
    addTimelineEvent,
  } = useSafeHer();
  const [destination, setDestination] = useState("");
  const [etaInput, setEtaInput] = useState("");
  const [threshold, setThreshold] = useState<Threshold>(500);
  const [deviation, setDeviation] = useState<string | null>(null);
  const [noMovement, setNoMovement] = useState(false);
  const lastPosRef = useRef<{ lat: number; lng: number; time: number } | null>(
    null,
  );
  const noMovementCountRef = useRef(0);

  const activeJourney = journeys.find((j) => j.status === "active");
  const pastJourneys = journeys
    .filter((j) => j.status !== "active")
    .slice(0, 5);

  const guardianContacts = contacts.filter((c) => c.isGuardian);

  // Deviation / no-movement detection every 30s when journey is active
  useEffect(() => {
    if (!activeJourney) {
      lastPosRef.current = null;
      noMovementCountRef.current = 0;
      setDeviation(null);
      setNoMovement(false);
      return;
    }

    const check = () => {
      navigator.geolocation?.getCurrentPosition(
        (pos) => {
          const { latitude: lat, longitude: lng } = pos.coords;
          const now = Date.now();

          // Check ETA overdue
          if (now > activeJourney.estimatedArrival) {
            setDeviation("ETA has passed but journey is still active.");
          }

          if (lastPosRef.current) {
            const dist = haversine(
              lastPosRef.current.lat,
              lastPosRef.current.lng,
              lat,
              lng,
            );

            // No movement: less than 20m in last reading
            if (dist < 20) {
              noMovementCountRef.current += 1;
              // 5 min = 10 readings at 30s interval
              if (noMovementCountRef.current >= 10 && !noMovement) {
                setNoMovement(true);
                toast.warning(
                  "⚠️ No movement detected for 5+ minutes. Are you OK?",
                  {
                    duration: 10000,
                  },
                );
                addTimelineEvent({
                  id: `no_movement_${now}`,
                  type: "route_deviation",
                  timestamp: now,
                  description:
                    "No movement detected for 5+ minutes during journey.",
                  severity: "warning",
                });
              }
            } else {
              noMovementCountRef.current = 0;
              setNoMovement(false);
            }

            // Deviation check: if user is far from start and ETA approaching
            if (activeJourney.startLat && activeJourney.startLng) {
              const fromStart = haversine(
                activeJourney.startLat,
                activeJourney.startLng,
                lat,
                lng,
              );
              if (fromStart > threshold && dist < 50) {
                const msg = `Route deviation detected! Moved ${Math.round(fromStart)}m off expected path (threshold: ${threshold}m)`;
                if (deviation !== msg) {
                  setDeviation(msg);
                  addTimelineEvent({
                    id: `deviation_${now}`,
                    type: "route_deviation",
                    timestamp: now,
                    description: msg,
                    severity: "warning",
                  });
                }
              }
            }
          }

          lastPosRef.current = { lat, lng, time: now };
        },
        () => {
          /* GPS unavailable */
        },
        { timeout: 8000, maximumAge: 20000 },
      );
    };

    check();
    const t = setInterval(check, 30000);
    return () => clearInterval(t);
  }, [activeJourney, threshold, deviation, noMovement, addTimelineEvent]);

  const startJourney = () => {
    if (!destination.trim()) {
      toast.error("Please enter a destination");
      return;
    }
    if (!etaInput) {
      toast.error("Please set an estimated arrival time");
      return;
    }
    if (activeJourney) {
      toast.error("A journey is already active. Complete it first.");
      return;
    }

    const etaDate = new Date(etaInput);
    if (etaDate.getTime() <= Date.now()) {
      toast.error("ETA must be in the future");
      return;
    }

    const journey: JourneySession = {
      id: `journey_${Date.now()}`,
      destination: destination.trim(),
      startTime: Date.now(),
      estimatedArrival: etaDate.getTime(),
      status: "active",
      guardianNotified: guardianContacts.length > 0,
    };

    addJourney(journey);
    addAlert({
      id: `j_alert_${Date.now()}`,
      type: "Journey",
      timestamp: Date.now(),
      location: destination.trim(),
      contactsNotified: guardianContacts.length,
      sendSuccess: true,
    });
    addNotification({
      type: "journey",
      title: "Journey Started",
      message: `Heading to ${destination.trim()}. ETA: ${etaDate.toLocaleTimeString()}`,
    });
    addTimelineEvent({
      id: `journey_start_${Date.now()}`,
      type: "journey_start",
      timestamp: Date.now(),
      description: `Journey started to ${destination.trim()}. ${guardianContacts.length} guardian(s) notified.`,
      severity: "info",
    });

    setDestination("");
    setEtaInput("");
    toast.success(
      `Journey to ${destination} started! ${guardianContacts.length} guardian(s) notified.`,
    );
  };

  const completeJourney = () => {
    if (!activeJourney) return;
    updateJourney({ ...activeJourney, status: "completed" });
    addNotification({
      type: "journey",
      title: "Journey Completed",
      message: `Arrived safely at ${activeJourney.destination}.`,
    });
    addTimelineEvent({
      id: `journey_done_${Date.now()}`,
      type: "check_in_completed",
      timestamp: Date.now(),
      description: `Arrived safely at ${activeJourney.destination}.`,
      severity: "info",
    });
    toast.success("✅ Arrived safely! Guardians notified.");
  };

  const sendCheckIn = () => {
    if (!activeJourney) return;
    addNotification({
      type: "journey",
      title: "Check-In Sent",
      message: `En route to ${activeJourney.destination}. All good.`,
    });
    addTimelineEvent({
      id: `checkin_${Date.now()}`,
      type: "check_in_completed",
      timestamp: Date.now(),
      description: "Manual check-in sent during journey.",
      severity: "info",
    });
    toast.success("Check-in sent to guardians!");
  };

  const cancelJourney = () => {
    if (!activeJourney) return;
    updateJourney({ ...activeJourney, status: "cancelled" });
    toast.info("Journey cancelled.");
  };

  const toggleGuardian = (id: string, current: boolean) => {
    const contact = contacts.find((c) => c.id === id);
    if (!contact) return;
    const stored = JSON.parse(localStorage.getItem("safeher_contacts") || "[]");
    const updated = stored.map((c: { id: string }) =>
      c.id === id ? { ...c, isGuardian: !current } : c,
    );
    localStorage.setItem("safeher_contacts", JSON.stringify(updated));
    toast.success(
      `${contact.name} ${!current ? "added as" : "removed from"} guardian circle.`,
    );
  };

  const minEta = useMemo(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() + 5);
    return d.toISOString().slice(0, 16);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl">Journey Mode</h2>
        <p className="text-sm text-muted-foreground">
          Let guardians track your trips and stay informed.
        </p>
      </div>

      {/* Deviation / Warning Banners */}
      {deviation && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-3 text-xs text-orange-400">
          ⚠️ {deviation}
        </div>
      )}
      {noMovement && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-400 animate-pulse">
          🟡 No movement detected for 5+ minutes. Are you OK? Tap &quot;Check
          In&quot; to confirm.
        </div>
      )}

      {/* Deviation Threshold Selector */}
      {activeJourney && (
        <div className="bg-card border border-border rounded-xl p-3">
          <p className="text-xs text-muted-foreground mb-2">
            Route deviation threshold:
          </p>
          <div className="flex gap-2">
            {THRESHOLDS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setThreshold(t)}
                className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                  threshold === t
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : "bg-secondary border-border text-muted-foreground"
                }`}
              >
                {t >= 1000 ? `${t / 1000}km` : `${t}m`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Journey */}
      <AnimatePresence>
        {activeJourney && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="bg-green-500/10 border border-green-500/30 rounded-2xl p-5 space-y-4"
            data-ocid="journey.active.card"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm font-semibold text-green-400">
                  Journey Active
                </span>
              </div>
              <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30">
                In Progress
              </Badge>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">{activeJourney.destination}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <ETACountdown eta={activeJourney.estimatedArrival} />
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {activeJourney.guardianNotified
                    ? `${guardianContacts.length} guardian(s) notified`
                    : "No guardians notified"}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={completeJourney}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                data-ocid="journey.arrived.button"
              >
                <CheckCircle className="w-4 h-4 mr-2" /> I've Arrived Safely
              </Button>
              <Button
                onClick={sendCheckIn}
                variant="outline"
                className="flex-1 border-green-500/30 text-green-400 hover:bg-green-500/10"
                data-ocid="journey.checkin.button"
              >
                <Send className="w-4 h-4 mr-2" /> Check In
              </Button>
            </div>
            <button
              type="button"
              onClick={cancelJourney}
              className="text-xs text-muted-foreground hover:text-foreground w-full text-center"
              data-ocid="journey.cancel.button"
            >
              Cancel Journey
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Start Journey Form */}
      {!activeJourney && (
        <div
          className="bg-card border border-border rounded-2xl p-5 space-y-4"
          data-ocid="journey.form.panel"
        >
          <h3 className="font-display font-semibold text-base">
            Start New Journey
          </h3>
          <div>
            <Label htmlFor="dest">Destination *</Label>
            <Input
              id="dest"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Home, Office, Friend's place"
              className="mt-1"
              data-ocid="journey.destination.input"
            />
          </div>
          <div>
            <Label htmlFor="eta">Estimated Arrival Time *</Label>
            <Input
              id="eta"
              type="datetime-local"
              min={minEta}
              value={etaInput}
              onChange={(e) => setEtaInput(e.target.value)}
              className="mt-1"
              data-ocid="journey.eta.input"
            />
          </div>
          <Button
            onClick={startJourney}
            className="w-full bg-primary text-primary-foreground"
            data-ocid="journey.start.primary_button"
          >
            <Navigation className="w-4 h-4 mr-2" /> Start Journey
          </Button>
        </div>
      )}

      {/* Guardian Circle */}
      <div
        className="bg-card border border-border rounded-2xl p-5 space-y-3"
        data-ocid="journey.guardians.card"
      >
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="font-display font-semibold text-base">
            Trusted Circle
          </h3>
          <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30">
            {guardianContacts.length} Active
          </Badge>
        </div>

        {contacts.length === 0 ? (
          <p
            className="text-sm text-muted-foreground"
            data-ocid="journey.guardians.empty_state"
          >
            No contacts added yet. Add emergency contacts first.
          </p>
        ) : (
          <div className="space-y-3">
            {contacts.map((c, i) => (
              <div
                key={c.id}
                className="flex items-center gap-3"
                data-ocid={`journey.guardian.item.${i + 1}`}
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary flex-shrink-0">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.relationship}
                  </p>
                </div>
                <Switch
                  checked={!!c.isGuardian}
                  onCheckedChange={() => toggleGuardian(c.id, !!c.isGuardian)}
                  data-ocid="journey.guardian.switch"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Journey History */}
      {pastJourneys.length > 0 && (
        <div
          className="bg-card border border-border rounded-2xl p-5 space-y-3"
          data-ocid="journey.history.card"
        >
          <h3 className="font-display font-semibold text-base">
            Journey History
          </h3>
          <div className="space-y-2">
            {pastJourneys.map((j, i) => (
              <div
                key={j.id}
                className="flex items-center gap-3"
                data-ocid={`journey.history.item.${i + 1}`}
              >
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                  <Navigation className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {j.destination}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(j.startTime).toLocaleDateString()}
                  </p>
                </div>
                <Badge className={`text-[10px] ${STATUS_CONFIG[j.status].cls}`}>
                  {STATUS_CONFIG[j.status].label}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
