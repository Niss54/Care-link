import React, { useEffect, useState } from 'react';
import { TabType, DoctorProfile } from '../types';
import {
  LayoutDashboard,
  Users,
  Calendar,
  BarChart3,
  Settings,
  Shield,
  LogOut,
  Stethoscope,
  BookOpen,
  Moon,
  Sun
} from 'lucide-react';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  doctor: DoctorProfile;
  onSignOut: () => void;
  isOpenMobile?: boolean;
  setIsOpenMobile?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  doctor,
  onSignOut,
  isOpenMobile,
  setIsOpenMobile
}) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const mainNavItems = [
    { id: 'home' as TabType, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'patients' as TabType, label: 'Patients', icon: Users, badge: '247' },
    { id: 'calendar' as TabType, label: 'Calendar', icon: Calendar, badge: '6' },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3 }
  ];

  const subNavItems = [
    { id: 'settings' as TabType, label: 'Settings & Themes', icon: BookOpen }
  ];

  const handleSelect = (tab: TabType) => {
    setActiveTab(tab);
    if (setIsOpenMobile) setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpenMobile && setIsOpenMobile(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-64 bg-[#022448] text-white flex flex-col justify-between transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          {/* Brand Header */}
          <div className="p-6 flex items-center gap-3 border-b border-white/10">
            <div className="w-10 h-10 rounded-xl bg-[#316bf3] flex items-center justify-center text-white shadow-lg shadow-[#316bf3]/20">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
                CareLink
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-[#316bf3] text-white px-1.5 py-0.5 rounded">
                  v2.4
                </span>
              </h1>
              <p className="text-xs text-[#adc8f5]">Clinical Management</p>
            </div>
          </div>

          {/* Primary Navigation */}
          <div className="px-3 py-6">
            <p className="px-3 text-[11px] font-semibold text-[#adc8f5]/70 uppercase tracking-wider mb-2">
              Main Menu
            </p>
            <nav className="space-y-1">
              {mainNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 relative ${
                      isActive
                        ? 'bg-[#316bf3] text-white shadow-md shadow-[#316bf3]/30 font-semibold'
                        : 'text-[#adc8f5] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full -ml-3" />
                    )}
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#adc8f5]'}`} />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-white/10 text-[#adc8f5]'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            {/* Design System & System Demo Navigation */}
            <p className="px-3 text-[11px] font-semibold text-[#adc8f5]/70 uppercase tracking-wider mt-6 mb-2">
              System & Demos
            </p>
            <nav className="space-y-1">
              {subNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-[#316bf3] text-white shadow-md font-semibold'
                        : 'text-[#adc8f5] hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#adc8f5]'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              
              <button
                onClick={() => setIsDark(!isDark)}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-[#adc8f5] hover:bg-white/5 hover:text-white"
              >
                <div className="flex items-center gap-3">
                  {isDark ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  <span>Dark Mode</span>
                </div>
                <div className={`w-8 h-4 rounded-full p-0.5 transition-colors ${isDark ? 'bg-[#316bf3]' : 'bg-white/20'}`}>
                  <div className={`w-3 h-3 rounded-full bg-white transition-transform ${isDark ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Footer Profile & Signout */}
        <div className="p-4 border-t border-white/10 bg-black/10">
          <div className="flex items-center gap-3 p-2 rounded-xl">
            <div className="relative">
              <img
                src={doctor.avatarUrl}
                alt={doctor.name}
                className="w-10 h-10 rounded-full object-cover border-2 border-[#316bf3]"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#10b981] border-2 border-[#022448] rounded-full" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{doctor.name}</p>
              <p className="text-xs text-[#adc8f5] truncate">{doctor.title}</p>
            </div>
            <button
              onClick={onSignOut}
              title="Sign Out"
              className="p-1.5 text-[#adc8f5] hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
