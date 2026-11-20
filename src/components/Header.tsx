import React, { useState, useRef, useEffect } from 'react';
import { useAgri } from '../context/AgriContext';
import {
  Bell,
  Wallet,
  UserPlus,
  LogIn,
  LogOut,
  RefreshCw,
  User as UserIcon,
  ChevronDown,
  ChevronRight,
  X,
} from 'lucide-react';
import { formatVND, formatDateTimeVN, getAccountTypeInfo } from '../utils/formatters';
import { AgriNotification } from '../types';

export const Header: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    allUsers,
    switchUser,
    logoutUser,
    openAuthModal,
    providerWalletBalance,
    getUserWalletBalance,
    setShowWalletModal,
    setShowSyncModal,
    notifications,
    markNotificationAsRead,
    markAllNotificationsReadForCurrentUser,
    posts,
    transactions,
    setSelectedPost,
    setSelectedChatTxnId,
    setPendingTransactionFocus,
    setActiveTab,
    activeTab,
  } = useAgri();

  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement | null>(null);
  const notifMenuRef = useRef<HTMLDivElement | null>(null);
  const showNotifMenuRef = useRef(false);
  showNotifMenuRef.current = showNotifMenu;

  const closeNotifMenu = () => {
    if (showNotifMenuRef.current) {
      markAllNotificationsReadForCurrentUser();
    }
    setShowNotifMenu(false);
  };

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setShowRoleMenu(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        if (showNotifMenuRef.current) {
          markAllNotificationsReadForCurrentUser();
          setShowNotifMenu(false);
        }
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [currentUser.id]);


  const userNotifs = isAuthenticated
    ? [...notifications]
        .filter((n) => !n.userId || n.userId === currentUser.id)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    : [];

  const unreadNotifs = userNotifs.filter((n) => !n.read).length;

  const handleNotificationClick = (n: AgriNotification) => {
    markNotificationAsRead(n.id);
    setShowNotifMenu(false);

    if (n.openWallet || n.type === 'wallet') {
      if (n.targetTab === 'admin' && currentUser.role === 'admin') {
        setActiveTab('admin');
      } else if (n.targetTab === 'transactions' && (n.targetPostId || n.targetTxnId)) {
        setPendingTransactionFocus({ postId: n.targetPostId, txnId: n.targetTxnId });
        setActiveTab('transactions');
      }
      setShowWalletModal(true);
      return;
    }

    if (n.type === 'chat') {
      if (n.targetPostId || n.targetTxnId) {
        setPendingTransactionFocus({ postId: n.targetPostId, txnId: n.targetTxnId });
      }
      setActiveTab('transactions');
      if (n.targetTxnId) {
        setSelectedChatTxnId(n.targetTxnId);
      }
      return;
    }

    if (n.targetTab === 'transactions' || n.type === 'contract') {
      const targetTxn = n.targetTxnId
        ? transactions.find((t) => t.id === n.targetTxnId)
        : n.targetPostId
        ? transactions.find((t) => t.postId === n.targetPostId)
        : undefined;
      if (targetTxn || n.targetPostId || n.targetTxnId) {
        setPendingTransactionFocus({
          postId: n.targetPostId || targetTxn?.postId,
          txnId: n.targetTxnId || targetTxn?.id,
        });
      }
      setActiveTab('transactions');
      return;
    }

    if (n.targetPostId) {
      const foundPost = posts.find((p) => p.id === n.targetPostId);
      setActiveTab('home');
      if (foundPost) {
        setSelectedPost(foundPost);
      }
      return;
    }

    if (n.targetTab) {
      if (n.targetTab === 'admin' && currentUser.role !== 'admin') {
        setActiveTab('home');
      } else {
        setActiveTab(n.targetTab);
      }
      return;
    }

    setActiveTab('home');
  };

  return (
    <header className="shrink-0 sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Zone 1: Brand */}
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer min-w-0 text-left min-h-[38px]"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center text-white shadow-sm shrink-0">
            <span className="text-base sm:text-lg">🌾</span>
          </div>
          <span className="text-[13px] sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-white truncate">
            Sàn Nông Nghiệp
          </span>
        </button>

        {/* Zone 2: Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => setActiveTab('home')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-700 dark:hover:text-emerald-400 ${
              activeTab === 'home' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''
            }`}
          >
            Trang chủ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('news')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-700 dark:hover:text-emerald-400 ${
              activeTab === 'news' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''
            }`}
          >
            Tin tức
          </button>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('login');
                return;
              }
              setActiveTab('create');
            }}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-700 dark:hover:text-emerald-400 ${
              activeTab === 'create' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''
            }`}
          >
            Đăng tin
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('transactions')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-700 dark:hover:text-emerald-400 ${
              activeTab === 'transactions' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''
            }`}
          >
            Giao dịch
          </button>
          {isAuthenticated && currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`transition-colors whitespace-nowrap shrink-0 hover:text-emerald-700 dark:hover:text-emerald-400 ${
                activeTab === 'admin' ? 'text-emerald-700 dark:text-emerald-400 font-bold' : ''
              }`}
            >
              Quản trị
            </button>
          )}
        </nav>

        {/* Zone 3: Utilities & Top-Right Account / Guest Auth */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {isAuthenticated ? (
            <>
              {/* Wallet Quick Button */}
              <button
                type="button"
                onClick={() => setShowWalletModal(true)}
                className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 h-9 sm:h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition-colors whitespace-nowrap shrink-0"
                title="Xem ví và nạp tiền tài khoản"
              >
                <Wallet className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span className="text-[11px] sm:text-xs font-bold tabular-nums">
                  {formatVND(providerWalletBalance)}
                </span>
              </button>

              {/* Notifications Button */}
              <div className="relative" ref={notifMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    if (showNotifMenu) {
                      closeNotifMenu();
                    } else {
                      setShowNotifMenu(true);
                      setShowRoleMenu(false);
                    }
                  }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 relative transition-colors flex items-center justify-center shrink-0"
                  title="Thông báo"
                  aria-label="Thông báo"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1 right-1 min-w-4 h-4 px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                      {unreadNotifs}
                    </span>
                  )}
                </button>

                {showNotifMenu && (
                  <div className="fixed sm:absolute right-3 sm:right-0 left-3 sm:left-auto top-16 sm:top-auto sm:mt-2 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50 animate-fade-in">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 mb-2 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-bold text-slate-800 dark:text-white truncate">
                          Thông báo mới
                        </span>
                        {unreadNotifs > 0 && (
                          <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold font-mono shrink-0">
                            ({unreadNotifs} chưa đọc)
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={closeNotifMenu}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                        title="Đóng thông báo"
                        aria-label="Đóng thông báo"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto space-y-1.5 pr-0.5">
                      {userNotifs.length === 0 ? (
                        <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                          Chưa có thông báo nào cho tài khoản này.
                        </div>
                      ) : (
                        userNotifs.map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => handleNotificationClick(n)}
                            className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-start justify-between gap-2 border ${
                              n.read
                                ? 'bg-slate-50 dark:bg-slate-800/40 border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                                : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800/70 hover:bg-emerald-100/70 dark:hover:bg-emerald-950/80 text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                {!n.read && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
                                )}
                                <p className="font-bold text-slate-900 dark:text-white truncate">
                                  {n.title}
                                </p>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 leading-snug">
                                {n.message}
                              </p>
                              <p className="text-[10px] font-mono tabular-nums text-slate-400 pt-0.5">
                                {formatDateTimeVN(n.createdAt)} · Nhấn để mở trang
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Account Avatar & Instant Logout Menu */}
              <div className="relative" ref={accountMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    if (showNotifMenu) {
                      closeNotifMenu();
                    }
                    setShowRoleMenu((prev) => !prev);
                  }}
                  className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2.5 h-9 sm:h-10 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-600 bg-white dark:bg-slate-800 transition-colors"
                >
                  <img
                    src={currentUser.avatarUrl}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-emerald-500 shrink-0"
                  />
                  <div className="text-left hidden md:block max-w-[130px]">
                    <p className="text-xs font-bold text-slate-800 dark:text-white leading-tight truncate">
                      {currentUser.name}
                    </p>
                    <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                      {getAccountTypeInfo(currentUser).shortLabel}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block shrink-0" />
                </button>

                {showRoleMenu && (
                  <div className="fixed sm:absolute right-3 sm:right-0 left-3 sm:left-auto top-16 sm:top-auto sm:mt-2 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3.5 z-50 space-y-3 animate-fade-in">
                    {/* Active User Summary + Quick Profile & Logout */}
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={currentUser.avatarUrl}
                          alt={currentUser.name}
                          className="w-9 h-9 rounded-full object-cover border border-emerald-500 shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                            {currentUser.name}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            {getAccountTypeInfo(currentUser).shortLabel} · {currentUser.phone}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setShowRoleMenu(false);
                          logoutUser();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Đăng xuất</span>
                      </button>
                    </div>

                    {/* Quick Profile & Sync Row */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRoleMenu(false);
                          setActiveTab('profile');
                        }}
                        className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Hồ sơ cá nhân</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRoleMenu(false);
                          setShowSyncModal(true);
                        }}
                        className="py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-sky-600" />
                        <span>Đồng bộ dữ liệu</span>
                      </button>
                    </div>

                    {/* Quick Switch Existing Accounts */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">
                        Chuyển nhanh tài khoản đã lưu ({allUsers.length})
                      </p>
                      <div className="max-h-52 overflow-y-auto space-y-1 pr-1">
                        {allUsers.map((u) => {
                          const isCurrent = u.id === currentUser.id;
                          const accInfo = getAccountTypeInfo(u);
                          const userBal = getUserWalletBalance(u.id);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                switchUser(u.id);
                                setShowRoleMenu(false);
                              }}
                              className={`w-full p-2 rounded-xl text-left flex items-center justify-between gap-2 transition-colors ${
                                isCurrent
                                  ? 'bg-emerald-700 text-white font-bold'
                                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0 flex-1">
                                <img
                                  src={u.avatarUrl}
                                  alt={u.name}
                                  className="w-7 h-7 rounded-full object-cover shrink-0 border border-white/40"
                                />
                                <div className="min-w-0">
                                  <p className="text-xs font-bold truncate leading-tight">{u.name}</p>
                                  <p
                                    className={`text-[10px] truncate font-mono tabular-nums ${
                                      isCurrent ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'
                                    }`}
                                  >
                                    {formatVND(userBal)} · {accInfo.shortLabel}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Direct Login / Register Buttons */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setShowRoleMenu(false);
                          openAuthModal('login');
                        }}
                        className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <LogIn className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400" />
                        <span>Đăng nhập khác</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setShowRoleMenu(false);
                          openAuthModal('register');
                        }}
                        className="py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Đăng ký mới</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Guest Mode: Prominent Login & Register Controls in Top-Right */
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="px-2.5 sm:px-3.5 h-9 sm:h-10 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <LogIn className="w-3.5 h-3.5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                <span>Đăng nhập</span>
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="px-2.5 sm:px-3.5 h-9 sm:h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] sm:text-xs flex items-center gap-1 sm:gap-1.5 transition-colors shadow-xs whitespace-nowrap shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5 shrink-0" />
                <span>Đăng ký</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
