import { 
  Employee, Boat, AttendanceRecord, LeaveRequest, TripRecord, User, DatabaseStatus, MarineWeather, UserRole 
} from '../types/marine.js';

const TOKEN_KEY = 'nautica_auth_token';

class MarineApiClient {
  private token: string | null = null;

  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  }

  public setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
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

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `HTTP error ${response.status}`);
    }
    return data;
  }

  // --- Auth ---
  public async login(email: string, password: string): Promise<{ token: string; user: User }> {
    const res = await this.request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(res.token);
    return res;
  }

  public async getMe(): Promise<{ user: User }> {
    return this.request<{ user: User }>('/api/auth/me');
  }

  public logout() {
    this.setToken(null);
  }

  // --- Employees ---
  public async getEmployees(): Promise<{ employees: Employee[] }> {
    return this.request<{ employees: Employee[] }>('/api/employees');
  }

  public async createEmployee(empData: Partial<Employee>): Promise<{ employee: Employee }> {
    return this.request<{ employee: Employee }>('/api/employees', {
      method: 'POST',
      body: JSON.stringify(empData)
    });
  }

  public async updateEmployee(id: string, updates: Partial<Employee>): Promise<{ employee: Employee }> {
    return this.request<{ employee: Employee }>(`/api/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  public async deleteEmployee(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/employees/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Boats ---
  public async getBoats(): Promise<{ boats: Boat[] }> {
    return this.request<{ boats: Boat[] }>('/api/boats');
  }

  public async createBoat(boatData: Partial<Boat>): Promise<{ boat: Boat }> {
    return this.request<{ boat: Boat }>('/api/boats', {
      method: 'POST',
      body: JSON.stringify(boatData)
    });
  }

  public async updateBoat(id: string, updates: Partial<Boat>): Promise<{ boat: Boat }> {
    return this.request<{ boat: Boat }>(`/api/boats/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  public async updateBoatStatus(id: string, updates: Partial<Boat>): Promise<{ boat: Boat }> {
    return this.request<{ boat: Boat }>(`/api/boats/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  public async deleteBoat(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/boats/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Attendance ---
  public async getAttendance(params?: { date?: string; employeeId?: string }): Promise<{ attendance: AttendanceRecord[] }> {
    const query = new URLSearchParams();
    if (params?.date) query.set('date', params.date);
    if (params?.employeeId) query.set('employeeId', params.employeeId);
    const qs = query.toString() ? `?${query.toString()}` : '';
    return this.request<{ attendance: AttendanceRecord[] }>(`/api/attendance${qs}`);
  }

  public async clockEmployee(
    employeeId: string, 
    action: 'clock_in' | 'clock_out', 
    marinaZone?: string
  ): Promise<{ record: AttendanceRecord }> {
    return this.request<{ record: AttendanceRecord }>('/api/attendance/clock', {
      method: 'POST',
      body: JSON.stringify({ employeeId, action, marinaZone })
    });
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
    return this.request<{ record: AttendanceRecord; success: boolean }>('/api/attendance/mark', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async requestAttendanceCorrection(
    attendanceId: string,
    requestedClockIn: string | undefined,
    requestedClockOut: string | undefined,
    reason: string
  ): Promise<{ record: AttendanceRecord }> {
    return this.request<{ record: AttendanceRecord }>('/api/attendance/correct', {
      method: 'POST',
      body: JSON.stringify({ attendanceId, requestedClockIn, requestedClockOut, reason })
    });
  }

  public async reviewAttendanceCorrection(
    attendanceId: string,
    decision: 'approved' | 'rejected',
    note?: string
  ): Promise<{ record: AttendanceRecord }> {
    return this.request<{ record: AttendanceRecord }>(`/api/attendance/correct/${attendanceId}/review`, {
      method: 'PUT',
      body: JSON.stringify({ decision, note })
    });
  }

  // --- Leaves ---
  public async getLeaves(): Promise<{ leaves: LeaveRequest[] }> {
    return this.request<{ leaves: LeaveRequest[] }>('/api/leaves');
  }

  public async createLeave(leaveData: Partial<LeaveRequest>): Promise<{ leave: LeaveRequest }> {
    return this.request<{ leave: LeaveRequest }>('/api/leaves', {
      method: 'POST',
      body: JSON.stringify(leaveData)
    });
  }

  public async reviewLeave(id: string, decision: 'approved' | 'rejected', reviewerComment?: string): Promise<{ leave: LeaveRequest }> {
    return this.request<{ leave: LeaveRequest }>(`/api/leaves/${id}/review`, {
      method: 'PUT',
      body: JSON.stringify({ decision, reviewerComment })
    });
  }

  // --- Trips ---
  public async getTrips(): Promise<{ trips: TripRecord[] }> {
    return this.request<{ trips: TripRecord[] }>('/api/trips');
  }

  public async createTrip(tripData: Partial<TripRecord>): Promise<{ trip: TripRecord }> {
    return this.request<{ trip: TripRecord }>('/api/trips', {
      method: 'POST',
      body: JSON.stringify(tripData)
    });
  }

  public async logDeparture(tripId: string, departureChecklist: TripRecord['departureChecklist']): Promise<{ trip: TripRecord }> {
    return this.request<{ trip: TripRecord }>(`/api/trips/${tripId}/departure`, {
      method: 'PUT',
      body: JSON.stringify({ departureChecklist })
    });
  }

  public async logArrival(tripId: string, arrivalLog: NonNullable<TripRecord['arrivalLog']>): Promise<{ trip: TripRecord }> {
    return this.request<{ trip: TripRecord }>(`/api/trips/${tripId}/arrival`, {
      method: 'PUT',
      body: JSON.stringify({ arrivalLog })
    });
  }

  // --- Managers (Admin only) ---
  public async getManagers(): Promise<{ managers: User[] }> {
    return this.request<{ managers: User[] }>('/api/managers');
  }

  public async createManager(data: { name: string; email: string; password: string; title: string }): Promise<{ manager: User }> {
    return this.request<{ manager: User }>('/api/managers', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateManager(id: string, updates: Partial<User>): Promise<{ manager: User }> {
    return this.request<{ manager: User }>(`/api/managers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  public async deleteManager(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/managers/${id}`, {
      method: 'DELETE'
    });
  }

  // --- Marine Weather ---
  public async getWeather(): Promise<{ weather: MarineWeather }> {
    return this.request<{ weather: MarineWeather }>('/api/marine/weather');
  }

  // --- Database Status & Atlas Sync ---
  public async getDatabaseStatus(): Promise<DatabaseStatus> {
    return this.request<DatabaseStatus>('/api/db/status');
  }

  public async connectMongoAtlas(uri: string): Promise<{ success: boolean; message: string; status: DatabaseStatus }> {
    return this.request<{ success: boolean; message: string; status: DatabaseStatus }>('/api/db/connect', {
      method: 'POST',
      body: JSON.stringify({ uri })
    });
  }

  public async resetDatabase(): Promise<{ success: boolean; message: string; status: DatabaseStatus }> {
    return this.request<{ success: boolean; message: string; status: DatabaseStatus }>('/api/db/seed', {
      method: 'POST'
    });
  }
}

export const api = new MarineApiClient();
