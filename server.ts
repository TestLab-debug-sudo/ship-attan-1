import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { marineDb } from './server/db.js';
import { UserRole } from './src/types/marine.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'nautica_marine_super_secret_jwt_2026';

app.use(express.json());

// --- Authentication Middleware ---
interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

function authenticate(allowedRoles?: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // In dev mode allow header-based or fall back gracefully
      res.status(401).json({ error: 'Missing or invalid authorization token' });
      return;
    }

    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      req.user = decoded;
      if (allowedRoles && !allowedRoles.includes(decoded.role)) {
        res.status(403).json({ error: 'Forbidden: Insufficient privileges for this role' });
        return;
      }
      next();
    } catch (err) {
      res.status(401).json({ error: 'Token expired or invalid' });
      return;
    }
  };
}

// --- Auth Routes ---
app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required' });
    return;
  }

  const user = marineDb.findUserByEmail(email);
  if (!user) {
    res.status(401).json({ error: 'Invalid marine credentials' });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({ error: 'Invalid marine credentials' });
    return;
  }

  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  const { passwordHash, ...safeUser } = user;
  res.json({
    token,
    user: safeUser
  });
});

app.get('/api/auth/me', authenticate(), (req: AuthRequest, res: Response) => {
  if (!req.user) {
    res.status(401).json({ error: 'Not authenticated' });
    return;
  }
  const user = marineDb.findUserByEmail(req.user.email);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  const { passwordHash, ...safeUser } = user;
  res.json({ user: safeUser });
});

// --- Employee Routes ---
app.get('/api/employees', (req: Request, res: Response) => {
  res.json({ employees: marineDb.getEmployees() });
});

app.post('/api/employees', authenticate(['admin']), (req: Request, res: Response) => {
  try {
    const { name, role, phone, email, emergencyContact, certifications, assignedShift, notes } = req.body;
    if (!name || !role || !phone) {
      res.status(400).json({ error: 'Name, role, and phone are mandatory' });
      return;
    }

    const count = marineDb.getEmployees().length + 1;
    const employeeCode = `EMP-${String(count).padStart(3, '0')}`;
    const newEmp = marineDb.addEmployee({
      id: `emp-${Date.now()}`,
      employeeCode,
      name,
      role,
      phone,
      email: email || `${name.toLowerCase().replace(/\s+/g, '.')}@nautica.marine`,
      emergencyContact: emergencyContact || 'Marina Dispatch Desk',
      certifications: certifications || ['STCW 95'],
      status: 'available',
      assignedShift: assignedShift || 'morning',
      joinedDate: new Date().toISOString().split('T')[0],
      totalTripsLogged: 0,
      notes
    });

    res.status(201).json({ employee: newEmp });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/employees/:id', authenticate(['admin', 'manager']), (req: Request, res: Response) => {
  const emp = marineDb.updateEmployee(req.params.id, req.body);
  if (!emp) {
    res.status(404).json({ error: 'Employee not found' });
    return;
  }
  res.json({ employee: emp });
});

app.delete('/api/employees/:id', authenticate(['admin']), (req: Request, res: Response) => {
  const success = marineDb.deleteEmployee(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Employee not found' });
    return;
  }
  res.json({ success: true, message: 'Employee removed from registry' });
});

// --- Boat Routes ---
app.get('/api/boats', (req: Request, res: Response) => {
  res.json({ boats: marineDb.getBoats() });
});

app.post('/api/boats', authenticate(['admin']), (req: Request, res: Response) => {
  try {
    const { registrationNumber, name, vesselType, lengthFt, capacityPax, fuelLevelPct, currentMarinaSlip, notes } = req.body;
    if (!name || !registrationNumber || !vesselType) {
      res.status(400).json({ error: 'Name, registration number, and vessel type are required' });
      return;
    }

    const newBoat = marineDb.addBoat({
      id: `boat-${Date.now()}`,
      registrationNumber,
      name,
      vesselType,
      lengthFt: Number(lengthFt) || 38,
      capacityPax: Number(capacityPax) || 8,
      fuelLevelPct: Number(fuelLevelPct) || 100,
      engineHours: 0,
      status: 'docked',
      currentMarinaSlip: currentMarinaSlip || 'Slip A-05',
      location: {
        lat: 25.7740,
        lng: -80.1310,
        heading: 90,
        speedKnots: 0
      },
      safetyInspectionExpiry: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
      lastMaintenanceDate: new Date().toISOString().split('T')[0],
      notes
    });

    res.status(201).json({ boat: newBoat });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/boats/:id', authenticate(['admin']), (req: Request, res: Response) => {
  const boat = marineDb.updateBoat(req.params.id, req.body);
  if (!boat) {
    res.status(404).json({ error: 'Boat not found' });
    return;
  }
  res.json({ boat });
});

app.put('/api/boats/:id/status', authenticate(['admin', 'manager']), (req: Request, res: Response) => {
  const boat = marineDb.updateBoat(req.params.id, req.body);
  if (!boat) {
    res.status(404).json({ error: 'Boat not found' });
    return;
  }
  res.json({ boat });
});

app.delete('/api/boats/:id', authenticate(['admin']), (req: Request, res: Response) => {
  const success = marineDb.deleteBoat(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Boat not found' });
    return;
  }
  res.json({ success: true, message: 'Vessel decommissioned' });
});

// --- Attendance Routes ---
app.get('/api/attendance', (req: Request, res: Response) => {
  const { date, employeeId } = req.query;
  const records = marineDb.getAttendance({
    date: date as string,
    employeeId: employeeId as string
  });
  res.json({ attendance: records });
});

app.post('/api/attendance/clock', authenticate(['admin', 'manager']), (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, action, marinaZone } = req.body;
    if (!employeeId || !action) {
      res.status(400).json({ error: 'employeeId and action (clock_in/clock_out) required' });
      return;
    }
    const verifier = req.user ? `${req.user.name} (${req.user.role})` : 'Marina Dispatch';
    const record = marineDb.recordClockAction(employeeId, action, marinaZone, verifier);
    res.json({ record });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/attendance/mark', authenticate(['admin', 'manager']), (req: AuthRequest, res: Response) => {
  try {
    const { employeeId, date, status, clockIn, clockOut, marinaZone, hoursWorked, notes } = req.body;
    if (!employeeId || !date || !status) {
      res.status(400).json({ error: 'employeeId, date, and status are required' });
      return;
    }
    const verifier = req.user ? `${req.user.name} (${req.user.title || req.user.role})` : 'Station Manager';
    const record = marineDb.markAttendance({
      employeeId,
      date,
      status,
      clockIn,
      clockOut,
      marinaZone,
      hoursWorked,
      notes,
      verifiedBy: verifier
    });
    res.json({ record, success: true });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/attendance/correct', authenticate(['admin', 'manager']), (req: AuthRequest, res: Response) => {
  try {
    const { attendanceId, requestedClockIn, requestedClockOut, reason } = req.body;
    if (!attendanceId || !reason) {
      res.status(400).json({ error: 'attendanceId and reason are required' });
      return;
    }
    const record = marineDb.requestAttendanceCorrection(
      attendanceId,
      requestedClockIn,
      requestedClockOut,
      reason,
      req.user?.id || 'usr-mgr-1'
    );
    if (!record) {
      res.status(404).json({ error: 'Attendance record not found' });
      return;
    }
    res.json({ record });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/attendance/correct/:id/review', authenticate(['admin']), (req: AuthRequest, res: Response) => {
  const { decision, note } = req.body;
  if (!decision || !['approved', 'rejected'].includes(decision)) {
    res.status(400).json({ error: 'Decision must be approved or rejected' });
    return;
  }
  const record = marineDb.reviewAttendanceCorrection(
    req.params.id,
    decision,
    req.user?.name || 'Administrator',
    note
  );
  if (!record) {
    res.status(404).json({ error: 'Attendance correction record not found' });
    return;
  }
  res.json({ record });
});

// --- Leaves Routes ---
app.get('/api/leaves', (req: Request, res: Response) => {
  res.json({ leaves: marineDb.getLeaves() });
});

app.post('/api/leaves', authenticate(['admin', 'manager']), (req: Request, res: Response) => {
  try {
    const { employeeId, employeeName, employeeCode, leaveType, startDate, endDate, totalDays, reason } = req.body;
    if (!employeeId || !startDate || !endDate || !reason) {
      res.status(400).json({ error: 'employeeId, startDate, endDate, and reason are required' });
      return;
    }
    const emp = marineDb.getEmployeeById(employeeId);
    const leave = marineDb.createLeave({
      employeeId,
      employeeName: employeeName || emp?.name || 'Marine Staff',
      employeeCode: employeeCode || emp?.employeeCode || 'EMP-000',
      leaveType: leaveType || 'annual',
      startDate,
      endDate,
      totalDays: Number(totalDays) || 1,
      reason
    });
    res.status(201).json({ leave });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/leaves/:id/review', authenticate(['admin']), (req: AuthRequest, res: Response) => {
  const { decision, reviewerComment } = req.body;
  if (!decision || !['approved', 'rejected'].includes(decision)) {
    res.status(400).json({ error: 'Decision must be approved or rejected' });
    return;
  }
  const leave = marineDb.reviewLeave(
    req.params.id,
    decision,
    req.user ? `${req.user.name} (Admin)` : 'Admin',
    reviewerComment
  );
  if (!leave) {
    res.status(404).json({ error: 'Leave request not found' });
    return;
  }
  res.json({ leave });
});

// --- Trip Routes ---
app.get('/api/trips', (req: Request, res: Response) => {
  res.json({ trips: marineDb.getTrips() });
});

app.post('/api/trips', authenticate(['admin', 'manager']), (req: Request, res: Response) => {
  try {
    const {
      boatId,
      boatName,
      tripType,
      skipperId,
      skipperName,
      crew,
      scheduledDeparture,
      scheduledReturn,
      passengerCount,
      destination,
      weatherSummary
    } = req.body;

    if (!boatId || !skipperId || !scheduledDeparture || !destination) {
      res.status(400).json({ error: 'Boat, Skipper, Departure Time, and Destination are required' });
      return;
    }

    const trip = marineDb.createTrip({
      boatId,
      boatName: boatName || marineDb.getBoatById(boatId)?.name || 'Vessel',
      tripType: tripType || 'deep_sea_fishing',
      skipperId,
      skipperName: skipperName || marineDb.getEmployeeById(skipperId)?.name || 'Skipper',
      crew: crew || [],
      scheduledDeparture,
      scheduledReturn: scheduledReturn || scheduledDeparture,
      status: 'scheduled',
      passengerCount: Number(passengerCount) || 0,
      destination,
      weatherSummary: weatherSummary || 'Checked clear with marine weather station.',
      departureChecklist: {
        safetyGearVerified: false,
        marineRadioTested: false,
        fuelVerified: false,
        weatherClearance: true,
        manifestSigned: false,
        firstAidKitInspected: false,
        bilgePumpTested: false
      }
    });

    res.status(201).json({ trip });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/trips/:id/departure', authenticate(['admin', 'manager']), (req: Request, res: Response) => {
  const { departureChecklist } = req.body;
  const trip = marineDb.logTripDeparture(req.params.id, departureChecklist);
  if (!trip) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }
  res.json({ trip });
});

app.put('/api/trips/:id/arrival', authenticate(['admin', 'manager']), (req: Request, res: Response) => {
  const { arrivalLog } = req.body;
  if (!arrivalLog) {
    res.status(400).json({ error: 'arrivalLog is required' });
    return;
  }
  const trip = marineDb.logTripArrival(req.params.id, arrivalLog);
  if (!trip) {
    res.status(404).json({ error: 'Trip not found' });
    return;
  }
  res.json({ trip });
});

// --- Managers Management (Admin Only) ---
app.get('/api/managers', authenticate(['admin']), (req: Request, res: Response) => {
  const users = marineDb.getUsers().filter(u => u.role === 'manager');
  res.json({ managers: users });
});

app.post('/api/managers', authenticate(['admin']), (req: Request, res: Response) => {
  try {
    const { name, email, password, title, permissions } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password required' });
      return;
    }
    const hash = bcrypt.hashSync(password, 10);
    const newMgr = marineDb.addManager({
      id: `usr-mgr-${Date.now()}`,
      name,
      email,
      passwordHash: hash,
      role: 'manager',
      title: title || 'Marine Operations Coordinator',
      lastLogin: undefined,
      permissions: permissions || ['daily_dispatch', 'log_attendance', 'request_corrections', 'vessel_checkout', 'arrival_logs']
    });
    res.status(201).json({ manager: newMgr });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/managers/:id', authenticate(['admin']), (req: Request, res: Response) => {
  const updated = marineDb.updateManager(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: 'Manager not found' });
    return;
  }
  res.json({ manager: updated });
});

app.delete('/api/managers/:id', authenticate(['admin']), (req: Request, res: Response) => {
  const success = marineDb.deleteManager(req.params.id);
  if (!success) {
    res.status(404).json({ error: 'Manager not found' });
    return;
  }
  res.json({ success: true, message: 'Manager account removed' });
});

// --- Marine Weather & Tides ---
app.get('/api/marine/weather', (req: Request, res: Response) => {
  res.json({
    weather: {
      windSpeedKnots: 12.8,
      windDirection: 'NW (310°)',
      waveHeightMeters: 1.1,
      waterTempCelsius: 26.5,
      tideState: 'Rising',
      tideNextChangeTime: '18:20 High Tide (+5.8m Navlakhi Datum)',
      advisoryFlag: 'green',
      advisoryMessage: 'Navlakhi Fairway & Gulf of Kutch Inner Anchorage: Favorable navigation conditions. Moderate chop at outer bar.',
      barometerHpa: 1013.8,
      visibilityNm: 10.5
    }
  });
});

// --- Database Status & Atlas Sync ---
app.get('/api/db/status', (req: Request, res: Response) => {
  res.json(marineDb.getStatus());
});

app.post('/api/db/connect', authenticate(['admin']), async (req: Request, res: Response) => {
  const { uri } = req.body;
  if (!uri) {
    res.status(400).json({ error: 'MongoDB connection string (URI) required' });
    return;
  }
  const result = await marineDb.connectMongo(uri);
  res.json({ ...result, status: marineDb.getStatus() });
});

app.post('/api/db/seed', authenticate(['admin']), (req: Request, res: Response) => {
  marineDb.resetToSeed();
  res.json({ success: true, message: 'Database reset to initial maritime operations dataset', status: marineDb.getStatus() });
});

// --- Vite Dev Integration & Production Serving ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`⚓ Nautica Marine Operations Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start marine server:', err);
});
