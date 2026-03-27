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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle,
  Flashlight,
  Mic,
  Phone,
  Siren,
  Smartphone,
  Volume2,
  VolumeX,
  XCircle,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useSafeHer } from "../context/SafeHerContext";

function SupportBadge({ supported }: { supported: boolean | null }) {
  if (supported === null) return null;
  return supported ? (
    <Badge className="text-[10px] bg-green-500/20 text-green-400 border-green-500/30">
      <CheckCircle className="w-2.5 h-2.5 mr-1" /> Supported
    </Badge>
  ) : (
    <Badge className="text-[10px] bg-rose-500/20 text-rose-400 border-rose-500/30">
      <XCircle className="w-2.5 h-2.5 mr-1" /> Not Supported
    </Badge>
  );
}

// Fake Call Feature
function FakeCallTool() {
  const [callerName, setCallerName] = useState("Mom");
  const [delay, setDelay] = useState(5);
  const [callActive, setCallActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const audioRef = useRef<AudioContext | null>(null);
  const sirenRef = useRef<OscillatorNode | null>(null);

  const startRingtone = () => {
    try {
      const ctx = new AudioContext();
      audioRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 440;
      gain.gain.value = 0.3;
      osc.type = "sine";
      osc.start();
      sirenRef.current = osc;

      // Ringtone pattern: on/off
      let on = true;
      const interval = setInterval(() => {
        gain.gain.value = on ? 0.3 : 0;
        on = !on;
      }, 500);

      return () => {
        clearInterval(interval);
        osc.stop();
        ctx.close();
      };
    } catch {
      return () => {};
    }
  };

  const startFakeCall = () => {
    let count = delay;
    setCountdown(count);
    const interval = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(interval);
        setCountdown(null);
        setCallActive(true);
        const cleanup = startRingtone();
        // Auto-dismiss after 30s
        setTimeout(() => {
          cleanup();
          setCallActive(false);
        }, 30000);
      }
    }, 1000);
  };

  const dismissCall = () => {
    sirenRef.current?.stop();
    audioRef.current?.close();
    setCallActive(false);
    toast.info("Fake call dismissed");
  };

  return (
    <div
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
      data-ocid="tools.fakecall.card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Phone className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Fake Call</p>
            <p className="text-xs text-muted-foreground">
              Simulate an incoming call
            </p>
          </div>
        </div>
        <SupportBadge supported={true} />
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="caller-name" className="text-xs">
            Caller Name
          </Label>
          <Input
            id="caller-name"
            value={callerName}
            onChange={(e) => setCallerName(e.target.value)}
            placeholder="Mom, Dad, etc."
            className="mt-1 h-9"
            data-ocid="tools.fakecall.input"
          />
        </div>
        <div>
          <Label className="text-xs">Delay</Label>
          <div className="flex gap-2 mt-1">
            {[5, 10, 30].map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDelay(d)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  delay === d
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={startFakeCall}
        disabled={countdown !== null || callActive}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        data-ocid="tools.fakecall.primary_button"
      >
        {countdown !== null ? `Calling in ${countdown}s...` : "Start Fake Call"}
      </Button>

      {/* Fake Call Incoming UI */}
      <Dialog open={callActive}>
        <DialogContent
          className="max-w-sm bg-gray-900 border-gray-700 text-white"
          data-ocid="tools.fakecall.dialog"
        >
          <DialogHeader>
            <DialogTitle className="text-center text-white">
              Incoming Call
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center animate-pulse">
              <span className="text-3xl font-bold text-green-400">
                {callerName[0]?.toUpperCase()}
              </span>
            </div>
            <div className="text-center">
              <p className="font-display font-bold text-2xl">{callerName}</p>
              <p className="text-sm text-gray-400">
                <span className="ringing">📲</span> Incoming call...
              </p>
            </div>
            <div className="flex gap-6 w-full justify-center">
              <button
                type="button"
                onClick={dismissCall}
                className="w-16 h-16 rounded-full bg-red-600 flex items-center justify-center"
                data-ocid="tools.fakecall.decline.button"
              >
                <Phone className="w-6 h-6 text-white rotate-135" />
              </button>
              <button
                type="button"
                onClick={dismissCall}
                className="w-16 h-16 rounded-full bg-green-600 flex items-center justify-center"
                data-ocid="tools.fakecall.accept.button"
              >
                <Phone className="w-6 h-6 text-white" />
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Emergency Siren
function SirenTool() {
  const [active, setSirenActive] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const supported =
    typeof AudioContext !== "undefined" ||
    typeof (window as any).webkitAudioContext !== "undefined";

  const startSiren = () => {
    try {
      const AudioCtx =
        window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 880;
      gain.gain.value = 0.8;
      osc.type = "sawtooth";
      osc.start();
      oscRef.current = osc;
      setSirenActive(true);
    } catch {
      toast.error("Could not activate siren. Check browser permissions.");
    }
  };

  const stopSiren = () => {
    oscRef.current?.stop();
    audioRef.current?.close();
    oscRef.current = null;
    audioRef.current = null;
    setSirenActive(false);
  };

  useEffect(() => {
    return () => {
      oscRef.current?.stop();
      audioRef.current?.close();
    };
  }, []);

  return (
    <div
      className={`border rounded-2xl p-5 space-y-4 transition-colors ${
        active
          ? "bg-rose-950/30 border-rose-500/50 siren-active"
          : "bg-card border-border"
      }`}
      data-ocid="tools.siren.card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-rose-500/10 flex items-center justify-center">
            <Volume2 className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Emergency Siren</p>
            <p className="text-xs text-muted-foreground">
              Loud 880Hz alarm sound
            </p>
          </div>
        </div>
        <SupportBadge supported={supported} />
      </div>

      {!supported ? (
        <p className="text-xs text-muted-foreground bg-secondary rounded-xl p-3">
          Web Audio API is not supported in your browser. Try Chrome or Firefox.
        </p>
      ) : active ? (
        <Button
          onClick={stopSiren}
          className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white text-lg font-bold rounded-2xl"
          data-ocid="tools.siren.stop.button"
        >
          <VolumeX className="w-6 h-6 mr-2" /> STOP SIREN
        </Button>
      ) : (
        <Button
          onClick={startSiren}
          className="w-full h-14 bg-rose-600 hover:bg-rose-700 text-white text-lg font-bold rounded-2xl"
          data-ocid="tools.siren.primary_button"
        >
          <Siren className="w-6 h-6 mr-2" /> ACTIVATE SIREN
        </Button>
      )}
    </div>
  );
}

// Flashlight Tool
function FlashlightTool() {
  const [flashOn, setFlashOn] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const tryFlashlight = async () => {
    if (flashOn) {
      for (const t of streamRef.current?.getTracks() ?? []) {
        t.stop();
      }
      setFlashOn(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      const track = stream.getVideoTracks()[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const caps = track.getCapabilities() as any;
      if (caps.torch) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (track as any).applyConstraints({ advanced: [{ torch: true }] });
        setFlashOn(true);
        setSupported(true);
      } else {
        setSupported(false);
        for (const t of stream.getTracks()) {
          t.stop();
        }
        toast.error("Torch/flashlight not supported on this device.");
      }
    } catch {
      setSupported(false);
      toast.error("Camera access denied or not available.");
    }
  };

  useEffect(() => {
    return () => {
      for (const t of streamRef.current?.getTracks() ?? []) {
        t.stop();
      }
    };
  }, []);

  return (
    <div
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
      data-ocid="tools.flashlight.card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <Flashlight className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Flashlight</p>
            <p className="text-xs text-muted-foreground">
              Use phone camera torch
            </p>
          </div>
        </div>
        <SupportBadge supported={supported} />
      </div>

      <Button
        onClick={tryFlashlight}
        variant={flashOn ? "default" : "outline"}
        className={`w-full ${
          flashOn ? "bg-yellow-500 hover:bg-yellow-600 text-black" : ""
        }`}
        data-ocid="tools.flashlight.primary_button"
      >
        <Flashlight className="w-4 h-4 mr-2" />
        {flashOn ? "Turn Off Flashlight" : "Turn On Flashlight"}
      </Button>

      {supported === false && (
        <p className="text-xs text-muted-foreground bg-secondary rounded-xl p-3">
          Your device or browser does not support flashlight control. Please use
          your phone's built-in flashlight app instead.
        </p>
      )}
    </div>
  );
}

// Shake-to-SOS
function ShakeTool() {
  const [_shakeActive, setShakeActive] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { addAlert, contacts } = useSafeHer();

  useEffect(() => {
    if (typeof window.DeviceMotionEvent === "undefined") {
      setSupported(false);
      return;
    }
    setSupported(true);
    setShakeActive(true);

    let lastTime = Date.now();
    let lastX = 0;
    let lastY = 0;
    let lastZ = 0;

    const handleMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc) return;
      const now = Date.now();
      if (now - lastTime < 100) return;
      const dx = Math.abs((acc.x ?? 0) - lastX);
      const dy = Math.abs((acc.y ?? 0) - lastY);
      const dz = Math.abs((acc.z ?? 0) - lastZ);
      lastX = acc.x ?? 0;
      lastY = acc.y ?? 0;
      lastZ = acc.z ?? 0;
      lastTime = now;
      if (dx + dy + dz > 20) {
        setConfirmOpen(true);
      }
    };

    window.addEventListener("devicemotion", handleMotion);
    return () => window.removeEventListener("devicemotion", handleMotion);
  }, []);

  const triggerSOS = () => {
    addAlert({
      id: `shake_${Date.now()}`,
      type: "ShakeSOS",
      timestamp: Date.now(),
      location: "Shake Triggered",
      contactsNotified: contacts.length,
      sendSuccess: true,
    });
    toast.error("🚨 Shake SOS Triggered! Contacts notified.");
    setConfirmOpen(false);
  };

  return (
    <div
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
      data-ocid="tools.shake.card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Smartphone className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Shake to SOS</p>
            <p className="text-xs text-muted-foreground">
              Shake phone to trigger alert
            </p>
          </div>
        </div>
        <SupportBadge supported={supported} />
      </div>

      {supported === false ? (
        <p className="text-xs text-muted-foreground bg-secondary rounded-xl p-3">
          Shake detection requires a mobile device with motion sensors. Not
          supported on this browser/device.
        </p>
      ) : (
        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl p-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <p className="text-xs text-green-400">
            Shake Detection Active — Shake your device strongly to trigger SOS
          </p>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent data-ocid="tools.shake.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>🚨 Shake Detected!</AlertDialogTitle>
            <AlertDialogDescription>
              Strong shake detected. Do you want to trigger an SOS alert?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setConfirmOpen(false)}
              data-ocid="tools.shake.cancel_button"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={triggerSOS}
              className="bg-primary"
              data-ocid="tools.shake.confirm_button"
            >
              Send SOS!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Voice SOS
function VoiceSOSTool() {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const recognitionRef = useRef<any>(null);
  const { addAlert, contacts } = useSafeHer();

  const keywords = ["help me", "sos", "emergency", "bachao"];

  const startListening = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSupported(false);
      toast.error("Voice SOS not supported in this browser.");
      return;
    }
    setSupported(true);
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    recognitionRef.current = rec;

    rec.onresult = (e: any) => {
      const transcript = Array.from(e.results)
        .map((r: any) => r[0].transcript)
        .join(" ")
        .toLowerCase();
      if (keywords.some((kw) => transcript.includes(kw))) {
        rec.stop();
        setListening(false);
        setConfirmOpen(true);
      }
    };

    rec.onerror = () => {
      setListening(false);
      toast.error("Voice recognition error. Try again.");
    };

    rec.onend = () => setListening(false);

    rec.start();
    setListening(true);
    toast.success('Listening... say "Help me" or "SOS"');
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const triggerSOS = () => {
    addAlert({
      id: `voice_${Date.now()}`,
      type: "VoiceSOS",
      timestamp: Date.now(),
      location: "Voice Triggered",
      contactsNotified: contacts.length,
      sendSuccess: true,
    });
    toast.error("🚨 Voice SOS Triggered! Contacts notified.");
    setConfirmOpen(false);
  };

  return (
    <div
      className="bg-card border border-border rounded-2xl p-5 space-y-4"
      data-ocid="tools.voice.card"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Mic className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <p className="font-semibold text-sm">Voice SOS</p>
            <p className="text-xs text-muted-foreground">
              Say "Help me" or "SOS"
            </p>
          </div>
        </div>
        <SupportBadge supported={supported} />
      </div>

      {supported === false ? (
        <p className="text-xs text-muted-foreground bg-secondary rounded-xl p-3">
          Voice activation requires Chrome or Edge on Android/desktop. Not
          supported in this browser.
        </p>
      ) : (
        <Button
          onClick={listening ? stopListening : startListening}
          className={`w-full ${
            listening
              ? "bg-purple-600 hover:bg-purple-700 animate-pulse"
              : "bg-purple-600 hover:bg-purple-700"
          } text-white`}
          data-ocid="tools.voice.primary_button"
        >
          <Mic className="w-4 h-4 mr-2" />
          {listening ? "Listening... (tap to stop)" : "Start Listening"}
        </Button>
      )}

      {listening && (
        <p className="text-xs text-muted-foreground text-center">
          Keywords: &quot;help me&quot;, &quot;SOS&quot;, &quot;emergency&quot;,
          &quot;bachao&quot;
        </p>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent data-ocid="tools.voice.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>🎤 SOS Keyword Detected!</AlertDialogTitle>
            <AlertDialogDescription>
              A safety keyword was detected. Do you want to send an SOS alert?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="tools.voice.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={triggerSOS}
              className="bg-primary"
              data-ocid="tools.voice.confirm_button"
            >
              Send SOS!
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function SafetyToolsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display font-bold text-2xl">Safety Tools</h2>
        <p className="text-sm text-muted-foreground">
          Emergency tools to help you stay safe in any situation.
        </p>
      </div>

      <FakeCallTool />
      <SirenTool />
      <FlashlightTool />
      <ShakeTool />
      <VoiceSOSTool />
    </div>
  );
}
