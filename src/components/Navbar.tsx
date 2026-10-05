import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { SupabaseBadge } from './SupabaseBadge';
import { PWAInstallButton } from './PWAInstallButton';
import unithaiLogo from '../assets/images/unithai_official_original_logo.jpg';
import { UNITHAI_DEPARTMENTS, findMatchingDepartment } from '../lib/departments';
import {
  Users,
  Briefcase,
  Ship,
  Package,
  LogOut,
  Shield,
  ShieldAlert,
  LayoutDashboard,
  Building2,
  X,
  Edit3,
  Check,
  User,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'parts' | 'users' | 'jobs' | 'shipments';

interface NavbarProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { isDark } = useTheme();
  const { t, language } = useLanguage();
  const { currentUser, isAdmin, logout, updateProfile } = useAuth();

  // Quick Profile & Department Edit Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmployeeId, setEditEmployeeId] = useState('');
  const [editDept, setEditDept] = useState('');
  const [editCustomDept, setEditCustomDept] = useState('');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleOpenEdit = () => {
    if (!currentUser) return;
    setEditFullName(currentUser.full_name || currentUser.name || '');
    setEditEmployeeId(currentUser.employee_id || '');
    const currentDept = currentUser.department || '';
    const match = findMatchingDepartment(currentDept);
    if (match && match.id !== '__OTHER__') {
      setEditDept(match.id);
      setIsCustomDept(false);
      setEditCustomDept('');
    } else {
      setEditDept('__OTHER__');
      setIsCustomDept(true);
      setEditCustomDept(currentDept);
    }
    setIsEditProfileOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    const resolvedDept = isCustomDept
      ? (editCustomDept.trim() || 'Ship Repair Management (SRM)')
      : editDept;

    await updateProfile({
      full_name: editFullName.trim(),
      name: editFullName.trim(),
      employee_id: editEmployeeId.trim(),
      department: resolvedDept,
    });
    setIsSaving(false);
    setIsEditProfileOpen(false);
  };

  return (
    <>
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
                <span className="text-sm sm:text-base font-extrabold tracking-tight font-sans">
                  {t.appTitle}
                </span>
                <span className="text-[10px] text-slate-500 font-mono hidden sm:inline leading-none">
                  {t.appSubtitle}
                </span>
              </div>
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold">
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
                <span>{isAdmin ? t.navAdminDashboard : t.navDashboard}</span>
              </button>

              <button
                onClick={() => onSelectTab('parts')}
                className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                  currentTab === 'parts'
                    ? 'bg-cyan-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>{language === 'th' ? 'คลังชิปเม้น' : 'Shipments'}</span>
              </button>

              {isAdmin && (
                <>
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
                    <Ship className="w-4 h-4" />
                    <span>{t.navJobAssignments}</span>
                  </button>
                </>
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

            {/* Right Controls: Language Toggle, PWA, Theme Toggle, User Profile & Logout */}
            <div className="flex items-center gap-2">
              <PWAInstallButton />
              <LanguageToggle />
              <SupabaseBadge />
              <ThemeToggle showLabel={false} />

              {/* User Profile Badge (Clickable to Edit Department/Profile) */}
              {currentUser && (
                <div
                  className={`flex items-center gap-2 pl-2 sm:pl-3 border-l ${
                    isDark ? 'border-slate-800' : 'border-slate-200'
                  }`}
                >
                  <button
                    type="button"
                    onClick={handleOpenEdit}
                    className="flex flex-col text-right cursor-pointer group text-left sm:text-right"
                    title={language === 'th' ? 'คลิกเพื่อแก้ไขแผนกและข้อมูลโปรไฟล์' : 'Click to edit department & profile'}
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span
                        className={`text-xs font-bold leading-none truncate max-w-[110px] sm:max-w-[150px] group-hover:text-cyan-500 transition-colors ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
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

                    {/* Department line under the user's name */}
                    <span
                      className={`text-[10px] font-mono leading-tight truncate max-w-[150px] sm:max-w-[220px] mt-0.5 group-hover:underline ${
                        isDark ? 'text-cyan-400/90' : 'text-cyan-700'
                      }`}
                      title={`${currentUser.employee_id || ''} • ${currentUser.department || ''}`}
                    >
                      {currentUser.department || currentUser.employee_id || (language === 'th' ? 'ระบุแผนก...' : 'Set Department...')}
                    </span>
                  </button>

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
        </div>

        {/* Mobile Navigation bar */}
        <div
          className={`flex md:hidden items-center justify-around py-2 border-t text-xs font-semibold ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}
        >
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
            {language === 'th' ? 'คลังชิปเม้น' : 'Shipments'}
          </button>
          {isAdmin && (
            <>
              <button
                onClick={() => onSelectTab('users')}
                className={`px-2 py-1 rounded-lg ${
                  currentTab === 'users'
                    ? 'bg-cyan-600 text-white font-bold'
                    : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.navUserManagement}
              </button>
              <button
                onClick={() => onSelectTab('jobs')}
                className={`px-2 py-1 rounded-lg ${
                  currentTab === 'jobs'
                    ? 'bg-cyan-600 text-white font-bold'
                    : isDark ? 'text-slate-300 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.navJobAssignments}
              </button>
            </>
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
      </header>

      {/* Edit Profile & Department Modal */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl border p-6 shadow-2xl transition-all ${
              isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-extrabold text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>{language === 'th' ? 'แก้ไขแผนกและข้อมูลโปรไฟล์' : 'Edit Department & Profile'}</span>
              </h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="mt-4 space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {language === 'th' ? 'ชื่อ - นามสกุล' : 'Full Name'} *
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  {language === 'th' ? 'รหัสพนักงาน' : 'Employee ID'} *
                </label>
                <input
                  type="text"
                  required
                  value={editEmployeeId}
                  onChange={(e) => setEditEmployeeId(e.target.value)}
                  className={`w-full p-2.5 text-xs font-mono rounded-xl border focus:outline-hidden ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
              </div>

              {/* Department Selector */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span>{language === 'th' ? 'แผนก / ฝ่าย (Department) *' : 'Department *'}</span>
                </label>
                <select
                  value={isCustomDept ? '__OTHER__' : editDept}
                  onChange={(e) => {
                    if (e.target.value === '__OTHER__') {
                      setIsCustomDept(true);
                    } else {
                      setIsCustomDept(false);
                      setEditDept(e.target.value);
                    }
                  }}
                  className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden cursor-pointer ${
                    isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                >
                  {UNITHAI_DEPARTMENTS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {language === 'th' ? d.nameTh : d.nameEn}
                    </option>
                  ))}
                </select>

                {isCustomDept && (
                  <div className="mt-2">
                    <input
                      type="text"
                      required
                      placeholder={language === 'th' ? 'พิมพ์ระบุชื่อแผนกของคุณ...' : 'Specify your department name...'}
                      value={editCustomDept}
                      onChange={(e) => setEditCustomDept(e.target.value)}
                      className={`w-full p-2.5 text-xs rounded-xl border focus:outline-hidden ${
                        isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs cursor-pointer"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <span>{language === 'th' ? 'กำลังบันทึก...' : 'Saving...'}</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{t.save}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
