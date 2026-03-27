import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useCallback, useRef, useState } from "react";
import { toast } from "sonner";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { AlertRecord, EmergencyContact } from "../types";

interface SOSButtonProps {
  contacts: EmergencyContact[];
  onAlertAdded: (alert: AlertRecord) => void;
  profile?: { name: string } | null;
}

function getLocation(): Promise<GeolocationPosition | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos),
      () => resolve(null),
      { timeout: 5000, maximumAge: 60000 },
    );
  });
}

export default function SOSButton({
  contacts,
  onAlertAdded,
  profile,
}: SOSButtonProps) {
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);
  const { actor } = useActor();
  const { identity } = useInternetIdentity();

  const startHold = useCallback(() => {
    progressRef.current = 0;
    setProgress(0);
    setHolding(true);
    holdTimerRef.current = setInterval(() => {
      progressRef.current += 100 / 30;
      setProgress(progressRef.current);
      if (progressRef.current >= 100) {
        clearInterval(holdTimerRef.current!);
        holdTimerRef.current = null;
        setHolding(false);
        setProgress(0);
        setShowConfirm(true);
      }
    }, 100);
  }, []);

  const cancelHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (holding && progress < 50) {
      toast.info("Hold for 3 seconds to activate SOS", { duration: 2000 });
    }
    setHolding(false);
    setProgress(0);
  }, [holding, progress]);

  const handleConfirm = useCallback(async () => {
    setShowConfirm(false);

    if (contacts.length === 0) {
      toast.error("No emergency contacts saved!", {
        description: "Please add contacts before sending SOS.",
        duration: 5000,
      });
      return;
    }

    if (!actor) {
      toast.error("Backend unavailable. Cannot send SOS.", {
        description: "Please check your connection and try again.",
        duration: 5000,
      });
      return;
    }

    setSending(true);
    toast.loading("Sending SOS alert...", { id: "sos-send" });

    const pos = await getLocation();
    const lat = pos?.coords.latitude ?? 0;
    const lng = pos?.coords.longitude ?? 0;
    const accuracy = pos?.coords.accuracy ?? 0;

    if (!lat || !lng) {
      console.warn("[SafeHer] SOS: GPS unavailable");
    }

    // Dial primary contact immediately
    const primary = contacts[0];
    if (primary?.phone) {
      window.location.href = `tel:${primary.phone}`;
    }

    try {
      const userId = identity?.getPrincipal().toString() ?? "anonymous";
      const result = await actor.sendSosAlert(
        userId,
        lat,
        lng,
        accuracy,
        profile?.name ?? "SafeHer User",
        BigInt(Date.now()),
      );

      const notified = Number(result.contactsNotified);
      const failed = result.failedContacts;
      const isMock = result.isMockMode;
      const mapLink = result.mapLink;

      const alert: AlertRecord = {
        id: Date.now().toString(),
        type: "SOS",
        timestamp: Date.now(),
        location:
          lat && lng
            ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
            : "Location unavailable",
        lat: lat || undefined,
        lng: lng || undefined,
        contactsNotified: notified,
        sendSuccess: result.status !== "failed",
        providerUsed: result.providerUsed,
        isMockMode: isMock,
        mapLink,
      };
      onAlertAdded(alert);

      if (isMock) {
        toast.warning("⚠️ MOCK MODE — No real SMS sent", {
          id: "sos-send",
          description: `Alert logged. ${notified} contact(s) would be notified in real mode.`,
          duration: 6000,
        });
      } else if (result.status === "success") {
        toast.success(
          `✅ SOS sent to ${notified} contact(s) via ${result.providerUsed}`,
          { id: "sos-send", duration: 6000 },
        );
      } else if (result.status === "partial") {
        toast.warning(`⚠️ Partial: ${notified} sent, ${failed.length} failed`, {
          id: "sos-send",
          duration: 6000,
        });
      } else {
        toast.error(`❌ SOS failed: ${failed.join(", ") || "Unknown error"}`, {
          id: "sos-send",
          duration: 6000,
        });
      }
    } catch (err) {
      console.error("[SafeHer] SOS send error:", err);
      const alert: AlertRecord = {
        id: Date.now().toString(),
        type: "SOS",
        timestamp: Date.now(),
        location: "Location unavailable",
        contactsNotified: 0,
        sendSuccess: false,
        errorMessage: err instanceof Error ? err.message : "Send failed",
      };
      onAlertAdded(alert);
      toast.error("SOS failed completely", { id: "sos-send", duration: 5000 });
    } finally {
      setSending(false);
    }
  }, [contacts, onAlertAdded, profile, actor, identity]);

  const circumference = 2 * Math.PI * 40;
  const strokeOffset = circumference - (progress / 100) * circumference;

  return (
    <>
      <div
        className="fixed bottom-[88px] left-1/2 -translate-x-1/2 z-50"
        data-ocid="sos.button"
      >
        <div className="relative w-20 h-20">
          {holding && (
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 88 88"
              aria-label="SOS activation progress"
              role="img"
            >
              <title>SOS activation progress</title>
              <circle
                cx="44"
                cy="44"
                r="40"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeOpacity="0.3"
              />
              <circle
                cx="44"
                cy="44"
                r="40"
                fill="none"
                stroke="white"
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                style={{
                  transformOrigin: "center",
                  transform: "rotate(-90deg)",
                  transition: "stroke-dashoffset 0.1s linear",
                }}
              />
            </svg>
          )}
          <button
            type="button"
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={(e) => {
              e.preventDefault();
              startHold();
            }}
            onTouchEnd={cancelHold}
            disabled={sending}
            className="absolute inset-1 rounded-full bg-gradient-to-br from-red-500 to-red-700 text-white font-display font-bold text-lg shadow-sos flex items-center justify-center select-none animate-pulse-red cursor-pointer active:scale-95 transition-transform disabled:opacity-60"
            aria-label="SOS Emergency Button - Hold for 3 seconds"
          >
            {sending ? "..." : "SOS"}
          </button>
        </div>
      </div>

      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent
          data-ocid="sos.dialog"
          className="border-primary/50"
        >
          <AlertDialogHeader>
            <AlertDialogTitle className="text-primary text-xl">
              🚨 Send Emergency Alert?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-foreground/80">
              {contacts.length === 0
                ? "⚠️ No emergency contacts saved! Please add contacts first."
                : `This will call your primary contact and send an emergency SMS alert to all ${
                    contacts.length
                  } saved contact(s) with your live location.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="sos.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="sos.confirm_button"
              onClick={handleConfirm}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              Send Alert Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
