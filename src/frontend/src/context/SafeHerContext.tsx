import { type ReactNode, createContext, useContext } from "react";
import {
  useAlerts,
  useCheckIn,
  useCommunityReports,
  useContacts,
  useDangerZones,
  useEscalation,
  useJourneySessions,
  useNotifications,
  useOfficialContacts,
  useProfile,
  useSafeZones,
  useSharingStatus,
  useTimeline,
} from "../hooks/useSafeHerStore";
import type {
  AlertRecord,
  AppNotification,
  CheckInSession,
  CommunityReport,
  DangerZone,
  EmergencyContact,
  EscalationLevel,
  IndiaOfficialContact,
  JourneySession,
  SafeZone,
  SafetyTimelineEvent,
  SharingStatus,
  UserProfile,
} from "../types";

interface SafeHerContextType {
  profile: UserProfile | null;
  saveProfile: (p: UserProfile) => void;
  contacts: EmergencyContact[];
  addContact: (c: EmergencyContact) => void;
  updateContact: (c: EmergencyContact) => void;
  deleteContact: (id: string) => void;
  alerts: AlertRecord[];
  addAlert: (a: AlertRecord) => void;
  clearAlerts: () => void;
  zones: DangerZone[];
  sharingStatus: SharingStatus;
  setSharingStatus: (s: SharingStatus) => void;
  officialContacts: IndiaOfficialContact[];
  journeys: JourneySession[];
  addJourney: (j: JourneySession) => void;
  updateJourney: (j: JourneySession) => void;
  reports: CommunityReport[];
  addReport: (r: CommunityReport) => void;
  updateReport: (r: CommunityReport) => void;
  notifications: AppNotification[];
  addNotification: (
    n: Omit<AppNotification, "id" | "timestamp" | "read">,
  ) => void;
  markAllRead: () => void;
  markRead: (id: string) => void;
  unreadCount: number;
  safeZones: SafeZone[];
  addSafeZone: (z: SafeZone) => void;
  removeSafeZone: (id: string) => void;
  timelineEvents: SafetyTimelineEvent[];
  addTimelineEvent: (e: SafetyTimelineEvent) => void;
  escalationLevel: EscalationLevel;
  setEscalationLevel: (l: EscalationLevel) => void;
  checkInSession: CheckInSession | null;
  setCheckInSession: (s: CheckInSession | null) => void;
}

const SafeHerContext = createContext<SafeHerContextType | null>(null);

export function SafeHerProvider({ children }: { children: ReactNode }) {
  const profileStore = useProfile();
  const contactsStore = useContacts();
  const alertsStore = useAlerts();
  const zonesStore = useDangerZones();
  const sharingStore = useSharingStatus();
  const officialContactsStore = useOfficialContacts();
  const journeyStore = useJourneySessions();
  const reportsStore = useCommunityReports();
  const notificationsStore = useNotifications();
  const safeZonesStore = useSafeZones();
  const timelineStore = useTimeline();
  const escalationStore = useEscalation();
  const checkInStore = useCheckIn();

  return (
    <SafeHerContext.Provider
      value={{
        ...profileStore,
        ...contactsStore,
        ...alertsStore,
        ...zonesStore,
        ...sharingStore,
        ...officialContactsStore,
        ...journeyStore,
        ...reportsStore,
        ...notificationsStore,
        ...safeZonesStore,
        ...timelineStore,
        ...escalationStore,
        ...checkInStore,
      }}
    >
      {children}
    </SafeHerContext.Provider>
  );
}

export function useSafeHer() {
  const ctx = useContext(SafeHerContext);
  if (!ctx) throw new Error("useSafeHer must be used inside SafeHerProvider");
  return ctx;
}
