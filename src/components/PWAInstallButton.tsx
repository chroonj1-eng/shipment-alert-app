import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { Download, Smartphone, Share, PlusSquare, X, CheckCircle, Apple } from 'lucide-react';
import unithaiLogo from '../assets/images/unithai_official_original_logo.jpg';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const { language } = useLanguage();
  const { isDark } = useTheme();
  const [showModal, setShowModal] = useState(false);
  const [justInstalled, setJustInstalled] = useState(false);

  // If already running in standalone mode, hide button
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        setJustInstalled(true);
        setTimeout(() => setJustInstalled(false), 3000);
      }
    } else {
      setShowModal(true);
    }
  };

  const isThai = language === 'th';

  return (
    <>
      {/* Navbar trigger button */}
      <button
        type="button"
        onClick={handleInstallClick}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-sky-600 hover:from-cyan-500 hover:to-sky-500 text-white shadow-xs transition-all cursor-pointer border border-cyan-400/40 active:scale-95"
        title={isThai ? 'ติดตั้งแอปบนมือถือ / แท็บเล็ต / พีซี' : 'Install PWA on Mobile / Desktop'}
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">
          {isThai ? 'ติดตั้งแอป' : 'Install App'}
        </span>
        <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-black/20 text-cyan-100 hidden md:inline">
          PWA
        </span>
      </button>

      {/* Success notification if just installed */}
      {justInstalled && (
        <div className="fixed top-16 right-4 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xl border border-emerald-400">
          <CheckCircle className="w-4 h-4" />
          <span>{isThai ? 'ติดตั้งแอปพลิเคชันสำเร็จแล้ว!' : 'App installed successfully!'}</span>
        </div>
      )}

      {/* Informative Guidance Modal for iOS & Non-Prompt Browsers */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-2xl shadow-2xl border p-5 sm:p-6 transition-all relative ${
              isDark
                ? 'bg-slate-900 border-slate-700/80 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Close Button */}
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / App Crest */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-white p-1 border border-slate-300 shadow-xs flex items-center justify-center overflow-hidden shrink-0">
                <img src={unithaiLogo} alt="Unithai Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold">
                  {isThai ? 'ติดตั้ง UNITHAI SRM PWA' : 'Install UNITHAI SRM PWA'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isThai
                    ? 'ใช้งานเสมือนแอปเนทีฟบน Android และ iPhone'
                    : 'Use like a native app on Android & iPhone'}
                </p>
              </div>
            </div>

            {/* Platform instructions */}
            {isIOS ? (
              /* iOS Safari instructions */
              <div className="space-y-3.5 my-4">
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                    isDark ? 'bg-slate-800/60 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'
                  }`}
                >
                  <Apple className="w-5 h-5 text-sky-500 shrink-0" />
                  <span className="text-xs font-bold">
                    {isThai ? 'วิธีติดตั้งบน iPhone / iPad (Safari):' : 'How to install on iPhone / iPad (Safari):'}
                  </span>
                </div>

                <ol className={`space-y-3 text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-600 text-white font-mono font-bold text-xs shrink-0">
                      1
                    </span>
                    <div className="flex-1">
                      <p>
                        {isThai
                          ? 'เปิดเว็บนี้ด้วย Safari จากนั้นแตะปุ่ม'
                          : 'Open in Safari and tap the'}{' '}
                        <strong className={`inline-flex items-center gap-1 font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                          <Share className="w-3.5 h-3.5 inline" /> {isThai ? 'แชร์ (Share)' : 'Share'}
                        </strong>{' '}
                        {isThai ? 'ที่แถบด้านล่าง' : 'button in the toolbar.'}
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-600 text-white font-mono font-bold text-xs shrink-0">
                      2
                    </span>
                    <div className="flex-1">
                      <p>
                        {isThai
                          ? 'เลื่อนลงมาแล้วเลือก'
                          : 'Scroll down and tap'}{' '}
                        <strong className={`inline-flex items-center gap-1 font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
                          <PlusSquare className="w-3.5 h-3.5 inline" /> {isThai ? 'เพิ่มไปยังหน้าจอโฮม (Add to Home Screen)' : 'Add to Home Screen'}
                        </strong>
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-600 text-white font-mono font-bold text-xs shrink-0">
                      3
                    </span>
                    <div className="flex-1">
                      <p>
                        {isThai
                          ? 'แตะ "เพิ่ม" (Add) ที่มุมขวาบน ไอคอน Unithai SRM จะปรากฏบนหน้าจอมือถือของคุณทันที'
                          : 'Tap "Add" in the top right corner. The Unithai SRM icon will appear on your home screen.'}
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            ) : isAndroid ? (
              /* Android Instructions */
              <div className="space-y-3.5 my-4">
                <div
                  className={`p-3 rounded-xl border flex items-center gap-2.5 ${
                    isDark ? 'bg-slate-800/60 border-slate-700 text-slate-100' : 'bg-slate-100 border-slate-200 text-slate-900'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-bold">
                    {isThai ? 'วิธีติดตั้งบน Android (Chrome):' : 'How to install on Android (Chrome):'}
                  </span>
                </div>

                <ol className={`space-y-3 text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-600 text-white font-mono font-bold text-xs shrink-0">
                      1
                    </span>
                    <div className="flex-1">
                      <p>
                        {isThai
                          ? 'แตะเมนูจุดไข่ปลา (⋮) ที่มุมขวาบนของ Google Chrome'
                          : 'Tap the three-dots menu (⋮) in Google Chrome.'}
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-600 text-white font-mono font-bold text-xs shrink-0">
                      2
                    </span>
                    <div className="flex-1">
                      <p>
                        {isThai
                          ? 'เลือก "ติดตั้งแอป" หรือ "เพิ่มลงในหน้าจอหลัก" (Install app / Add to Home screen)'
                          : 'Select "Install app" or "Add to Home screen".'}
                      </p>
                    </div>
                  </li>

                  <li className="flex items-start gap-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-600 text-white font-mono font-bold text-xs shrink-0">
                      3
                    </span>
                    <div className="flex-1">
                      <p>
                        {isThai
                          ? 'กดยืนยันการติดตั้ง จากนั้นเปิดใช้งานแอปเต็มหน้าจอได้ทุกที่ทุกเวลา'
                          : 'Confirm install to launch the full-screen standalone application.'}
                      </p>
                    </div>
                  </li>
                </ol>
              </div>
            ) : (
              /* Desktop / Generic Instructions */
              <div className="space-y-3.5 my-4">
                <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {isThai
                    ? 'คุณสามารถติดตั้ง UNITHAI SRM ลงบนคอมพิวเตอร์หรือแท็บเล็ตของคุณได้โดยตรงผ่าน Google Chrome, Edge หรือเบราว์เซอร์ที่รองรับ'
                    : 'You can install UNITHAI SRM on your PC or Mac directly via Google Chrome, Microsoft Edge, or compatible Chromium browsers.'}
                </p>
                <div
                  className={`p-3 rounded-xl border text-xs leading-relaxed ${
                    isDark ? 'bg-slate-800/60 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <p>
                    {isThai
                      ? 'คลิกไอคอนรูปหน้าจอพร้อมลูกศรดาวน์โหลด ⊕ ที่แถบที่อยู่เว็บ (Address Bar) หรือกดเมนู (⋮) > "ติดตั้ง UNITHAI SRM"'
                      : 'Click the install icon ⊕ in your browser address bar or select Menu > "Install UNITHAI SRM".'}
                  </p>
                </div>
              </div>
            )}

            {/* Standalone benefits */}
            <div className={`pt-3 border-t mt-4 text-[11px] flex flex-col gap-1.5 ${
              isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-600'
            }`}>
              <span>✓ {isThai ? 'ทำงานแบบเต็มหน้าจอ (Standalone Mode)' : 'Full screen standalone mode'}</span>
              <span>✓ {isThai ? 'รองรับการใช้งานออฟไลน์พร้อมระบบแคช' : 'Offline caching and instant launch'}</span>
              <span>✓ {isThai ? 'เข้าถึงงานเรือและอะไหล่ได้อย่างรวดเร็ว' : 'Fast access to marine spare parts'}</span>
            </div>

            {/* Action buttons */}
            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                    : 'border-slate-300 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {isThai ? 'ปิด' : 'Close'}
              </button>
              {isInstallable && (
                <button
                  type="button"
                  onClick={async () => {
                    setShowModal(false);
                    await install();
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-600 hover:bg-cyan-500 text-white transition cursor-pointer shadow-xs"
                >
                  {isThai ? 'ติดตั้งทันที' : 'Install Now'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
