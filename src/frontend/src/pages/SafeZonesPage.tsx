import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, MapPin, Trash2 } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSafeHer } from "../context/SafeHerContext";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import type { SafeZone } from "../types";

const LABEL_ICONS: Record<SafeZone["label"], string> = {
  home: "🏠",
  college: "🎓",
  hostel: "🏨",
  workplace: "🏢",
  friends_house: "👥",
  custom: "📍",
};

const LABEL_NAMES: Record<SafeZone["label"], string> = {
  home: "Home",
  college: "College",
  hostel: "Hostel",
  workplace: "Workplace",
  friends_house: "Friend's House",
  custom: "Custom",
};

export default function SafeZonesPage() {
  const { safeZones, addSafeZone, removeSafeZone } = useSafeHer();
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const [name, setName] = useState("");
  const [label, setLabel] = useState<SafeZone["label"]>("home");
  const [locating, setLocating] = useState(false);
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [saving, setSaving] = useState(false);

  const useCurrentLocation = () => {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLng(pos.coords.longitude.toFixed(6));
        setLocating(false);
        toast.success("Location captured");
      },
      () => {
        setLocating(false);
        toast.error("Could not get location");
      },
      { timeout: 8000 },
    );
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a zone name");
      return;
    }
    if (!lat || !lng) {
      toast.error("Please set a location");
      return;
    }

    setSaving(true);
    const zone: SafeZone = {
      id: `sz_${Date.now()}`,
      name: name.trim(),
      label,
      lat: Number.parseFloat(lat),
      lng: Number.parseFloat(lng),
      radius: 200,
    };

    try {
      if (actor && identity) {
        const userId = identity.getPrincipal().toString();
        await actor.saveSafeZone(userId, {
          id: zone.id,
          name: zone.name,
          zoneLabel: zone.label,
          lat: zone.lat,
          long: zone.lng,
          radius: zone.radius,
        });
      }
    } catch (err) {
      console.warn("[SafeHer] Safe zone backend save failed, using local", err);
    }

    addSafeZone(zone);
    setName("");
    setLat("");
    setLng("");
    setSaving(false);
    toast.success(`Safe zone "${zone.name}" saved!`);
  };

  const handleDelete = async (id: string) => {
    try {
      if (actor && identity) {
        const userId = identity.getPrincipal().toString();
        await actor.deleteSafeZone(userId, id);
      }
    } catch (err) {
      console.warn("[SafeHer] Safe zone delete failed", err);
    }
    removeSafeZone(id);
    toast.info("Safe zone removed");
  };

  return (
    <div className="space-y-4 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 rounded-2xl p-4"
        data-ocid="safezones.panel"
      >
        <h1 className="font-display font-bold text-xl">Safe Zones</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Save trusted places. Entering a safe zone during Journey Mode can
          auto-stop tracking and notify your guardians.
        </p>
      </motion.div>

      {/* Add Zone Form */}
      <div
        className="bg-card border border-border rounded-2xl p-4 space-y-3"
        data-ocid="safezones.add.panel"
      >
        <p className="font-semibold text-sm">Add Safe Zone</p>

        <div className="space-y-2">
          <Label className="text-xs">Zone Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. My Home, College Hostel"
            className="h-9 text-sm"
            data-ocid="safezones.name.input"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Zone Type</Label>
          <Select
            value={label}
            onValueChange={(v) => setLabel(v as SafeZone["label"])}
          >
            <SelectTrigger
              className="h-9 text-sm"
              data-ocid="safezones.label.select"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(LABEL_NAMES) as SafeZone["label"][]).map((k) => (
                <SelectItem key={k} value={k}>
                  {LABEL_ICONS[k]} {LABEL_NAMES[k]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">Location</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={useCurrentLocation}
              disabled={locating}
              className="h-6 text-[10px] text-primary"
              data-ocid="safezones.use_location.button"
            >
              {locating ? (
                <Loader2 className="w-3 h-3 animate-spin mr-1" />
              ) : (
                <MapPin className="w-3 h-3 mr-1" />
              )}
              Use My Current Location
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="Latitude"
              className="h-9 text-sm"
              data-ocid="safezones.lat.input"
            />
            <Input
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="Longitude"
              className="h-9 text-sm"
              data-ocid="safezones.lng.input"
            />
          </div>
        </div>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="w-full"
          data-ocid="safezones.save.button"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Save Safe Zone
        </Button>
      </div>

      {/* Zone List */}
      {safeZones.length === 0 ? (
        <div
          className="text-center py-10 text-sm text-muted-foreground"
          data-ocid="safezones.empty_state"
        >
          No safe zones saved yet. Add your home, college, or workplace above.
        </div>
      ) : (
        <div className="space-y-2" data-ocid="safezones.list">
          {safeZones.map((zone, i) => (
            <motion.div
              key={zone.id}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-3 flex items-center gap-3"
              data-ocid={`safezones.item.${i + 1}`}
            >
              <span className="text-2xl flex-shrink-0">
                {LABEL_ICONS[zone.label]}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{zone.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge className="text-[9px] bg-primary/10 text-primary border-primary/20 px-1.5">
                    {LABEL_NAMES[zone.label]}
                  </Badge>
                  <span className="text-[10px] text-muted-foreground">
                    {zone.lat.toFixed(4)}, {zone.lng.toFixed(4)} · r
                    {zone.radius}m
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(zone.id)}
                className="w-8 h-8 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 flex items-center justify-center flex-shrink-0"
                data-ocid={`safezones.delete.button.${i + 1}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <div className="bg-secondary/50 border border-border rounded-xl p-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          💡 When entering a safe zone during Journey Mode, the system can
          auto-stop tracking and optionally notify your guardians that you
          arrived safely. Leaving a safe zone late at night may suggest enabling
          Journey Mode.
        </p>
      </div>
    </div>
  );
}
