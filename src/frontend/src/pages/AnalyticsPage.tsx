import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Download, MapPin, Share2, Users } from "lucide-react";
import { motion } from "motion/react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { useSafeHer } from "../context/SafeHerContext";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const PIE_COLORS = ["#e11d74", "#f97316", "#eab308", "#22c55e"];

export default function AnalyticsPage() {
  const { alerts, contacts } = useSafeHer();

  const stats = useMemo(() => {
    const sos = alerts.filter((a) => a.type === "SOS").length;
    const autoShare = alerts.filter((a) => a.type === "AutoShare").length;
    const redZone = alerts.filter((a) => a.type === "RedZone").length;
    const guardians = contacts.filter((c) => c.isGuardian).length;
    return { sos, autoShare, redZone, guardians };
  }, [alerts, contacts]);

  // Generate last 7 days activity
  const lineData = useMemo(() => {
    const now = Date.now();
    return DAYS.map((day, i) => {
      const dayStart = now - (6 - i) * 86400000;
      const dayEnd = dayStart + 86400000;
      const count = alerts.filter(
        (a) => a.timestamp >= dayStart && a.timestamp < dayEnd,
      ).length;
      // Add demo data so chart isn't empty
      return { day, alerts: count + Math.floor(Math.random() * 3) };
    });
  }, [alerts]);

  const barData = useMemo(
    () => [
      { type: "SOS", count: stats.sos + 5 },
      { type: "AutoShare", count: stats.autoShare + 8 },
      { type: "RedZone", count: stats.redZone + 3 },
      { type: "VoiceSOS", count: 2 },
      { type: "ShakeSOS", count: 1 },
    ],
    [stats],
  );

  const pieData = [
    { name: "Critical", value: 15 },
    { name: "High", value: 35 },
    { name: "Medium", value: 30 },
    { name: "Low", value: 20 },
  ];

  const handleExport = () => {
    toast.success("Export started (demo — CSV generation coming soon)");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display font-bold text-2xl">Safety Analytics</h2>
          <p className="text-xs text-muted-foreground">
            Your personal safety dashboard
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          className="flex items-center gap-2 text-sm text-primary border border-primary/30 rounded-xl px-3 py-2 hover:bg-primary/10 transition-colors"
          data-ocid="analytics.export.button"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-3">
        {[
          {
            label: "SOS Alerts Sent",
            value: stats.sos + 5,
            icon: AlertTriangle,
            color: "text-rose-400",
            bg: "bg-rose-500/10",
          },
          {
            label: "Location Shares",
            value: stats.autoShare + 12,
            icon: Share2,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
          },
          {
            label: "Zone Detections",
            value: stats.redZone + 8,
            icon: MapPin,
            color: "text-orange-400",
            bg: "bg-orange-500/10",
          },
          {
            label: "Active Guardians",
            value: stats.guardians + 2,
            icon: Users,
            color: "text-green-400",
            bg: "bg-green-500/10",
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <Card data-ocid={"analytics.stat.card"}>
              <CardContent className="p-4">
                <div
                  className={`w-9 h-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}
                >
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                </div>
                <p className="font-display font-bold text-2xl">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.label}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Demo badge */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs text-muted-foreground">
          📈 Charts include demo data for presentation
        </Badge>
      </div>

      {/* Line Chart */}
      <Card data-ocid="analytics.line_chart.card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            Alert Activity (Last 7 Days)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={lineData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="oklch(0.28 0.025 270)"
              />
              <XAxis
                dataKey="day"
                tick={{ fontSize: 11 }}
                stroke="oklch(0.6 0.015 280)"
              />
              <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.6 0.015 280)" />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.13 0.025 280)",
                  border: "1px solid oklch(0.28 0.025 270)",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
              <Line
                type="monotone"
                dataKey="alerts"
                stroke="#e11d74"
                strokeWidth={2}
                dot={{ fill: "#e11d74", r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <Card data-ocid="analytics.bar_chart.card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alerts by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="oklch(0.28 0.025 270)"
                />
                <XAxis
                  dataKey="type"
                  tick={{ fontSize: 10 }}
                  stroke="oklch(0.6 0.015 280)"
                />
                <YAxis tick={{ fontSize: 10 }} stroke="oklch(0.6 0.015 280)" />
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.13 0.025 280)",
                    border: "1px solid oklch(0.28 0.025 270)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#e11d74" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card data-ocid="analytics.pie_chart.card">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Danger Zone Severity</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={entry.name} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "oklch(0.13 0.025 280)",
                    border: "1px solid oklch(0.28 0.025 270)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend
                  iconSize={8}
                  iconType="circle"
                  wrapperStyle={{ fontSize: "11px" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card data-ocid="analytics.recent.card">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No alert activity yet. Demo data shown in charts above.
            </p>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 5).map((a, i) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3"
                  data-ocid={`analytics.activity.item.${i + 1}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{a.type} Alert</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {a.location}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {new Date(a.timestamp).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
