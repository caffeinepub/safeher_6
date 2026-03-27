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
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, ChevronUp, FileText, MapPin } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import { useSafeHer } from "../context/SafeHerContext";
import type { CommunityReport } from "../types";

const CATEGORIES = [
  {
    value: "poor_lighting",
    label: "Poor Lighting",
    icon: "💡",
    color: "text-yellow-400 bg-yellow-500/15 border-yellow-500/30",
  },
  {
    value: "harassment_zone",
    label: "Harassment Zone",
    icon: "⚠️",
    color: "text-rose-400 bg-rose-500/15 border-rose-500/30",
  },
  {
    value: "isolated_road",
    label: "Isolated Road",
    icon: "🚫",
    color: "text-orange-400 bg-orange-500/15 border-orange-500/30",
  },
  {
    value: "suspicious_activity",
    label: "Suspicious Activity",
    icon: "👁",
    color: "text-purple-400 bg-purple-500/15 border-purple-500/30",
  },
  {
    value: "unsafe_transport",
    label: "Unsafe Transport",
    icon: "🚌",
    color: "text-blue-400 bg-blue-500/15 border-blue-500/30",
  },
] as const;

const STATUS_CONFIG = {
  pending: {
    label: "Pending Review",
    cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  },
  approved: {
    label: "Approved",
    cls: "bg-green-500/15 text-green-400 border-green-500/30",
  },
  rejected: {
    label: "Rejected",
    cls: "bg-muted text-muted-foreground border-border",
  },
};

export default function ReportsPage() {
  const { reports, addReport, updateReport } = useSafeHer();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "" as CommunityReport["category"] | "",
    locationName: "",
  });

  const handleSubmit = () => {
    if (!form.title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!form.category) {
      toast.error("Please select a category");
      return;
    }
    if (!form.locationName.trim()) {
      toast.error("Location name is required");
      return;
    }

    const report: CommunityReport = {
      id: `report_${Date.now()}`,
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category as CommunityReport["category"],
      locationName: form.locationName.trim(),
      timestamp: Date.now(),
      status: "pending",
      upvotes: 0,
    };

    addReport(report);
    setForm({ title: "", description: "", category: "", locationName: "" });
    toast.success("Report submitted! It will be reviewed by admins.");
  };

  const handleUpvote = (report: CommunityReport) => {
    updateReport({ ...report, upvotes: report.upvotes + 1 });
  };

  const getCategoryConfig = (cat: CommunityReport["category"]) =>
    CATEGORIES.find((c) => c.value === cat) ?? CATEGORIES[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display font-bold text-2xl">Community Reports</h2>
        <p className="text-sm text-muted-foreground">
          Help keep your community safe by reporting unsafe areas.
        </p>
      </div>

      {/* Report Form */}
      <div
        className="bg-card border border-border rounded-2xl p-5 space-y-4"
        data-ocid="reports.form.panel"
      >
        <h3 className="font-display font-semibold text-base">
          Report Unsafe Area
        </h3>

        <div>
          <Label htmlFor="r-title">Title *</Label>
          <Input
            id="r-title"
            value={form.title}
            onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
            placeholder="e.g. Dark alley near metro station"
            className="mt-1"
            data-ocid="reports.title.input"
          />
        </div>

        <div>
          <Label htmlFor="r-cat">Category *</Label>
          <Select
            value={form.category}
            onValueChange={(v) =>
              setForm((p) => ({
                ...p,
                category: v as CommunityReport["category"],
              }))
            }
          >
            <SelectTrigger
              id="r-cat"
              className="mt-1"
              data-ocid="reports.category.select"
            >
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.icon} {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="r-loc">Location Name *</Label>
          <Input
            id="r-loc"
            value={form.locationName}
            onChange={(e) =>
              setForm((p) => ({ ...p, locationName: e.target.value }))
            }
            placeholder="e.g. Near Connaught Place Metro, Delhi"
            className="mt-1"
            data-ocid="reports.location.input"
          />
        </div>

        <div>
          <Label htmlFor="r-desc">Description</Label>
          <Textarea
            id="r-desc"
            value={form.description}
            onChange={(e) =>
              setForm((p) => ({ ...p, description: e.target.value }))
            }
            placeholder="Describe the unsafe conditions..."
            className="mt-1 resize-none"
            rows={3}
            data-ocid="reports.description.textarea"
          />
        </div>

        <Button
          onClick={handleSubmit}
          className="w-full bg-primary text-primary-foreground"
          data-ocid="reports.submit.submit_button"
        >
          <AlertTriangle className="w-4 h-4 mr-2" /> Submit Report
        </Button>
      </div>

      {/* Reports List */}
      {reports.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-10 space-y-3"
          data-ocid="reports.empty_state"
        >
          <div className="text-4xl">📝</div>
          <p className="font-display font-semibold">No reports yet</p>
          <p className="text-sm text-muted-foreground">
            Help keep your community safe by reporting unsafe areas.
          </p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          <h3 className="font-display font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Submitted Reports ({reports.length})
          </h3>
          <AnimatePresence>
            {reports.map((r, i) => {
              const cat = getCategoryConfig(r.category);
              const status = STATUS_CONFIG[r.status];
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-2xl p-4 space-y-3"
                  data-ocid={`reports.item.${i + 1}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{cat.icon}</span>
                      <div>
                        <p className="font-semibold text-sm">{r.title}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {r.locationName}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge
                      className={`text-[10px] flex-shrink-0 ${status.cls}`}
                    >
                      {status.label}
                    </Badge>
                  </div>

                  {r.description && (
                    <p className="text-xs text-muted-foreground">
                      {r.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <Badge className={`text-[10px] ${cat.color} border`}>
                      {cat.label}
                    </Badge>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {new Date(r.timestamp).toLocaleDateString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpvote(r)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        data-ocid={"reports.upvote.button"}
                      >
                        <ChevronUp className="w-3.5 h-3.5" /> {r.upvotes}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
