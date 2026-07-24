import React from 'react';
import { useFoodFlow, type Role } from '../context/FoodFlowContext';
import { Utensils, ShoppingBag, HeartHandshake, Shield } from 'lucide-react';

export const MobileNav: React.FC = () => {
  const { currentRole, setCurrentRole, notifications } = useFoodFlow();

  const roleNotifications = notifications.filter(
    (n) => n.role === currentRole || n.role === 'all'
  );
  const unreadCount = roleNotifications.filter((n) => !n.read).length;

  const navItems: { role: Role; label: string; icon: React.ReactNode }[] = [
    { role: 'restaurant', label: 'Kitchen', icon: <Utensils size={20} /> },
    { role: 'customer', label: 'Marketplace', icon: <ShoppingBag size={20} /> },
    { role: 'ngo', label: 'NGO Relief', icon: <HeartHandshake size={20} /> },
    { role: 'admin', label: 'Admin', icon: <Shield size={20} /> },
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 glass-card bg-slate-950/90 backdrop-blur-xl border-t-2 border-white/80 px-3 py-2 no-print shadow-2xl">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = currentRole === item.role;
          return (
            <button
              key={item.role}
              onClick={() => setCurrentRole(item.role)}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-xl transition-all duration-200 active:scale-95 touch-target ${
                isActive
                  ? 'text-brown-400 font-bold bg-brown-600/10 border border-brown-500/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                {item.icon}
                {isActive && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
