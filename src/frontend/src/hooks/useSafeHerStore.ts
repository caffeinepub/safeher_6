import { useCallback, useState } from "react";
import { INDIA_DANGER_ZONES } from "../data/dangerZones";
import { INDIA_EMERGENCY_CONTACTS } from "../data/emergencyContacts";
import type {
  AlertRecord,
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
import { useNotifications } from "./useNotifications";

export const DEFAULT_DANGER_ZONES: DangerZone[] = INDIA_DANGER_ZONES;

function readLS<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLS<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function useProfile() {
  const [profile, setProfileState] = useState<UserProfile | null>(() =>
    readLS<UserProfile | null>("safeher_profile", null),
  );

  const saveProfile = useCallback((p: UserProfile) => {
    writeLS("safeher_profile", p);
    setProfileState(p);
  }, []);

  return { profile, saveProfile };
}

export function useContacts() {
  const [contacts, setContactsState] = useState<EmergencyContact[]>(() =>
    readLS<EmergencyContact[]>("safeher_contacts", []),
  );

  const addContact = useCallback((c: EmergencyContact) => {
    setContactsState((prev) => {
      const next = [...prev, c];
      writeLS("safeher_contacts", next);
      return next;
    });
  }, []);

  const updateContact = useCallback((updated: EmergencyContact) => {
    setContactsState((prev) => {
      const next = prev.map((c) => (c.id === updated.id ? updated : c));
      writeLS("safeher_contacts", next);
      return next;
    });
  }, []);

  const deleteContact = useCallback((id: string) => {
    setContactsState((prev) => {
      const next = prev.filter((c) => c.id !== id);
      writeLS("safeher_contacts", next);
      return next;
    });
  }, []);

  return { contacts, addContact, updateContact, deleteContact };
}

export function useAlerts() {
  const [alerts, setAlertsState] = useState<AlertRecord[]>(() =>
    readLS<AlertRecord[]>("safeher_alerts", []),
  );

  const addAlert = useCallback((a: AlertRecord) => {
    setAlertsState((prev) => {
      const next = [a, ...prev].slice(0, 100);
      writeLS("safeher_alerts", next);
      return next;
    });
  }, []);

  const clearAlerts = useCallback(() => {
    writeLS("safeher_alerts", []);
    setAlertsState([]);
  }, []);

  return { alerts, addAlert, clearAlerts };
}

export function useDangerZones() {
  const zones: DangerZone[] = INDIA_DANGER_ZONES;
  return { zones };
}

export function useOfficialContacts() {
  const officialContacts: IndiaOfficialContact[] = INDIA_EMERGENCY_CONTACTS;
  return { officialContacts };
}

export function useSharingStatus() {
  const [status, setStatusState] = useState<SharingStatus>(() =>
    readLS<SharingStatus>("safeher_sharing", "stopped"),
  );

  const setStatus = useCallback((s: SharingStatus) => {
    writeLS("safeher_sharing", s);
    setStatusState(s);
  }, []);

  return { sharingStatus: status, setSharingStatus: setStatus };
}

export function useJourneySessions() {
  const [journeys, setJourneysState] = useState<JourneySession[]>(() =>
    readLS<JourneySession[]>("safeher_journeys", []),
  );

  const addJourney = useCallback((j: JourneySession) => {
    setJourneysState((prev) => {
      const next = [j, ...prev].slice(0, 20);
      writeLS("safeher_journeys", next);
      return next;
    });
  }, []);

  const updateJourney = useCallback((updated: JourneySession) => {
    setJourneysState((prev) => {
      const next = prev.map((j) => (j.id === updated.id ? updated : j));
      writeLS("safeher_journeys", next);
      return next;
    });
  }, []);

  return { journeys, addJourney, updateJourney };
}

export function useCommunityReports() {
  const [reports, setReportsState] = useState<CommunityReport[]>(() =>
    readLS<CommunityReport[]>("safeher_reports", []),
  );

  const addReport = useCallback((r: CommunityReport) => {
    setReportsState((prev) => {
      const next = [r, ...prev].slice(0, 100);
      writeLS("safeher_reports", next);
      return next;
    });
  }, []);

  const updateReport = useCallback((updated: CommunityReport) => {
    setReportsState((prev) => {
      const next = prev.map((r) => (r.id === updated.id ? updated : r));
      writeLS("safeher_reports", next);
      return next;
    });
  }, []);

  return { reports, addReport, updateReport };
}

export function useSafeZones() {
  const [safeZones, setSafeZonesState] = useState<SafeZone[]>(() =>
    readLS<SafeZone[]>("safeher_safe_zones", []),
  );

  const addSafeZone = useCallback((z: SafeZone) => {
    setSafeZonesState((prev) => {
      const next = [...prev, z];
      writeLS("safeher_safe_zones", next);
      return next;
    });
  }, []);

  const removeSafeZone = useCallback((id: string) => {
    setSafeZonesState((prev) => {
      const next = prev.filter((z) => z.id !== id);
      writeLS("safeher_safe_zones", next);
      return next;
    });
  }, []);

  return { safeZones, addSafeZone, removeSafeZone };
}

export function useTimeline() {
  const [timelineEvents, setTimelineEvents] = useState<SafetyTimelineEvent[]>(
    () => readLS<SafetyTimelineEvent[]>("safeher_timeline", []),
  );

  const addTimelineEvent = useCallback((e: SafetyTimelineEvent) => {
    setTimelineEvents((prev) => {
      const next = [e, ...prev].slice(0, 50);
      writeLS("safeher_timeline", next);
      return next;
    });
  }, []);

  return { timelineEvents, addTimelineEvent };
}

export function useEscalation() {
  const [escalationLevel, setEscalationLevelState] = useState<EscalationLevel>(
    () => readLS<EscalationLevel>("safeher_escalation", 1),
  );

  const setEscalationLevel = useCallback((l: EscalationLevel) => {
    writeLS("safeher_escalation", l);
    setEscalationLevelState(l);
  }, []);

  return { escalationLevel, setEscalationLevel };
}

export function useCheckIn() {
  const [checkInSession, setCheckInSessionState] =
    useState<CheckInSession | null>(() =>
      readLS<CheckInSession | null>("safeher_checkin_session", null),
    );

  const setCheckInSession = useCallback((s: CheckInSession | null) => {
    writeLS("safeher_checkin_session", s);
    setCheckInSessionState(s);
  }, []);

  return { checkInSession, setCheckInSession };
}

export { useNotifications };
