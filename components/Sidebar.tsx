
import React from 'react';
import { LayoutDashboard, Package, Users, Receipt, FileText, X, TrendingUp, Shield, LogOut, Settings as SettingsIcon, BookOpen, Server } from 'lucide-react';
import { User, AppSettings } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (isOpen: boolean) => void;
  currentUser: User | null;
  onLogout: () => void;
  settings: AppSettings;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isMobileOpen, setIsMobileOpen, currentUser, onLogout, settings }) => {
  
  const getThemeColors = () => 'bg-slate-900';
  const getActiveColor = () => 'bg-orange-600 text-white';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'revenue', label: 'Revenue', icon: <TrendingUp size={20} /> },
    { id: 'credit', label: 'Credit Book (Udhaar)', icon: <BookOpen size={20} /> },
    { id: 'inventory', label: 'Inventory', icon: <Package size={20} /> },
    { id: 'customers', label: 'Customers', icon: <Users size={20} /> },
    { id: 'rentals', label: 'Rentals', icon: <Receipt size={20} /> },
    { id: 'invoices', label: 'Invoice History', icon: <FileText size={20} /> },
    { id: 'users', label: 'User Management', icon: <Shield size={20} /> },
    { id: 'settings', label: 'Settings', icon: <SettingsIcon size={20} /> },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-30
        w-64 text-white transform transition-transform duration-300 ease-in-out
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col h-full
        ${getThemeColors()}
      `}>
        {/* Logo Area */}
        <div className="p-6 flex items-center justify-between border-b border-white/10">
          <div className="flex items-center gap-3">
            {settings.logoUrl && (
              <img src={settings.logoUrl} alt="Logo" className="w-8 h-8 rounded object-cover bg-white" />
            )}
            <div>
              <h1 className="text-lg font-bold leading-tight">{settings.storeName}</h1>
              <p className="text-[10px] opacity-70 uppercase tracking-widest">{settings.tagline}</p>
            </div>
          </div>
          <button 
            onClick={() => setIsMobileOpen(false)} 
            className="lg:hidden text-white hover:text-orange-500"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`
                w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200
                ${activeTab === item.id 
                  ? `${getActiveColor()} shadow-lg` 
                  : 'text-slate-300 hover:bg-white/10 hover:text-white'}
              `}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Server Status */}
        <div className="px-6 py-2 text-[10px] text-slate-500 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>CPANEL SERVER ACTIVE</span>
        </div>

        {/* User Profile / Footer */}
        <div className="p-4 bg-black/20 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold overflow-hidden">
                {currentUser?.photo ? (
                  <img src={currentUser.photo} className="w-full h-full object-cover" alt="User" />
                ) : (
                  currentUser?.name.substring(0, 2).toUpperCase()
                )}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-semibold truncate w-24">{currentUser?.name}</p>
                <p className="text-xs opacity-70">{currentUser?.role}</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="text-white/70 hover:text-white transition"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
