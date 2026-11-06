import mongoose, { Schema, Document } from 'mongoose';
import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { 
  Employee, Boat, AttendanceRecord, LeaveRequest, TripRecord, User, DatabaseStatus 
} from '../src/types/marine.js';

// --- Mongoose Schemas (for MongoDB Atlas) ---
const UserSchema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['admin', 'manager'], required: true },
  title: { type: String, required: true },
  avatarUrl: String,
  lastLogin: String,
  permissions: [String]
});

const EmployeeSchema = new Schema({
  id: { type: String, required: true, unique: true },
  employeeCode: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  station: String,
  phone: { type: String, required: true },
  email: { type: String, required: true },
  emergencyContact: { type: String, required: true },
  certifications: [String],
  status: { type: String, required: true },
  assignedShift: { type: String, required: true },
  currentBoatId: String,
  avatarUrl: String,
  joinedDate: String,
  totalTripsLogged: Number,
  notes: String,
  travellingDate: String,
  leaveDate: String
});

const BoatSchema = new Schema({
  id: { type: String, required: true, unique: true },
  registrationNumber: { type: String, required: true },
  name: { type: String, required: true },
  vesselType: { type: String, required: true },
  lengthFt: { type: Number, required: true },
  capacityPax: { type: Number, required: true },
  fuelLevelPct: { type: Number, required: true },
  engineHours: { type: Number, required: true },
  status: { type: String, required: true },
  currentMarinaSlip: { type: String, required: true },
  location: {
    lat: Number,
    lng: Number,
    heading: Number,
    speedKnots: Number
  },
  safetyInspectionExpiry: String,
  lastMaintenanceDate: String,
  imageUrl: String,
  notes: String
});

const AttendanceSchema = new Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  employeeCode: { type: String, required: true },
  role: { type: String, required: true },
  date: { type: String, required: true },
  clockIn: String,
  clockOut: String,
  status: { type: String, required: true },
  marinaZone: String,
  hoursWorked: Number,
  verifiedBy: String,
  correctionRequest: {
    requestedClockIn: String,
    requestedClockOut: String,
    reason: String,
    status: String,
    submittedAt: String,
    submittedByManagerId: String,
    reviewedByAdminId: String,
    reviewNote: String
  }
});

const LeaveSchema = new Schema({
  id: { type: String, required: true, unique: true },
  employeeId: { type: String, required: true },
  employeeName: { type: String, required: true },
  employeeCode: { type: String, required: true },
  leaveType: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String, required: true },
  totalDays: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, required: true },
  requestedAt: { type: String, required: true },
  reviewedBy: String,
  reviewerComment: String
});

const TripSchema = new Schema({
  id: { type: String, required: true, unique: true },
  tripNumber: { type: String, required: true },
  boatId: { type: String, required: true },
  boatName: { type: String, required: true },
  tripType: { type: String, required: true },
  skipperId: { type: String, required: true },
  skipperName: { type: String, required: true },
  crew: [{
    employeeId: String,
    employeeName: String,
    role: String
  }],
  scheduledDeparture: { type: String, required: true },
  scheduledReturn: { type: String, required: true },
  actualDeparture: String,
  actualReturn: String,
  status: { type: String, required: true },
  departureChecklist: {
    safetyGearVerified: Boolean,
    marineRadioTested: Boolean,
    fuelVerified: Boolean,
    weatherClearance: Boolean,
    manifestSigned: Boolean,
    firstAidKitInspected: Boolean,
    bilgePumpTested: Boolean
  },
  arrivalLog: {
    actualReturnTime: String,
    nauticalMiles: Number,
    fuelConsumedLiters: Number,
    catchWeightKg: Number,
    catchSpecies: [String],
    seaConditionsRating: Number,
    logNotes: String
  },
  passengerCount: Number,
  destination: String,
  weatherSummary: String,
  routeCoordinates: [[Number]]
});

// Guard model creation to avoid OverwriteModelError
export const MongoUser = mongoose.models.User || mongoose.model('User', UserSchema);
export const MongoEmployee = mongoose.models.Employee || mongoose.model('Employee', EmployeeSchema);
export const MongoBoat = mongoose.models.Boat || mongoose.model('Boat', BoatSchema);
export const MongoAttendance = mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);
export const MongoLeave = mongoose.models.Leave || mongoose.model('Leave', LeaveSchema);
export const MongoTrip = mongoose.models.Trip || mongoose.model('Trip', TripSchema);

// In-Memory / File Persistent DB State
interface DataStore {
  users: (User & { passwordHash: string })[];
  employees: Employee[];
  boats: Boat[];
  attendance: AttendanceRecord[];
  leaves: LeaveRequest[];
  trips: TripRecord[];
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'marine_db.json');

// Initial High-Fidelity Domain Data (Navlakhi Station Personnel, Fleet & Roster)
export function getInitialSeedData(): DataStore {
  const adminHash = bcrypt.hashSync('admin123', 10);
  const managerHash = bcrypt.hashSync('manager123', 10);

  const users: (User & { passwordHash: string })[] = [
    {
      id: 'usr-admin-1',
      name: 'Capt. M. Madhukar Rao',
      email: 'admin@nautica.marine',
      passwordHash: adminHash,
      role: 'admin',
      title: 'Station Manager & Marine Operations Head - Navlakhi',
      avatarUrl: '/src/assets/images/avatar_captain_skipper_1793952351503.jpg',
      lastLogin: new Date().toISOString(),
      permissions: ['all', 'manage_employees', 'manage_boats', 'manage_managers', 'approve_corrections', 'approve_leave']
    },
    {
      id: 'usr-mgr-1',
      name: 'Debashish Banerjee',
      email: 'manager@nautica.marine',
      passwordHash: managerHash,
      role: 'manager',
      title: 'Marine Supervisor & Dispatch Coordinator - Navlakhi',
      avatarUrl: '',
      lastLogin: new Date().toISOString(),
      permissions: ['daily_dispatch', 'log_attendance', 'request_corrections', 'vessel_checkout', 'arrival_logs']
    },
    {
      id: 'usr-mgr-2',
      name: 'SCK Sharma',
      email: 'sck.sharma@nautica.marine',
      passwordHash: managerHash,
      role: 'manager',
      title: 'Marine Supervisor - Navlakhi',
      avatarUrl: '',
      lastLogin: new Date().toISOString(),
      permissions: ['daily_dispatch', 'log_attendance', 'request_corrections']
    }
  ];

  const employees: Employee[] = [
    {
      id: 'emp-001',
      employeeCode: 'EMP-001',
      name: 'Capt. M. Madhukar Rao',
      role: 'manager',
      station: 'NAVLAKHI',
      phone: '9553464475',
      email: 'm.madhukar.rao@nautica.marine',
      emergencyContact: 'Navlakhi Port Dispatch Desk',
      certifications: ['Master Mariner (FG)', 'STCW 95', 'GMDSS GOC', 'Port Safety Officer'],
      status: 'on_duty',
      assignedShift: 'morning',
      currentBoatId: 'boat-01',
      avatarUrl: '/src/assets/images/avatar_captain_skipper_1793952351503.jpg',
      joinedDate: '2026-04-16',
      totalTripsLogged: 412,
      notes: 'Station Manager - In charge of Navlakhi maritime operations.'
    },
    {
      id: 'emp-002',
      employeeCode: 'EMP-002',
      name: 'Debashish Banerjee',
      role: 'supervisor',
      station: 'NAVLAKHI',
      phone: '9702201293',
      email: 'debashish.b@nautica.marine',
      emergencyContact: 'Navlakhi Port Operations Desk',
      certifications: ['STCW 95', 'Vessel Traffic & Berth Supervisor', 'Maritime Radar Observer'],
      status: 'on_duty',
      assignedShift: 'morning',
      currentBoatId: 'boat-02',
      joinedDate: '2026-04-15',
      leaveDate: '2026-09-12',
      travellingDate: '2026-09-12',
      totalTripsLogged: 245,
      notes: 'Leave taken on 2026-09-12. Expected joining on 01st of November (Resumed duty).'
    },
    {
      id: 'emp-003',
      employeeCode: 'EMP-003',
      name: 'SCK Sharma',
      role: 'supervisor',
      station: 'NAVLAKHI',
      phone: '9328798325',
      email: 'sck.sharma@nautica.marine',
      emergencyContact: 'Port Control Morbi +91 9328798320',
      certifications: ['STCW 95', 'Advanced Coastal Navigation', 'Marine Dispatch Management'],
      status: 'on_leave',
      assignedShift: 'off',
      joinedDate: '2026-07-01',
      leaveDate: '2026-11-01',
      travellingDate: '2026-11-01',
      totalTripsLogged: 168,
      notes: 'On leave from 2026-11-01. Expected joining on 01st of December.'
    },
    {
      id: 'emp-004',
      employeeCode: 'EMP-004',
      name: 'Jagjit Singh',
      role: 'supervisor',
      station: 'NAVLAKHI',
      phone: '7999600349',
      email: 'jagjit.s@nautica.marine',
      emergencyContact: 'Navlakhi Port Staff Quarters',
      certifications: ['STCW 95', 'Tug & Towage Controller', 'Marine Radio VHF'],
      status: 'available',
      assignedShift: 'morning',
      joinedDate: '2026-08-13',
      totalTripsLogged: 134,
      notes: 'Shift Supervisor - Navlakhi Jetty Operations.'
    },
    {
      id: 'emp-005',
      employeeCode: 'EMP-005',
      name: 'Arbind Dubey',
      role: 'supervisor',
      station: 'NAVLAKHI',
      phone: '7738272480',
      email: 'arbind.d@nautica.marine',
      emergencyContact: 'Navlakhi Port Operations Desk',
      certifications: ['STCW 95', 'Jetty Mooring & Safety Supervisor', 'First Aid at Sea'],
      status: 'on_duty',
      assignedShift: 'morning',
      currentBoatId: 'boat-03',
      joinedDate: '2026-10-14',
      totalTripsLogged: 82,
      notes: 'Jetty & Mooring Supervisor.'
    },
    {
      id: 'emp-006',
      employeeCode: 'EMP-006',
      name: 'Saurabh Dobhal',
      role: 'supervisor',
      station: 'NAVLAKHI',
      phone: '7017410445',
      email: 'saurabh.d@nautica.marine',
      emergencyContact: 'Navlakhi Dispatch Desk',
      certifications: ['STCW 95', 'Coastal Fleet Logistics', 'EPIRB Compliance'],
      status: 'available',
      assignedShift: 'evening',
      joinedDate: '2026-09-01',
      totalTripsLogged: 74,
      notes: 'Marine Operations Supervisor.'
    },
    {
      id: 'emp-007',
      employeeCode: 'EMP-007',
      name: 'LN Arya',
      role: 'supervisor',
      station: 'NAVLAKHI',
      phone: '7999600349',
      email: 'ln.arya@nautica.marine',
      emergencyContact: 'Navlakhi Staff Quarter Deck',
      certifications: ['STCW 95', 'Harbor Vessel Coordinator', 'Maritime Security Level 2'],
      status: 'available',
      assignedShift: 'morning',
      joinedDate: '2026-08-13',
      totalTripsLogged: 95,
      notes: 'Senior Marine Supervisor.'
    },
    {
      id: 'emp-008',
      employeeCode: 'EMP-008',
      name: 'Kalyan Shukla',
      role: 'operator',
      station: 'NAVLAKHI',
      phone: '9408869338',
      email: 'kalyan.s@nautica.marine',
      emergencyContact: 'Navlakhi Staff Colony',
      certifications: ['STCW 95', 'Heavy Marine Winch Operator', 'Deck Safety Trainee'],
      status: 'on_leave',
      assignedShift: 'off',
      joinedDate: '2017-11-01',
      leaveDate: '2026-11-04',
      totalTripsLogged: 340,
      notes: 'On leave from 2026-11-04. Expected joining on 16th November and again going on leave on 26th November (Expected joining on 14th of December).'
    },
    {
      id: 'emp-009',
      employeeCode: 'EMP-009',
      name: 'Nikhil Kumar Yadav',
      role: 'operator',
      station: 'NAVLAKHI',
      phone: '8707505526',
      email: 'nikhil.y@nautica.marine',
      emergencyContact: 'Navlakhi Marine Quarters',
      certifications: ['STCW 95', 'Marine Diesel Engine Operator', 'Towing Gear Handling'],
      status: 'on_leave',
      assignedShift: 'off',
      joinedDate: '2026-05-01',
      leaveDate: '2026-11-01',
      totalTripsLogged: 110,
      notes: 'On leave from 2026-11-01. Expected joining on 11th of November.'
    },
    {
      id: 'emp-010',
      employeeCode: 'EMP-010',
      name: 'Mohamed Irfan',
      role: 'operator',
      station: 'NAVLAKHI',
      phone: '9004383229',
      email: 'mohamed.irfan@nautica.marine',
      emergencyContact: 'Navlakhi Jetty Gate',
      certifications: ['STCW 95', 'Tug Operator', 'Rigging & Mooring Lines'],
      status: 'on_sea',
      assignedShift: 'morning',
      currentBoatId: 'boat-02',
      joinedDate: '2026-06-19',
      totalTripsLogged: 125,
      notes: 'Navlakhi Tug & Mooring Launch Operator.'
    },
    {
      id: 'emp-011',
      employeeCode: 'EMP-011',
      name: 'Antony I Nishanth',
      role: 'operator',
      station: 'NAVLAKHI',
      phone: '8754664298',
      email: 'antony.n@nautica.marine',
      emergencyContact: 'Navlakhi Port Quarters',
      certifications: ['STCW 95', 'Lighterage Barge Operator', 'Firefighting & Sea Survival'],
      status: 'available',
      assignedShift: 'morning',
      joinedDate: '2026-08-25',
      leaveDate: '2026-12-18',
      travellingDate: '2026-12-18',
      totalTripsLogged: 88,
      notes: 'Transfer to Gandhinagar for 1 month / Leave 2026-12-18 to 2027-01-18 (Expected joining on 18th of January).'
    },
    {
      id: 'emp-012',
      employeeCode: 'EMP-012',
      name: 'Vaishak Ramesh',
      role: 'operator',
      station: 'NAVLAKHI',
      phone: '8138067085',
      email: 'vaishak.r@nautica.marine',
      emergencyContact: 'Navlakhi Duty Office',
      certifications: ['STCW 95', 'Mooring & Pilot Boat Operator'],
      status: 'available',
      assignedShift: 'morning',
      joinedDate: '2026-06-01',
      leaveDate: '2026-11-01',
      travellingDate: '2026-11-01',
      totalTripsLogged: 92,
      notes: 'Leave taken until 2026-11-01. Expected joining on 01st of November (Resumed duty).'
    },
    {
      id: 'emp-013',
      employeeCode: 'EMP-013',
      name: 'Kapil Rana',
      role: 'operator',
      station: 'NAVLAKHI',
      phone: '9459505434',
      email: 'kapil.r@nautica.marine',
      emergencyContact: 'Navlakhi Port Operations Desk',
      certifications: ['STCW 95', 'Pilot Boarding Launch Operator', 'Marine VHF'],
      status: 'available',
      assignedShift: 'morning',
      joinedDate: '2026-09-05',
      totalTripsLogged: 64,
      notes: 'Launch Operator & Deck Specialist.'
    },
    {
      id: 'emp-014',
      employeeCode: 'EMP-014',
      name: 'Vishnu',
      role: 'operator',
      station: 'NAVLAKHI',
      phone: '8590490174',
      email: 'vishnu@nautica.marine',
      emergencyContact: 'Navlakhi Jetty Control',
      certifications: ['STCW 95', 'Marine Crane & Winch Operator', 'Seamanship Certified'],
      status: 'available',
      assignedShift: 'morning',
      joinedDate: '2026-04-20',
      totalTripsLogged: 148,
      notes: 'Marine Equipment & Crane Operator.'
    }
  ];

  const boats: Boat[] = [
    {
      id: 'boat-01',
      registrationNumber: 'GJ-10-NLK-001',
      name: 'Navlakhi Pilot I',
      vesselType: 'utility_tender',
      lengthFt: 46,
      capacityPax: 8,
      fuelLevelPct: 88,
      engineHours: 890,
      status: 'docked',
      currentMarinaSlip: 'Navlakhi Pilot Pier Berth 1',
      location: {
        lat: 22.9583,
        lng: 70.4430,
        heading: 85,
        speedKnots: 0
      },
      safetyInspectionExpiry: '2027-04-30',
      lastMaintenanceDate: '2026-10-15',
      imageUrl: '/src/assets/images/boat_fishing_catamaran_1793952351565.jpg',
      notes: 'Primary pilot vessel for guiding lighterage bulk cargo and coastal vessels into Navlakhi inner roadstead.'
    },
    {
      id: 'boat-02',
      registrationNumber: 'GJ-10-NLK-002',
      name: 'Kutch Tug Challenger',
      vesselType: 'fishing_trawler',
      lengthFt: 62,
      capacityPax: 10,
      fuelLevelPct: 74,
      engineHours: 1950,
      status: 'at_sea',
      currentMarinaSlip: 'Marine Tug Berth A',
      location: {
        lat: 22.9750,
        lng: 70.4180,
        heading: 295,
        speedKnots: 8.6
      },
      safetyInspectionExpiry: '2027-03-15',
      lastMaintenanceDate: '2026-09-28',
      imageUrl: '/src/assets/images/hero_marina_harbor_1793952351092.jpg',
      notes: 'Harbor tug engaged in barge towing and lighterage escort in Gulf of Kutch fairway.'
    },
    {
      id: 'boat-03',
      registrationNumber: 'GJ-10-NLK-003',
      name: 'Saurashtra Guard',
      vesselType: 'sport_fisherman',
      lengthFt: 38,
      capacityPax: 6,
      fuelLevelPct: 92,
      engineHours: 620,
      status: 'docked',
      currentMarinaSlip: 'Patrol Slipway 2',
      location: {
        lat: 22.9565,
        lng: 70.4445,
        heading: 180,
        speedKnots: 0
      },
      safetyInspectionExpiry: '2027-06-20',
      lastMaintenanceDate: '2026-10-22',
      imageUrl: '/src/assets/images/boat_fishing_catamaran_1793952351565.jpg',
      notes: 'Rapid coastal patrol, navigation buoy check, and safety inspection launch.'
    },
    {
      id: 'boat-04',
      registrationNumber: 'GJ-10-NLK-004',
      name: 'Navlakhi Mooring Launch IV',
      vesselType: 'catamaran',
      lengthFt: 34,
      capacityPax: 6,
      fuelLevelPct: 82,
      engineHours: 710,
      status: 'moored',
      currentMarinaSlip: 'Inner Anchorage Mooring M-3',
      location: {
        lat: 22.9620,
        lng: 70.4350,
        heading: 110,
        speedKnots: 0
      },
      safetyInspectionExpiry: '2027-01-25',
      lastMaintenanceDate: '2026-10-05',
      imageUrl: '/src/assets/images/boat_fishing_catamaran_1793952351565.jpg',
      notes: 'Mooring boat handling heavy towing hawsers and anchor handling at roadstead.'
    }
  ];

  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const attendance: AttendanceRecord[] = [
    {
      id: 'att-001',
      employeeId: 'emp-001',
      employeeName: 'Capt. M. Madhukar Rao',
      employeeCode: 'EMP-001',
      role: 'manager',
      date: todayStr,
      clockIn: '06:00 AM',
      clockOut: undefined,
      status: 'present',
      marinaZone: 'Navlakhi Port Operations Desk',
      hoursWorked: 5.0,
      verifiedBy: 'Capt. M. Madhukar Rao (Station Manager)'
    },
    {
      id: 'att-002',
      employeeId: 'emp-002',
      employeeName: 'Debashish Banerjee',
      employeeCode: 'EMP-002',
      role: 'supervisor',
      date: todayStr,
      clockIn: '06:30 AM',
      clockOut: undefined,
      status: 'present',
      marinaZone: 'Navlakhi Main Tidal Jetty',
      hoursWorked: 4.5,
      verifiedBy: 'Capt. M. Madhukar Rao (Station Manager)'
    },
    {
      id: 'att-003',
      employeeId: 'emp-003',
      employeeName: 'SCK Sharma',
      employeeCode: 'EMP-003',
      role: 'supervisor',
      date: todayStr,
      status: 'leave',
      marinaZone: 'Approved Leave (Expected 01 Dec)',
      hoursWorked: 0
    },
    {
      id: 'att-004',
      employeeId: 'emp-004',
      employeeName: 'Jagjit Singh',
      employeeCode: 'EMP-004',
      role: 'supervisor',
      date: todayStr,
      clockIn: '07:00 AM',
      clockOut: undefined,
      status: 'present',
      marinaZone: 'Port Dispatch & Signal Tower',
      hoursWorked: 4.0,
      verifiedBy: 'Debashish Banerjee (Supervisor)'
    },
    {
      id: 'att-005',
      employeeId: 'emp-005',
      employeeName: 'Arbind Dubey',
      employeeCode: 'EMP-005',
      role: 'supervisor',
      date: todayStr,
      clockIn: '06:45 AM',
      clockOut: undefined,
      status: 'present',
      marinaZone: 'Lighterage Wharf Berth 1',
      hoursWorked: 4.25,
      verifiedBy: 'Debashish Banerjee (Supervisor)'
    },
    {
      id: 'att-006',
      employeeId: 'emp-006',
      employeeName: 'Saurabh Dobhal',
      employeeCode: 'EMP-006',
      role: 'supervisor',
      date: todayStr,
      clockIn: '07:00 AM',
      clockOut: undefined,
      status: 'present',
      marinaZone: 'Navlakhi Pilot Station',
      hoursWorked: 4.0,
      verifiedBy: 'Debashish Banerjee (Supervisor)'
    },
    {
      id: 'att-007',
      employeeId: 'emp-007',
      employeeName: 'LN Arya',
      employeeCode: 'EMP-007',
      role: 'supervisor',
      date: todayStr,
      clockIn: '06:15 AM',
      clockOut: undefined,
      status: 'present',
      marinaZone: 'Marine Tug Berth A',
      hoursWorked: 4.75,
      verifiedBy: 'Debashish Banerjee (Supervisor)'
    },
    {
      id: 'att-008',
      employeeId: 'emp-008',
      employeeName: 'Kalyan Shukla',
      employeeCode: 'EMP-008',
      role: 'operator',
      date: todayStr,
      status: 'leave',
      marinaZone: 'Approved Leave (Expected 16 Nov)',
      hoursWorked: 0
    },
    {
      id: 'att-009',
      employeeId: 'emp-009',
      employeeName: 'Nikhil Kumar Yadav',
      employeeCode: 'EMP-009',
      role: 'operator',
      date: todayStr,
      status: 'leave',
      marinaZone: 'Approved Leave (Expected 11 Nov)',
      hoursWorked: 0
    },
    {
      id: 'att-010',
      employeeId: 'emp-010',
      employeeName: 'Mohamed Irfan',
      employeeCode: 'EMP-010',
      role: 'operator',
      date: todayStr,
      clockIn: '05:45 AM',
      clockOut: undefined,
      status: 'on_sea',
      marinaZone: 'Navlakhi Anchorage Zone (Kutch Tug)',
      hoursWorked: 5.25,
      verifiedBy: 'Debashish Banerjee (Supervisor)'
    },
    {
      id: 'att-011',
      employeeId: 'emp-011',
      employeeName: 'Antony I Nishanth',
      employeeCode: 'EMP-011',
      role: 'operator',
      date: todayStr,
      clockIn: '06:30 AM',
      clockOut: undefined,
      status: 'present',
      marinaZone: 'Lighterage Wharf Berth 2',
      hoursWorked: 4.5,
      verifiedBy: 'Debashish Banerjee (Supervisor)'
    },
    {
      id: 'att-012',
      employeeId: 'emp-012',
      employeeName: 'Vaishak Ramesh',
      employeeCode: 'EMP-012',
      role: 'operator',
      date: todayStr,
      clockIn: '06:45 AM',
      clockOut: undefined,
      status: 'present',
      marinaZone: 'Navlakhi Main Tidal Jetty',
      hoursWorked: 4.25,
      verifiedBy: 'Debashish Banerjee (Supervisor)'
    },
    {
      id: 'att-013',
      employeeId: 'emp-013',
      employeeName: 'Kapil Rana',
      employeeCode: 'EMP-013',
      role: 'operator',
      date: todayStr,
      clockIn: '07:15 AM',
      clockOut: undefined,
      status: 'present',
      marinaZone: 'Navlakhi Pilot Station',
      hoursWorked: 3.75,
      verifiedBy: 'Debashish Banerjee (Supervisor)'
    },
    {
      id: 'att-014',
      employeeId: 'emp-014',
      employeeName: 'Vishnu',
      employeeCode: 'EMP-014',
      role: 'operator',
      date: todayStr,
      clockIn: '06:30 AM',
      clockOut: undefined,
      status: 'present',
      marinaZone: 'Lighterage Wharf Berth 1',
      hoursWorked: 4.5,
      verifiedBy: 'Debashish Banerjee (Supervisor)'
    }
  ];

  // Generate continuous historical daily attendance records for October & November 2026
  for (let day = 1; day <= 31; day++) {
    const dayStr = day < 10 ? `0${day}` : `${day}`;
    const dateStr = `2026-10-${dayStr}`;
    employees.forEach((emp, idx) => {
      if (emp.joinedDate && emp.joinedDate > dateStr) return;
      const isDebashishLeave = emp.id === 'emp-002' && dateStr >= '2026-09-12' && dateStr <= '2026-11-01';
      const isVaishakLeave = emp.id === 'emp-012' && dateStr >= '2026-10-15' && dateStr <= '2026-11-01';
      const isLeave = isDebashishLeave || isVaishakLeave;
      if (dateStr === todayStr) return;

      attendance.push({
        id: `att-hist-10-${dayStr}-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeCode: emp.employeeCode,
        role: emp.role,
        date: dateStr,
        clockIn: isLeave ? undefined : '06:00 AM',
        clockOut: isLeave ? undefined : '04:30 PM',
        status: isLeave ? 'leave' : (idx % 4 === 1 ? 'on_sea' : 'present'),
        marinaZone: isLeave ? 'Approved Rotational Leave' : (idx % 4 === 1 ? 'Gulf of Kutch Fairway' : 'Navlakhi Main Tidal Jetty'),
        hoursWorked: isLeave ? 0 : 8.5,
        verifiedBy: 'Capt. M. Madhukar Rao (Station Manager)'
      });
    });
  }

  for (let day = 1; day <= 5; day++) {
    const dayStr = `0${day}`;
    const dateStr = `2026-11-${dayStr}`;
    employees.forEach((emp, idx) => {
      if (emp.joinedDate && emp.joinedDate > dateStr) return;
      const isSckSharmaLeave = emp.id === 'emp-003' && dateStr >= '2026-11-01';
      const isKalyanLeave = emp.id === 'emp-008' && dateStr >= '2026-11-04';
      const isNikhilLeave = emp.id === 'emp-009' && dateStr >= '2026-11-01';
      const isLeave = isSckSharmaLeave || isKalyanLeave || isNikhilLeave;
      if (dateStr === todayStr) return;

      attendance.push({
        id: `att-hist-11-${dayStr}-${emp.id}`,
        employeeId: emp.id,
        employeeName: emp.name,
        employeeCode: emp.employeeCode,
        role: emp.role,
        date: dateStr,
        clockIn: isLeave ? undefined : '06:15 AM',
        clockOut: isLeave ? undefined : '04:45 PM',
        status: isLeave ? 'leave' : (idx % 3 === 0 ? 'on_sea' : 'present'),
        marinaZone: isLeave ? 'Approved Coastal Leave' : 'Navlakhi Port Operations Desk',
        hoursWorked: isLeave ? 0 : 8.5,
        verifiedBy: 'Debashish Banerjee (Supervisor)'
      });
    });
  }

  const leaves: LeaveRequest[] = [
    {
      id: 'lev-001',
      employeeId: 'emp-002',
      employeeName: 'Debashish Banerjee',
      employeeCode: 'EMP-002',
      leaveType: 'annual',
      startDate: '2026-09-12',
      endDate: '2026-11-01',
      totalDays: 50,
      reason: 'Rotational coastal leave as per Navlakhi Port roster.',
      status: 'approved',
      requestedAt: '2026-09-01T08:00:00Z',
      reviewedBy: 'Capt. M. Madhukar Rao (Station Manager)',
      reviewerComment: 'Approved. Expected joining on 01st of November (Resumed duty on schedule).'
    },
    {
      id: 'lev-002',
      employeeId: 'emp-003',
      employeeName: 'SCK Sharma',
      employeeCode: 'EMP-003',
      leaveType: 'annual',
      startDate: '2026-11-01',
      endDate: '2026-12-01',
      totalDays: 30,
      reason: 'Annual rotation leave. Expected joining on 01st of December.',
      status: 'approved',
      requestedAt: '2026-10-20T08:00:00Z',
      reviewedBy: 'Capt. M. Madhukar Rao (Station Manager)',
      reviewerComment: 'Approved. Expected joining on 01st of December.'
    },
    {
      id: 'lev-003',
      employeeId: 'emp-008',
      employeeName: 'Kalyan Shukla',
      employeeCode: 'EMP-008',
      leaveType: 'annual',
      startDate: '2026-11-04',
      endDate: '2026-11-16',
      totalDays: 12,
      reason: 'First phase leave. Expected joining on 16th November.',
      status: 'approved',
      requestedAt: '2026-10-28T09:00:00Z',
      reviewedBy: 'Capt. M. Madhukar Rao (Station Manager)',
      reviewerComment: 'Approved as per station schedule.'
    },
    {
      id: 'lev-004',
      employeeId: 'emp-008',
      employeeName: 'Kalyan Shukla',
      employeeCode: 'EMP-008',
      leaveType: 'annual',
      startDate: '2026-11-26',
      endDate: '2026-12-14',
      totalDays: 18,
      reason: 'Second phase leave. Going on leave on 26th November, expected joining on 14th of December.',
      status: 'approved',
      requestedAt: '2026-11-02T10:00:00Z',
      reviewedBy: 'Capt. M. Madhukar Rao (Station Manager)',
      reviewerComment: 'Approved.'
    },
    {
      id: 'lev-005',
      employeeId: 'emp-009',
      employeeName: 'Nikhil Kumar Yadav',
      employeeCode: 'EMP-009',
      leaveType: 'annual',
      startDate: '2026-11-01',
      endDate: '2026-11-11',
      totalDays: 10,
      reason: 'Leave period. Expected joining on 11th of November.',
      status: 'approved',
      requestedAt: '2026-10-24T11:00:00Z',
      reviewedBy: 'Capt. M. Madhukar Rao (Station Manager)',
      reviewerComment: 'Approved.'
    },
    {
      id: 'lev-006',
      employeeId: 'emp-011',
      employeeName: 'Antony I Nishanth',
      employeeCode: 'EMP-011',
      leaveType: 'annual',
      startDate: '2026-12-18',
      endDate: '2027-01-18',
      totalDays: 31,
      reason: 'Transfer to Gandhinagar for 1 month / Rotational leave. Expected joining on 18th of January.',
      status: 'approved',
      requestedAt: '2026-11-03T12:00:00Z',
      reviewedBy: 'Capt. M. Madhukar Rao (Station Manager)',
      reviewerComment: 'Approved deputation transfer to Gandhinagar.'
    },
    {
      id: 'lev-007',
      employeeId: 'emp-012',
      employeeName: 'Vaishak Ramesh',
      employeeCode: 'EMP-012',
      leaveType: 'annual',
      startDate: '2026-10-15',
      endDate: '2026-11-01',
      totalDays: 17,
      reason: 'Leave cycle completed. Expected joining on 01st of November (Resumed duty).',
      status: 'approved',
      requestedAt: '2026-10-01T09:00:00Z',
      reviewedBy: 'Capt. M. Madhukar Rao (Station Manager)',
      reviewerComment: 'Rejoined duty on 01st of November.'
    }
  ];

  const trips: TripRecord[] = [
    {
      id: 'trip-001',
      tripNumber: 'TRIP-2026-NLK-101',
      boatId: 'boat-02',
      boatName: 'Kutch Tug Challenger',
      tripType: 'coastal_charter',
      skipperId: 'emp-010',
      skipperName: 'Mohamed Irfan',
      crew: [
        { employeeId: 'emp-013', employeeName: 'Kapil Rana', role: 'operator' },
        { employeeId: 'emp-014', employeeName: 'Vishnu', role: 'operator' }
      ],
      scheduledDeparture: `${todayStr}T06:00:00Z`,
      scheduledReturn: `${todayStr}T18:00:00Z`,
      actualDeparture: `${todayStr}T06:15:00Z`,
      status: 'in_progress',
      passengerCount: 4,
      destination: 'Gulf of Kutch Inner Anchorage Berth 2 (Lighterage Escort)',
      weatherSummary: 'Navlakhi tidal stream 2.8 kt, wind 13 kt NW, sea state slight chop.',
      departureChecklist: {
        safetyGearVerified: true,
        marineRadioTested: true,
        fuelVerified: true,
        weatherClearance: true,
        manifestSigned: true,
        firstAidKitInspected: true,
        bilgePumpTested: true
      },
      routeCoordinates: [
        [22.9583, 70.4430],
        [22.9640, 70.4320],
        [22.9710, 70.4240],
        [22.9750, 70.4180]
      ]
    },
    {
      id: 'trip-002',
      tripNumber: 'TRIP-2026-NLK-102',
      boatId: 'boat-01',
      boatName: 'Navlakhi Pilot I',
      tripType: 'harbor_tour',
      skipperId: 'emp-001',
      skipperName: 'Capt. M. Madhukar Rao',
      crew: [
        { employeeId: 'emp-002', employeeName: 'Debashish Banerjee', role: 'supervisor' }
      ],
      scheduledDeparture: `${todayStr}T14:30:00Z`,
      scheduledReturn: `${todayStr}T17:30:00Z`,
      status: 'scheduled',
      passengerCount: 6,
      destination: 'Navlakhi Fairway Pilot Boarding Station',
      weatherSummary: 'High tide window at 18:20 (+5.8m). Clear visibility.',
      departureChecklist: {
        safetyGearVerified: false,
        marineRadioTested: false,
        fuelVerified: false,
        weatherClearance: true,
        manifestSigned: false,
        firstAidKitInspected: false,
        bilgePumpTested: false
      }
    },
    {
      id: 'trip-003',
      tripNumber: 'TRIP-2026-NLK-100',
      boatId: 'boat-03',
      boatName: 'Saurashtra Guard',
      tripType: 'sea_trial',
      skipperId: 'emp-005',
      skipperName: 'Arbind Dubey',
      crew: [
        { employeeId: 'emp-011', employeeName: 'Antony I Nishanth', role: 'operator' }
      ],
      scheduledDeparture: `${yesterday}T09:00:00Z`,
      scheduledReturn: `${yesterday}T15:00:00Z`,
      actualDeparture: `${yesterday}T09:10:00Z`,
      actualReturn: `${yesterday}T15:05:00Z`,
      status: 'completed',
      passengerCount: 5,
      destination: 'Navlakhi Approach Channel & Outer Buoy Inspection',
      weatherSummary: 'Calm conditions, NW breeze 9 kt, excellent visibility.',
      departureChecklist: {
        safetyGearVerified: true,
        marineRadioTested: true,
        fuelVerified: true,
        weatherClearance: true,
        manifestSigned: true,
        firstAidKitInspected: true,
        bilgePumpTested: true
      },
      arrivalLog: {
        actualReturnTime: `${yesterday}T15:05:00Z`,
        nauticalMiles: 26.4,
        fuelConsumedLiters: 95,
        catchWeightKg: 0,
        seaConditionsRating: 5,
        logNotes: 'Channel buoys C-1 to C-6 inspected. Flashing lights operational. Moorings secure.'
      }
    }
  ];

  return {
    users,
    employees,
    boats,
    attendance,
    leaves,
    trips
  };
}


// In-Memory Database Manager
class MarineDatabase {
  private data: DataStore;
  private isMongoConnected: boolean = false;
  private activeMongoUri: string = '';

  constructor() {
    this.data = this.loadFromFile() || getInitialSeedData();
    this.saveToFile();
    // Attempt auto-connect if MONGODB_URI is provided in environment
    if (process.env.MONGODB_URI) {
      this.connectMongo(process.env.MONGODB_URI).catch((err) => {
        console.warn('Initial MongoDB connection attempt deferred:', err.message);
      });
    }
  }

  private loadFromFile(): DataStore | null {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (err) {
      console.error('Error reading marine_db.json:', err);
    }
    return null;
  }

  private saveToFile(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving marine_db.json:', err);
    }
  }

  public async connectMongo(uri: string): Promise<{ success: boolean; message: string }> {
    try {
      if (mongoose.connection.readyState === 1) {
        await mongoose.disconnect();
      }
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000
      });
      this.isMongoConnected = true;
      this.activeMongoUri = uri;

      // Seed MongoDB if empty
      const userCount = await MongoUser.countDocuments();
      if (userCount === 0) {
        await this.syncToMongo();
      } else {
        await this.syncFromMongo();
      }

      return { success: true, message: 'Connected to MongoDB Atlas successfully.' };
    } catch (err: any) {
      this.isMongoConnected = false;
      return { success: false, message: err.message || 'Failed to connect to MongoDB URI' };
    }
  }

  private async syncToMongo(): Promise<void> {
    if (!this.isMongoConnected) return;
    try {
      await MongoUser.deleteMany({});
      await MongoEmployee.deleteMany({});
      await MongoBoat.deleteMany({});
      await MongoAttendance.deleteMany({});
      await MongoLeave.deleteMany({});
      await MongoTrip.deleteMany({});

      await MongoUser.insertMany(this.data.users);
      await MongoEmployee.insertMany(this.data.employees);
      await MongoBoat.insertMany(this.data.boats);
      await MongoAttendance.insertMany(this.data.attendance);
      await MongoLeave.insertMany(this.data.leaves);
      await MongoTrip.insertMany(this.data.trips);
    } catch (err) {
      console.error('Error syncing data to Mongo:', err);
    }
  }

  private async syncFromMongo(): Promise<void> {
    if (!this.isMongoConnected) return;
    try {
      const users = await MongoUser.find().lean();
      const employees = await MongoEmployee.find().lean();
      const boats = await MongoBoat.find().lean();
      const attendance = await MongoAttendance.find().lean();
      const leaves = await MongoLeave.find().lean();
      const trips = await MongoTrip.find().lean();

      this.data.users = users as any;
      this.data.employees = employees as any;
      this.data.boats = boats as any;
      this.data.attendance = attendance as any;
      this.data.leaves = leaves as any;
      this.data.trips = trips as any;
      this.saveToFile();
    } catch (err) {
      console.error('Error syncing from Mongo:', err);
    }
  }

  public getStatus(): DatabaseStatus {
    const masked = this.activeMongoUri
      ? this.activeMongoUri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@')
      : undefined;

    return {
      connected: this.isMongoConnected,
      engine: this.isMongoConnected ? 'mongodb' : 'embedded',
      uriConfigured: !!this.activeMongoUri,
      maskedUri: masked,
      stats: {
        employees: this.data.employees.length,
        boats: this.data.boats.length,
        attendanceRecords: this.data.attendance.length,
        leaveRequests: this.data.leaves.length,
        trips: this.data.trips.length
      },
      lastSync: new Date().toISOString()
    };
  }

  public resetToSeed(): void {
    this.data = getInitialSeedData();
    this.saveToFile();
    if (this.isMongoConnected) {
      this.syncToMongo();
    }
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.data.users.map(({ passwordHash, ...u }) => u);
  }

  public findUserByEmail(email: string): (User & { passwordHash: string }) | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public addManager(user: User & { passwordHash: string }): User {
    this.data.users.push(user);
    this.saveToFile();
    if (this.isMongoConnected) {
      MongoUser.create(user).catch(console.error);
    }
    const { passwordHash, ...clean } = user;
    return clean;
  }

  public updateManager(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates };
    this.saveToFile();
    if (this.isMongoConnected) {
      MongoUser.updateOne({ id }, { $set: updates }).catch(console.error);
    }
    const { passwordHash, ...clean } = this.data.users[idx];
    return clean;
  }

  public deleteManager(id: string): boolean {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return false;
    this.data.users.splice(idx, 1);
    this.saveToFile();
    if (this.isMongoConnected) {
      MongoUser.deleteOne({ id }).catch(console.error);
    }
    return true;
  }

  // --- Employees ---
  public getEmployees(): Employee[] {
    return this.data.employees;
  }

  public getEmployeeById(id: string): Employee | undefined {
    return this.data.employees.find(e => e.id === id);
  }

  public addEmployee(emp: Employee): Employee {
    this.data.employees.push(emp);
    this.saveToFile();
    if (this.isMongoConnected) {
      MongoEmployee.create(emp).catch(console.error);
    }
    return emp;
  }

  public updateEmployee(id: string, updates: Partial<Employee>): Employee | null {
    const idx = this.data.employees.findIndex(e => e.id === id);
    if (idx === -1) return null;
    this.data.employees[idx] = { ...this.data.employees[idx], ...updates };
    this.saveToFile();
    if (this.isMongoConnected) {
      MongoEmployee.updateOne({ id }, { $set: updates }).catch(console.error);
    }
    return this.data.employees[idx];
  }

  public deleteEmployee(id: string): boolean {
    const idx = this.data.employees.findIndex(e => e.id === id);
    if (idx === -1) return false;
    this.data.employees.splice(idx, 1);
    this.saveToFile();
    if (this.isMongoConnected) {
      MongoEmployee.deleteOne({ id }).catch(console.error);
    }
    return true;
  }

  // --- Boats ---
  public getBoats(): Boat[] {
    return this.data.boats;
  }

  public getBoatById(id: string): Boat | undefined {
    return this.data.boats.find(b => b.id === id);
  }

  public addBoat(boat: Boat): Boat {
    this.data.boats.push(boat);
    this.saveToFile();
    if (this.isMongoConnected) {
      MongoBoat.create(boat).catch(console.error);
    }
    return boat;
  }

  public updateBoat(id: string, updates: Partial<Boat>): Boat | null {
    const idx = this.data.boats.findIndex(b => b.id === id);
    if (idx === -1) return null;
    this.data.boats[idx] = { ...this.data.boats[idx], ...updates };
    this.saveToFile();
    if (this.isMongoConnected) {
      MongoBoat.updateOne({ id }, { $set: updates }).catch(console.error);
    }
    return this.data.boats[idx];
  }

  public deleteBoat(id: string): boolean {
    const idx = this.data.boats.findIndex(b => b.id === id);
    if (idx === -1) return false;
    this.data.boats.splice(idx, 1);
    this.saveToFile();
    if (this.isMongoConnected) {
      MongoBoat.deleteOne({ id }).catch(console.error);
    }
    return true;
  }

  // --- Attendance ---
  public getAttendance(filter?: { date?: string; employeeId?: string }): AttendanceRecord[] {
    let result = this.data.attendance;
    if (filter?.date) {
      result = result.filter(a => a.date === filter.date);
    }
    if (filter?.employeeId) {
      result = result.filter(a => a.employeeId === filter.employeeId);
    }
    return result;
  }

  public recordClockAction(
    employeeId: string, 
    action: 'clock_in' | 'clock_out', 
    marinaZone?: string,
    verifiedBy?: string
  ): AttendanceRecord {
    const todayStr = new Date().toISOString().split('T')[0];
    const timeNow = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const emp = this.getEmployeeById(employeeId);
    if (!emp) throw new Error('Employee not found');

    let record = this.data.attendance.find(a => a.employeeId === employeeId && a.date === todayStr);

    if (!record) {
      record = {
        id: `att-${Date.now()}`,
        employeeId,
        employeeName: emp.name,
        employeeCode: emp.employeeCode,
        role: emp.role,
        date: todayStr,
        status: action === 'clock_in' ? 'present' : 'absent',
        marinaZone: marinaZone || 'Marina Gate Pier 1',
        verifiedBy: verifiedBy || 'Marina Dispatch'
      };
      this.data.attendance.push(record);
    }

    if (action === 'clock_in') {
      record.clockIn = timeNow;
      record.status = 'present';
      if (marinaZone) record.marinaZone = marinaZone;
      // update employee status
      this.updateEmployee(employeeId, { status: 'on_duty' });
    } else {
      record.clockOut = timeNow;
      record.hoursWorked = 8.5; // calculated or estimated
      this.updateEmployee(employeeId, { status: 'available' });
    }

    this.saveToFile();
    if (this.isMongoConnected) {
      MongoAttendance.updateOne({ id: record.id }, { $set: record }, { upsert: true }).catch(console.error);
    }
    return record;
  }

  public markAttendance(record: {
    employeeId: string;
    date: string;
    status: AttendanceStatus;
    clockIn?: string;
    clockOut?: string;
    marinaZone?: string;
    hoursWorked?: number;
    notes?: string;
    verifiedBy?: string;
  }): AttendanceRecord {
    const emp = this.getEmployeeById(record.employeeId);
    if (!emp) throw new Error('Employee not found');

    let existing = this.data.attendance.find(
      a => a.employeeId === record.employeeId && a.date === record.date
    );

    if (existing) {
      existing.status = record.status;
      if (record.clockIn !== undefined) existing.clockIn = record.clockIn;
      if (record.clockOut !== undefined) existing.clockOut = record.clockOut;
      if (record.marinaZone !== undefined) existing.marinaZone = record.marinaZone;
      if (record.hoursWorked !== undefined) existing.hoursWorked = record.hoursWorked;
      if (record.verifiedBy !== undefined) existing.verifiedBy = record.verifiedBy;
    } else {
      existing = {
        id: `att-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        employeeId: record.employeeId,
        employeeName: emp.name,
        employeeCode: emp.employeeCode,
        role: emp.role,
        date: record.date,
        status: record.status,
        clockIn: record.clockIn,
        clockOut: record.clockOut,
        marinaZone: record.marinaZone || 'Navlakhi Base',
        hoursWorked: record.hoursWorked || (record.status === 'present' || record.status === 'on_sea' ? 8 : 0),
        verifiedBy: record.verifiedBy || 'Navlakhi Dispatch Manager'
      };
      this.data.attendance.push(existing);
    }

    if (record.status === 'leave') {
      this.updateEmployee(record.employeeId, { status: 'on_leave' });
    } else if (record.status === 'on_sea') {
      this.updateEmployee(record.employeeId, { status: 'on_sea' });
    } else if (record.status === 'present') {
      this.updateEmployee(record.employeeId, { status: 'on_duty' });
    }

    this.saveToFile();
    if (this.isMongoConnected) {
      MongoAttendance.updateOne({ id: existing.id }, { $set: existing }, { upsert: true }).catch(console.error);
    }
    return existing;
  }

  public requestAttendanceCorrection(
    attendanceId: string,
    requestedClockIn: string | undefined,
    requestedClockOut: string | undefined,
    reason: string,
    managerId: string
  ): AttendanceRecord | null {
    const record = this.data.attendance.find(a => a.id === attendanceId);
    if (!record) return null;

    record.correctionRequest = {
      requestedClockIn,
      requestedClockOut,
      reason,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      submittedByManagerId: managerId
    };

    this.saveToFile();
    if (this.isMongoConnected) {
      MongoAttendance.updateOne({ id: record.id }, { $set: { correctionRequest: record.correctionRequest } }).catch(console.error);
    }
    return record;
  }

  public reviewAttendanceCorrection(
    attendanceId: string,
    decision: 'approved' | 'rejected',
    adminId: string,
    note?: string
  ): AttendanceRecord | null {
    const record = this.data.attendance.find(a => a.id === attendanceId);
    if (!record || !record.correctionRequest) return null;

    record.correctionRequest.status = decision;
    record.correctionRequest.reviewedByAdminId = adminId;
    record.correctionRequest.reviewNote = note || '';

    if (decision === 'approved') {
      if (record.correctionRequest.requestedClockIn) {
        record.clockIn = record.correctionRequest.requestedClockIn;
      }
      if (record.correctionRequest.requestedClockOut) {
        record.clockOut = record.correctionRequest.requestedClockOut;
      }
      record.status = 'present';
    }

    this.saveToFile();
    if (this.isMongoConnected) {
      MongoAttendance.updateOne({ id: record.id }, { $set: record }).catch(console.error);
    }
    return record;
  }

  // --- Leaves ---
  public getLeaves(): LeaveRequest[] {
    return this.data.leaves;
  }

  public createLeave(leave: Omit<LeaveRequest, 'id' | 'status' | 'requestedAt'>): LeaveRequest {
    const newLeave: LeaveRequest = {
      ...leave,
      id: `lev-${Date.now()}`,
      status: 'pending',
      requestedAt: new Date().toISOString()
    };
    this.data.leaves.push(newLeave);
    this.saveToFile();
    if (this.isMongoConnected) {
      MongoLeave.create(newLeave).catch(console.error);
    }
    return newLeave;
  }

  public reviewLeave(id: string, decision: 'approved' | 'rejected', adminName: string, comment?: string): LeaveRequest | null {
    const record = this.data.leaves.find(l => l.id === id);
    if (!record) return null;
    record.status = decision;
    record.reviewedBy = adminName;
    record.reviewerComment = comment;

    if (decision === 'approved') {
      // update employee status
      this.updateEmployee(record.employeeId, { status: 'on_leave' });
    }

    this.saveToFile();
    if (this.isMongoConnected) {
      MongoLeave.updateOne({ id }, { $set: record }).catch(console.error);
    }
    return record;
  }

  // --- Trips / Voyages ---
  public getTrips(): TripRecord[] {
    return this.data.trips;
  }

  public createTrip(trip: Omit<TripRecord, 'id' | 'tripNumber'>): TripRecord {
    const count = this.data.trips.length + 1;
    const newTrip: TripRecord = {
      ...trip,
      id: `trip-${Date.now()}`,
      tripNumber: `TRIP-2026-${100 + count}`
    };
    this.data.trips.unshift(newTrip);

    // If in_progress immediately, update boat and crew status
    if (newTrip.status === 'in_progress') {
      this.updateBoat(newTrip.boatId, { status: 'at_sea' });
      this.updateEmployee(newTrip.skipperId, { status: 'on_sea', currentBoatId: newTrip.boatId });
      newTrip.crew.forEach(c => {
        this.updateEmployee(c.employeeId, { status: 'on_sea', currentBoatId: newTrip.boatId });
      });
    }

    this.saveToFile();
    if (this.isMongoConnected) {
      MongoTrip.create(newTrip).catch(console.error);
    }
    return newTrip;
  }

  public updateTrip(id: string, updates: Partial<TripRecord>): TripRecord | null {
    const idx = this.data.trips.findIndex(t => t.id === id);
    if (idx === -1) return null;
    this.data.trips[idx] = { ...this.data.trips[idx], ...updates };
    this.saveToFile();
    if (this.isMongoConnected) {
      MongoTrip.updateOne({ id }, { $set: updates }).catch(console.error);
    }
    return this.data.trips[idx];
  }

  public logTripDeparture(id: string, checklist: TripRecord['departureChecklist']): TripRecord | null {
    const trip = this.data.trips.find(t => t.id === id);
    if (!trip) return null;

    trip.departureChecklist = checklist;
    trip.actualDeparture = new Date().toISOString();
    trip.status = 'in_progress';

    // Update boat
    this.updateBoat(trip.boatId, { status: 'at_sea' });
    // Update crew status to on_sea
    this.updateEmployee(trip.skipperId, { status: 'on_sea', currentBoatId: trip.boatId });
    trip.crew.forEach(c => {
      this.updateEmployee(c.employeeId, { status: 'on_sea', currentBoatId: trip.boatId });
    });

    this.saveToFile();
    if (this.isMongoConnected) {
      MongoTrip.updateOne({ id }, { $set: trip }).catch(console.error);
    }
    return trip;
  }

  public logTripArrival(id: string, arrivalLog: NonNullable<TripRecord['arrivalLog']>): TripRecord | null {
    const trip = this.data.trips.find(t => t.id === id);
    if (!trip) return null;

    trip.arrivalLog = arrivalLog;
    trip.actualReturn = arrivalLog.actualReturnTime || new Date().toISOString();
    trip.status = 'completed';

    // Update boat: docked, reduce fuel, add engine hours
    const boat = this.getBoatById(trip.boatId);
    if (boat) {
      const fuelDrop = Math.min(boat.fuelLevelPct, Math.round(arrivalLog.fuelConsumedLiters / 8));
      this.updateBoat(trip.boatId, {
        status: 'docked',
        fuelLevelPct: Math.max(15, boat.fuelLevelPct - fuelDrop),
        engineHours: boat.engineHours + Math.round(arrivalLog.nauticalMiles / 12)
      });
    }

    // Free crew
    this.updateEmployee(trip.skipperId, { status: 'available', totalTripsLogged: (this.getEmployeeById(trip.skipperId)?.totalTripsLogged || 0) + 1 });
    trip.crew.forEach(c => {
      const emp = this.getEmployeeById(c.employeeId);
      this.updateEmployee(c.employeeId, { status: 'available', totalTripsLogged: (emp?.totalTripsLogged || 0) + 1 });
    });

    this.saveToFile();
    if (this.isMongoConnected) {
      MongoTrip.updateOne({ id }, { $set: trip }).catch(console.error);
    }
    return trip;
  }
}

export const marineDb = new MarineDatabase();
