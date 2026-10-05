import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import unithaiLogo from '../assets/images/unithai_official_original_logo.jpg';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';
import { SupabaseBadge } from './SupabaseBadge';
import { PWAInstallButton } from './PWAInstallButton';
import {
  Lock,
  Mail,
  User,
  BadgeAlert,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Anchor,
} from 'lucide-react';
import { RoleType } from '../types/database';
import { UNITHAI_DEPARTMENTS } from '../lib/departments';

export const AuthView: React.FC = () => {
  const { isDark } = useTheme();
  const { t, language } = useLanguage();
  const {
    login,
    register,
    resetPassword,
    loading,
    error: authError,
    authMessage,
    clearAuthMessage,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');

  // Form State
  const [fullName, setFullName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [role, setRole] = useState<RoleType>('SRM');
  const [department, setDepartment] = useState('Ship Repair Management (SRM)');
  const [customDepartment, setCustomDepartment] = useState('');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [confirmationSentEmail, setConfirmationSentEmail] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setResetSuccess(false);
    clearAuthMessage();

    if (mode === 'login') {
      if (!email || !password) {
        setFormError(language === 'th' ? 'กรุณากรอกทั้งอีเมลและรหัสผ่าน' : 'Please enter both email and password.');
        return;
      }
      const res = await login(email, password);
      if (!res.success && res.error) {
        setFormError(res.error);
      }
    } else if (mode === 'register') {
      if (!fullName.trim()) {
        setFormError(language === 'th' ? 'กรุณาระบุชื่อ-นามสกุล' : 'Please enter your full name.');
        return;
      }
      if (!employeeId.trim()) {
        setFormError(language === 'th' ? 'กรุณาระบุรหัสพนักงาน (เช่น UT-02488)' : 'Please enter your Employee ID (e.g. UT-02488).');
        return;
      }
      if (isCustomDept && !customDepartment.trim()) {
        setFormError(language === 'th' ? 'กรุณาระบุชื่อแผนกของคุณ' : 'Please specify your department name.');
        return;
      }
      if (!email.trim()) {
        setFormError(language === 'th' ? 'กรุณาระบุอีเมลองค์กรที่ถูกต้อง' : 'Please enter a valid work email.');
        return;
      }
      if (password.length < 6) {
        setFormError(language === 'th' ? 'รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร' : 'Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setFormError(language === 'th' ? 'รหัสผ่านไม่ตรงกัน' : 'Passwords do not match.');
        return;
      }

      const resolvedDept = isCustomDept
        ? (customDepartment.trim() || 'Ship Repair Management (SRM)')
        : department;

      const res = await register({
        fullName,
        name: fullName,
        employeeId,
        email,
        password,
        role,
        department: resolvedDept,
      });

      if (!res.success && res.error) {
        setFormError(res.error);
      } else if (res.requiresConfirmation) {
        setConfirmationSentEmail(email.trim());
      }
    } else if (mode === 'forgot') {
      if (!email.trim()) {
        setFormError(language === 'th' ? 'กรุณากรอกอีเมลที่ลงทะเบียนไว้' : 'Please enter your registered email address.');
        return;
      }
      const res = await resetPassword(email);
      if (res.success) {
        setResetSuccess(true);
      } else {
        setFormError(res.error || (language === 'th' ? 'ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้' : 'Failed to send password reset email.'));
      }
    }
  };

  return (
    <div
      className={`min-h-screen flex flex-col justify-between transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Top Bar with Logo, Language Toggle, Supabase Status & Dark/Bright Toggle */}
      <header
        className={`w-full border-b px-4 sm:px-8 py-3.5 flex items-center justify-between transition-colors ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200'
        } backdrop-blur-md sticky top-0 z-20`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white p-1 border border-slate-300 shadow-sm shrink-0 flex items-center justify-center overflow-hidden">
            <img src={unithaiLogo} alt="Unithai Shipyard Official Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <span className={`font-extrabold tracking-tight text-base font-sans block ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {t.appTitle}
            </span>
            <p className={`text-[11px] font-mono hidden sm:block ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              {t.appSubtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <PWAInstallButton />
          <LanguageToggle />
          <SupabaseBadge />
          <ThemeToggle showLabel={false} />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div
            className={`rounded-2xl border p-6 sm:p-8 shadow-2xl transition-all ${
              isDark ? 'bg-slate-900/95 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Header info */}
            <div className="text-center mb-6">
              <div className={`inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3 shadow-inner ${
                isDark ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-400' : 'bg-cyan-50 border border-cyan-200 text-cyan-700'
              }`}>
                <Anchor className="w-7 h-7" />
              </div>
              <h1 className={`text-xl sm:text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {mode === 'login' && t.signInTitle}
                {mode === 'register' && t.registerTitle}
                {mode === 'forgot' && t.forgotTitle}
              </h1>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {mode === 'login' && t.signInSub}
                {mode === 'register' && t.registerSub}
                {mode === 'forgot' && t.forgotSub}
              </p>
            </div>

            {/* Auth Callback Notification (From Email Confirmation / Password Recovery) */}
            {authMessage && (
              <div
                className={`mb-5 p-3.5 rounded-xl border text-xs flex items-start gap-2.5 transition-all ${
                  authMessage.type === 'error'
                    ? 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300'
                    : authMessage.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
                    : 'bg-cyan-500/15 border-cyan-500/40 text-cyan-800 dark:text-cyan-300'
                }`}
              >
                {authMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600 dark:text-red-400" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
                )}
                <div className="flex-1">
                  {authMessage.title && (
                    <h4 className="font-bold mb-0.5">{authMessage.title}</h4>
                  )}
                  <p className="leading-relaxed">{authMessage.message}</p>
                </div>
                <button
                  type="button"
                  onClick={clearAuthMessage}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5"
                  title="Close"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Error or Success notification */}
            {(formError || authError) && !authMessage && (
              <div className="mb-5 p-3 rounded-xl bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 text-xs flex items-start gap-2 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">{formError || authError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="mb-5 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-emerald-400 text-xs flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-medium">
                  {language === 'th'
                    ? 'ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของคุณเรียบร้อยแล้ว กรุณาตรวจสอบกล่องจดหมาย'
                    : 'Password reset link has been dispatched to your email address. Please check your inbox.'}
                </span>
              </div>
            )}

            {/* Confirmation Email Sent Notification (When user registers on real Supabase) */}
            {confirmationSentEmail && (
              <div className="mb-6 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-slate-800 dark:text-slate-200">
                <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold mb-2">
                  <Mail className="w-4 h-4" />
                  <span>{language === 'th' ? 'กรุณายืนยันอีเมลของคุณ' : 'Please Confirm Your Email'}</span>
                </div>
                <p className="leading-relaxed mb-3">
                  {language === 'th' ? (
                    <>
                      ระบบได้ส่งลิงก์ยืนยันตัวตนไปยัง <strong className="text-cyan-600 dark:text-cyan-400">{confirmationSentEmail}</strong> แล้ว เมื่อคุณคลิกลิงก์ในอีเมล ระบบจะเปิดหน้าเว็บนี้เพื่อเปิดใช้งานบัญชีของคุณทันที
                    </>
                  ) : (
                    <>
                      A confirmation email has been dispatched to <strong className="text-cyan-600 dark:text-cyan-400">{confirmationSentEmail}</strong>. Please click the link in the email to activate your account.
                    </>
                  )}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmationSentEmail(null);
                      setMode('login');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold cursor-pointer text-xs"
                  >
                    {language === 'th' ? 'ไปที่หน้าเข้าสู่ระบบ' : 'Go to Sign In'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmationSentEmail(null)}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs"
                  >
                    {language === 'th' ? 'ปิด' : 'Dismiss'}
                  </button>
                </div>
              </div>
            )}

            {/* Forms */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <>
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {t.fullName}
                    </label>
                    <div className="relative">
                      <User className={`w-4 h-4 absolute left-3 top-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={t.fullNamePlaceholder}
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden transition-all ${
                          isDark
                            ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500'
                            : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {t.employeeId}{' '}
                      <span className={`text-[10px] font-normal ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {t.employeeIdSub}
                      </span>
                    </label>
                    <div className="relative">
                      <BadgeAlert className={`w-4 h-4 absolute left-3 top-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                      <input
                        type="text"
                        required
                        value={employeeId}
                        onChange={(e) => setEmployeeId(e.target.value)}
                        placeholder="UT-02488"
                        className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border font-mono focus:outline-hidden transition-all ${
                          isDark
                            ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500'
                            : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Role Selector: SRM, CO_SRM, IN_CHARGE, ENGINEER, USER (ADMIN can only be assigned by Administrator) */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {language === 'th' ? 'เลือกตำแหน่ง / บทบาทหน้าที่ *' : 'Select Role / Position *'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        {
                          id: 'SRM' as RoleType,
                          title: 'SRM',
                          sub: language === 'th' ? 'Ship Repair Manager' : 'Ship Repair Manager',
                          icon: '⚓',
                          selectedStyle: isDark ? 'border-cyan-500 bg-cyan-500/15 text-cyan-300 ring-2 ring-cyan-500/30' : 'border-cyan-500 bg-cyan-50 text-cyan-900 ring-2 ring-cyan-500/30',
                        },
                        {
                          id: 'CO_SRM' as RoleType,
                          title: 'CO SRM',
                          sub: language === 'th' ? 'ผู้ช่วย SRM (Co-Manager)' : 'Co-SRM Manager',
                          icon: '🤝',
                          selectedStyle: isDark ? 'border-teal-500 bg-teal-500/15 text-teal-300 ring-2 ring-teal-500/30' : 'border-teal-500 bg-teal-50 text-teal-900 ring-2 ring-teal-500/30',
                        },
                        {
                          id: 'IN_CHARGE' as RoleType,
                          title: 'IN CHARGE',
                          sub: language === 'th' ? 'ผู้รับผิดชอบงานเรือ' : 'Officer In-Charge',
                          icon: '📋',
                          selectedStyle: isDark ? 'border-indigo-500 bg-indigo-500/15 text-indigo-300 ring-2 ring-indigo-500/30' : 'border-indigo-500 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-500/30',
                        },
                        {
                          id: 'ENGINEER' as RoleType,
                          title: 'ENGINEER',
                          sub: language === 'th' ? 'วิศวกรซ่อมเรือ' : 'Marine Engineer',
                          icon: '🔧',
                          selectedStyle: isDark ? 'border-purple-500 bg-purple-500/15 text-purple-300 ring-2 ring-purple-500/30' : 'border-purple-500 bg-purple-50 text-purple-900 ring-2 ring-purple-500/30',
                        },
                        {
                          id: 'USER' as RoleType,
                          title: 'USER',
                          sub: language === 'th' ? 'เจ้าหน้าที่ทั่วไป' : 'General Staff',
                          icon: '👤',
                          selectedStyle: isDark ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-2 ring-emerald-500/30' : 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/30',
                        },
                      ].map((item) => {
                        const isSelected = role === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setRole(item.id)}
                            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                              isSelected
                                ? item.selectedStyle
                                : isDark
                                ? 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:border-slate-600'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full mb-1">
                              <span className="text-xs font-black flex items-center gap-1.5 font-mono">
                                <span>{item.icon}</span>
                                <span>{item.title}</span>
                              </span>
                              <input
                                type="radio"
                                name="role"
                                checked={isSelected}
                                onChange={() => setRole(item.id)}
                                className="accent-cyan-600 cursor-pointer"
                              />
                            </div>
                            <span className="text-[10px] leading-tight block opacity-80">
                              {item.sub}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Department Field */}
                  <div>
                    <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {language === 'th' ? 'แผนก / ฝ่าย (Department) *' : 'Department *'}
                    </label>
                    <select
                      value={isCustomDept ? '__OTHER__' : department}
                      onChange={(e) => {
                        if (e.target.value === '__OTHER__') {
                          setIsCustomDept(true);
                        } else {
                          setIsCustomDept(false);
                          setDepartment(e.target.value);
                        }
                      }}
                      className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-hidden transition-all ${
                        isDark
                          ? 'bg-slate-800/80 border-slate-700 text-white focus:border-cyan-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20'
                      }`}
                    >
                      {UNITHAI_DEPARTMENTS.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {language === 'th' ? dept.nameTh : dept.nameEn}
                        </option>
                      ))}
                    </select>

                    {/* Custom Department Name Input */}
                    {isCustomDept && (
                      <div className="mt-2 animate-fade-in">
                        <input
                          type="text"
                          required
                          placeholder={language === 'th' ? 'กรุณาระบุชื่อแผนกของคุณ (เช่น แผนกเครื่องกล)...' : 'Specify department name...'}
                          value={customDepartment}
                          onChange={(e) => setCustomDepartment(e.target.value)}
                          className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-hidden transition-all ${
                            isDark
                              ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500'
                              : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20'
                          }`}
                        />
                      </div>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {t.email}
                </label>
                <div className="relative">
                  <Mail className={`w-4 h-4 absolute left-3 top-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@unithai.com"
                    className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden transition-all ${
                      isDark
                        ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20'
                    }`}
                  />
                </div>
              </div>

              {mode !== 'forgot' && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {t.password}
                    </label>
                    {mode === 'login' && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('forgot');
                          setFormError(null);
                        }}
                        className={`text-[11px] font-semibold hover:underline cursor-pointer ${
                          isDark ? 'text-cyan-400' : 'text-cyan-700'
                        }`}
                      >
                        {t.forgotPasswordLink}
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className={`w-4 h-4 absolute left-3 top-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden transition-all ${
                        isDark
                          ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20'
                      }`}
                    />
                  </div>
                </div>
              )}

              {mode === 'register' && (
                <div>
                  <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {t.confirmPassword}
                  </label>
                  <div className="relative">
                    <KeyRound className={`w-4 h-4 absolute left-3 top-2.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className={`w-full pl-9 pr-3 py-2 text-xs rounded-xl border focus:outline-hidden transition-all ${
                        isDark
                          ? 'bg-slate-800/80 border-slate-700 text-white placeholder:text-slate-500 focus:border-cyan-500'
                          : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-cyan-600 focus:ring-2 focus:ring-cyan-500/20'
                      }`}
                    />
                  </div>

                  {/* Security Rule Notice - Clear, high contrast */}
                  <div
                    className={`mt-3 p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                      isDark
                        ? 'bg-cyan-950/40 border-cyan-800/60 text-cyan-200'
                        : 'bg-cyan-50/90 border-cyan-200 text-cyan-950 shadow-xs'
                    }`}
                  >
                    <ShieldCheck className={`w-4 h-4 shrink-0 mt-0.5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    <span className="leading-snug font-medium">{t.securityRuleSRM}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-[0.99] text-white font-bold text-xs sm:text-sm tracking-wide transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/25 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <span>
                      {mode === 'login' && t.signInBtn}
                      {mode === 'register' && t.registerBtn}
                      {mode === 'forgot' && t.sendResetBtn}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Toggle Modes */}
            <div
              className={`mt-6 pt-5 border-t text-center text-xs ${
                isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'
              }`}
            >
              {mode === 'login' ? (
                <p>
                  {t.noAccountYet}{' '}
                  <button
                    onClick={() => {
                      setMode('register');
                      setFormError(null);
                    }}
                    className={`font-bold hover:underline cursor-pointer ${
                      isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'
                    }`}
                  >
                    {t.registerHere}
                  </button>
                </p>
              ) : (
                <p>
                  {t.alreadyHaveAccount}{' '}
                  <button
                    onClick={() => {
                      setMode('login');
                      setFormError(null);
                    }}
                    className={`font-bold hover:underline cursor-pointer ${
                      isDark ? 'text-cyan-400 hover:text-cyan-300' : 'text-cyan-700 hover:text-cyan-800'
                    }`}
                  >
                    {t.signInInstead}
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`py-4 text-center text-xs border-t transition-colors ${
        isDark ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-600'
      }`}>
        <p>© 2026 Unithai Shipyard & Engineering Limited. All Rights Reserved. Laem Chabang Deep Sea Port, Thailand.</p>
      </footer>
    </div>
  );
};
