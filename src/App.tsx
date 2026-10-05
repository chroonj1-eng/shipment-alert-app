import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthView } from './components/AuthView';
import { Navbar, NavTab } from './components/Navbar';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminUserManagement } from './components/AdminUserManagement';
import { AdminJobManagement } from './components/AdminJobManagement';
import { SRMDashboard } from './components/SRMDashboard';
import { ShipmentsList } from './components/ShipmentsList';
import { MarineSparePartsTracker } from './components/MarineSparePartsTracker';
import { OfflineIndicator } from './components/OfflineIndicator';

const MainAppContent: React.FC = () => {
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const { currentUser, loading, isAdmin, isSRM, authMessage, clearAuthMessage } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavTab>('dashboard');

  // Loading Screen
  if (loading) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center transition-colors ${
          isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
        }`}
      >
        <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-sm font-semibold tracking-tight">{t.loading}</p>
        <span className="text-xs text-slate-400 font-mono mt-1">{t.appSubtitle}</span>
      </div>
    );
  }

  // Not Logged In -> Show Auth View (Login / Register / Forgot Password)
  if (!currentUser) {
    return <AuthView />;
  }

  // Ensure SRM cannot view Admin tabs
  const activeTab: NavTab = !isAdmin && (currentTab === 'users' || currentTab === 'jobs')
    ? 'dashboard'
    : currentTab;

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-200 ${
        isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'
      }`}
    >
      {/* Role-Aware Sticky Navbar with Dark/Bright Switch, Language Toggle & Database status */}
      <Navbar currentTab={activeTab} onSelectTab={setCurrentTab} />

      {/* Auth Callback Notification Banner (e.g. Email verified and automatically logged in) */}
      {authMessage && (
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center justify-between shadow-md transition-all ${
              authMessage.type === 'error'
                ? 'bg-red-500/15 border-red-500/40 text-red-700 dark:text-red-300'
                : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold">{authMessage.title || 'System Notification'}:</span>
              <span>{authMessage.message}</span>
            </div>
            <button
              onClick={clearAuthMessage}
              className="p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 text-xs font-bold cursor-pointer ml-3"
              title="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ADMIN VIEWS */}
        {isAdmin && (
          <>
            {activeTab === 'dashboard' && (
              <AdminDashboard
                onNavigateToUsers={() => setCurrentTab('users')}
                onNavigateToJobs={() => setCurrentTab('jobs')}
                onNavigateToShipments={() => setCurrentTab('shipments')}
              />
            )}
            {activeTab === 'parts' && <MarineSparePartsTracker />}
            {activeTab === 'users' && <AdminUserManagement />}
            {activeTab === 'jobs' && <AdminJobManagement />}
            {activeTab === 'shipments' && <ShipmentsList />}
          </>
        )}

        {/* SRM / ENGINEER / USER VIEWS */}
        {!isAdmin && (
          <>
            {activeTab === 'dashboard' && <SRMDashboard />}
            {activeTab === 'parts' && <MarineSparePartsTracker />}
            {activeTab === 'shipments' && <ShipmentsList />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer
        className={`py-4 border-t text-center text-xs transition-colors ${
          isDark ? 'border-slate-800/60 text-slate-400' : 'border-slate-200 text-slate-500'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>UNITHAI SHIPYARD & ENGINEERING LIMITED • Laem Chabang Deep Sea Port, Thailand</span>
          <span className="font-mono text-[11px]">
            Supabase PostgreSQL • RLS Enabled • Mode: {isDark ? 'DARK' : 'BRIGHT'}
          </span>
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <MainAppContent />
          <OfflineIndicator />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
