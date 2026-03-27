import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSafeHer } from "../context/SafeHerContext";
import type { CheckInSession } from "../types";

const INTERVALS: Array<10 | 20 | 30> = [10, 20, 30];

function Countdown({ nextAt }: { nextAt: number }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const remaining = Math.max(0, nextAt - now);
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  const isMissed = remaining === 0;

  return (
    <div className={`text-center py-6 ${isMissed ? "animate-pulse" : ""}`}>
      {isMissed ? (
        <div className="space-y-2" data-ocid="checkin.missed.error_state">
          <div className="text-5xl font-mono font-bold text-red-400">
            MISSED
          </div>
          <p className="text-sm text-red-400">Check-in overdue!</p>
        </div>
      ) : (
        <div data-ocid="checkin.countdown">
          <div className="text-6xl font-mono font-bold text-foreground">
            {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            until next required check-in
          </p>
        </div>
      )}
    </div>
  );
}

export default function CheckInPage() {
  const { checkInSession, setCheckInSession, contacts, addTimelineEvent } =
    useSafeHer();
  const [selectedInterval, setSelectedInterval] = useState<10 | 20 | 30>(20);
  const [history, setHistory] = useState<
    Array<{ time: number; status: "safe" | "missed" }>
  >([]);
  const missedRef = useRef(false);

  // Detect missed check-ins
  useEffect(() => {
    if (!checkInSession || checkInSession.status !== "active") return;
    const t = setInterval(() => {
      if (Date.now() > checkInSession.nextCheckInAt && !missedRef.current) {
        missedRef.current = true;
        setCheckInSession({
          ...checkInSession,
          status: "missed",
          missedCount: checkInSession.missedCount + 1,
        });
        addTimelineEvent({
          id: `checkin_missed_${Date.now()}`,
          type: "missed_check_in",
          timestamp: Date.now(),
          description: "Check-in missed! Guardians will be notified.",
          severity: "critical",
        });
        toast.error("⚠️ Check-in missed! Notifying guardians.", {
          duration: 8000,
        });
        setHistory((prev) =>
          [{ time: Date.now(), status: "missed" as const }, ...prev].slice(
            0,
            10,
          ),
        );
      }
    }, 5000);
    return () => clearInterval(t);
  }, [checkInSession, setCheckInSession, addTimelineEvent]);

  const startCheckIn = () => {
    missedRef.current = false;
    const now = Date.now();
    const session: CheckInSession = {
      id: `checkin_${now}`,
      intervalMinutes: selectedInterval,
      startTime: now,
      nextCheckInAt: now + selectedInterval * 60 * 1000,
      lastCheckInAt: null,
      status: "active",
      missedCount: 0,
    };
    setCheckInSession(session);
    addTimelineEvent({
      id: `checkin_start_${now}`,
      type: "check_in_completed",
      timestamp: now,
      description: `Check-in mode started (every ${selectedInterval} min)`,
      severity: "info",
    });
    toast.success(
      `Check-in mode started. Check in every ${selectedInterval} minutes.`,
    );
  };

  const markSafe = () => {
    if (!checkInSession) return;
    missedRef.current = false;
    const now = Date.now();
    const updated: CheckInSession = {
      ...checkInSession,
      lastCheckInAt: now,
      nextCheckInAt: now + checkInSession.intervalMinutes * 60 * 1000,
      status: "active",
    };
    setCheckInSession(updated);
    addTimelineEvent({
      id: `checkin_done_${now}`,
      type: "check_in_completed",
      timestamp: now,
      description: `Check-in confirmed — safe at ${new Date(now).toLocaleTimeString()}`,
      severity: "info",
    });
    setHistory((prev) =>
      [{ time: now, status: "safe" as const }, ...prev].slice(0, 10),
    );
    toast.success("✅ Check-in recorded. Stay safe!");
  };

  const stopCheckIn = () => {
    setCheckInSession(null);
    toast.info("Check-in mode stopped.");
  };

  return (
    <div className="space-y-4 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-4"
        data-ocid="checkin.panel"
      >
        <h1 className="font-display font-bold text-xl">Smart Check-In</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Set a check-in interval. If you miss a check-in, your guardians will
          be alerted.
        </p>
      </motion.div>

      {contacts.length === 0 && (
        <div
          className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 text-xs text-yellow-400"
          data-ocid="checkin.no_contacts.error_state"
        >
          ⚠️ No emergency contacts saved. Guardians cannot be notified if you
          miss a check-in.
        </div>
      )}

      {!checkInSession ? (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <p className="text-sm font-semibold">Select check-in interval:</p>
          <div className="flex gap-3">
            {INTERVALS.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setSelectedInterval(mins)}
                className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${
                  selectedInterval === mins
                    ? "bg-primary/20 border-primary/50 text-primary"
                    : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                }`}
                data-ocid={`checkin.interval_${mins}.button`}
              >
                {mins} min
              </button>
            ))}
          </div>
          <Button
            onClick={startCheckIn}
            className="w-full"
            data-ocid="checkin.start.button"
          >
            Start Check-In Mode
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Badge
              className={
                checkInSession.status === "active"
                  ? "bg-green-500/20 text-green-400 border-green-500/40"
                  : "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
              }
            >
              {checkInSession.status === "active" ? "ACTIVE" : "MISSED"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Every {checkInSession.intervalMinutes} min
            </span>
          </div>

          <Countdown nextAt={checkInSession.nextCheckInAt} />

          <Button
            onClick={markSafe}
            className="w-full h-14 text-lg font-bold bg-green-600 hover:bg-green-700 text-white"
            data-ocid="checkin.safe.button"
          >
            ✓ I'm Safe
          </Button>

          <Button
            variant="outline"
            onClick={stopCheckIn}
            className="w-full text-xs h-8 text-muted-foreground"
            data-ocid="checkin.stop.button"
          >
            Stop Check-In Mode
          </Button>
        </div>
      )}

      {history.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4">
          <p className="text-sm font-semibold mb-3">Check-In History</p>
          <div className="space-y-2">
            {history.map((h, i) => (
              <div
                key={h.time}
                className="flex items-center justify-between text-xs"
                data-ocid={`checkin.history.item.${i + 1}`}
              >
                <span className="text-muted-foreground">
                  {new Date(h.time).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
                <Badge
                  className={
                    h.status === "safe"
                      ? "bg-green-500/20 text-green-400 border-green-500/40"
                      : "bg-red-500/20 text-red-400 border-red-500/40"
                  }
                >
                  {h.status === "safe" ? "✓ Safe" : "✗ Missed"}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
