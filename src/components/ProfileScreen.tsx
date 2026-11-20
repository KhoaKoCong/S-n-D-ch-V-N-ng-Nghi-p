import React from 'react';
import { useAgri } from '../context/AgriContext';
import { formatVND, getAccountTypeInfo } from '../utils/formatters';
import {
  User,
  ShieldCheck,
  Star,
  FileText,
  Wallet,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
  Phone,
  MapPin,
  Sparkles,
  Edit,
  Trash2,
  ListFilter,
  RefreshCw,
  Database,
  LogIn,
  UserPlus,
  Sun,
  Moon
} from 'lucide-react';

export const ProfileScreen: React.FC = () => {
  const {
    currentUser,
    isAuthenticated,
    logoutUser,
    openAuthModal,
    allUsers,
    switchUser,
    deleteUser,
    setShowAuthModal,
    posts,
    setEditingPost,
    deletePost,
    setSelectedPost,
    providerWalletBalance,
    getUserWalletBalance,
    setShowWalletModal,
    setShowSyncModal,
    setActiveTab,
    setCurrentUserRole,
    setShowOnboarding
  } = useAgri();

  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [deleteUserModalId, setDeleteUserModalId] = React.useState<string | null>(null);
  const [isDark, setIsDark] = React.useState<boolean>(() =>
    typeof document !== 'undefined' && document.documentElement.classList.contains('dark')
  );

  const toggleDarkMode = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('agri_theme_mode', 'dark');
      } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('agri_theme_mode', 'light');
      } catch {}
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-8 sm:py-12 px-4 space-y-4">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
            <User className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Bạn đang duyệt ở Chế độ Khách
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Đăng nhập hoặc đăng ký tài khoản để quản lý hồ sơ, ví tiền, đăng bài dịch vụ và theo dõi tiến trình hợp đồng.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2.5 pt-2 sm:max-w-xs sm:mx-auto">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span>Đăng nhập</span>
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="w-full min-h-[42px] px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>Đăng ký mới</span>
            </button>
          </div>
        </div>

        {/* Guest Appearance Setting */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                Giao diện Sáng / Tối
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Đang dùng chế độ {isDark ? 'Tối' : 'Sáng'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={toggleDarkMode}
            role="switch"
            aria-checked={isDark}
            aria-label="Chuyển đổi chế độ Sáng và Tối"
            className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
              isDark ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>
    );
  }

  const myPosts = posts.filter(p => p.authorId === currentUser.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-24 h-24 rounded-full object-cover border-4 border-emerald-600 shadow-md"
          />

          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                {currentUser.name}
              </h1>
              {currentUser.verified && (
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              )}
            </div>

            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-wider">
              {getAccountTypeInfo(currentUser).fullLabel}
            </p>

            <div className="flex items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                {currentUser.district}, {currentUser.province}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1 text-amber-500 font-bold">
                <Star className="w-3.5 h-3.5 fill-amber-500" />
                {currentUser.rating} ({currentUser.reviewCount} đánh giá)
              </span>
            </div>

            {/* Quick sync & edit buttons */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center sm:justify-start gap-2 pt-2.5 w-full">
              <button
                type="button"
                onClick={() => setShowSyncModal(true)}
                className="col-span-2 sm:col-span-1 min-h-[38px] px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs whitespace-nowrap"
              >
                <Edit className="w-3.5 h-3.5 shrink-0" />
                <span>Sửa thông tin & Đồng bộ</span>
              </button>

              <button
                type="button"
                onClick={() => setShowSyncModal(true)}
                className="min-h-[38px] px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs whitespace-nowrap"
              >
                <RefreshCw className="w-3.5 h-3.5 shrink-0" />
                <span>Đồng bộ</span>
              </button>

              <button
                type="button"
                onClick={() => logoutUser()}
                className="min-h-[38px] px-3 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <LogOut className="w-3.5 h-3.5 shrink-0" />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>

        {/* Machine info for provider */}
        {currentUser.role === 'provider' && currentUser.machineryType && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <p className="font-bold text-slate-900 dark:text-white">Thiết bị & Năng lực phục vụ:</p>
            <p className="text-slate-600 dark:text-slate-300">⚙️ {currentUser.machineryType}</p>
            <p className="text-slate-600 dark:text-slate-300">⚡ Công suất: {currentUser.capacity} | Bán kính: {currentUser.serviceRadiusKm} km</p>
          </div>
        )}

        {/* Quick Wallet Row (visible for ALL accounts) */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 uppercase font-semibold">Số dư ví sàn hiện có:</span>
            <p className="text-xl sm:text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 tabular-nums">
              {formatVND(providerWalletBalance)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowWalletModal(true)}
            className="w-full sm:w-auto min-h-[40px] px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs shrink-0 text-center"
          >
            + Nạp tiền ngay
          </button>
        </div>
      </div>

      {/* Account Menu Items */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 shadow-sm overflow-hidden text-sm">
        
        <button
          type="button"
          onClick={() => setActiveTab('transactions')}
          className="w-full px-4 py-3.5 min-h-[52px] flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-800 dark:text-slate-200 text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-xs sm:text-sm truncate">Hợp đồng & Lịch sử giao dịch của tôi</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('create')}
          className="w-full px-4 py-3.5 min-h-[52px] flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-800 dark:text-slate-200 text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-xs sm:text-sm truncate">Đăng nhu cầu / Đăng dịch vụ mới</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => setShowWalletModal(true)}
          className="w-full px-4 py-3.5 min-h-[52px] flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-800 dark:text-slate-200 text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <Wallet className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-xs sm:text-sm truncate">Ví tài khoản & Nạp tiền Viettel Money</span>
          </div>
          <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums shrink-0">
            {formatVND(providerWalletBalance)}
          </span>
        </button>

        <button
          type="button"
          onClick={toggleDarkMode}
          className="w-full px-4 py-3.5 min-h-[56px] flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-800 dark:text-slate-200 text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400 shrink-0" />
            ) : (
              <Moon className="w-5 h-5 text-slate-600 dark:text-slate-300 shrink-0" />
            )}
            <div className="text-left min-w-0">
              <span className="font-semibold text-xs sm:text-sm block">
                Chế độ giao diện Sáng / Tối
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                Đang bật: {isDark ? 'Giao diện Tối' : 'Giao diện Sáng'}
              </span>
            </div>
          </div>
          <span
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
              isDark ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                isDark ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowOnboarding(true)}
          className="w-full px-4 py-3.5 min-h-[52px] flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-800 dark:text-slate-200 text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <HelpCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-semibold text-xs sm:text-sm truncate">Hướng dẫn & Giới thiệu ứng dụng (4 bước)</span>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => setShowSyncModal(true)}
          className="w-full px-4 py-3.5 min-h-[56px] flex items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-800 dark:text-slate-200 text-left"
        >
          <div className="flex items-center gap-3 min-w-0">
            <RefreshCw className="w-5 h-5 text-blue-600 shrink-0" />
            <div className="text-left min-w-0">
              <span className="font-semibold text-xs sm:text-sm block text-blue-900 dark:text-blue-300">
                Trung tâm đồng bộ & Khôi phục dữ liệu
              </span>
              <span className="text-[11px] text-slate-500 block leading-snug">
                Đồng bộ thông tin tài khoản với bài đăng hoặc khôi phục lại dữ liệu gốc ban đầu
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </button>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
              Danh sách tài khoản ({allUsers.length}):
            </span>
            <button
              type="button"
              onClick={() => setShowAuthModal(true)}
              className="min-h-[34px] px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 flex items-center gap-1 whitespace-nowrap"
            >
              <span>+ Tạo / Đổi tài khoản</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allUsers.map((u) => {
              const isCurrent = u.id === currentUser.id;
              const accInfo = getAccountTypeInfo(u);
              const bal = getUserWalletBalance(u.id);
              return (
                <div
                  key={u.id}
                  className={`p-2.5 rounded-2xl flex items-center justify-between border transition-all ${
                    isCurrent
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm font-bold'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200'
                  }`}
                >
                  <div
                    onClick={() => switchUser(u.id)}
                    className="flex items-center gap-2 truncate cursor-pointer flex-1 mr-2"
                  >
                    <img
                      src={u.avatarUrl}
                      alt={u.name}
                      className="w-8 h-8 rounded-full object-cover shrink-0 border border-white/40"
                    />
                    <div className="truncate">
                      <p className="text-xs font-bold truncate leading-tight">{u.name}</p>
                      <p className={`text-[10px] truncate ${isCurrent ? 'text-emerald-100' : 'text-slate-500'}`}>
                        {accInfo.icon} {accInfo.shortLabel} · <strong className="tabular-nums">{formatVND(bal)}</strong>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCurrent && (
                      <span className="px-2 py-0.5 rounded text-[9px] bg-white/20 text-white font-extrabold uppercase">
                        Đang dùng
                      </span>
                    )}

                    {/* Delete account button (allowed if more than 1 user exists) */}
                    {allUsers.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteUserModalId(u.id);
                        }}
                        className={`w-8 h-8 rounded-lg transition-colors flex items-center justify-center shrink-0 ${
                          isCurrent
                            ? 'bg-black/30 hover:bg-rose-600 text-white'
                            : 'hover:bg-rose-50 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600'
                        }`}
                        title="Xóa tài khoản này"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Danh sách bài đăng của tôi (Quản lý, Chỉnh sửa & Xóa) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-emerald-600" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
              Bài Đăng Của Tôi ({myPosts.length})
            </h3>
          </div>
          <button
            onClick={() => {
              setEditingPost(null);
              setActiveTab('create');
            }}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>+ Đăng bài mới</span>
          </button>
        </div>

        {myPosts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Bạn chưa có bài đăng nào. Bấm "+ Đăng bài mới" để tạo nhu cầu hoặc dịch vụ.
          </div>
        ) : (
          <div className="space-y-3">
            {myPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div
                  onClick={() => setSelectedPost(post)}
                  className="space-y-1 cursor-pointer flex-1"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
                        post.type === 'demand'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      }`}
                    >
                      {post.type === 'demand' ? '🌾 Nhu Cầu' : '🚁 Dịch Vụ'}
                    </span>
                    <span className="text-slate-500 font-medium">{post.categoryName}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 hover:text-emerald-600">
                    {post.title}
                  </h4>
                  <p className="text-emerald-700 dark:text-emerald-400 font-bold tabular-nums">
                    {formatVND(post.price)} / {post.priceUnit.replace('₫/', '')}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:flex items-center gap-2 w-full sm:w-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(post);
                      setActiveTab('create');
                    }}
                    className="min-h-[38px] px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 font-bold flex items-center justify-center gap-1.5 transition-colors border border-emerald-300 dark:border-emerald-700 whitespace-nowrap"
                    title="Chỉnh sửa bài đăng"
                  >
                    <Edit className="w-3.5 h-3.5 shrink-0" />
                    <span>Sửa</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteId(post.id)}
                    className="min-h-[38px] px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm whitespace-nowrap"
                    title="Xóa bài đăng"
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Xóa bài</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Modal in Profile */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Xác nhận xóa bài đăng?</h4>
              <p className="text-xs text-slate-500 mt-1">Bài đăng này sẽ bị xóa khỏi sàn dịch vụ nông nghiệp.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePost(deleteId);
                  setDeleteId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                Xóa bài
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Modal in Profile */}
      {deleteUserModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Xác nhận xóa tài khoản?</h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tài khoản <strong>"{allUsers.find(u => u.id === deleteUserModalId)?.name}"</strong> và toàn bộ các bài đăng của tài khoản này trên trang chủ sàn sẽ bị xóa vĩnh viễn.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteUserModalId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteUser(deleteUserModalId);
                  setDeleteUserModalId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
