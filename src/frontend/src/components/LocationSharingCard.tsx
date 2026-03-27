import { Button } from "@/components/ui/button";
import { Clock, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { AlertRecord, EmergencyContact, SharingStatus } from "../types";

const AUTO_INTERVAL_MS = 20 * 60 * 1000;
const LS_LAST_SENT = "safeher_lastAutoSent";
const LS_NEXT_SEND = "safeher_nextSend";

interface Props {
  sharingStatus: SharingStatus;
  onSharingChange: (s: SharingStatus) => void;
  onAlertAdded: (a: AlertRecord) => void;
  contacts: EmergencyContact[];
  profile: { name: string } | null;
}

const STATUS_CONFIG = {
  active: { color: "bg-safe", label: "Active", text: "Sharing every 20 min" },
  paused: { color: "bg-warning", label: "Paused", text: "Sharing paused" },
  stopped: { color: "bg-primary", label: "Stopped", text: "Not sharing" },
};

function getLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10000,
      maximumAge: 30000,
    });
  });
}

export default function LocationSharingCard({
  sharingStatus,
  onSharingChange,
  onAlertAdded,
  profile,
}: Props) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [lastSentAt, setLastSentAt] = useState<number | null>(() => {
    const v = localStorage.getItem(LS_LAST_SENT);
    return v ? Number(v) : null;
  });
  const [nextSendAt, setNextSendAt] = useState<number | null>(() => {
    const v = localStorage.getItem(LS_NEXT_SEND);
    return v ? Number(v) : null;
  });
  const [isSending, setIsSending] = useState(false);
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  const sendLocationNow = useRef(async () => {
    setIsSending(true);

    if (!actor) {
      toast.error("Backend unavailable — location share skipped");
      setIsSending(false);
      return;
    }

    let pos: GeolocationPosition | null = null;
    try {
      pos = await getLocation();
    } catch {
      try {
        pos = await getLocation();
      } catch (retryErr) {
        console.error(
          "[SafeHer] Auto-location: GPS failed after retry",
          retryErr,
        );
        setIsSending(false);
        const failedAlert: AlertRecord = {
          id: Date.now().toString(),
          type: "AutoShare",
          timestamp: Date.now(),
          location: "Location unavailable",
          contactsNotified: 0,
          sendSuccess: false,
          errorMessage: "GPS location could not be obtained",
        };
        onAlertAdded(failedAlert);
        toast.error("Auto-share failed: could not get location");
        return;
      }
    }

    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const locationStr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

    try {
      const userId = identity?.getPrincipal().toString() ?? "anonymous";
      const result = await actor.sendAutoLocationAlert(
        userId,
        lat,
        lng,
        profile?.name ?? "SafeHer User",
        BigInt(Date.now()),
      );

      const notified = Number(result.contactsNotified);
      const isMock = result.isMockMode;

      const now = Date.now();
      const nextTime = now + AUTO_INTERVAL_MS;
      localStorage.setItem(LS_LAST_SENT, String(now));
      localStorage.setItem(LS_NEXT_SEND, String(nextTime));
      setLastSentAt(now);
      setNextSendAt(nextTime);

      const alert: AlertRecord = {
        id: Date.now().toString(),
        type: "AutoShare",
        timestamp: now,
        location: locationStr,
        lat,
        lng,
        contactsNotified: notified,
        sendSuccess: result.status !== "failed",
        providerUsed: result.providerUsed,
        isMockMode: isMock,
        mapLink: result.mapLink,
      };
      onAlertAdded(alert);

      if (isMock) {
        toast.info(
          `⚠️ MOCK MODE: Location logged (no real SMS). ${notified} contact(s) would be notified.`,
          { duration: 4000 },
        );
      } else if (result.status !== "failed") {
        toast.info(`📍 Location shared with ${notified} contact(s)`, {
          duration: 3000,
        });
      } else {
        toast.error("Auto-share: SMS delivery failed");
      }
    } catch (err) {
      console.error("[SafeHer] Auto-location: send failed", err);
      const alert: AlertRecord = {
        id: Date.now().toString(),
        type: "AutoShare",
        timestamp: Date.now(),
        location: locationStr,
        lat,
        lng,
        contactsNotified: 0,
        sendSuccess: false,
        errorMessage: err instanceof Error ? err.message : "Send failed",
      };
      onAlertAdded(alert);
      toast.error("Auto-share failed to send");
    } finally {
      setIsSending(false);
    }
  });

  useEffect(() => {
    if (sharingStatus === "active") {
      const savedNext = localStorage.getItem(LS_NEXT_SEND);
      const now = Date.now();
      if (savedNext && Number(savedNext) <= now) {
        sendLocationNow.current();
      }

      const scheduleNext = () => {
        const next = Date.now() + AUTO_INTERVAL_MS;
        localStorage.setItem(LS_NEXT_SEND, String(next));
        setNextSendAt(next);
      };

      scheduleNext();
      intervalRef.current = setInterval(() => {
        sendLocationNow.current();
        scheduleNext();
      }, AUTO_INTERVAL_MS);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (sharingStatus === "stopped") {
        localStorage.removeItem(LS_NEXT_SEND);
        setNextSendAt(null);
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sharingStatus]);

  const cfg = STATUS_CONFIG[sharingStatus];

  const formatTime = (ts: number | null) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="bg-card border border-border rounded-2xl p-4 space-y-3"
      data-ocid="sharing.card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Location Sharing</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${cfg.color} ${
              sharingStatus === "active" ? "animate-pulse" : ""
            }`}
          />
          <span
            className={`text-xs font-medium ${
              sharingStatus === "active"
                ? "text-safe"
                : sharingStatus === "paused"
                  ? "text-warning"
                  : "text-primary"
            }`}
          >
            {cfg.label}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {isSending ? "Sending location..." : cfg.text}
      </p>

      {(lastSentAt || nextSendAt) && (
        <div className="flex gap-4">
          {lastSentAt && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground">
                Last: {formatTime(lastSentAt)}
              </span>
            </div>
          )}
          {nextSendAt && sharingStatus === "active" && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-safe" />
              <span className="text-[11px] text-safe">
                Next: {formatTime(nextSendAt)}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2">
        {sharingStatus !== "active" && (
          <Button
            size="sm"
            data-ocid="sharing.start.button"
            onClick={() => {
              onSharingChange("active");
              toast.success("Location sharing started");
            }}
            className="flex-1 bg-safe/20 text-safe hover:bg-safe/30 border border-safe/30 h-8 text-xs"
            variant="outline"
          >
            Start
          </Button>
        )}
        {sharingStatus === "active" && (
          <Button
            size="sm"
            data-ocid="sharing.pause.button"
            onClick={() => {
              onSharingChange("paused");
              toast.info("Location sharing paused");
            }}
            className="flex-1 bg-warning/20 text-warning hover:bg-warning/30 border border-warning/30 h-8 text-xs"
            variant="outline"
          >
            Pause
          </Button>
        )}
        {sharingStatus !== "stopped" && (
          <Button
            size="sm"
            data-ocid="sharing.stop.button"
            onClick={() => {
              onSharingChange("stopped");
              toast.info("Location sharing stopped");
            }}
            className="flex-1 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 h-8 text-xs"
            variant="outline"
          >
            Stop
          </Button>
        )}
      </div>
    </div>
  );
}
