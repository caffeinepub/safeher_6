export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  bloodGroup?: string;
  address?: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isGuardian?: boolean;
  isActive?: boolean;
}

export interface ContactDelivery {
  contactId: string;
  name: string;
  phone: string;
  status: "sent" | "failed";
  timestamp: number;
}

export type AlertType =
  | "SOS"
  | "RedZone"
  | "AutoShare"
  | "VoiceSOS"
  | "ShakeSOS"
  | "Journey";

export interface AlertRecord {
  id: string;
  type: AlertType;
  timestamp: number;
  location: string;
  lat?: number;
  lng?: number;
  contactsNotified: number;
  sendSuccess?: boolean;
  deliveryStatuses?: ContactDelivery[];
  errorMessage?: string;
  providerUsed?: string;
  isMockMode?: boolean;
  mapLink?: string;
}

export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface DangerZone {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  polygon?: [number, number][];
  city?: string;
  state?: string;
  riskLevel?: RiskLevel;
  category?: string;
}

export type OfficialContactType =
  | "police_station"
  | "police_control_room"
  | "women_helpline"
  | "ambulance"
  | "national_emergency";

export interface IndiaOfficialContact {
  id: string;
  name: string;
  type: OfficialContactType;
  phone: string;
  city: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  address: string;
  is24x7: boolean;
  verifiedSource: string;
  lastVerified: string;
}

export type SharingStatus = "active" | "paused" | "stopped";

export interface JourneySession {
  id: string;
  destination: string;
  startTime: number;
  estimatedArrival: number;
  status: "active" | "completed" | "missed" | "cancelled";
  startLat?: number;
  startLng?: number;
  guardianNotified: boolean;
}

export interface CommunityReport {
  id: string;
  title: string;
  description: string;
  category:
    | "poor_lighting"
    | "harassment_zone"
    | "isolated_road"
    | "suspicious_activity"
    | "unsafe_transport";
  lat?: number;
  lng?: number;
  locationName: string;
  timestamp: number;
  status: "pending" | "approved" | "rejected";
  upvotes: number;
}

export interface AppNotification {
  id: string;
  type: "alert" | "zone" | "journey" | "system";
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
}

export interface SafeZone {
  id: string;
  name: string;
  label:
    | "home"
    | "college"
    | "hostel"
    | "workplace"
    | "friends_house"
    | "custom";
  lat: number;
  lng: number;
  radius: number;
}

export interface CheckInSession {
  id: string;
  intervalMinutes: 10 | 20 | 30;
  startTime: number;
  nextCheckInAt: number;
  lastCheckInAt: number | null;
  status: "active" | "missed" | "stopped";
  missedCount: number;
}

export type EscalationLevel = 1 | 2 | 3 | 4;

export interface SafetyTimelineEvent {
  id: string;
  type:
    | "journey_start"
    | "danger_zone_entered"
    | "risk_score_changed"
    | "check_in_completed"
    | "missed_check_in"
    | "route_deviation"
    | "sos_triggered"
    | "safe_zone_entered"
    | "auto_share_sent";
  timestamp: number;
  description: string;
  severity: "info" | "warning" | "critical";
}
