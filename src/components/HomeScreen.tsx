import React, { useMemo, useState } from 'react';
import { useAgri } from '../context/AgriContext';
import { IMAGES } from '../mockData';
import {
  formatVND,
  getAccountTypeInfo,
  computeExtraCostsTotal,
  getHiringModeLabel,
  computePostGrandTotal,
  formatWorkScheduleSummary,
} from '../utils/formatters';
import {
  Search,
  MapPin,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  Users,
  FileCheck2,
  Clock,
  SlidersHorizontal,
  X,
  Newspaper,
} from 'lucide-react';

export const HomeScreen: React.FC = () => {
  const {
    categories,
    posts,
    applications,
    transactions,
    applyForDemandPost,
    setActiveTab,
    setSelectedPost,
    setPendingTransactionFocus,
    setEditingPost,
    deletePost,
    currentUser,
    isAuthenticated,
    openAuthModal,
    setShowWalletModal,
  } = useAgri();

  const openPostProgress = (postId: string, txnId?: string) => {
    setPendingTransactionFocus({ postId, txnId });
    setActiveTab('transactions');
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [quickToast, setQuickToast] = useState<{ postId: string; text: string; ok: boolean } | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedCatId, setSelectedCatId] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'demand' | 'supply'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'price_asc' | 'nearest'>('newest');
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);

  const availableProvinces = useMemo(() => {
    const base = ['An Giang', 'Đồng Tháp', 'Cần Thơ', 'Kiên Giang', 'Long An', 'Sóc Trăng', 'Tiền Giang'];
    const fromPosts = posts.map((p) => p.province).filter(Boolean);
    return Array.from(new Set([...base, ...fromPosts]));
  }, [posts]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedProvince !== 'all' ||
    selectedCatId !== 'all' ||
    filterType !== 'all';

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedProvince('all');
    setSelectedCatId('all');
    setFilterType('all');
    setSortBy('newest');
  };

  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = posts.filter((post) => {
      const matchesSearch =
        !q ||
        post.title.toLowerCase().includes(q) ||
        post.categoryName.toLowerCase().includes(q) ||
        post.description.toLowerCase().includes(q) ||
        post.province.toLowerCase().includes(q) ||
        post.district.toLowerCase().includes(q);

      const matchesProvince = selectedProvince === 'all' || post.province === selectedProvince;
      const matchesCat =
        selectedCatId === 'all' ||
        post.categoryId === selectedCatId ||
        Boolean(post.jointVentureTasks?.some((t) => t.categoryId === selectedCatId));
      const matchesType = filterType === 'all' || post.type === filterType;

      return matchesSearch && matchesProvince && matchesCat && matchesType;
    });

    if (sortBy === 'price_asc') {
      return [...list].sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'nearest') {
      return [...list].sort((a, b) => (a.distanceKm ?? 25) - (b.distanceKm ?? 25));
    }
    return list;
  }, [posts, searchQuery, selectedProvince, selectedCatId, filterType, sortBy]);

  return (
    <div className="space-y-6 pb-24">
      {/* Compact Hero Banner */}
      <section className="relative rounded-3xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800">
        <img
          src={IMAGES.hero}
          alt="Nông nghiệp công nghệ cao Mekong"
          className="w-full h-52 sm:h-64 object-cover opacity-80"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/15 flex flex-col justify-end p-5 sm:p-8 text-white">
          <div className="max-w-2xl space-y-2.5">
            <p className="text-xs font-bold tracking-wide text-emerald-300">
              Cơ giới hóa nông nghiệp · Phun Drone · Máy gặt · Thu mua nông sản
            </p>
            <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight leading-tight text-white">
              Kết Nối Nông Dân & Nhà Cung Cấp Dịch Vụ Ruộng Đồng
            </h1>
            <div className="pt-1.5 grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5">
              <button
                type="button"
                onClick={() => {
                  if (!isAuthenticated) {
                    openAuthModal('login');
                    return;
                  }
                  setActiveTab('create');
                }}
                className="min-h-[40px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] sm:text-sm transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <span className="truncate">Đăng nhu cầu ngay</span>
                <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('news')}
                className="min-h-[40px] px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-[11px] sm:text-sm backdrop-blur-sm transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Newspaper className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">Tin mùa màng</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Unified Compact Search & Filter Console */}
      <section className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3.5">
        {/* Row 1: Search Input + Province + Sort */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          <div className="md:col-span-6 relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh dịch vụ, máy móc, khu vực (Drone, máy gặt, An Giang...)"
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 dark:text-white"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Xóa từ khóa"
                className="absolute right-2.5 top-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="md:col-span-3 relative flex items-center">
            <MapPin className="w-4 h-4 text-emerald-700 dark:text-emerald-400 absolute left-3 pointer-events-none" />
            <select
              value={selectedProvince}
              onChange={(e) => setSelectedProvince(e.target.value)}
              aria-label="Lọc theo tỉnh thành"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="all">Tất cả Tỉnh / Thành</option>
              {availableProvinces.map((prov) => (
                <option key={prov} value={prov}>
                  {prov}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3 relative flex items-center">
            <SlidersHorizontal className="w-4 h-4 text-slate-500 absolute left-3 pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'price_asc' | 'nearest')}
              aria-label="Sắp xếp kết quả"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs sm:text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
            >
              <option value="newest">Sắp xếp: Mới nhất</option>
              <option value="price_asc">Đơn giá: Thấp → Cao</option>
              <option value="nearest">Khoảng cách: Gần nhất</option>
            </select>
          </div>
        </div>

        {/* Row 2: Type Segmented Filter + Category Drawer Toggle + Result Counter */}
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="grid grid-cols-3 sm:inline-flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`min-h-[36px] px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-colors text-center truncate ${
                filterType === 'all'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Tất cả ({posts.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('demand')}
              className={`min-h-[36px] px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-colors text-center truncate ${
                filterType === 'demand'
                  ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-950 dark:text-amber-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Cần thuê
            </button>
            <button
              type="button"
              onClick={() => setFilterType('supply')}
              className={`min-h-[36px] px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-colors text-center truncate ${
                filterType === 'supply'
                  ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-950 dark:text-emerald-200 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Cung cấp
            </button>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowAllCategories((prev) => !prev)}
              className="min-h-[36px] px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-700 dark:text-slate-200 text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-colors whitespace-nowrap"
            >
              <span>Danh mục ({categories.length})</span>
              {showAllCategories ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="min-h-[36px] px-2.5 py-1.5 rounded-lg text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] sm:text-xs font-bold whitespace-nowrap"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        </div>

        {/* Row 3: Quick Horizontal Category Strip (always compact) OR Full Grid when toggled */}
        {!showAllCategories ? (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setSelectedCatId('all')}
              className={`min-h-[34px] px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold border transition-colors whitespace-nowrap shrink-0 ${
                selectedCatId === 'all'
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
              }`}
            >
              Tất cả dịch vụ
            </button>
            {categories.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCatId(isSelected ? 'all' : cat.id)}
                  className={`min-h-[34px] px-2.5 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold border transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 pt-1 animate-fade-in">
            {categories.map((cat) => {
              const isSelected = selectedCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCatId(isSelected ? 'all' : cat.id)}
                  className={`p-3 rounded-xl text-left border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700 hover:border-emerald-500 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="text-xl mb-1.5">{cat.icon}</div>
                  <div>
                    <h4 className="font-bold text-xs leading-tight line-clamp-2">{cat.name}</h4>
                    <p
                      className={`text-[10px] mt-1 font-mono tabular-nums line-clamp-1 ${
                        isSelected ? 'text-emerald-100' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      Từ {formatVND(cat.defaultPrice)}/{cat.defaultUnit}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Main Listings Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            Tin Đăng Dịch Vụ ({filteredPosts.length})
          </h2>
          <button
            type="button"
            onClick={() => {
              if (!isAuthenticated) {
                openAuthModal('login');
                return;
              }
              setActiveTab('create');
            }}
            className="text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:underline whitespace-nowrap"
          >
            + Đăng tin mới
          </button>
        </div>

        {filteredPosts.length === 0 ? (
          <div className="p-10 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">
              Không tìm thấy bài đăng phù hợp
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Hãy thử đổi từ khóa, chọn tỉnh khác hoặc đặt lại bộ lọc để xem toàn bộ dịch vụ hiện có.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
            >
              Đặt lại bộ lọc
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPosts.map((post) => {
              const isDemand = post.type === 'demand';
              const isAuthor = isAuthenticated && currentUser.id === post.authorId;
              const isAdmin = isAuthenticated && currentUser.role === 'admin';
              const canDelete = isAuthor || isAdmin;
              const authorInfo = getAccountTypeInfo({
                role: post.authorRole,
                accountType: post.authorAccountType,
                customAccountLabel: post.authorAccountLabel,
              });

              const postApps = applications.filter((a) => a.postId === post.id);
              const waitingApps = postApps.filter((a) => a.status === 'waiting');
              const acceptedApps = postApps.filter((a) => a.status === 'accepted');
              const isJV =
                isDemand &&
                Boolean(post.isJointVenture && post.jointVentureTasks && post.jointVentureTasks.length > 0);
              const maxPartners = isJV ? Math.max(1, post.maxPartners || post.jointVentureTasks?.length || 1) : 1;
              const isMyAppAccepted =
                isAuthenticated && acceptedApps.some((a) => a.applicantId === currentUser.id);
              const isWaitlistClosed = post.status !== 'active' || acceptedApps.length >= maxPartners;
              const hasApplied =
                isAuthenticated && waitingApps.some((a) => a.applicantId === currentUser.id);
              const postTxns = transactions.filter(
                (t) => t.postId === post.id && t.status !== 'cancelled'
              );
              const myAcceptedTxn = isAuthenticated
                ? postTxns.find(
                    (t) => t.participantId === currentUser.id || t.providerId === currentUser.id
                  )
                : undefined;
              const supplyContracts = !isDemand ? postTxns : [];
              const mySupplyContracts = isAuthenticated
                ? supplyContracts.filter(
                    (t) => t.participantId === currentUser.id || t.farmerId === currentUser.id
                  )
                : [];
              const volumeVal =
                post.pricingMode === 'vehicle'
                  ? post.vehicleCount || post.areaSize || 0
                  : post.areaSize || 0;
              const extrasTotal = computeExtraCostsTotal(post.extraCosts);
              const estTotal =
                isJV || volumeVal > 0 || extrasTotal > 0 ? computePostGrandTotal(post) : null;

              return (
                <div
                  key={post.id}
                  onClick={() => setSelectedPost(post)}
                  className={`rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md flex flex-col overflow-hidden cursor-pointer group ${
                    isDemand
                      ? 'bg-amber-50/90 dark:bg-amber-950/25 border-amber-200 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-600'
                      : 'bg-emerald-50/90 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 dark:hover:border-emerald-600'
                  }`}
                >
                  {/* Image container */}
                  <div className="relative h-44 w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <img
                      src={post.imageUrl || IMAGES.droneSpray}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />

                    {(isAuthor || canDelete) && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 z-10">
                        {isAuthor && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingPost(post);
                              setActiveTab('create');
                            }}
                            className="w-8 h-8 rounded-lg bg-black/70 hover:bg-emerald-700 text-white transition-colors backdrop-blur-sm flex items-center justify-center"
                            title="Chỉnh sửa bài đăng của bạn"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(post.id);
                            }}
                            className="h-8 px-2.5 rounded-lg bg-rose-600/90 hover:bg-rose-700 text-white text-[11px] font-bold transition-colors backdrop-blur-sm flex items-center gap-1"
                            title={isAdmin && !isAuthor ? 'Xóa bài đăng (Quyền Admin)' : 'Xóa bài đăng của bạn'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Xóa</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Price overlay */}
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2 text-white">
                      <span className="text-[11px] font-bold tracking-wide text-white/95 drop-shadow-sm">
                        {isDemand ? 'Yêu cầu dịch vụ' : 'Cung cấp dịch vụ'}
                      </span>
                      <div className="px-2.5 py-1 rounded-lg bg-black/75 backdrop-blur-sm text-right">
                        <span className="text-xs font-extrabold font-mono tabular-nums text-white">
                          {isJV
                            ? `Gói ${formatVND(estTotal || post.price)}`
                            : `${formatVND(post.price)} / ${post.priceUnit.replace('₫/', '')}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                        <span
                          className={
                            isDemand
                              ? 'text-amber-800 dark:text-amber-300 font-bold'
                              : 'text-emerald-800 dark:text-emerald-300 font-bold'
                          }
                        >
                          {isJV ? `Liên doanh (${post.jointVentureTasks!.length} dịch vụ)` : post.categoryName}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>
                          {post.district}, {post.province}
                        </span>
                        {!isJV && post.hiringMode && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-700 dark:text-slate-300">
                              {getHiringModeLabel(post.hiringMode, post.type)}
                            </span>
                          </>
                        )}
                        {isJV && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-amber-800 dark:text-amber-300">
                              {acceptedApps.length}/{maxPartners} đối tác
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2 group-hover:text-emerald-800 dark:group-hover:text-emerald-300 transition-colors">
                        {post.title}
                      </h3>

                      <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                        {post.description}
                      </p>
                    </div>

                    {/* Clear Price & Scale Summary Strip */}
                    <div
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs ${
                        isDemand
                          ? 'bg-amber-100/70 dark:bg-amber-900/20 border-amber-200/90 dark:border-amber-800/50'
                          : 'bg-emerald-100/70 dark:bg-emerald-900/20 border-emerald-200/90 dark:border-emerald-800/50'
                      }`}
                    >
                      <div>
                        <span className="text-[10px] text-slate-600 dark:text-slate-400 block">
                          {isJV
                            ? `Liên doanh (${post.jointVentureTasks!.length} công đoạn)`
                            : isDemand
                            ? 'Đơn giá đề xuất'
                            : 'Đơn giá dịch vụ'}
                        </span>
                        <span
                          className={`font-extrabold font-mono tabular-nums text-sm ${
                            isDemand
                              ? 'text-amber-900 dark:text-amber-200'
                              : 'text-emerald-900 dark:text-emerald-200'
                          }`}
                        >
                          {isJV
                            ? `Tuyển ${maxPartners} đối tác`
                            : `${formatVND(post.price)}/${post.priceUnit.replace('₫/', '')}`}
                        </span>
                      </div>
                      <div className="text-right">
                        {estTotal ? (
                          <>
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 block">
                              Tổng ({isJV ? 'Gói liên doanh' : volumeVal > 0 ? `${volumeVal} ${post.areaUnit}` : 'Dự kiến'}
                              {extrasTotal > 0 ? ' + vật tư' : ''})
                            </span>
                            <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                              {formatVND(estTotal)}
                            </span>
                            {extrasTotal > 0 && (
                              <span className="text-[10px] font-semibold font-mono tabular-nums text-amber-800 dark:text-amber-300 block">
                                +{formatVND(extrasTotal)} vật tư thêm
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 block">
                              {isDemand ? 'Lịch thực hiện' : 'Lịch dịch vụ'}
                            </span>
                            <span className="font-bold tabular-nums text-slate-800 dark:text-slate-200 line-clamp-1">
                              {formatWorkScheduleSummary(post)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Author & Schedule line */}
                    <div className="flex items-center justify-between gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                          {post.authorName}
                        </span>
                        {post.authorVerified && <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{authorInfo.shortLabel}</span>
                      </div>
                      <span
                        className="shrink-0 tabular-nums truncate max-w-[165px] text-right"
                        title={formatWorkScheduleSummary(post)}
                      >
                        {formatWorkScheduleSummary(post)}
                      </span>
                    </div>

                    {quickToast && quickToast.postId === post.id && (
                      <div
                        className={`p-2 rounded-lg text-[11px] font-bold ${
                          quickToast.ok ? 'bg-emerald-700 text-white' : 'bg-rose-600 text-white'
                        }`}
                      >
                        {quickToast.text}
                      </div>
                    )}

                    {/* Primary Action Row */}
                    <div
                      className="pt-2 border-t border-black/5 dark:border-white/10 flex items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {isDemand ? (
                        isAuthor ? (
                          <div className="flex-1 min-w-0 flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                if (isWaitlistClosed) {
                                  openPostProgress(post.id, postTxns[0]?.id);
                                } else {
                                  setSelectedPost(post);
                                }
                              }}
                              className="flex-1 min-w-0 min-h-[40px] py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                            >
                              <Users className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {!isWaitlistClosed
                                  ? isJV
                                    ? `Chọn đối tác (${acceptedApps.length}/${maxPartners} · ${waitingApps.length} chờ)`
                                    : `Chọn danh sách chờ (${waitingApps.length})`
                                  : acceptedApps.length > 0
                                  ? isJV
                                    ? `Đã chốt ${acceptedApps.length}/${maxPartners} · Tiến trình`
                                    : `Đã chốt: ${acceptedApps[0].applicantName} · Tiến trình`
                                  : 'Xem tiến trình'}
                              </span>
                            </button>
                            {!isWaitlistClosed && postTxns.length > 0 && (
                              <button
                                type="button"
                                onClick={() => openPostProgress(post.id, postTxns[0].id)}
                                className="min-h-[40px] py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs whitespace-nowrap shrink-0"
                              >
                                Tiến trình
                              </button>
                            )}
                          </div>
                        ) : isMyAppAccepted ? (
                          <button
                            type="button"
                            onClick={() => openPostProgress(post.id, myAcceptedTxn?.id)}
                            className="flex-1 min-w-0 min-h-[40px] py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5"
                          >
                            <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Đã duyệt · Mở tiến trình</span>
                          </button>
                        ) : isWaitlistClosed ? (
                          <button
                            type="button"
                            onClick={() => setSelectedPost(post)}
                            className="flex-1 min-w-0 min-h-[40px] py-2 px-3 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs truncate"
                          >
                            Đã đóng danh sách chờ
                          </button>
                        ) : hasApplied ? (
                          <button
                            type="button"
                            onClick={() => setSelectedPost(post)}
                            className="flex-1 min-w-0 min-h-[40px] py-2 px-3 rounded-xl bg-amber-200/80 dark:bg-amber-900/50 text-amber-950 dark:text-amber-200 font-bold text-xs flex items-center justify-center gap-1.5"
                          >
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Đã gửi chờ duyệt ({waitingApps.length})</span>
                          </button>
                        ) : isJV ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (!isAuthenticated) {
                                openAuthModal('login');
                                return;
                              }
                              setSelectedPost(post);
                            }}
                            className="flex-1 min-w-0 min-h-[40px] py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Chọn công đoạn ({acceptedApps.length}/{maxPartners})</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              if (!isAuthenticated) {
                                openAuthModal('login');
                                return;
                              }
                              const res = applyForDemandPost(post.id);
                              setQuickToast({ postId: post.id, text: res.message, ok: res.success });
                              setTimeout(() => setQuickToast(null), 3000);
                            }}
                            className="flex-1 min-w-0 min-h-[40px] py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Gửi yêu cầu tham gia</span>
                          </button>
                        )
                      ) : isAuthor ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (supplyContracts.length > 0) {
                              openPostProgress(post.id, supplyContracts[0].id);
                            } else {
                              setSelectedPost(post);
                            }
                          }}
                          className="flex-1 min-w-0 min-h-[40px] py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <span className="truncate">
                            {supplyContracts.length > 0
                              ? `Quản lí (${supplyContracts.length} HĐ) · Tiến trình`
                              : 'Quản lí bài cung cấp'}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        </button>
                      ) : mySupplyContracts.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => openPostProgress(post.id, mySupplyContracts[0].id)}
                          className="flex-1 min-w-0 min-h-[40px] py-2 px-3 rounded-xl bg-emerald-200/85 dark:bg-emerald-900/60 hover:bg-emerald-200 text-emerald-950 dark:text-emerald-100 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Đã tham gia ({mySupplyContracts.length} HĐ) · Tiến trình</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!isAuthenticated) {
                              openAuthModal('login');
                              return;
                            }
                            setSelectedPost(post);
                          }}
                          className="flex-1 min-w-0 min-h-[40px] py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <FileCheck2 className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Tham gia hợp đồng</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Transparent Platform Fee Banner */}
      <section className="p-4 sm:p-6 rounded-3xl bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-xl">
          <p className="text-xs font-bold text-emerald-200 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Chính Sách Minh Bạch & Tạm Giữ An Toàn</span>
          </p>
          <h3 className="text-base sm:text-xl font-bold leading-snug">
            Phí Giao Dịch Cố Định +3.000 ₫ / Mỗi Giao Dịch
          </h3>
          <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
            Mỗi giao dịch cộng thêm 3.000 ₫ phí sàn chuyển thẳng về tài khoản{' '}
            <strong>104888853717 (Huỳnh Công Khoa)</strong>. Hỗ trợ nạp ví nhanh qua Viettel Money.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (!isAuthenticated) {
              openAuthModal('login');
              return;
            }
            setShowWalletModal(true);
          }}
          className="w-full md:w-auto min-h-[42px] px-5 py-2.5 rounded-xl bg-white text-emerald-900 font-extrabold text-xs sm:text-sm hover:bg-emerald-50 transition-colors shrink-0 whitespace-nowrap text-center"
        >
          {isAuthenticated ? 'Nạp tiền tài khoản ngay' : 'Đăng nhập để nạp ví'}
        </button>
      </section>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                Xác nhận xóa bài đăng?
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Bài đăng này sẽ bị xóa vĩnh viễn khỏi sàn dịch vụ.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePost(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700"
              >
                Xóa bài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
