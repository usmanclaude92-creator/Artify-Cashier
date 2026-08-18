import React from 'react';
import { useCashier } from '../context/CashierContext';
import { LayoutDashboard, History, Send, UserCheck, Plus } from 'lucide-react';
import { ScreenType } from '../types';

export const BottomNavBar: React.FC = () => {
  const { currentScreen, navigateTo, openTransactionsForActiveProject, fundRequests } = useCashier();

  // Screen matches
  const isDashboard = currentScreen === 'dashboard';
  const isHistory = currentScreen === 'history';
  const isRequests = currentScreen === 'requests';
  const isProfile = currentScreen === 'profile';

  const pendingRequestsCount = fundRequests.filter(r => r.status === 'pending').length;
  const openTxCount = openTransactionsForActiveProject.length;

  const navItems: { id: ScreenType; label: string; icon: React.ReactNode; badge?: number; dot?: boolean }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      badge: openTxCount > 0 ? openTxCount : undefined
    },
    {
      id: 'history',
      label: 'History',
      icon: <History className="w-5 h-5" />,
    },
    {
      id: 'requests',
      label: 'Requests',
      icon: <Send className="w-5 h-5" />,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : undefined
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: <UserCheck className="w-5 h-5" />,
    }
  ];

  return (
    <div className="sticky bottom-0 left-0 right-0 z-40 bg-slate-900/95 border-t border-slate-800/80 backdrop-blur-lg px-2 py-1.5 flex items-center justify-around shadow-2xl">
      {navItems.map((item) => {
        const isActive = 
          (item.id === 'dashboard' && isDashboard) ||
          (item.id === 'history' && isHistory) ||
          (item.id === 'requests' && isRequests) ||
          (item.id === 'profile' && isProfile);

        return (
          <button
            key={item.id}
            onClick={() => navigateTo(item.id)}
            className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-200 ${
              isActive 
                ? 'text-emerald-400 font-semibold' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            {/* Active Pill background */}
            {isActive && (
              <span className="absolute inset-0 bg-emerald-500/10 rounded-xl -z-10 border border-emerald-500/20" />
            )}

            <div className="relative">
              {item.icon}
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1.5 -right-2.5 bg-emerald-500 text-slate-950 font-extrabold text-[10px] w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-pulse">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
};
