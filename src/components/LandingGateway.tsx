import React, { useState } from 'react';
import { User, UserRole, JobProject, AlertRuleConfig } from '../types';
import { Language, translations } from '../i18n/translations';
import {
  Ship,
  ShieldCheck,
  Lock,
  Key,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Globe,
  BellRing,
  Layers,
  ChevronRight,
  UserCheck,
  Database,
  RotateCcw,
} from 'lucide-react';

// Import company logo & maritime badge
import unithaiLogo from '../assets/images/unithai_official_original_logo.jpg';
import marineBadge from '../assets/images/marine_logistics_badge_1791007149085.jpg';

interface LandingGatewayProps {
  onLogin: (user: User) => void;
  onRegister: (newUser: {
    name: string;
    email: string;
    role: UserRole;
    department: string;
    phone: string;
    assignedJobs?: string[];
  }) => { success: boolean; user?: User; error?: string };
  allUsers: User[];
  allJobs: JobProject[];
  config: AlertRuleConfig;
  lang: Language;
  onToggleLang: (lang: Language) => void;
  onResetEmpty: () => void;
  onLoadSample: () => void;
  isEmpty: boolean;
}

export const LandingGateway: React.FC<LandingGatewayProps> = ({
  onLogin,
  onRegister,
  allUsers,
  allJobs,
  config,
  lang,
  onToggleLang,
  onResetEmpty,
  onLoadSample,
  isEmpty,
}) => {
  const t = translations[lang];

  const [activeTab, setActiveTab] = useState<'register' | 'signin' | 'demo'>('register');
  const [step, setStep] = useState<'form' | 'otp_verify'>('form');

  // Register form state
  const [name, setName] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [role, setRole] = useState<UserRole>('srm');
  const [department, setDepartment] = useState('Ship Repair Management');
  const [phone, setPhone] = useState('');
  const [selectedJob, setSelectedJob] = useState(allJobs[0]?.jobNo || '');
  const [registerError, setRegisterError] = useState('');

  // OTP Verification state
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(null);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInError, setSignInError] = useState('');

  const fullEmail = `${emailPrefix}${config.companyEmailDomain}`;

  // Start registration step 1 -> trigger OTP verification
  const handleStartRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!name.trim()) {
      setRegisterError(lang === 'th' ? 'กรุณากรอกชื่อ-นามสกุล' : 'Please enter full name');
      return;
    }
    if (!emailPrefix.trim()) {
      setRegisterError(lang === 'th' ? 'กรุณากรอกชื่อผู้ใช้อีเมลบริษัท' : 'Please enter company email prefix');
      return;
    }

    const email = fullEmail.toLowerCase();
    const existing = allUsers.find((u) => u.email.toLowerCase() === email);
    if (existing) {
      setRegisterError(
        lang === 'th'
          ? `อีเมล ${email} มีอยู่ในระบบแล้ว กรุณาไปที่แท็บเข้าสู่ระบบ`
          : `Email ${email} already exists. Please go to Sign In tab.`
      );
      return;
    }

    // Generate 6-digit OTP code for identity verification
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setPendingUser({
      name,
      email,
      role,
      department,
      phone,
      assignedJobs: selectedJob ? [selectedJob] : [],
    });
    setStep('otp_verify');
  };

  // Step 2: Complete OTP verification and activate account
  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError('');

    if (inputOtp.trim() !== generatedOtp.trim()) {
      setOtpError(
        lang === 'th'
          ? 'รหัสยืนยัน OTP ไม่ถูกต้อง กรุณากรอกรหัส 6 หลักที่ถูกต้อง'
          : 'Invalid OTP code. Please enter the correct 6-digit code.'
      );
      return;
    }

    const res = onRegister(pendingUser);
    if (res.success && res.user) {
      onLogin(res.user);
    } else {
      setOtpError(res.error || 'Failed to create account');
    }
  };

  // Sign In submit
  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setSignInError('');

    const target = allUsers.find(
      (u) => u.email.toLowerCase() === signInEmail.trim().toLowerCase()
    );

    if (!target) {
      setSignInError(
        lang === 'th'
          ? `ไม่พบอีเมล "${signInEmail}" ในระบบ กรุณาตรวจสอบหรือลงทะเบียนใหม่`
          : `Email "${signInEmail}" not found in system. Please register or check spelling.`
      );
      return;
    }

    onLogin(target);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Bar Contract (1 Row, 3 Zones) */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Zone 1: Unithai Company Logo & Wordmark */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-cyan-500/40 bg-white p-0.5 shadow-md shrink-0">
              <img
                src={unithaiLogo}
                alt="Unithai Shipyard Logo"
                className="w-full h-full object-contain rounded-md"
              />
            </div>
            <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
              {t.appTitle}
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/70">
                {t.versionBadge}
              </span>
            </span>
          </div>

          {/* Zone 2: Navigation Links */}
          <div className="hidden md:flex items-center gap-6 text-xs text-slate-400">
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Job-Scoped RBAC Architecture</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Delivery Date ⚠️ Urgency Watch</span>
            </span>
            <span className="text-slate-600">·</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              <span>SRM / Co-SRM / In-charge / Admin</span>
            </span>
          </div>

          {/* Zone 3: Language Switcher & Quick Action */}
          <div className="flex items-center gap-3">
            {/* Language Switcher Pill */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700 text-xs">
              <button
                type="button"
                onClick={() => onToggleLang('th')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  lang === 'th'
                    ? 'bg-cyan-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                TH (ไทย)
              </button>
              <button
                type="button"
                onClick={() => onToggleLang('en')}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  lang === 'en'
                    ? 'bg-cyan-600 text-white shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
            </div>

            <button
              onClick={() => setActiveTab('demo')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-lg transition-colors"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.tabQuickDemo}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Hero & Registration Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-16 flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Column: Shipyard Platform Information */}
        <div className="flex-1 max-w-xl space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-cyan-500/50 bg-white p-1 shadow-lg shrink-0">
              <img
                src={unithaiLogo}
                alt="Unithai Shipyard Official Logo"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-700/60 text-cyan-300 text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>UNITHAI SHIPYARD & ENGINEERING</span>
              </div>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                Laem Chabang Shipyard · Marine Maintenance & Logistics
              </div>
            </div>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            {t.landingTitle}
          </h1>

          <div className="text-base sm:text-lg font-semibold text-cyan-400">
            {t.landingSubtitle}
          </div>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            {t.landingDescription}
          </p>

          {/* Standalone Client Storage Box with Empty Database / Sample Data toggle */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-cyan-500/40 shadow-xl space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-cyan-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  {t.standaloneTitle}
                </h3>
              </div>
              <span className={`text-[11px] font-mono px-2.5 py-0.5 rounded-full border ${
                isEmpty
                  ? 'bg-emerald-950/90 text-emerald-300 border-emerald-600/70 font-semibold'
                  : 'bg-cyan-950/90 text-cyan-300 border-cyan-600/70 font-semibold'
              }`}>
                {isEmpty ? t.dbStatusEmpty : t.dbStatusSample}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {t.standaloneNotice}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={onResetEmpty}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isEmpty
                    ? 'bg-emerald-600 text-white shadow-md ring-2 ring-emerald-400/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.btnStartEmptyDb}</span>
              </button>

              <button
                type="button"
                onClick={onLoadSample}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  !isEmpty
                    ? 'bg-cyan-600 text-white shadow-md ring-2 ring-cyan-400/50'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                <span>{t.btnLoadSampleDb}</span>
              </button>
            </div>
          </div>

          {/* 3 Core Value Pillars */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="p-2 rounded-md bg-cyan-950 text-cyan-400 shrink-0 mt-0.5">
                <span className="text-lg">🚢</span>
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {t.feature1Title}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {t.feature1Desc}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="p-2 rounded-md bg-amber-950 text-amber-400 shrink-0 mt-0.5">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {t.feature2Title}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {t.feature2Desc}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-800">
              <div className="p-2 rounded-md bg-indigo-950 text-indigo-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  {t.feature3Title}
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  {t.feature3Desc}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Prominent Interactive Registration & Authentication Card */}
        <div className="w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-200 overflow-hidden shrink-0">
          {/* Card Top Branding Header */}
          <div className="p-3.5 bg-slate-950 border-b border-slate-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg overflow-hidden border border-cyan-400/50 bg-white p-0.5 shrink-0 shadow-sm">
                <img
                  src={unithaiLogo}
                  alt="Unithai Logo"
                  className="w-full h-full object-contain rounded-md"
                />
              </div>
              <div>
                <div className="text-[11px] font-bold tracking-wider text-cyan-400 uppercase font-mono">
                  UNITHAI SHIPYARD
                </div>
                <div className="text-xs font-semibold text-white">
                  {lang === 'th' ? 'ระบบยืนยันตัวตน SRM & พนักงาน' : 'SRM & Employee Identity Gateway'}
                </div>
              </div>
            </div>
            <div className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/80">
              🔒 SSL 256-bit
            </div>
          </div>

          {/* Card Top Tabs */}
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs">
            <button
              onClick={() => {
                setActiveTab('register');
                setStep('form');
                setRegisterError('');
              }}
              className={`flex-1 py-3 font-semibold text-center transition-colors ${
                activeTab === 'register'
                  ? 'bg-white text-cyan-900 border-b-2 border-cyan-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.tabRegister}
            </button>

            <button
              onClick={() => {
                setActiveTab('signin');
                setSignInError('');
              }}
              className={`flex-1 py-3 font-semibold text-center transition-colors ${
                activeTab === 'signin'
                  ? 'bg-white text-cyan-900 border-b-2 border-cyan-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.tabSignIn}
            </button>

            <button
              onClick={() => setActiveTab('demo')}
              className={`flex-1 py-3 font-semibold text-center transition-colors ${
                activeTab === 'demo'
                  ? 'bg-white text-cyan-900 border-b-2 border-cyan-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.tabQuickDemo}
            </button>
          </div>

          {/* Card Content Body */}
          <div className="p-6 text-xs">
            {/* TAB 1: REGISTRATION FLOW */}
            {activeTab === 'register' && (
              <>
                {step === 'otp_verify' ? (
                  /* OTP Security Verification Step */
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <div className="text-center">
                      <div className="w-12 h-12 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center mx-auto mb-2">
                        <Key className="w-6 h-6" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">
                        {t.otpTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {t.otpSubtitle} <br />
                        <strong className="text-slate-900 font-mono">{pendingUser?.email}</strong>
                      </p>
                    </div>

                    {/* Simulated Code Box */}
                    <div className="p-3 bg-cyan-50 border border-cyan-200 rounded-lg text-center">
                      <span className="text-[10px] text-cyan-800 font-medium block">
                        {t.otpSimulationNotice}
                      </span>
                      <span className="text-2xl font-bold font-mono tracking-widest text-cyan-950 mt-1 block">
                        {generatedOtp}
                      </span>
                      <button
                        type="button"
                        onClick={() => setInputOtp(generatedOtp)}
                        className="mt-1 text-[11px] text-cyan-700 underline font-medium hover:text-cyan-900"
                      >
                        {t.otpAutoFill}
                      </button>
                    </div>

                    {otpError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs">
                        {otpError}
                      </div>
                    )}

                    <div>
                      <label className="block text-slate-700 font-semibold mb-1 text-center">
                        {t.otpInputLabel}
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={inputOtp}
                        onChange={(e) => setInputOtp(e.target.value)}
                        placeholder="------"
                        required
                        className="w-full text-center text-xl font-mono tracking-widest py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                      />
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setStep('form')}
                        className="px-3 py-2 text-slate-600 hover:bg-slate-100 rounded text-xs"
                      >
                        {t.btnBack}
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 font-semibold text-white bg-cyan-700 hover:bg-cyan-600 rounded-md transition-colors shadow-xs"
                      >
                        {t.btnRegisterSubmit}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Initial Registration Form */
                  <form onSubmit={handleStartRegister} className="space-y-3.5">
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
                      {t.regDomainNotice}{' '}
                      <strong className="text-cyan-900 font-mono">{config.companyEmailDomain}</strong>
                    </div>

                    {registerError && (
                      <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs">
                        {registerError}
                      </div>
                    )}

                    {/* Full Name */}
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        {t.regFullName} *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t.regFullNamePlaceholder}
                        required
                        className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-cyan-500"
                      />
                    </div>

                    {/* Corporate Email Prefix + Domain */}
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        {t.regEmail} *
                      </label>
                      <div className="flex rounded border border-slate-300 overflow-hidden focus-within:ring-1 focus-within:ring-cyan-500">
                        <input
                          type="text"
                          value={emailPrefix}
                          onChange={(e) =>
                            setEmailPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))
                          }
                          placeholder={t.regEmailPrefixPlaceholder}
                          required
                          className="w-full px-3 py-1.5 text-xs font-mono focus:outline-none"
                        />
                        <span className="bg-slate-100 text-slate-600 px-3 py-1.5 font-mono text-xs border-l border-slate-300 flex items-center">
                          {config.companyEmailDomain}
                        </span>
                      </div>
                    </div>

                    {/* Role & Phone */}
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          {t.regRole} *
                        </label>
                        <select
                          value={role}
                          onChange={(e) => setRole(e.target.value as UserRole)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-cyan-500 font-medium"
                        >
                          <option value="srm">{t.regRoleSrm}</option>
                          <option value="co_srm">{t.regRoleCoSrm}</option>
                          <option value="incharge">{t.regRoleIncharge}</option>
                          <option value="admin">{t.regRoleAdmin}</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          {t.regPhone}
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder={t.regPhonePlaceholder}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-mono"
                        />
                      </div>
                    </div>

                    {/* Department */}
                    <div>
                      <label className="block text-slate-700 font-semibold mb-1">
                        {t.regDepartment}
                      </label>
                      <input
                        type="text"
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        placeholder={t.regDepartmentPlaceholder}
                        className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs"
                      />
                    </div>

                    {/* Vessel Job Assignment Selection (for non-admins) */}
                    {role !== 'admin' && allJobs.length > 0 && (
                      <div>
                        <label className="block text-slate-700 font-semibold mb-1">
                          {t.regJobAssign}
                        </label>
                        <select
                          value={selectedJob}
                          onChange={(e) => setSelectedJob(e.target.value)}
                          className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs font-medium"
                        >
                          <option value="">{t.regJobAssignPlaceholder}</option>
                          {allJobs.map((j) => (
                            <option key={j.jobNo} value={j.jobNo}>
                              {j.jobNo} - {j.vesselName}
                            </option>
                          ))}
                        </select>
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          {t.regScopeNotice}
                        </span>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 font-semibold text-white bg-cyan-700 hover:bg-cyan-600 rounded-md transition-colors shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <span>{t.btnContinueVerify}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}

            {/* TAB 2: SIGN IN FLOW */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="text-xs text-slate-600">
                  {t.signInTitle}
                </div>

                {signInError && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 text-xs">
                    {signInError}
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">
                    {t.signInEmailLabel}
                  </label>
                  <input
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    placeholder={t.signInEmailPlaceholder}
                    required
                    className="w-full px-3 py-2 border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-cyan-500"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors shadow-xs"
                  >
                    {t.btnSignIn}
                  </button>
                </div>

                <div className="pt-3 border-t border-slate-200 text-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('demo')}
                    className="text-xs text-cyan-700 hover:underline font-medium"
                  >
                    {t.quickTestTitle}
                  </button>
                </div>
              </form>
            )}

            {/* TAB 3: QUICK DEMO ROLE SWITCHER */}
            {activeTab === 'demo' && (
              <div className="space-y-3">
                <div className="text-xs text-slate-600">
                  {t.quickTestTitle}
                </div>

                <div className="space-y-2">
                  {allUsers.map((u) => {
                    const isAdm = u.role === 'admin';
                    const isSrm = u.role === 'srm';

                    return (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => onLogin(u)}
                        className="w-full text-left p-3 rounded-lg border border-slate-200 hover:border-cyan-500 hover:bg-cyan-50/40 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 text-xs">
                              {u.name}
                            </span>
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-semibold ${
                                isAdm
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : isSrm
                                  ? 'bg-cyan-100 text-cyan-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {u.role.toUpperCase()}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5 truncate max-w-[240px]">
                            {u.email}
                          </div>
                          <div className="text-[10px] text-cyan-800 font-medium mt-1">
                            {isAdm
                              ? 'สิทธิ์ดูแลทุกโปรเจคเรือในอู่'
                              : `งานที่ดูแล: ${u.assignedJobs.join(', ') || 'ไม่มี'}`}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-cyan-600 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-4 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            {t.appTitle} · {t.appSubtitle}
          </span>
          <span className="font-mono text-[11px] text-slate-600">
            Enterprise Marine Shipyard Portal · Bilingual Edition
          </span>
        </div>
      </footer>
    </div>
  );
};
