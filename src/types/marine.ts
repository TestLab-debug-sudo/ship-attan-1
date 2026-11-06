export type UserRole = 'admin' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  title: string;
  avatarUrl?: string;
  lastLogin?: string;
  permissions?: string[];
}

export type EmployeeRole = 
  | 'manager'
  | 'supervisor'
  | 'operator'
  | 'skipper' 
  | 'first_mate' 
  | 'marine_engineer' 
  | 'deckhand' 
  | 'dockmaster' 
  | 'marina_technician' 
  | 'safety_officer';

export type AvailabilityStatus = 
  | 'available' 
  | 'on_sea' 
  | 'on_duty' 
  | 'standby' 
  | 'on_leave' 
  | 'sick';

export type ShiftType = 'morning' | 'evening' | 'full_day' | 'off';

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  role: EmployeeRole;
  station?: string;
  phone: string;
  email: string;
  emergencyContact: string;
  certifications: string[];
  status: AvailabilityStatus;
  assignedShift: ShiftType;
  currentBoatId?: string;
  avatarUrl?: string;
  joinedDate: string;
  totalTripsLogged: number;
  notes?: string;
  travellingDate?: string;
  leaveDate?: string;
}

export type VesselType = 
  | 'fishing_trawler' 
  | 'catamaran' 
  | 'charter_yacht' 
  | 'sport_fisherman' 
  | 'utility_tender';

export type VesselStatus = 
  | 'docked' 
  | 'at_sea' 
  | 'moored' 
  | 'maintenance' 
  | 'standby';

export interface Boat {
  id: string;
  registrationNumber: string;
  name: string;
  vesselType: VesselType;
  lengthFt: number;
  capacityPax: number;
  fuelLevelPct: number;
  engineHours: number;
  status: VesselStatus;
  currentMarinaSlip: string;
  location: {
    lat: number;
    lng: number;
    heading: number;
    speedKnots: number;
  };
  safetyInspectionExpiry: string;
  lastMaintenanceDate: string;
  imageUrl?: string;
  notes?: string;
}

export type AttendanceStatus = 
  | 'present' 
  | 'on_sea' 
  | 'late' 
  | 'absent' 
  | 'half_day' 
  | 'leave';

export interface AttendanceCorrection {
  requestedClockIn?: string;
  requestedClockOut?: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  submittedByManagerId?: string;
  reviewedByAdminId?: string;
  reviewNote?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  role: EmployeeRole;
  date: string; // YYYY-MM-DD
  clockIn?: string;
  clockOut?: string;
  status: AttendanceStatus;
  marinaZone?: string;
  hoursWorked?: number;
  verifiedBy?: string;
  correctionRequest?: AttendanceCorrection;
}

export type LeaveType = 'annual' | 'sick' | 'marine_rest' | 'emergency';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  totalDays: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedBy?: string;
  reviewerComment?: string;
}

export type TripType = 
  | 'deep_sea_fishing' 
  | 'coastal_charter' 
  | 'harbor_tour' 
  | 'island_transfer' 
  | 'sea_trial';

export type TripStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface DepartureChecklist {
  safetyGearVerified: boolean;
  marineRadioTested: boolean;
  fuelVerified: boolean;
  weatherClearance: boolean;
  manifestSigned: boolean;
  firstAidKitInspected: boolean;
  bilgePumpTested: boolean;
}

export interface ArrivalLog {
  actualReturnTime: string;
  nauticalMiles: number;
  fuelConsumedLiters: number;
  catchWeightKg?: number;
  catchSpecies?: string[];
  seaConditionsRating: number; // 1 to 5
  logNotes: string;
}

export interface TripRecord {
  id: string;
  tripNumber: string;
  boatId: string;
  boatName: string;
  tripType: TripType;
  skipperId: string;
  skipperName: string;
  crew: {
    employeeId: string;
    employeeName: string;
    role: EmployeeRole;
  }[];
  scheduledDeparture: string;
  scheduledReturn: string;
  actualDeparture?: string;
  actualReturn?: string;
  status: TripStatus;
  departureChecklist: DepartureChecklist;
  arrivalLog?: ArrivalLog;
  passengerCount: number;
  destination: string;
  weatherSummary: string;
  routeCoordinates?: [number, number][];
}

export interface MarineWeather {
  windSpeedKnots: number;
  windDirection: string;
  waveHeightMeters: number;
  waterTempCelsius: number;
  tideState: 'High Tide' | 'Low Tide' | 'Rising' | 'Ebbing';
  tideNextChangeTime: string;
  advisoryFlag: 'green' | 'yellow' | 'red';
  advisoryMessage: string;
  barometerHpa: number;
  visibilityNm: number;
}

export interface DatabaseStatus {
  connected: boolean;
  engine: 'mongodb' | 'embedded';
  uriConfigured: boolean;
  maskedUri?: string;
  stats: {
    employees: number;
    boats: number;
    attendanceRecords: number;
    leaveRequests: number;
    trips: number;
  };
  lastSync: string;
}
