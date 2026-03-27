import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface http_request_result {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface JourneySession {
    id: string;
    startTime: bigint;
    status: string;
    destination: string;
    userId: string;
    isActive: boolean;
    currentLong: number;
    currentLat: number;
    estimatedArrival: bigint;
}
export interface TransformationOutput {
    status: bigint;
    body: Uint8Array;
    headers: Array<http_header>;
}
export interface AlertResult {
    status: string;
    contactsNotified: bigint;
    mapLink: string;
    isMockMode: boolean;
    failedContacts: Array<string>;
    providerUsed: string;
}
export interface TransformationInput {
    context: Uint8Array;
    response: http_request_result;
}
export interface SystemStats {
    totalAutoAlerts: bigint;
    failedDeliveries: bigint;
    totalSosAlerts: bigint;
    totalUsers: bigint;
    totalDeliveries: bigint;
}
export interface SafeZone {
    id: string;
    lat: number;
    long: number;
    name: string;
    zoneLabel: string;
    radius: number;
}
export interface EmergencyContact {
    id: string;
    relationship: string;
    isGuardian: boolean;
    name: string;
    phone: string;
}
export interface AlertLog {
    id: string;
    lat: number;
    alertType: string;
    contactsNotified: bigint;
    mapLink: string;
    isMockMode: boolean;
    userId: string;
    long: number;
    errorDetails?: string;
    failedContacts: Array<string>;
    timestamp: bigint;
    providerUsed: string;
    overallStatus: string;
    locationAccuracy: number;
}
export interface UserProfile {
    name: string;
    email: string;
    bloodGroup?: string;
    address?: string;
    phone: string;
}
export interface http_header {
    value: string;
    name: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    clearAlertLogs(userId: string): Promise<boolean>;
    deleteEmergencyContact(userId: string, contactId: string): Promise<boolean>;
    deleteSafeZone(userId: string, zoneId: string): Promise<boolean>;
    endJourney(journeyId: string, status: string): Promise<boolean>;
    getActiveJourney(userId: string): Promise<JourneySession | null>;
    getAlertLogs(userId: string): Promise<Array<AlertLog>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getEmergencyContacts(userId: string): Promise<Array<EmergencyContact>>;
    getProfile(userId: string): Promise<UserProfile | null>;
    getSafeZones(userId: string): Promise<Array<SafeZone>>;
    getSystemStats(): Promise<SystemStats>;
    getTwilioStatus(): Promise<{
        isMockMode: boolean;
        configured: boolean;
        fromNumber?: string;
    }>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveEmergencyContact(userId: string, contact: EmergencyContact): Promise<string>;
    saveProfile(userId: string, profile: UserProfile): Promise<boolean>;
    saveSafeZone(userId: string, zone: SafeZone): Promise<string>;
    sendAutoLocationAlert(userId: string, lat: number, long: number, userName: string, timestamp: bigint): Promise<AlertResult>;
    sendSosAlert(userId: string, lat: number, long: number, accuracy: number, userName: string, timestamp: bigint): Promise<AlertResult>;
    setTwilioConfig(sid: string, authToken: string, fromNumber: string): Promise<boolean>;
    startJourney(userId: string, destination: string, estimatedArrival: bigint): Promise<string>;
    transform(input: TransformationInput): Promise<TransformationOutput>;
    updateJourneyLocation(journeyId: string, lat: number, long: number): Promise<boolean>;
}
