import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'ta' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  // Navigation & Branding
  brand_title: { en: 'NAUTICA MARINE', ta: 'நாட்டிகா மரைன்' },
  station_name: { en: 'NAVLAKHI', ta: 'நாவலாகி' },
  tagline_admin: { en: 'Navlakhi Port Administration', ta: 'நாவலாகி துறைமுக நிர்வாகம்' },
  tagline_manager: { en: 'Navlakhi Operations & Dispatch', ta: 'நாவலாகி துறைமுக மேலாண்மை & அட்டனன்ஸ்' },
  
  // Views
  view_dashboard: { en: 'Operations Console', ta: 'செயல்பாட்டு கட்டுப்பாட்டகம்' },
  view_attendance: { en: 'Crew Attendance & Leave Roster', ta: 'பணியாளர் வருகை & விடுப்பு லெட்ஜர்' },
  view_dispatch: { en: 'Voyage Dispatch', ta: 'கப்பல் புறப்பாடு' },
  view_harbor_3d: { en: '3D Harbor Basin', ta: '3D துறைமுக காட்சி' },
  view_radar: { en: 'AIS Fleet Radar', ta: 'AIS ரேடார்' },
  view_employees: { en: 'Crew Personnel', ta: 'பணியாளர்கள் விவரம்' },
  view_boats: { en: 'Fleet Registry', ta: 'கப்பல் பதிவு' },
  view_approvals: { en: 'Attendance Approvals', ta: 'அட்டனன்ஸ் திருத்த ஒப்புதல்கள்' },
  view_leaves: { en: 'Leave Quotas', ta: 'விடுப்பு ஒதுக்கீடுகள்' },
  view_managers: { en: 'Manager Accounts', ta: 'மேலாளர் கணக்குகள்' },
  view_database: { en: 'MongoDB & Cloud', ta: 'டேட்டாபேஸ் & மேகம்' },

  // Attendance Actions
  mark_attendance: { en: 'Mark Attendance', ta: 'அட்டனன்ஸ் போடு' },
  record_daily_attendance: { en: 'Record Daily Crew Attendance', ta: 'தினசரி பணியாளர் வருகை பதிவு' },
  take_attendance: { en: 'Take Attendance', ta: 'வருகை பதிவு செய்க' },
  clock_in: { en: 'Clock In', ta: 'உள் வருகை (In)' },
  clock_out: { en: 'Clock Out', ta: 'வெளிச் செல்லல் (Out)' },
  present: { en: 'Present', ta: 'வந்தார் (Present)' },
  leave: { en: 'Leave', ta: 'விடுப்பு (Leave)' },
  on_sea: { en: 'On Sea Duty', ta: 'கடல் பணி (On Sea)' },
  late: { en: 'Late', ta: 'தாமதம் (Late)' },
  absent: { en: 'Absent', ta: 'வரவில்லை (Absent)' },

  // Metrics
  days_worked: { en: 'Days Worked', ta: 'வந்த நாட்கள்' },
  leaves_taken: { en: 'Leaves Taken', ta: 'எடுத்த லீவ்' },
  joined_date: { en: 'Joined Date', ta: 'பணியில் சேர்ந்த தேதி' },
  reporting_date: { en: 'Expected Return Date', ta: 'பணிக்கு திரும்பும் தேதி' },
  total_crew: { en: 'Total Crew', ta: 'மொத்த பணியாளர்கள்' },
  on_duty_today: { en: 'On Duty Today', ta: 'இன்று பணியில் உள்ளவர்கள்' },
  on_leave_today: { en: 'On Leave Today', ta: 'இன்று விடுப்பில் உள்ளவர்கள்' },
  total_service_days: { en: 'Total Service Days', ta: 'மொத்த பணிக்காலம்' },

  // Filter & Search
  search_placeholder: { en: 'Search by employee name, code, phone...', ta: 'பணியாளர் பெயர், குறியீடு, போன் தேட...' },
  select_person: { en: 'Select Crew Member', ta: 'பணியாளரைத் தேர்ந்தெடுக்கவும்' },
  all_crew: { en: 'All 14 Navlakhi Crew', ta: 'அனைத்து 14 பணியாளர்கள்' },
  filter_by_month: { en: 'Filter by Month', ta: 'மாத வாரியாக பார்' },
  all_months: { en: 'All Months Since Joining', ta: 'சேர்ந்த நாளில் இருந்து அனைத்து மாதங்களும்' },

  // Download & Export
  download_excel: { en: 'Download Excel (.xlsx / .csv)', ta: 'எக்ஸெல் டவுன்லோட் (.xlsx / .csv)' },
  download_monthly_sheet: { en: 'Download Monthly Attendance Sheet', ta: 'மாத அட்டனன்ஸ் அறிக்கை டவுன்லோட்' },

  // Correction & Admin
  request_correction: { en: 'Request Correction', ta: 'திருத்தம் கோரு' },
  pending_admin_approval: { en: 'Pending Admin Approval', ta: 'அட்மின் ஒப்புதலுக்கு காத்திருக்கிறது' },
  approve: { en: 'Approve Correction', ta: 'ஏற்றுக்கொள்' },
  reject: { en: 'Reject', ta: 'நிராகரி' },
  safety_warning: {
    en: 'Vessel allocation & dispatch must not proceed without official Admin attendance verification.',
    ta: 'அட்மின் அனுமதி பெறாமல் கப்பல் பணி ஒதுக்கீடோ திருத்தமோ செய்யக்கூடாது.'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('nautica_lang');
    return saved === 'ta' || saved === 'en' ? saved : 'ta'; // Default to Tamil as requested
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('nautica_lang', lang);
  };

  const toggleLanguage = () => {
    setLanguage(language === 'ta' ? 'en' : 'ta');
  };

  const t = (key: string, fallback?: string): string => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

