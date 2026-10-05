import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { SupabaseBadge } from './SupabaseBadge';
import { PWAInstallButton } from './PWAInstallButton';
import unithaiLogo from '../assets/images/unithai_official_original_logo.jpg';
import {
  Users,
  Briefcase,
  Ship,
  Package,
  LogOut,
  Shield,
  ShieldAlert,
  LayoutDashboard,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'parts' | 'users' | 'jobs' | 'shipments';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { isDark } = useTheme();
  const { t, language } = useLanguage();
  const { currentUser, isAdmin, logout } = useAuth();

  return (
    <header
      className={`sticky top-0 z-30 border-b backdrop-blur-md transition-colors ${
        isDark ? 'bg-slate-950/85 border-slate-800 text-white' : 'bg-white/90 border-slate-200 text-slate-900 shadow-xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-300 shadow-xs shrink-0 flex items-center justify-center overflow-hidden">
              <img src={unithaiLogo} alt="Unithai Official Logo" className="w-full h-full object-contain" />
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm sm:text-base font-extrabold tracking-tight font-sans">
                  {t.appTitle}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-400 font-bold border border-cyan-500/30">
                  {t.srmSystem}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                {t.appSubtitle}
              </span>
            </div>
          </div>

          {/* Navigation Links (Role-aware) */}
          <nav className="hidden md:flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'dashboard'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{isAdmin ? t.navAdminDashboard : t.navMyDashboard}</span>
            </button>

            {/* Marine Spare Parts Tracker Tab */}
            <button
              onClick={() => onSelectTab('parts')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'parts'
                  ? 'bg-cyan-600 text-white shadow-xs font-bold'
                  : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{t.navSparePartsTracker}</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => onSelectTab('users')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'users'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{t.navUserManagement}</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => onSelectTab('jobs')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'jobs'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>{t.navJobAssignments}</span>
              </button>
            )}

            <button
              onClick={() => onSelectTab('shipments')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'shipments'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{isAdmin ? t.navAllShipments : t.navMyShipments}</span>
            </button>
          </nav>

          {/* Right Controls: Language Toggle (TH/EN), PWA Install, Database Badge, Theme Toggle (Dark/Bright), User Badge & Logout */}
          <div className="flex items-center gap-2">
            <PWAInstallButton />
            <LanguageToggle />
            <SupabaseBadge />
            <ThemeToggle showLabel={false} />

            {/* User Profile Badge */}
            {currentUser && (
              <div
                className={`flex items-center gap-2 pl-2 sm:pl-3 border-l ${
                  isDark ? 'border-slate-800' : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col text-right">
                  <div className="flex items-center justify-end gap-1.5">
                    <span className={`text-xs font-bold leading-none truncate max-w-[110px] sm:max-w-[140px] ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}>
                      {currentUser.full_name || currentUser.name}
                    </span>
                    <span
                      className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded uppercase ${
                        currentUser.role === 'ADMIN'
                          ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                          : currentUser.role === 'CO_SRM'
                          ? 'bg-teal-500/15 text-teal-800 dark:text-teal-300 border border-teal-500/30'
                          : currentUser.role === 'IN_CHARGE'
                          ? 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30'
                          : currentUser.role === 'ENGINEER'
                          ? 'bg-purple-500/15 text-purple-800 dark:text-purple-300 border border-purple-500/30'
                          : currentUser.role === 'USER'
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                          : 'bg-cyan-500/15 text-cyan-800 dark:text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      {currentUser.role === 'CO_SRM' ? 'CO SRM' : currentUser.role === 'IN_CHARGE' ? 'IN CHARGE' : currentUser.role}
                    </span>
                  </div>
                  <span className={`text-[10px] font-mono leading-tight truncate max-w-[130px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`} title={`${currentUser.employee_id || ''} • ${currentUser.department || ''}`}>
                    {currentUser.department || currentUser.employee_id}
                  </span>
                </div>

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    isDark
                      ? 'border-slate-700 hover:bg-red-500/10 hover:border-red-500/30 text-slate-400 hover:text-red-400'
                      : 'border-slate-300 hover:bg-red-50 hover:border-red-300 text-slate-500 hover:text-red-600'
                  }`}
                  title={t.navSignOut}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className={`flex md:hidden items-center justify-around py-2 border-t text-xs font-semibold ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`px-2 py-1 rounded-lg ${
              currentTab === 'dashboard'
                ? 'bg-cyan-600 text-white font-bold'
                : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.navDashboard}
          </button>
          <button
            onClick={() => onSelectTab('parts')}
            className={`px-2 py-1 rounded-lg ${
              currentTab === 'parts'
                ? 'bg-cyan-600 text-white font-bold'
                : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {language === 'th' ? 'คลังอะไหล่' : 'Spares'}
          </button>
          {isAdmin && (
            <button
              onClick={() => onSelectTab('users')}
              className={`px-2.5 py-1 rounded-lg ${
                currentTab === 'users'
                  ? 'bg-cyan-600 text-white font-bold'
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.navUserManagement}
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => onSelectTab('jobs')}
              className={`px-2.5 py-1 rounded-lg ${
                currentTab === 'jobs'
                  ? 'bg-cyan-600 text-white font-bold'
                  : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.navJobAssignments}
            </button>
          )}
          <button
            onClick={() => onSelectTab('shipments')}
            className={`px-2.5 py-1 rounded-lg ${
              currentTab === 'shipments'
                ? 'bg-cyan-600 text-white font-bold'
                : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {isAdmin ? t.navAllShipments : t.navMyShipments}
          </button>
        </div>
      </div>
    </header>
  );
};
