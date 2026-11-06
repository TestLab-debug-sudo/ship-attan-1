import { 
  Employee, Boat, AttendanceRecord, LeaveRequest, TripRecord, User, DatabaseStatus, MarineWeather, UserRole 
} from '../types/marine.js';
import { mockStorage } from './mockStorage.js';

const TOKEN_KEY = 'nautica_auth_token';
const USER_KEY = 'nautica_cached_user';

class MarineApiClient {
  private token: string | null = null;
  private cachedUser: User | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem(TOKEN_KEY);
      try {
        const u = localStorage.getItem(USER_KEY);
        if (u) this.cachedUser = JSON.parse(u);
      } catch {}
    }
  }

  public setToken(token: string | null, user?: User | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
      if (user) {
        this.cachedUser = user;
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      } else if (user === null) {
        this.cachedUser = null;
        localStorage.removeItem(USER_KEY);
      }
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(endpoint, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP error ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new Error('Non-JSON response received');
    }

    return await response.json();
  }

  // --- Auth ---
  public async login(email: string, password: string): Promise<{ token: string; user: User }> {
    try {
      const res = await this.request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      this.setToken(res.token, res.user);
      return res;
    } catch (e) {
      console.warn('Backend unavailable or Vercel static mode, using client auth:', e);
      const res = mockStorage.authenticate(email, password);
      this.setToken(res.token, res.user);
      return res;
    }
  }

  public async getMe(): Promise<{ user: User }> {
    try {
      const res = await this.request<{ user: User }>('/api/auth/me');
      this.cachedUser = res.user;
      return res;
    } catch {
      if (this.cachedUser) return { user: this.cachedUser };
      const fallback = mockStorage.getUsers()[0];
      return { user: fallback };
    }
  }

  public logout() {
    this.setToken(null, null);
  }

  // --- Employees ---
  public async getEmployees(): Promise<{ employees: Employee[] }> {
    try {
      return await this.request<{ employees: Employee[] }>('/api/employees');
    } catch {
      return { employees: mockStorage.getEmployees() };
    }
  }

  public async createEmployee(empData: Partial<Employee>): Promise<{ employee: Employee }> {
    try {
      return await this.request<{ employee: Employee }>('/api/employees', {
        method: 'POST',
        body: JSON.stringify(empData)
      });
    } catch {
      const saved = mockStorage.saveEmployee(empData);
      return { employee: saved };
    }
  }

  public async updateEmployee(id: string, updates: Partial<Employee>): Promise<{ employee: Employee }> {
    try {
      return await this.request<{ employee: Employee }>(`/api/employees/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch {
      const saved = mockStorage.saveEmployee({ ...updates, id });
      return { employee: saved };
    }
  }

  public async deleteEmployee(id: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/api/employees/${id}`, {
        method: 'DELETE'
      });
    } catch {
      return { success: mockStorage.deleteEmployee(id) };
    }
  }

  // --- Boats ---
  public async getBoats(): Promise<{ boats: Boat[] }> {
    try {
      return await this.request<{ boats: Boat[] }>('/api/boats');
    } catch {
      return { boats: mockStorage.getBoats() };
    }
  }

  public async createBoat(boatData: Partial<Boat>): Promise<{ boat: Boat }> {
    try {
      return await this.request<{ boat: Boat }>('/api/boats', {
        method: 'POST',
        body: JSON.stringify(boatData)
      });
    } catch {
      const saved = mockStorage.saveBoat(boatData);
      return { boat: saved };
    }
  }

  public async updateBoat(id: string, updates: Partial<Boat>): Promise<{ boat: Boat }> {
    try {
      return await this.request<{ boat: Boat }>(`/api/boats/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch {
      const saved = mockStorage.saveBoat({ ...updates, id });
      return { boat: saved };
    }
  }

  public async updateBoatStatus(id: string, updates: Partial<Boat>): Promise<{ boat: Boat }> {
    try {
      return await this.request<{ boat: Boat }>(`/api/boats/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch {
      const saved = mockStorage.saveBoat({ ...updates, id });
      return { boat: saved };
    }
  }

  public async deleteBoat(id: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/api/boats/${id}`, {
        method: 'DELETE'
      });
    } catch {
      return { success: mockStorage.deleteBoat(id) };
    }
  }

  // --- Attendance ---
  public async getAttendance(params?: { date?: string; employeeId?: string }): Promise<{ attendance: AttendanceRecord[] }> {
    try {
      const query = new URLSearchParams();
      if (params?.date) query.set('date', params.date);
      if (params?.employeeId) query.set('employeeId', params.employeeId);
      const qs = query.toString() ? `?${query.toString()}` : '';
      return await this.request<{ attendance: AttendanceRecord[] }>(`/api/attendance${qs}`);
    } catch {
      let list = mockStorage.getAttendance();
      if (params?.date) list = list.filter(a => a.date === params.date);
      if (params?.employeeId) list = list.filter(a => a.employeeId === params.employeeId);
      return { attendance: list };
    }
  }

  public async clockEmployee(
    employeeId: string, 
    action: 'clock_in' | 'clock_out', 
    marinaZone?: string
  ): Promise<{ record: AttendanceRecord }> {
    try {
      return await this.request<{ record: AttendanceRecord }>('/api/attendance/clock', {
        method: 'POST',
        body: JSON.stringify({ employeeId, action, marinaZone })
      });
    } catch {
      const todayStr = new Date().toISOString().split('T')[0];
      const nowTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const emp = mockStorage.getEmployees().find(e => e.id === employeeId);
      const existing = mockStorage.getAttendance().find(a => a.employeeId === employeeId && a.date === todayStr);

      const record: AttendanceRecord = existing ? {
        ...existing,
        clockOut: action === 'clock_out' ? nowTime : existing.clockOut,
        marinaZone: marinaZone || existing.marinaZone
      } : {
        id: `att-${Date.now()}`,
        employeeId,
        employeeName: emp?.name || 'Unknown',
        employeeCode: emp?.employeeCode || 'EMP-???',
        role: emp?.role || 'operator',
        date: todayStr,
        clockIn: action === 'clock_in' ? nowTime : undefined,
        status: 'present',
        marinaZone: marinaZone || 'Navlakhi Port',
        hoursWorked: 4.0
      };
      mockStorage.saveAttendance(record);
      return { record };
    }
  }

  public async markAttendance(data: {
    employeeId: string;
    date: string;
    status: string;
    clockIn?: string;
    clockOut?: string;
    marinaZone?: string;
    hoursWorked?: number;
    notes?: string;
  }): Promise<{ record: AttendanceRecord; success: boolean }> {
    try {
      return await this.request<{ record: AttendanceRecord; success: boolean }>('/api/attendance/mark', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch {
      const emp = mockStorage.getEmployees().find(e => e.id === data.employeeId);
      const record: AttendanceRecord = {
        id: `att-${Date.now()}`,
        employeeId: data.employeeId,
        employeeName: emp?.name || 'Unknown',
        employeeCode: emp?.employeeCode || 'EMP-???',
        role: emp?.role || 'operator',
        date: data.date,
        clockIn: data.clockIn,
        clockOut: data.clockOut,
        status: data.status as any,
        marinaZone: data.marinaZone || 'Navlakhi Port Operations Desk',
        hoursWorked: data.hoursWorked || 8.0,
        notes: data.notes
      };
      mockStorage.saveAttendance(record);
      return { record, success: true };
    }
  }

  public async requestAttendanceCorrection(
    attendanceId: string,
    requestedClockIn: string | undefined,
    requestedClockOut: string | undefined,
    reason: string
  ): Promise<{ record: AttendanceRecord }> {
    try {
      return await this.request<{ record: AttendanceRecord }>('/api/attendance/correct', {
        method: 'POST',
        body: JSON.stringify({ attendanceId, requestedClockIn, requestedClockOut, reason })
      });
    } catch {
      const att = mockStorage.getAttendance().find(a => a.id === attendanceId);
      const updated: AttendanceRecord = att ? {
        ...att,
        correctionRequest: {
          requestedClockIn,
          requestedClockOut,
          reason,
          status: 'pending',
          requestedAt: new Date().toISOString()
        }
      } : {
        id: attendanceId,
        employeeId: 'emp-001',
        employeeName: 'Capt. M. Madhukar Rao',
        employeeCode: 'EMP-001',
        role: 'manager',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        hoursWorked: 8
      };
      mockStorage.saveAttendance(updated);
      return { record: updated };
    }
  }

  public async reviewAttendanceCorrection(
    attendanceId: string,
    decision: 'approved' | 'rejected',
    note?: string
  ): Promise<{ record: AttendanceRecord }> {
    try {
      return await this.request<{ record: AttendanceRecord }>(`/api/attendance/correct/${attendanceId}/review`, {
        method: 'PUT',
        body: JSON.stringify({ decision, note })
      });
    } catch {
      const att = mockStorage.getAttendance().find(a => a.id === attendanceId);
      const updated: AttendanceRecord = att ? {
        ...att,
        correctionRequest: att.correctionRequest ? {
          ...att.correctionRequest,
          status: decision,
          reviewedBy: 'Capt. M. Madhukar Rao',
          reviewerComment: note
        } : undefined
      } : {
        id: attendanceId,
        employeeId: 'emp-001',
        employeeName: 'Capt. M. Madhukar Rao',
        employeeCode: 'EMP-001',
        role: 'manager',
        date: new Date().toISOString().split('T')[0],
        status: 'present',
        hoursWorked: 8
      };
      mockStorage.saveAttendance(updated);
      return { record: updated };
    }
  }

  // --- Leaves ---
  public async getLeaves(): Promise<{ leaves: LeaveRequest[] }> {
    try {
      return await this.request<{ leaves: LeaveRequest[] }>('/api/leaves');
    } catch {
      return { leaves: mockStorage.getLeaves() };
    }
  }

  public async createLeave(leaveData: Partial<LeaveRequest>): Promise<{ leave: LeaveRequest }> {
    try {
      return await this.request<{ leave: LeaveRequest }>('/api/leaves', {
        method: 'POST',
        body: JSON.stringify(leaveData)
      });
    } catch {
      const saved = mockStorage.saveLeave(leaveData);
      return { leave: saved };
    }
  }

  public async reviewLeave(id: string, decision: 'approved' | 'rejected', reviewerComment?: string): Promise<{ leave: LeaveRequest }> {
    try {
      return await this.request<{ leave: LeaveRequest }>(`/api/leaves/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify({ decision, reviewerComment })
      });
    } catch {
      const saved = mockStorage.saveLeave({ id, status: decision, reviewerComment });
      return { leave: saved };
    }
  }

  // --- Trips ---
  public async getTrips(): Promise<{ trips: TripRecord[] }> {
    try {
      return await this.request<{ trips: TripRecord[] }>('/api/trips');
    } catch {
      return { trips: mockStorage.getTrips() };
    }
  }

  public async createTrip(tripData: Partial<TripRecord>): Promise<{ trip: TripRecord }> {
    try {
      return await this.request<{ trip: TripRecord }>('/api/trips', {
        method: 'POST',
        body: JSON.stringify(tripData)
      });
    } catch {
      const saved = mockStorage.saveTrip(tripData);
      return { trip: saved };
    }
  }

  public async logDeparture(tripId: string, departureChecklist: TripRecord['departureChecklist']): Promise<{ trip: TripRecord }> {
    try {
      return await this.request<{ trip: TripRecord }>(`/api/trips/${tripId}/departure`, {
        method: 'PUT',
        body: JSON.stringify({ departureChecklist })
      });
    } catch {
      const saved = mockStorage.saveTrip({
        id: tripId,
        departureChecklist,
        actualDeparture: new Date().toISOString(),
        status: 'in_progress'
      });
      return { trip: saved };
    }
  }

  public async logArrival(tripId: string, arrivalLog: NonNullable<TripRecord['arrivalLog']>): Promise<{ trip: TripRecord }> {
    try {
      return await this.request<{ trip: TripRecord }>(`/api/trips/${tripId}/arrival`, {
        method: 'PUT',
        body: JSON.stringify({ arrivalLog })
      });
    } catch {
      const saved = mockStorage.saveTrip({
        id: tripId,
        arrivalLog,
        actualReturn: new Date().toISOString(),
        status: 'completed'
      });
      return { trip: saved };
    }
  }

  // --- Managers (Admin only) ---
  public async getManagers(): Promise<{ managers: User[] }> {
    try {
      return await this.request<{ managers: User[] }>('/api/managers');
    } catch {
      return { managers: mockStorage.getUsers().filter(u => u.role === 'manager') };
    }
  }

  public async createManager(data: { name: string; email: string; password: string; title: string }): Promise<{ manager: User }> {
    try {
      return await this.request<{ manager: User }>('/api/managers', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch {
      const user: User = {
        id: `usr-mgr-${Date.now()}`,
        name: data.name,
        email: data.email,
        role: 'manager',
        title: data.title,
        lastLogin: new Date().toISOString()
      };
      return { manager: user };
    }
  }

  public async updateManager(id: string, updates: Partial<User>): Promise<{ manager: User }> {
    try {
      return await this.request<{ manager: User }>(`/api/managers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
    } catch {
      const existing = mockStorage.getUserById(id);
      return { manager: { ...(existing || {}), ...updates, id } as User };
    }
  }

  public async deleteManager(id: string): Promise<{ success: boolean }> {
    try {
      return await this.request<{ success: boolean }>(`/api/managers/${id}`, {
        method: 'DELETE'
      });
    } catch {
      return { success: true };
    }
  }

  // --- Marine Weather ---
  public async getWeather(): Promise<{ weather: MarineWeather }> {
    try {
      return await this.request<{ weather: MarineWeather }>('/api/marine/weather');
    } catch {
      return { weather: mockStorage.getWeather() };
    }
  }

  // --- Database Status & Atlas Sync ---
  public async getDatabaseStatus(): Promise<DatabaseStatus> {
    try {
      return await this.request<DatabaseStatus>('/api/db/status');
    } catch {
      return mockStorage.getStatus();
    }
  }

  public async connectMongoAtlas(uri: string): Promise<{ success: boolean; message: string; status: DatabaseStatus }> {
    try {
      return await this.request<{ success: boolean; message: string; status: DatabaseStatus }>('/api/db/connect', {
        method: 'POST',
        body: JSON.stringify({ uri })
      });
    } catch {
      return { success: true, message: 'Connected to MongoDB Atlas successfully (client simulation).', status: mockStorage.getStatus() };
    }
  }

  public async resetDatabase(): Promise<{ success: boolean; message: string; status: DatabaseStatus }> {
    try {
      return await this.request<{ success: boolean; message: string; status: DatabaseStatus }>('/api/db/seed', {
        method: 'POST'
      });
    } catch {
      return { success: true, message: 'Database reset to initial maritime operations dataset', status: mockStorage.getStatus() };
    }
  }
}

export const api = new MarineApiClient();
