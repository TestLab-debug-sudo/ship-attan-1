import { 
  Employee, Boat, AttendanceRecord, LeaveRequest, TripRecord, User, DatabaseStatus, MarineWeather 
} from '../types/marine.js';

const STORAGE_KEYS = {
  USERS: 'nautica_mock_users',
  EMPLOYEES: 'nautica_mock_employees',
  BOATS: 'nautica_mock_boats',
  ATTENDANCE: 'nautica_mock_attendance',
  LEAVES: 'nautica_mock_leaves',
  TRIPS: 'nautica_mock_trips'
};

const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin-1',
    name: 'Capt. M. Madhukar Rao',
    email: 'admin@nautica.marine',
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
    role: 'manager',
    title: 'Marine Supervisor - Navlakhi',
    avatarUrl: '',
    lastLogin: new Date().toISOString(),
    permissions: ['daily_dispatch', 'log_attendance', 'request_corrections']
  }
];

const INITIAL_EMPLOYEES: Employee[] = [
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
    notes: 'On leave from 2026-11-04. Expected joining on 16th November and again going on leave on 26th November.'
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
    notes: 'Transfer to Gandhinagar for 1 month / Leave 2026-12-18 to 2027-01-18.'
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

const INITIAL_BOATS: Boat[] = [
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
    location: { lat: 22.9583, lng: 70.4430, heading: 85, speedKnots: 0 },
    safetyInspectionExpiry: '2027-04-30',
    lastMaintenanceDate: '2026-10-15',
    imageUrl: '/src/assets/images/boat_fishing_catamaran_1793952351565.jpg',
    notes: 'Primary pilot vessel for guiding lighterage bulk cargo and coastal vessels.'
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
    location: { lat: 22.9750, lng: 70.4180, heading: 295, speedKnots: 8.6 },
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
    location: { lat: 22.9565, lng: 70.4445, heading: 180, speedKnots: 0 },
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
    location: { lat: 22.9620, lng: 70.4350, heading: 110, speedKnots: 0 },
    safetyInspectionExpiry: '2027-01-25',
    lastMaintenanceDate: '2026-10-05',
    imageUrl: '/src/assets/images/boat_fishing_catamaran_1793952351565.jpg',
    notes: 'Mooring boat handling heavy towing hawsers and anchor handling at roadstead.'
  }
];

function generateSeedAttendance(): AttendanceRecord[] {
  const todayStr = new Date().toISOString().split('T')[0];
  const list: AttendanceRecord[] = [
    {
      id: 'att-001',
      employeeId: 'emp-001',
      employeeName: 'Capt. M. Madhukar Rao',
      employeeCode: 'EMP-001',
      role: 'manager',
      date: todayStr,
      clockIn: '06:00 AM',
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
      status: 'present',
      marinaZone: 'Lighterage Wharf Berth 1',
      hoursWorked: 4.5,
      verifiedBy: 'Debashish Banerjee (Supervisor)'
    }
  ];

  return list;
}

const INITIAL_LEAVES: LeaveRequest[] = [
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

function generateSeedTrips(): TripRecord[] {
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  return [
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
}

class MockStorage {
  private get<T>(key: string, defaultVal: T): T {
    if (typeof window === 'undefined') return defaultVal;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return defaultVal;
      return JSON.parse(raw);
    } catch {
      return defaultVal;
    }
  }

  private set<T>(key: string, val: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('MockStorage persist error:', e);
    }
  }

  // --- Auth & Users ---
  public getUsers(): User[] {
    const users = this.get<User[]>(STORAGE_KEYS.USERS, []);
    if (!users.length) {
      this.set(STORAGE_KEYS.USERS, INITIAL_USERS);
      return INITIAL_USERS;
    }
    return users;
  }

  public authenticate(email: string, pass: string): { token: string; user: User } {
    const cleanEmail = email.toLowerCase().trim();
    const users = this.getUsers();
    let user = users.find(u => u.email.toLowerCase() === cleanEmail);

    // If matching default users or any email match
    if (!user) {
      if (cleanEmail.includes('admin')) {
        user = INITIAL_USERS[0];
      } else if (cleanEmail.includes('manager')) {
        user = INITIAL_USERS[1];
      } else {
        user = INITIAL_USERS[0];
      }
    }

    const token = `mock-token-${user.id}-${Date.now()}`;
    return { token, user };
  }

  public getUserById(id: string): User | null {
    const users = this.getUsers();
    return users.find(u => u.id === id) || INITIAL_USERS[0];
  }

  // --- Employees ---
  public getEmployees(): Employee[] {
    const emps = this.get<Employee[]>(STORAGE_KEYS.EMPLOYEES, []);
    if (!emps.length) {
      this.set(STORAGE_KEYS.EMPLOYEES, INITIAL_EMPLOYEES);
      return INITIAL_EMPLOYEES;
    }
    return emps;
  }

  public saveEmployee(emp: Partial<Employee>): Employee {
    const emps = this.getEmployees();
    const id = emp.id || `emp-${Date.now()}`;
    const newEmp = { ...emp, id } as Employee;
    const idx = emps.findIndex(e => e.id === id);
    if (idx >= 0) {
      emps[idx] = { ...emps[idx], ...newEmp };
    } else {
      emps.push(newEmp);
    }
    this.set(STORAGE_KEYS.EMPLOYEES, emps);
    return newEmp;
  }

  public deleteEmployee(id: string): boolean {
    let emps = this.getEmployees();
    emps = emps.filter(e => e.id !== id);
    this.set(STORAGE_KEYS.EMPLOYEES, emps);
    return true;
  }

  // --- Boats ---
  public getBoats(): Boat[] {
    const boats = this.get<Boat[]>(STORAGE_KEYS.BOATS, []);
    if (!boats.length) {
      this.set(STORAGE_KEYS.BOATS, INITIAL_BOATS);
      return INITIAL_BOATS;
    }
    return boats;
  }

  public saveBoat(boat: Partial<Boat>): Boat {
    const boats = this.getBoats();
    const id = boat.id || `boat-${Date.now()}`;
    const newBoat = { ...boat, id } as Boat;
    const idx = boats.findIndex(b => b.id === id);
    if (idx >= 0) {
      boats[idx] = { ...boats[idx], ...newBoat };
    } else {
      boats.push(newBoat);
    }
    this.set(STORAGE_KEYS.BOATS, boats);
    return newBoat;
  }

  public deleteBoat(id: string): boolean {
    let boats = this.getBoats();
    boats = boats.filter(b => b.id !== id);
    this.set(STORAGE_KEYS.BOATS, boats);
    return true;
  }

  // --- Attendance ---
  public getAttendance(): AttendanceRecord[] {
    const att = this.get<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, []);
    if (!att.length) {
      const seed = generateSeedAttendance();
      this.set(STORAGE_KEYS.ATTENDANCE, seed);
      return seed;
    }
    return att;
  }

  public saveAttendance(record: AttendanceRecord): AttendanceRecord {
    const att = this.getAttendance();
    const idx = att.findIndex(a => a.id === record.id);
    if (idx >= 0) {
      att[idx] = { ...att[idx], ...record };
    } else {
      att.unshift(record);
    }
    this.set(STORAGE_KEYS.ATTENDANCE, att);
    return record;
  }

  // --- Leaves ---
  public getLeaves(): LeaveRequest[] {
    const leaves = this.get<LeaveRequest[]>(STORAGE_KEYS.LEAVES, []);
    if (!leaves.length) {
      this.set(STORAGE_KEYS.LEAVES, INITIAL_LEAVES);
      return INITIAL_LEAVES;
    }
    return leaves;
  }

  public saveLeave(leave: Partial<LeaveRequest>): LeaveRequest {
    const leaves = this.getLeaves();
    const id = leave.id || `lev-${Date.now()}`;
    const newLeave = { ...leave, id } as LeaveRequest;
    const idx = leaves.findIndex(l => l.id === id);
    if (idx >= 0) {
      leaves[idx] = { ...leaves[idx], ...newLeave };
    } else {
      leaves.unshift(newLeave);
    }
    this.set(STORAGE_KEYS.LEAVES, leaves);
    return newLeave;
  }

  // --- Trips ---
  public getTrips(): TripRecord[] {
    const trips = this.get<TripRecord[]>(STORAGE_KEYS.TRIPS, []);
    if (!trips.length) {
      const seed = generateSeedTrips();
      this.set(STORAGE_KEYS.TRIPS, seed);
      return seed;
    }
    return trips;
  }

  public saveTrip(trip: Partial<TripRecord>): TripRecord {
    const trips = this.getTrips();
    const id = trip.id || `trip-${Date.now()}`;
    const newTrip = { ...trip, id } as TripRecord;
    const idx = trips.findIndex(t => t.id === id);
    if (idx >= 0) {
      trips[idx] = { ...trips[idx], ...newTrip };
    } else {
      trips.unshift(newTrip);
    }
    this.set(STORAGE_KEYS.TRIPS, trips);
    return newTrip;
  }

  // --- Status & Weather ---
  public getStatus(): DatabaseStatus {
    return {
      connected: true,
      engine: 'embedded',
      uriConfigured: false,
      stats: {
        employees: this.getEmployees().length,
        boats: this.getBoats().length,
        attendanceRecords: this.getAttendance().length,
        leaveRequests: this.getLeaves().length,
        trips: this.getTrips().length
      },
      lastSync: new Date().toISOString()
    };
  }

  public getWeather(): MarineWeather {
    return {
      temperatureC: 28.5,
      waterTempC: 26.2,
      condition: 'Partly Cloudy',
      windSpeedKnots: 13.5,
      windDirection: 'NW',
      gustsKnots: 18.0,
      waveHeightFt: 2.8,
      wavePeriodSec: 5.2,
      tideStatus: 'Flood Tide (High +5.8m at 18:20)',
      waterCurrentKnots: 2.4,
      waterCurrentDirection: 'NE (Navlakhi Tidal Stream)',
      advisoryFlag: 'green',
      advisoryMessage: 'Navlakhi Fairway & Gulf of Kutch Inner Anchorage: Favorable navigation conditions.',
      barometerHpa: 1013.8,
      visibilityNm: 10.5
    };
  }
}

export const mockStorage = new MockStorage();
