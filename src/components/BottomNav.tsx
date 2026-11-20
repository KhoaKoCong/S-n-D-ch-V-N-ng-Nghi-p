import React from 'react';
import { useAgri } from '../context/AgriContext';
import { Home, Newspaper, PlusCircle, FileText, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeTab, setActiveTab, isAuthenticated, openAuthModal } = useAgri();

  const navItems = [
    { key: 'home', label: 'Trang chủ', icon: Home },
    { key: 'news', label: 'Tin tức', icon: Newspaper },
    { key: 'create', label: 'Đăng bài', icon: PlusCircle, isHighlight: true },
    { key: 'transactions', label: 'Giao dịch', icon: FileText },
    { key: 'profile', label: 'Cá nhân', icon: User },
  ] as const;

  const handleNavClick = (key: (typeof navItems)[number]['key']) => {
    if (!isAuthenticated && key === 'create') {
      openAuthModal('login');
      return;
    }
    setActiveTab(key);
  };

  return (
    <nav
      aria-label="Điều hướng chính"
      className="lg:hidden shrink-0 relative z-40 w-full bg-white/98 dark:bg-slate-900/98 backdrop-blur-lg border-t border-slate-200 dark:border-slate-800 shadow-[0_-4px_18px_rgba(15,23,42,0.08)] dark:shadow-[0_-4px_18px_rgba(0,0,0,0.45)] pb-safe"
    >
      <div className="grid grid-cols-5 items-center h-[60px] max-w-lg mx-auto px-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.key;

          if ('isHighlight' in item && item.isHighlight) {
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => handleNavClick(item.key)}
                className="flex flex-col items-center justify-center -mt-4 min-h-[44px]"
              >
                <div className="w-11 h-11 rounded-full bg-emerald-700 text-white flex items-center justify-center shadow-md shadow-emerald-700/30 active:scale-95 transition-transform ring-4 ring-white dark:ring-slate-900">
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 mt-0.5 whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.key}
              type="button"
              onClick={() => handleNavClick(item.key)}
              className="flex flex-col items-center justify-center py-1 min-h-[44px] transition-colors relative"
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-7 h-0.5 rounded-full bg-emerald-700 dark:bg-emerald-400" />
              )}
              <Icon
                className={`w-[19px] h-[19px] transition-transform ${
                  isActive ? 'text-emerald-700 dark:text-emerald-400 scale-105' : 'text-slate-400 dark:text-slate-500'
                }`}
              />
              <span
                className={`text-[10px] tracking-tight mt-0.5 whitespace-nowrap ${
                  isActive ? 'font-bold text-emerald-800 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
