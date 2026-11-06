/**
 * MODEL: Oceanic Marine Authentication Data Model & MongoDB Integration Contracts
 */

export type LoginRole = 'admin' | 'manager';

export interface LoginCredentials {
  identifier: string; // Username or Email
  password: string;
  role: LoginRole;
  rememberMe: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errorMessage?: string;
}

export interface MarineKpiSnapshot {
  employeesCount: string;
  boatsCount: string;
  atSeaCount: string;
  atHarbourCount: string;
}

export interface MongoAuthContract {
  clusterUri?: string;
  dbName: string;
  collection: string;
  supportedAuthMechanisms: string[];
  isAtlasReady: boolean;
}

export const REMEMBER_ME_STORAGE_KEY = 'oceanic_marine_saved_user';

export const DEFAULT_PRESET_CREDENTIALS: Record<LoginRole, { identifier: string; password: string; title: string }> = {
  admin: {
    identifier: 'admin@nautica.marine',
    password: 'admin123',
    title: 'Station Administrator & Marine Operations Head'
  },
  manager: {
    identifier: 'manager@nautica.marine',
    password: 'manager123',
    title: 'Marine Dispatch & Attendance Operations Manager'
  }
};

export const DEFAULT_MARINE_KPIS: MarineKpiSnapshot = {
  employeesCount: '20+',
  boatsCount: '5',
  atSeaCount: '3',
  atHarbourCount: '2'
};

export const MONGO_AUTH_INTEGRATION_SPEC: MongoAuthContract = {
  dbName: 'nautica_marine_operations',
  collection: 'users',
  supportedAuthMechanisms: ['SCRAM-SHA-256', 'JWT-Bearer', 'Bcrypt-Hash'],
  isAtlasReady: true
};

export function validateLoginInput(identifier: string, password: string): ValidationResult {
  if (!identifier || !identifier.trim()) {
    return { isValid: false, errorMessage: 'Please enter your username or registered marine email.' };
  }
  if (!password || password.length < 4) {
    return { isValid: false, errorMessage: 'Password must be at least 4 characters.' };
  }
  return { isValid: true };
}

export function saveRememberedUser(credentials: { identifier: string; role: LoginRole }) {
  try {
    localStorage.setItem(REMEMBER_ME_STORAGE_KEY, JSON.stringify(credentials));
  } catch (e) {
    console.warn('Unable to persist credentials to localStorage', e);
  }
}

export function loadRememberedUser(): { identifier: string; role: LoginRole } | null {
  try {
    const raw = localStorage.getItem(REMEMBER_ME_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearRememberedUser() {
  try {
    localStorage.removeItem(REMEMBER_ME_STORAGE_KEY);
  } catch (e) {
    console.warn('Unable to clear remembered user', e);
  }
}
