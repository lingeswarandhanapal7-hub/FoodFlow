import React, { useState } from 'react';
import { useFoodFlow } from '../context/FoodFlowContext';
import { Bell, Award, Leaf, Utensils, User, HeartHandshake, Shield, LogOut } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentRole, 
    currentUser, 
    notifications, 
    markNotificationRead,
    donations,
    orders,
    loggedInUser,
    logout
  } = useFoodFlow();

  const [showNotifications, setShowNotifications] = useState(false);

  // Dynamic Impact Metrics
  const completedDonations = donations.filter(d => d.status === 'completed');
  const reservedPortions = orders.reduce((acc, o) => acc + o.quantity, 0);
  
  // Total weight saved is completed donations weight + reserved portions weight
  const totalWeightSaved = completedDonations.reduce((acc, d) => acc + d.weight, 0) + (reservedPortions * 0.35);
  const totalMealsSaved = completedDonations.reduce((acc, d) => acc + Math.round(d.weight / 0.35), 0) + reservedPortions;
  const totalCarbonSaved = parseFloat((totalWeightSaved * 2.5).toFixed(1));

  // Filter notifications relevant to current role
  const roleNotifications = notifications.filter(
    n => n.role === currentRole || n.role === 'all'
  );
  const unreadCount = roleNotifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b-2 border-white/80 px-6 py-3 no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brown-600 to-brown-400 flex items-center justify-center shadow-lg shadow-brown-600/20">
            <Leaf className="text-slate-950" size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white m-0 leading-none">
              FoodFlow
            </h1>
            <p className="text-[10px] font-semibold text-brown-400 tracking-wider uppercase">
              Waste Reduction Platform
            </p>
          </div>
        </div>

        {/* Global Impact Micro-ticker */}
        <div className="hidden lg:flex items-center gap-6 px-4 py-1.5 bg-slate-900/90 rounded-full border-2 border-white/80">
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Award className="text-brown-400" size={14} />
            <span className="text-slate-400">Total Meals Saved:</span>
            <span className="text-white font-semibold text-brown-400">{totalMealsSaved.toLocaleString()}</span>
          </div>
          <div className="w-px h-3 bg-slate-800" />
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <Leaf className="text-teal-400" size={14} />
            <span className="text-slate-400">CO₂ Prevented:</span>
            <span className="text-white font-semibold text-teal-400">{totalCarbonSaved} kg</span>
          </div>
        </div>

        {/* User Stats & Alert Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Notifications Trigger */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 rounded-xl bg-slate-900 border-2 border-white/80 text-slate-300 hover:text-white hover:bg-slate-800 transition-all relative"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white font-bold text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Menu */}
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-slate-900 border-2 border-white/80 rounded-2xl shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-400">Alerts & Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] text-brown-400 font-semibold">{unreadCount} New</span>
                  )}
                </div>
                <div className="max-h-64 overflow-y-auto mt-1 flex flex-col gap-1">
                  {roleNotifications.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-500">
                      No notifications for your active role.
                    </div>
                  ) : (
                    roleNotifications.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => markNotificationRead(n.id)}
                        className={`p-2.5 rounded-xl transition-all cursor-pointer text-left ${
                          n.read 
                            ? 'opacity-60 hover:opacity-100 bg-transparent' 
                            : 'bg-slate-800/40 border border-slate-700/30'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-xs font-bold text-slate-200">{n.title}</span>
                          <span className="text-[9px] text-slate-500 whitespace-nowrap">{n.timestamp}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                          {n.message}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-900 border-2 border-white/80 rounded-xl">
            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700/50 flex items-center justify-center flex-shrink-0">
              {currentUser.role === 'restaurant' && <Utensils size={14} className="text-brown-400" />}
              {currentUser.role === 'customer' && <User size={14} className="text-sky-400" />}
              {currentUser.role === 'ngo' && <HeartHandshake size={14} className="text-rose-400" />}
              {currentUser.role === 'admin' && <Shield size={14} className="text-violet-400" />}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-slate-200 leading-tight">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-500 font-medium capitalize">
                {currentRole === 'ngo' ? 'Verified NGO' : currentRole}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          {loggedInUser && (
            <button
              onClick={logout}
              className="p-2 bg-slate-900 hover:bg-slate-800 hover:text-rose-400 border border-slate-800 rounded-xl text-slate-400 transition-all flex items-center justify-center gap-1.5 px-3 py-1.5"
              title="Log Out"
            >
              <LogOut size={13} />
              <span className="text-[10px] font-bold hidden sm:inline">Logout</span>
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
