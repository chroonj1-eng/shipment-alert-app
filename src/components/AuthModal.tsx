import React, { useState } from 'react';
import { User, UserRole, JobProject, AlertRuleConfig } from '../types';
import { Language, translations } from '../i18n/translations';
import { UNITHAI_DEPARTMENTS } from '../lib/departments';
import unithaiLogo from '../assets/images/unithai_official_original_logo.jpg';
import { X, ShieldCheck, Mail, User as UserIcon, Key, AlertCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
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
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  onRegister,
  allUsers,
  allJobs,
  config,
  lang,
}) => {
  if (!isOpen) return null;
  const t = translations[lang];

  const [mode, setMode] = useState<'signin' | 'register'>('register');
  const [step, setStep] = useState<'form' | 'otp_verify'>('form');

  // Sign in state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginError, setLoginError] = useState('');

  // Register state
  const [name, setName] = useState('');
  const [emailPrefix, setEmailPrefix] = useState('');
  const [role, setRole] = useState<UserRole>('srm');
  const [department, setDepartment] = useState('Ship / Project Management & Planning');
  const [customDepartment, setCustomDepartment] = useState('');
  const [isCustomDept, setIsCustomDept] = useState(false);
  const [deptViewMode, setDeptViewMode] = useState<'radio' | 'dropdown'>('radio');
  const [deptSearch, setDeptSearch] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedJob, setSelectedJob] = useState(allJobs[0]?.jobNo || '');
  const [registerError, setRegisterError] = useState('');

  // OTP Verification state
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [inputOtp, setInputOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [pendingUser, setPendingUser] = useState<any>(null);

  const fullEmail = `${emailPrefix}${config.companyEmailDomain}`;

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const target = allUsers.find(
      (u) => u.email.toLowerCase() === loginEmail.trim().toLowerCase()
    );

    if (!target) {
      setLoginError(
        lang === 'th'
          ? `ไม่พบอีเมล "${loginEmail}" ในระบบ กรุณาตรวจสอบหรือลงทะเบียนใหม่`
          : `Email "${loginEmail}" not found in system. Please register or check spelling.`
      );
      return;
    }

    onLogin(target);
    onClose();
  };

  const handleStartRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setRegisterError('');

    if (!name.trim()) {
      setRegisterError(lang === 'th' ? 'กรุณากรอกชื่อ-นามสกุล' : 'Please enter full name');
      return;
    }

    if (!emailPrefix.trim()) {
      setRegisterError(lang === 'th' ? 'กรุณากรอกชื่อผู้ใช้อีเมลบริษัท' : 'Please enter email prefix');
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

    const resolvedDept = isCustomDept
      ? (customDepartment.trim() || 'Ship / Project Management & Planning')
      : department;

    // Generate 6-digit OTP code for identity verification
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setPendingUser({
      name,
      email,
      role,
      department: resolvedDept,
      phone,
      assignedJobs: selectedJob ? [selectedJob] : [],
    });
    setStep('otp_verify');
  };

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
      onClose();
    } else {
      setOtpError(res.error || 'Failed to create account');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-cyan-400/50 bg-white p-0.5 shrink-0 shadow-sm">
              <img
                src={unithaiLogo}
                alt="Unithai Logo"
                className="w-full h-full object-contain rounded-md"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {lang === 'th' ? 'ระบบรักษาความปลอดภัยบัญชีองค์กร' : 'Corporate Account Security'}
              </h3>
              <p className="text-xs text-slate-400">
                {lang === 'th' ? 'เฉพาะ SRM, Co-SRM, In-charge & Admin' : 'SRM, Co-SRM, In-charge & Admin'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        {step === 'form' && (
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs">
            <button
              onClick={() => {
                setMode('register');
                setRegisterError('');
              }}
              className={`flex-1 py-2.5 font-semibold text-center transition-colors ${
                mode === 'register'
                  ? 'border-b-2 border-cyan-600 bg-white text-cyan-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.tabRegister}
            </button>
            <button
              onClick={() => {
                setMode('signin');
                setLoginError('');
              }}
              className={`flex-1 py-2.5 font-semibold text-center transition-colors ${
                mode === 'signin'
                  ? 'border-b-2 border-cyan-600 bg-white text-cyan-900'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.tabSignIn}
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-6 text-xs">
          {step === 'otp_verify' ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-700 flex items-center justify-center mx-auto mb-2">
                  <Key className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  {t.otpTitle}
                </h4>
                <p className="text-xs text-slate-500 mt-1">
                  {t.otpSubtitle} <br />
                  <strong className="text-slate-800 font-mono">{pendingUser?.email}</strong>
                </p>
              </div>

              {/* Demo OTP display badge for seamless test experience */}
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
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{otpError}</span>
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
                  className="w-full text-center text-xl font-mono tracking-widest py-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-cyan-500"
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
          ) : mode === 'register' ? (
            /* Register Form */
            <form onSubmit={handleStartRegister} className="space-y-3.5">
              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600">
                {t.regDomainNotice}{' '}
                <strong className="text-cyan-900 font-mono">{config.companyEmailDomain}</strong>
              </div>

              {registerError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{registerError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t.regFullName} *
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t.regFullNamePlaceholder}
                    required
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t.regEmail} *
                </label>
                <div className="flex rounded border border-slate-300 overflow-hidden focus-within:ring-1 focus-within:ring-cyan-500">
                  <div className="relative flex-1">
                    <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={emailPrefix}
                      onChange={(e) => setEmailPrefix(e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
                      placeholder={t.regEmailPrefixPlaceholder}
                      required
                      className="w-full pl-8 pr-2 py-1.5 text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <span className="bg-slate-100 text-slate-600 px-3 py-1.5 font-mono text-xs border-l border-slate-300 flex items-center">
                    {config.companyEmailDomain}
                  </span>
                </div>
              </div>

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

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-slate-700 font-semibold text-xs flex items-center gap-1.5">
                    <span>{t.regDepartment}</span>
                    <span className="text-[11px] text-cyan-600 font-normal">
                      ({lang === 'th' ? 'ติ๊กเลือกแผนก 17 แผนก' : 'Tick 17 departments'})
                    </span>
                  </label>
                  <div className="flex items-center gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setDeptViewMode('radio')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        deptViewMode === 'radio'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {lang === 'th' ? 'รายการติ๊กเลือก (Radio)' : 'Radio List'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeptViewMode('dropdown')}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                        deptViewMode === 'dropdown'
                          ? 'bg-cyan-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {lang === 'th' ? 'ดรอปดาวน์' : 'Dropdown'}
                    </button>
                  </div>
                </div>

                {deptViewMode === 'dropdown' ? (
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
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs cursor-pointer bg-white text-slate-800"
                  >
                    {UNITHAI_DEPARTMENTS.map((d) => (
                      <option key={d.id} value={d.id}>
                        {lang === 'th' ? d.nameTh : d.nameEn}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="border border-slate-300 rounded-xl overflow-hidden bg-slate-50/70 p-2">
                    <input
                      type="text"
                      placeholder={lang === 'th' ? '🔍 พิมพ์ค้นหาแผนก...' : '🔍 Search department...'}
                      value={deptSearch}
                      onChange={(e) => setDeptSearch(e.target.value)}
                      className="w-full mb-2 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-hidden focus:border-cyan-500"
                    />
                    <div className="max-h-44 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {UNITHAI_DEPARTMENTS.filter((d) => {
                        if (!deptSearch.trim()) return true;
                        const q = deptSearch.toLowerCase();
                        return d.nameEn.toLowerCase().includes(q) || d.nameTh.toLowerCase().includes(q);
                      }).map((d) => {
                        const isChecked = isCustomDept ? d.id === '__OTHER__' : department === d.id;
                        return (
                          <label
                            key={d.id}
                            className={`flex items-start gap-2 p-1.5 rounded-lg cursor-pointer transition-all border text-xs ${
                              isChecked
                                ? 'bg-cyan-50 border-cyan-500 text-cyan-950 font-semibold shadow-xs'
                                : 'bg-white border-slate-200 hover:border-cyan-300 text-slate-700'
                            }`}
                          >
                            <input
                              type="radio"
                              name="modal_dept_radio"
                              checked={isChecked}
                              onChange={() => {
                                if (d.id === '__OTHER__') {
                                  setIsCustomDept(true);
                                } else {
                                  setIsCustomDept(false);
                                  setDepartment(d.id);
                                }
                              }}
                              className="mt-0.5 text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-[11.5px] leading-tight font-medium text-slate-900">
                                {d.nameEn}
                              </div>
                              <div className="text-[9.5px] text-slate-500 font-normal mt-0.5">
                                {d.nameTh}
                              </div>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}

                {isCustomDept && (
                  <div className="mt-2">
                    <input
                      type="text"
                      required
                      placeholder={lang === 'th' ? 'ระบุชื่อแผนกของคุณ...' : 'Specify your department name...'}
                      value={customDepartment}
                      onChange={(e) => setCustomDepartment(e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white text-slate-800"
                    />
                  </div>
                )}
              </div>

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
                  className="w-full py-2.5 px-4 font-semibold text-white bg-cyan-700 hover:bg-cyan-600 rounded-md transition-colors shadow-xs"
                >
                  {t.btnContinueVerify}
                </button>
              </div>
            </form>
          ) : (
            /* Sign In Form */
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="text-xs text-slate-600">
                {t.signInTitle}
              </div>

              {loginError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded text-rose-800 flex items-center gap-1.5 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{loginError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {t.signInEmailLabel}
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder={t.signInEmailPlaceholder}
                    required
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-300 rounded text-xs font-mono focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs">
                <span className="font-semibold text-slate-700 block mb-1.5">
                  {t.quickTestTitle}
                </span>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {allUsers.map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => {
                        onLogin(u);
                        onClose();
                      }}
                      className="w-full text-left px-2 py-1 rounded bg-white hover:bg-cyan-50 border border-slate-200 text-xs flex items-center justify-between transition-colors"
                    >
                      <span className="font-medium text-slate-800 truncate pr-1">
                        {u.name}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1 rounded bg-slate-100 text-slate-600">
                        {u.role}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
                >
                  {t.btnSignIn}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
