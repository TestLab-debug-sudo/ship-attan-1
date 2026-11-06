import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { useLanguage } from '../../context/LanguageContext.js';
import { 
  Anchor, Shield, UserCheck, Database, LogOut, Ship, Menu, X, 
  LayoutDashboard, Users, Clock, Calendar, Compass, Radio, ChevronRight,
  Languages 
} from 'lucide-react';

interface TopBarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  availableViews: { id: string; label: string }[];
}

export const TopBar: React.FC<TopBarProps> = ({
  currentView,
  onNavigate,
  availableViews
}) => {
  const { user, role, logout, dbStatus } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile drawer on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const getViewIcon = (id: string) => {
    switch (id) {
      case 'dashboard': return <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />;
      case 'employees': return <Users className="w-3.5 h-3.5 shrink-0" />;
      case 'boats': return <Ship className="w-3.5 h-3.5 shrink-0" />;
      case 'attendance': return <Clock className="w-3.5 h-3.5 shrink-0" />;
      case 'leaves': return <Calendar className="w-3.5 h-3.5 shrink-0" />;
      case 'managers': return <Shield className="w-3.5 h-3.5 shrink-0" />;
      case 'database': return <Database className="w-3.5 h-3.5 shrink-0" />;
      case 'dispatch': return <Anchor className="w-3.5 h-3.5 shrink-0" />;
      case 'harbor_3d': return <Compass className="w-3.5 h-3.5 shrink-0" />;
      case 'fleet_radar': return <Radio className="w-3.5 h-3.5 shrink-0" />;
      default: return <Anchor className="w-3.5 h-3.5 shrink-0" />;
    }
  };

  const handleSelectView = (id: string) => {
    onNavigate(id);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#082F49]/95 backdrop-blur-md border-b border-cyan-500/20 transition-all">
        {/* Tier 1: Brand & Profile Bar (Guaranteed Full Width Fit on All Displays) */}
        <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 sm:gap-6">
          {/* Left: Brand Identity */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#27C5C1] to-[#063B5C] flex items-center justify-center text-white shadow-md border border-cyan-300/30 shrink-0">
              <Anchor className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-white font-display whitespace-nowrap leading-none">
                  NAUTICA MARINE
                </span>
                <span className="text-cyan-400 font-light text-xs md:text-sm font-mono border-l border-white/20 pl-1.5">
                  NAVLAKHI
                </span>
              </div>
              <span className="text-[9px] sm:text-[10px] tracking-wider uppercase font-mono text-cyan-300 block mt-0.5 truncate">
                {role === 'admin' ? 'Navlakhi Port Administration' : 'Navlakhi Operations & Dispatch'}
              </span>
            </div>
          </div>

          {/* Right: Operational Status, User Profile & Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Database Engine Indicator */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#063B5C] border border-cyan-500/20 text-xs">
              <Database className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="text-slate-300 font-mono text-[11px]">
                {dbStatus?.engine === 'mongodb' ? 'MongoDB Atlas' : 'Embedded DB'}
              </span>
            </div>

            {/* Role Tag */}
            <div className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-semibold uppercase tracking-wider flex items-center gap-1 sm:gap-1.5 shrink-0 ${
              role === 'admin' 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
            }`}>
              {role === 'admin' ? <Shield className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <UserCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}
              <span>{role}</span>
            </div>

            {/* Bilingual Language Switcher (தமிழ் / English) */}
            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-lg bg-[#063B5C] hover:bg-[#082F49] text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm touch-target-min"
              title={language === 'ta' ? 'Switch to English' : 'தமிழுக்கு மாற்றவும்'}
            >
              <Languages className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span className="font-bold text-[11px] sm:text-xs">
                {language === 'ta' ? 'தமிழ்' : 'English'}
              </span>
            </button>

            {/* Profile Avatar & Info */}
            <div className="flex items-center gap-1.5 sm:gap-2 pl-2 border-l border-white/10 shrink-0">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full object-cover border border-cyan-400/30 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-cyan-600/40 text-cyan-200 font-bold flex items-center justify-center text-xs border border-cyan-400/30 shrink-0">
                  {user?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="hidden md:block text-left text-xs max-w-[130px]">
                <span className="text-white font-medium block truncate">{user?.name}</span>
                <span className="text-[10px] text-slate-400 font-mono block truncate capitalize">{user?.title || role}</span>
              </div>

              {/* Logout Button */}
              <button
                onClick={logout}
                title="Sign Out"
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors ml-1 touch-target-min flex items-center justify-center"
              >
                <LogOut className="w-4 h-4" />
              </button>

              {/* Mobile Drawer Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden p-1.5 text-cyan-300 hover:text-white hover:bg-white/10 rounded-lg border border-cyan-500/30 transition-colors touch-target-min flex items-center justify-center"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Tier 2: Dedicated Navigation Tabs Bar (Scrollable on Tablets, Clean on Laptops & Desktops) */}
        <div className="border-t border-cyan-500/15 bg-[#06334f]/90 px-4 sm:px-6 py-1.5">
          <div className="max-w-7xl 2xl:max-w-[1600px] mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none py-0.5">
            {availableViews.map((item) => {
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all flex items-center gap-1.5 touch-target-min shrink-0 ${
                    isActive
                      ? 'bg-[#27C5C1] text-[#063B5C] font-bold shadow-md shadow-cyan-500/20'
                      : 'text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {getViewIcon(item.id)}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Off-Canvas Mobile Drawer (< 640px) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden flex">
          {/* Backdrop Blur */}
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 bg-[#021320]/80 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative ml-auto w-full max-w-xs bg-[#082F49] border-l border-cyan-500/20 shadow-2xl flex flex-col justify-between p-5 text-white z-10 overflow-y-auto pb-safe">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#27C5C1] flex items-center justify-center text-[#063B5C] font-bold">
                    <Anchor className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">NAUTICA MARINE</h3>
                    <span className="text-[10px] font-mono text-cyan-300">Navlakhi Station</span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg touch-target-min flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Active User Card in Drawer */}
              <div className="my-4 p-3 rounded-xl bg-[#063B5C] border border-cyan-500/20 flex items-center gap-3">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-10 h-10 rounded-full object-cover border border-cyan-400/40 shrink-0"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-cyan-600/40 text-cyan-200 font-bold flex items-center justify-center text-sm border border-cyan-400/40 shrink-0">
                    {user?.name?.charAt(0) || 'U'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <span className="text-xs font-bold text-white block truncate">{user?.name}</span>
                  <span className="text-[10px] text-cyan-300 font-mono capitalize block truncate">
                    {user?.title || role}
                  </span>
                </div>
              </div>

              {/* Navigation Menu List with Big Touch Targets */}
              <div className="space-y-1.5 mt-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block px-2 mb-2">
                  Navigation Modules
                </span>
                {availableViews.map((item) => {
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectView(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all touch-target-min ${
                        isActive
                          ? 'bg-[#27C5C1] text-[#063B5C] shadow-lg font-bold'
                          : 'text-slate-200 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {getViewIcon(item.id)}
                        <span>{item.label}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#063B5C]' : 'text-slate-500'}`} />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Drawer Footer with Database status & Logout */}
            <div className="pt-4 border-t border-white/10 space-y-3 mt-6">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono px-1">
                <span>Database:</span>
                <span className="text-cyan-300">
                  {dbStatus?.engine === 'mongodb' ? 'MongoDB Atlas' : 'Local Embedded'}
                </span>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-xs font-bold transition-colors touch-target-min"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Station</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};