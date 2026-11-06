import { Employee, AttendanceRecord, LeaveRequest } from '../types/marine.js';

interface ExportRecordOptions {
  employee: Employee;
  records: AttendanceRecord[];
  daysWorked: number;
  totalLeaveDays: number;
  selectedMonth?: string;
}

export function exportEmployeeAttendanceToCSV({
  employee,
  records,
  daysWorked,
  totalLeaveDays,
  selectedMonth
}: ExportRecordOptions) {
  const title = `NAUTICA MARINE - NAVLAKHI STATION`;
  const subTitle = `CREW ATTENDANCE & LEAVE LEDGER (பணியாளர் வருகை & விடுப்பு அறிக்கை)`;
  
  const headers = [
    'Date (தேதி)',
    'Day (கிழமை)',
    'Status (வருகை நிலை)',
    'Clock In (உள் வருகை)',
    'Clock Out (வெளிச் செல்லல்)',
    'Hours Worked (பணி நேரம்)',
    'Zone / Vessel Berth (பணி இடம் / தளம்)',
    'Supervisor / Verifier (சரிபார்த்தவர்)',
    'Remarks / Operational Notes (குறிப்பு)'
  ];

  const metadataRows = [
    [`Report Title`, `${title} - ${subTitle}`],
    [`Employee Name (பணியாளர் பெயர்)`, `${employee.name}`],
    [`Employee Code (குறியீடு)`, `${employee.employeeCode}`],
    [`Designation (பதவி)`, `${employee.role.toUpperCase()}`],
    [`Station (நிலையம்)`, `${employee.station || 'NAVLAKHI PORT'}`],
    [`Phone Number (தொலைபேசி)`, `${employee.phone}`],
    [`Joined Date (பணியில் சேர்ந்த தேதி)`, `${employee.joinedDate}`],
    [`Filter Period (கால அளவு)`, `${selectedMonth === 'all' || !selectedMonth ? 'All Time (சேர்ந்த நாளில் இருந்து)' : selectedMonth}`],
    [`Total Days Worked (வந்த நாட்கள்)`, `${daysWorked} Days (நாட்கள்)`],
    [`Total Leaves Taken (எடுத்த விடுப்பு)`, `${totalLeaveDays} Days (நாட்கள்)`],
    [`Report Generated At (அறிக்கை தேதி)`, `${new Date().toLocaleString()}`],
    [] // blank line
  ];

  const dataRows = records.map(rec => {
    const d = new Date(rec.date);
    const dayName = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { weekday: 'short' });
    
    let statusText = rec.status;
    if (rec.status === 'present') statusText = 'Present (வந்தார்)';
    else if (rec.status === 'leave') statusText = 'Leave (விடுப்பு)';
    else if (rec.status === 'on_sea') statusText = 'On Sea (கடல் பணி)';
    else if (rec.status === 'late') statusText = 'Late (தாமதம்)';

    return [
      `"${rec.date}"`,
      `"${dayName}"`,
      `"${statusText}"`,
      `"${rec.clockIn || '--'}"`,
      `"${rec.clockOut || '--'}"`,
      `"${rec.hoursWorked || (rec.status === 'present' ? '8.0' : '0')}"`,
      `"${(rec.marinaZone || 'Navlakhi Base').replace(/"/g, '""')}"`,
      `"${(rec.verifiedBy || 'Station Manager').replace(/"/g, '""')}"`,
      `"${(rec.correctionRequest ? `Correction: ${rec.correctionRequest.status}` : '').replace(/"/g, '""')}"`
    ];
  });

  const csvContent = '\uFEFF' + [
    ...metadataRows.map(row => row.map(c => `"${c}"`).join(',')),
    headers.map(h => `"${h}"`).join(','),
    ...dataRows.map(row => row.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = employee.name.replace(/[^a-zA-Z0-9]/g, '_');
  link.setAttribute('href', url);
  link.setAttribute('download', `Navlakhi_${safeName}_Attendance_${selectedMonth || 'Full'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportStationRosterMonthlyToCSV(
  employees: Employee[],
  attendance: AttendanceRecord[],
  leaves: LeaveRequest[],
  selectedMonth: string
) {
  const headers = [
    'Emp Code (குறியீடு)',
    'Employee Name (பணியாளர் பெயர்)',
    'Role (பதவி)',
    'Phone (தொலைபேசி)',
    'Joined Date (சேர்ந்த தேதி)',
    'Month (மாதம்)',
    'Days Worked (வந்த நாட்கள்)',
    'Leaves Taken (எடுத்த விடுப்பு நாட்கள்)',
    'Current Status (தற்போதைய நிலை)',
    'Leave Remarks & Expected Return (திரும்பும் தேதி)'
  ];

  const todayStr = new Date().toISOString().split('T')[0];

  const rows = employees.map(emp => {
    // Filter records for this month if provided
    let empAtt = attendance.filter(a => a.employeeId === emp.id);
    if (selectedMonth && selectedMonth !== 'all') {
      empAtt = empAtt.filter(a => a.date.startsWith(selectedMonth));
    }

    const presentCount = empAtt.filter(a => a.status === 'present' || a.status === 'on_sea').length;
    const leaveCount = empAtt.filter(a => a.status === 'leave').length;

    // Check overall leaves
    const empLeaves = leaves.filter(l => l.employeeId === emp.id && l.status === 'approved');
    const activeLeave = empLeaves.find(l => todayStr >= l.startDate && todayStr <= l.endDate);

    let leaveRemark = 'No Active Leave';
    if (activeLeave) {
      leaveRemark = `On Leave until ${activeLeave.endDate} (Expected Return: ${activeLeave.endDate})`;
    } else if (emp.leaveDate && emp.leaveDate <= todayStr) {
      leaveRemark = `Resumed Duty (Ended ${emp.leaveDate})`;
    }

    return [
      `"${emp.employeeCode}"`,
      `"${emp.name}"`,
      `"${emp.role.toUpperCase()}"`,
      `"${emp.phone}"`,
      `"${emp.joinedDate}"`,
      `"${selectedMonth || 'All'}"`,
      `"${presentCount || (emp.joinedDate ? 'Active' : '0')}"`,
      `"${leaveCount || (activeLeave ? activeLeave.totalDays : '0')}"`,
      `"${activeLeave ? 'On Leave' : emp.status.toUpperCase()}"`,
      `"${leaveRemark.replace(/"/g, '""')}"`
    ];
  });

  const metadata = [
    [`"NAUTICA MARINE - NAVLAKHI HARBOR STATION"`],
    [`"MONTHLY CREW ROSTER & ATTENDANCE SUMMARY (மாதாந்திர பணி & விடுப்பு அறிக்கை)"`],
    [`"Period (காலம்)", "${selectedMonth || 'All Months'}"`],
    [`"Generated (தயாரிக்கப்பட்ட தேதி)", "${new Date().toLocaleString()}"`],
    []
  ];

  const csvContent = '\uFEFF' + [
    ...metadata.map(r => r.join(',')),
    headers.map(h => `"${h}"`).join(','),
    ...rows.map(r => r.join(','))
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Navlakhi_Fleet_Roster_${selectedMonth || 'Master'}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

