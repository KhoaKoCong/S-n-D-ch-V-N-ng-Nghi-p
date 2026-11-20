import React, { useState, useEffect } from 'react';
import {
  useAgri,
  PLATFORM_FEE,
  PLATFORM_ACCOUNT_NAME,
  PLATFORM_ACCOUNT_NUMBER,
} from '../context/AgriContext';
import {
  formatVND,
  formatDateVN,
  formatDateTimeVN,
  getAccountTypeInfo,
  computeExtraCostsTotal,
  getHiringModeLabel,
  computePostGrandTotal,
  computeJointVentureSlotBreakdown,
  formatWorkScheduleSummary,
  calculateRecurringDates,
  getRecurrenceIntervalLabel,
  getRecurrenceDurationLabel,
  computeUpfrontPayment,
  buildContractSessionDates
} from '../utils/formatters';
import {
  X,
  MapPin,
  CheckCircle,
  CheckCircle2,
  Star,
  Phone,
  ShieldCheck,
  FileCheck2,
  Clock,
  Edit,
  Trash2,
  AlertTriangle,
  Users,
  Wallet,
  Lock,
  Plus,
  Calendar,
  Repeat
} from 'lucide-react';
import { IMAGES } from '../mockData';
import { ExtraCostItem, PaymentMode } from '../types';

export const PostDetailModal: React.FC = () => {
  const {
    selectedPost,
    setSelectedPost,
    setEditingPost,
    deletePost,
    applications,
    transactions,
    applyForDemandPost,
    confirmDemandApplicant,
    joinSupplyPost,
    providerWalletBalance,
    setShowWalletModal,
    setActiveTab,
    setPendingTransactionFocus,
    currentUser,
    isAuthenticated,
    openAuthModal
  } = useAgri();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Demand waitlist states
  const [applyNote, setApplyNote] = useState('');
  const [selectedApplyTaskId, setSelectedApplyTaskId] = useState<string>('');
  const [selectedAppId, setSelectedAppId] = useState<string>('');
  const [selectedOverrideTaskId, setSelectedOverrideTaskId] = useState<string>('');

  // Supply join form states
  const [showSupplyForm, setShowSupplyForm] = useState(false);
  const [orderArea, setOrderArea] = useState<number>(selectedPost?.areaSize || 20);
  const [orderDate, setOrderDate] = useState<string>(selectedPost?.executionDate || '2026-11-18');
  const [orderTerms, setOrderTerms] = useState<string>('');
  const [joinExtraCosts, setJoinExtraCosts] = useState<ExtraCostItem[]>(selectedPost?.extraCosts || []);

  // Flexible payment configuration (shared cleanly for demand confirm & supply join)
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('full_upfront');
  const [depositPercent, setDepositPercent] = useState<number>(30);

  // Feedback message state
  const [actionResult, setActionResult] = useState<{
    success: boolean;
    message: string;
    insufficientFunds?: boolean;
    txnId?: string;
  } | null>(null);

  const resultBannerRef = React.useRef<HTMLDivElement | null>(null);
  const redirectTimerRef = React.useRef<number | null>(null);

  useEffect(() => {
    if (redirectTimerRef.current) {
      window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = null;
    }
    if (selectedPost) {
      const initVolume =
        selectedPost.pricingMode === 'vehicle'
          ? selectedPost.vehicleCount || selectedPost.areaSize || 1
          : selectedPost.areaSize || (selectedPost.areaUnit === 'kg' ? 1000 : 20);
      setOrderArea(initVolume);
      setOrderDate(selectedPost.executionDate || '2026-11-18');
      setOrderTerms('');
      setJoinExtraCosts(selectedPost.extraCosts ? selectedPost.extraCosts.map((item) => ({ ...item })) : []);
      setApplyNote('');
      setSelectedApplyTaskId(selectedPost.jointVentureTasks?.[0]?.id || '');
      setSelectedAppId('');
      setSelectedOverrideTaskId('');
      setPaymentMode('full_upfront');
      setDepositPercent(30);
      setActionResult(null);
      setShowSupplyForm(false);
      setShowDeleteConfirm(false);
    }
    return () => {
      if (redirectTimerRef.current) {
        window.clearTimeout(redirectTimerRef.current);
        redirectTimerRef.current = null;
      }
    };
  }, [selectedPost?.id]);

  if (!selectedPost) return null;

  const isDemand = selectedPost.type === 'demand';
  const isAuthor = isAuthenticated && currentUser.id === selectedPost.authorId;
  const isAdmin = isAuthenticated && currentUser.role === 'admin';
  const canDelete = isAuthor || isAdmin;

  const authorTypeInfo = getAccountTypeInfo({
    role: selectedPost.authorRole,
    accountType: selectedPost.authorAccountType,
    customAccountLabel: selectedPost.authorAccountLabel
  });

  const isJointVentureDemand =
    isDemand &&
    Boolean(selectedPost.isJointVenture && selectedPost.jointVentureTasks && selectedPost.jointVentureTasks.length > 0);
  const maxPartners = isJointVentureDemand
    ? Math.max(1, selectedPost.maxPartners || selectedPost.jointVentureTasks?.length || 1)
    : 1;

  // Demand waitlist records for this post
  const postApps = applications.filter((a) => a.postId === selectedPost.id);
  const waitingApps = postApps.filter((a) => a.status === 'waiting');
  const acceptedApps = postApps.filter((a) => a.status === 'accepted');
  const myAcceptedApp = acceptedApps.find((a) => a.applicantId === currentUser.id);
  const myWaitingApp = waitingApps.find((a) => a.applicantId === currentUser.id);
  const isMyAppAccepted = Boolean(myAcceptedApp);
  const isWaitlistClosed = selectedPost.status !== 'active' || acceptedApps.length >= maxPartners;

  // Supply contracts linked to this post
  const supplyContractsForPost = !isDemand
    ? transactions.filter(
        (t) =>
          t.postId === selectedPost.id &&
          (isAuthor || isAdmin || t.participantId === currentUser.id || t.farmerId === currentUser.id)
      )
    : [];

  // Financial calculation (base service + extra material costs)
  const postExtraCosts = selectedPost.extraCosts || [];
  const demandExtraTotal = computeExtraCostsTotal(postExtraCosts);
  const demandContractVolume =
    selectedPost.pricingMode === 'vehicle'
      ? Math.max(1, selectedPost.vehicleCount || selectedPost.areaSize || 1)
      : Math.max(1, selectedPost.areaSize || 1);
  const demandContractTotal = computePostGrandTotal(selectedPost);

  // Selected waiting applicant & per-slot escrow preview (matches AgriContext.confirmDemandApplicant)
  const selectedWaitingApp = waitingApps.find((a) => a.id === selectedAppId);
  const effectiveSlotTaskId = isJointVentureDemand
    ? selectedOverrideTaskId || selectedWaitingApp?.targetTaskId || selectedPost.jointVentureTasks?.[0]?.id
    : undefined;
  const slotEscrowBreakdown = computeJointVentureSlotBreakdown(
    selectedPost,
    effectiveSlotTaskId,
    acceptedApps.length
  );

  const joinExtraTotal = computeExtraCostsTotal(joinExtraCosts);
  const supplyBaseTotal = Math.round(Math.max(1, Number(orderArea) || 1) * selectedPost.price);
  const supplyContractTotal = supplyBaseTotal + joinExtraTotal;

  const demandSessionCount = buildContractSessionDates(selectedPost.workSchedule, selectedPost.executionDate, 12).length;
  const demandUpfrontRequired = computeUpfrontPayment(slotEscrowBreakdown.totalAmount, paymentMode, depositPercent);
  const demandUpfrontWithFee = demandUpfrontRequired + PLATFORM_FEE;
  const supplyUpfrontRequired = computeUpfrontPayment(supplyContractTotal, paymentMode, depositPercent);
  const supplyUpfrontWithFee = supplyUpfrontRequired + PLATFORM_FEE;

  const handleApplyDemand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const chosenTask = isJointVentureDemand
      ? selectedPost.jointVentureTasks?.find((t) => t.id === selectedApplyTaskId) ||
        selectedPost.jointVentureTasks?.[0]
      : undefined;
    const res = applyForDemandPost(
      selectedPost.id,
      applyNote,
      chosenTask
        ? {
            targetTaskId: chosenTask.id,
            targetTaskTitle: chosenTask.categoryName,
            proposedHiringMode: chosenTask.hiringMode
          }
        : undefined
    );
    setActionResult({ success: res.success, message: res.message });
  };

  const handleConfirmDemandSelection = () => {
    if (!selectedAppId) {
      setActionResult({
        success: false,
        message: 'Vui lòng nhấn chọn 1 người trong danh sách chờ trước khi xác nhận!'
      });
      return;
    }
    const res = confirmDemandApplicant(
      selectedPost.id,
      selectedAppId,
      isJointVentureDemand ? effectiveSlotTaskId : undefined,
      { mode: paymentMode, depositPercent }
    );
    setActionResult({
      success: res.success,
      message: res.message,
      insufficientFunds: res.insufficientFunds,
      txnId: res.txnId
    });
    if (res.success) {
      setSelectedAppId('');
      setSelectedOverrideTaskId('');
      window.setTimeout(() => resultBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    }
  };

  const handleJoinSupply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    const cleanedJoinExtras = joinExtraCosts
      .filter((item) => item.label.trim() && Number(item.amount) > 0)
      .map((item) => ({
        ...item,
        label: item.label.trim(),
        amount: Math.round(Number(item.amount))
      }));
    const res = joinSupplyPost(
      selectedPost.id,
      Number(orderArea),
      orderDate,
      orderTerms || 'Thực hiện dịch vụ đúng cam kết chất lượng và tiến độ.',
      cleanedJoinExtras,
      { mode: paymentMode, depositPercent }
    );
    if (res.success) {
      setShowSupplyForm(false);
      setActionResult({
        success: true,
        message: `${res.message} Đang chuyển sang Hợp Đồng & Tiến Độ...`,
        txnId: res.txnId
      });
      window.setTimeout(() => resultBannerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
      redirectTimerRef.current = window.setTimeout(() => {
        setPendingTransactionFocus({ postId: selectedPost.id, txnId: res.txnId });
        setSelectedPost(null);
        setActiveTab('transactions');
      }, 1600);
    } else {
      setActionResult({
        success: false,
        message: res.message,
        insufficientFunds: res.insufficientFunds
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border flex flex-col ${
          isDemand
            ? 'bg-amber-50 dark:bg-slate-900 border-amber-300 dark:border-amber-800/70'
            : 'bg-emerald-50 dark:bg-slate-900 border-emerald-300 dark:border-emerald-800/70'
        }`}
      >
        {/* Header Image */}
        <div className="relative h-56 w-full bg-slate-900 shrink-0">
          <img
            src={selectedPost.imageUrl || IMAGES.droneSpray}
            alt={selectedPost.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />

          {/* Control buttons in header - strictly permissioned */}
          <div className="absolute top-4 right-4 flex items-center gap-2 z-20">
            {isAuthor && (
              <button
                onClick={() => {
                  setEditingPost(selectedPost);
                  setSelectedPost(null);
                  setActiveTab('create');
                }}
                className="px-3 py-1.5 rounded-full bg-emerald-700/90 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md backdrop-blur-md flex items-center gap-1.5"
                title="Chỉnh sửa bài đăng của bạn"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Sửa bài</span>
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-3.5 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md backdrop-blur-md flex items-center gap-1.5"
                title={isAdmin && !isAuthor ? 'Xóa bài đăng (Quyền Admin)' : 'Xóa bài đăng của bạn'}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa bài</span>
              </button>
            )}
            <button
              onClick={() => setSelectedPost(null)}
              className="p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors backdrop-blur-md"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="absolute bottom-4 left-4 flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-extrabold shadow-md ${
                isDemand ? 'bg-amber-600 text-white' : 'bg-emerald-700 text-white'
              }`}
            >
              {isDemand ? '🌾 Yêu Cầu Dịch Vụ' : '🚁 Cung Cấp Dịch Vụ'}
            </span>
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-black/70 text-white backdrop-blur-md">
              {selectedPost.categoryName}
            </span>
          </div>
        </div>

        {/* Content Body */}
        <div
          className={`p-6 sm:p-8 space-y-6 flex-1 text-slate-800 dark:text-slate-100 ${
            isDemand
              ? 'bg-amber-50/90 dark:bg-amber-950/20'
              : 'bg-emerald-50/90 dark:bg-emerald-950/20'
          }`}
        >
          {/* Title & Pricing Summary */}
          <div
            className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b ${
              isDemand
                ? 'border-amber-200 dark:border-amber-900/60'
                : 'border-emerald-200 dark:border-emerald-900/60'
            }`}
          >
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
                {selectedPost.title}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <MapPin className={`w-4 h-4 shrink-0 ${isDemand ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`} />
                <span>{selectedPost.district}, {selectedPost.province}</span>
                <span>·</span>
                <span>{isDemand ? 'Lịch làm' : 'Lịch dịch vụ'}: {formatWorkScheduleSummary(selectedPost)}</span>
                {isJointVentureDemand ? (
                  <>
                    <span>·</span>
                    <span className="font-bold text-amber-800 dark:text-amber-300">
                      Hợp tác liên doanh ({selectedPost.jointVentureTasks!.length} dịch vụ · {acceptedApps.length}/{maxPartners} đối tác)
                    </span>
                  </>
                ) : (
                  <>
                    {(selectedPost.areaSize || selectedPost.vehicleCount) && (
                      <>
                        <span>·</span>
                        <span className="font-semibold font-mono tabular-nums">
                          Quy mô: {demandContractVolume} {selectedPost.areaUnit}
                        </span>
                      </>
                    )}
                    {selectedPost.hiringMode && (
                      <>
                        <span>·</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {getHiringModeLabel(selectedPost.hiringMode, selectedPost.type)}
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>
              {selectedPost.locationDetail && (
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  <strong>{isDemand ? 'Địa điểm cánh đồng:' : 'Địa chỉ xưởng / Bãi xe:'}</strong>{' '}
                  {selectedPost.locationDetail}
                </p>
              )}
            </div>

            <div
              className={`p-3.5 rounded-2xl border text-right shrink-0 ${
                isDemand
                  ? 'bg-amber-100/80 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800'
                  : 'bg-emerald-100/80 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800'
              }`}
            >
              {isJointVentureDemand ? (
                <>
                  <span className="text-[10px] uppercase font-bold block text-amber-800 dark:text-amber-300">
                    Tổng gói liên doanh
                  </span>
                  <p className="text-xl font-extrabold font-mono tabular-nums text-amber-950 dark:text-amber-100">
                    {formatVND(demandContractTotal)}
                  </p>
                  <span className="text-xs font-bold block text-amber-800 dark:text-amber-300">
                    {selectedPost.jointVentureTasks!.length} công đoạn · {maxPartners} đối tác
                  </span>
                  {demandExtraTotal > 0 && (
                    <p className="text-[10px] font-mono tabular-nums text-amber-800 dark:text-amber-300 mt-1">
                      (gồm +{formatVND(demandExtraTotal)} vật tư)
                    </p>
                  )}
                </>
              ) : (
                <>
                  <span
                    className={`text-[10px] uppercase font-bold block ${
                      isDemand ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-800 dark:text-emerald-300'
                    }`}
                  >
                    Đơn giá dịch vụ
                  </span>
                  <p
                    className={`text-xl font-extrabold font-mono tabular-nums ${
                      isDemand ? 'text-amber-950 dark:text-amber-100' : 'text-emerald-950 dark:text-emerald-100'
                    }`}
                  >
                    {formatVND(selectedPost.price)}
                  </p>
                  <span
                    className={`text-xs font-bold block ${
                      isDemand ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    / {selectedPost.priceUnit.replace('₫/', '')}
                  </span>
                  {(selectedPost.areaSize || selectedPost.vehicleCount || demandExtraTotal > 0) && (
                    <div className="text-[11px] font-bold font-mono tabular-nums text-slate-700 dark:text-slate-300 mt-1 pt-1 border-t border-black/10 dark:border-white/10 space-y-0.5">
                      <p>Tổng: {formatVND(demandContractTotal)}</p>
                      {demandExtraTotal > 0 && (
                        <p className="text-[10px] text-amber-800 dark:text-amber-300">
                          (gồm +{formatVND(demandExtraTotal)} vật tư)
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Author Card */}
          <div className="p-4 rounded-2xl bg-white/85 dark:bg-slate-800/75 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full text-white font-extrabold flex items-center justify-center text-lg ${
                  isDemand ? 'bg-amber-600' : 'bg-emerald-700'
                }`}
              >
                {selectedPost.authorName[0]}
              </div>
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                    {selectedPost.authorName}
                  </h4>
                  {selectedPost.authorVerified && (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                    · {authorTypeInfo.icon} {authorTypeInfo.shortLabel}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 mr-0.5" />
                    {selectedPost.authorRating || 4.9}
                  </span>
                  <span>·</span>
                  <span>{isAuthor ? 'Bài đăng của bạn' : 'Đối tác đã xác thực'}</span>
                </div>
              </div>
            </div>

            <a
              href={`tel:${selectedPost.authorPhone}`}
              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span className="font-mono">{selectedPost.authorPhone}</span>
            </a>
          </div>

          {/* Description & Technical Specs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-500 dark:text-slate-400 tracking-wider">
              Mô tả chi tiết công việc
            </h4>
            <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              {selectedPost.description}
            </p>

            {selectedPost.hiringMode && !isJointVentureDemand && (
              <div className="p-3 rounded-xl bg-white/85 dark:bg-slate-800/75 border border-slate-200 dark:border-slate-700 text-xs flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-600 dark:text-slate-300">Hình thức thuê / cung cấp:</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {getHiringModeLabel(selectedPost.hiringMode, selectedPost.type)}
                </span>
              </div>
            )}

            {isDemand && selectedPost.workSchedule && selectedPost.workSchedule.type !== 'single_day' && (
              <div className="p-3.5 rounded-xl bg-white/85 dark:bg-slate-800/80 border border-amber-200 dark:border-amber-800/60 text-xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                    {selectedPost.workSchedule.type === 'recurring' ? (
                      <Repeat className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    ) : (
                      <Calendar className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                    )}
                    <span>
                      {selectedPost.workSchedule.type === 'recurring'
                        ? 'Lịch làm việc lặp lại định kỳ'
                        : 'Danh sách các ngày làm việc'}
                    </span>
                  </span>
                  <span className="font-bold font-mono tabular-nums text-amber-800 dark:text-amber-300">
                    {formatWorkScheduleSummary(selectedPost)}
                  </span>
                </div>

                {selectedPost.workSchedule.type === 'multi_days' &&
                  selectedPost.workSchedule.selectedDates &&
                  selectedPost.workSchedule.selectedDates.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pt-0.5">
                      {selectedPost.workSchedule.selectedDates.map((d) => (
                        <span
                          key={d}
                          className="px-2 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[11px] font-bold font-mono tabular-nums text-amber-950 dark:text-amber-200"
                        >
                          {formatDateVN(d)}
                        </span>
                      ))}
                    </div>
                  )}

                {selectedPost.workSchedule.type === 'recurring' && (() => {
                  const ws = selectedPost.workSchedule!;
                  const rec = calculateRecurringDates(
                    ws.startDate || selectedPost.executionDate,
                    ws.recurrenceInterval || 'every_2_days',
                    ws.customIntervalDays || 4,
                    ws.recurrenceDuration || '1_month',
                    ws.customDurationMonths || 2
                  );
                  return (
                    <div className="space-y-2 pt-0.5">
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 dark:text-slate-300">
                        <span>
                          Tần suất:{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {getRecurrenceIntervalLabel(ws.recurrenceInterval, ws.customIntervalDays)}
                          </strong>
                        </span>
                        <span>
                          Thời hạn:{' '}
                          <strong className="text-slate-900 dark:text-white">
                            {getRecurrenceDurationLabel(ws.recurrenceDuration, ws.customDurationMonths)}
                          </strong>
                        </span>
                        <span>
                          Tổng dự kiến:{' '}
                          <strong className="font-mono tabular-nums text-amber-800 dark:text-amber-300">
                            {rec.totalCount} buổi
                          </strong>
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Các buổi đầu:</span>
                        {rec.previewDates.map((d) => (
                          <span
                            key={d}
                            className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[11px] font-bold font-mono tabular-nums text-amber-950 dark:text-amber-200"
                          >
                            {formatDateVN(d)}
                          </span>
                        ))}
                        {rec.totalCount > rec.previewDates.length && (
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            +{rec.totalCount - rec.previewDates.length} buổi nữa
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {isJointVentureDemand && selectedPost.jointVentureTasks && (
              <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-800/80 border border-amber-300 dark:border-amber-800/70 space-y-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <strong className="text-slate-900 dark:text-white">
                    Các dịch vụ & hạng mục trong gói Hợp tác liên doanh ({selectedPost.jointVentureTasks.length})
                  </strong>
                  <span className="font-bold font-mono tabular-nums text-amber-800 dark:text-amber-300">
                    Tuyển tối đa {maxPartners} đối tác ({acceptedApps.length}/{maxPartners} đã chốt)
                  </span>
                </div>
                <div className="space-y-2">
                  {selectedPost.jointVentureTasks.map((task, idx) => {
                    const taskTotal = Math.round(Math.max(1, task.areaSize || 1) * task.price);
                    const assignedPartner = acceptedApps.find((a) => a.targetTaskId === task.id);
                    return (
                      <div
                        key={task.id}
                        className="p-3 rounded-xl bg-amber-50/70 dark:bg-slate-900/70 border border-amber-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                            <span className="text-amber-700 dark:text-amber-400">#{idx + 1}</span>
                            <span>{task.categoryName}</span>
                            {task.hiringMode && (
                              <>
                                <span className="text-slate-400">·</span>
                                <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                  {getHiringModeLabel(task.hiringMode, 'demand')}
                                </span>
                              </>
                            )}
                          </div>
                          {task.note && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400">{task.note}</p>
                          )}
                          {assignedPartner && (
                            <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                              ✓ Đã giao đối tác: {assignedPartner.applicantName}
                            </p>
                          )}
                        </div>
                        <div className="text-left sm:text-right font-mono tabular-nums shrink-0">
                          <p className="font-extrabold text-slate-900 dark:text-white">
                            {formatVND(taskTotal)}
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {task.areaSize} {task.areaUnit} × {formatVND(task.price)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedPost.requirements && (
              <div className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-800/70 border border-amber-200 dark:border-amber-900/50 text-slate-800 dark:text-slate-200 text-xs space-y-1">
                <strong>Yêu cầu công việc:</strong>
                <p>{selectedPost.requirements}</p>
              </div>
            )}

            {postExtraCosts.length > 0 && (
              <div className="p-3.5 rounded-xl bg-white/85 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <strong className="text-slate-900 dark:text-white">
                    Chi phí vật tư & phụ phí kèm theo (Cộng vào hợp đồng)
                  </strong>
                  <span className="font-extrabold font-mono tabular-nums text-amber-700 dark:text-amber-400">
                    + {formatVND(demandExtraTotal)}
                  </span>
                </div>
                <div className="space-y-1 pt-1 border-t border-slate-100 dark:border-slate-700/70">
                  {postExtraCosts.map((item) => (
                    <div key={item.id} className="flex items-center justify-between text-slate-600 dark:text-slate-300">
                      <span>· {item.label}</span>
                      <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                        {formatVND(item.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPost.capacityPerDay && (
              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="p-3 bg-white/80 dark:bg-slate-800/70 rounded-xl border border-slate-200/70 dark:border-slate-700">
                  <span className="text-slate-500 dark:text-slate-400 block">Năng suất hoạt động:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPost.capacityPerDay}</span>
                </div>
                {selectedPost.equipmentCount && (
                  <div className="p-3 bg-white/80 dark:bg-slate-800/70 rounded-xl border border-slate-200/70 dark:border-slate-700">
                    <span className="text-slate-500 dark:text-slate-400 block">Số lượng thiết bị:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{selectedPost.equipmentCount} máy</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Result Notification Banner */}
          {actionResult && (
            <div
              ref={resultBannerRef}
              className={`p-4 rounded-2xl border-2 text-xs font-bold space-y-2.5 animate-fade-in shadow-sm ${
                actionResult.success
                  ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-400 dark:border-emerald-700 text-emerald-950 dark:text-emerald-100'
                  : 'bg-rose-100 dark:bg-rose-950/80 border-rose-400 dark:border-rose-700 text-rose-950 dark:text-rose-100'
              }`}
            >
              <div className="flex items-start gap-2">
                {actionResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 dark:text-emerald-400 shrink-0" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
                )}
                <p className="leading-relaxed">{actionResult.message}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-0.5">
                {actionResult.insufficientFunds && (
                  <button
                    type="button"
                    onClick={() => setShowWalletModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Nạp tiền ngay</span>
                  </button>
                )}
                {actionResult.txnId && (
                  <button
                    type="button"
                    onClick={() => {
                      if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
                      setPendingTransactionFocus({ postId: selectedPost.id, txnId: actionResult.txnId });
                      setSelectedPost(null);
                      setActiveTab('transactions');
                    }}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold shadow-xs"
                  >
                    Mở Hợp Đồng & Theo Dõi Tiến Trình Ngay
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ===================== CONTRACT WORKFLOW AREA ===================== */}
          {isDemand ? (
            /* DEMAND POST WORKFLOW: Waitlist + Single or Multi-Partner Selection + Escrow */
            <div className="space-y-4">
              {isAuthor ? (
                /* AUTHOR DEDICATED FRAME: ACCEPTED PARTNERS + WAITING APPLICANTS */
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-amber-400 dark:border-amber-700 space-y-4 shadow-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-700 dark:text-amber-400" />
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                        {isJointVentureDemand
                          ? `Quản Lý Đối Tác Liên Doanh (${acceptedApps.length}/${maxPartners} đã chọn · ${waitingApps.length} chờ)`
                          : `Danh Sách Người Đã Đăng Ký Tham Gia (${waitingApps.length} chờ duyệt)`}
                      </h4>
                    </div>
                    <span className="text-[11px] font-bold text-slate-500">
                      {isWaitlistClosed
                        ? 'Đã chốt đủ đối tác'
                        : isJointVentureDemand
                        ? `Còn ${maxPartners - acceptedApps.length} suất đối tác`
                        : 'Chọn 1 người'}
                    </span>
                  </div>

                  {/* Already Accepted Partners List */}
                  {acceptedApps.length > 0 && (
                    <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 space-y-2.5 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <span className="font-extrabold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>
                            {isJointVentureDemand
                              ? `Đối tác đã xác nhận tham gia liên doanh (${acceptedApps.length}/${maxPartners})`
                              : `Đã xác nhận đối tác: ${acceptedApps[0].applicantName}`}
                          </span>
                        </span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                          {isWaitlistClosed ? 'Đã đóng danh sách chờ' : 'Vẫn đang nhận thêm đối tác'}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {acceptedApps.map((partner) => (
                          <div
                            key={partner.id}
                            className="p-2.5 rounded-lg bg-white/80 dark:bg-slate-900/80 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between gap-2"
                          >
                            <div>
                              <span className="font-bold text-slate-900 dark:text-white">
                                {partner.applicantName}
                              </span>
                              <span className="text-slate-500 dark:text-slate-400 ml-1.5 font-mono">
                                · {partner.applicantPhone}
                              </span>
                              {partner.targetTaskTitle && (
                                <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                                  Đảm nhận: {partner.targetTaskTitle}
                                  {partner.proposedHiringMode
                                    ? ` (${getHiringModeLabel(partner.proposedHiringMode, 'demand')})`
                                    : ''}
                                </p>
                              )}
                            </div>
                            <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                              Đã tạo HĐ
                            </span>
                          </div>
                        ))}
                      </div>

                      <p className="text-slate-600 dark:text-slate-300">
                        Tiền hợp đồng đã tạm giữ theo từng suất. Người tham gia được chọn tự cập nhật tiến độ 0%–100%.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setPendingTransactionFocus({ postId: selectedPost.id });
                          setSelectedPost(null);
                          setActiveTab('transactions');
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                      >
                        Xem hợp đồng & tiến trình
                      </button>
                    </div>
                  )}

                  {/* Remaining Waitlist Selection when slots still open */}
                  {!isWaitlistClosed && (
                    waitingApps.length === 0 ? (
                      <div className="p-5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 text-center space-y-1 text-xs">
                        <p className="font-bold text-amber-950 dark:text-amber-200">
                          {acceptedApps.length > 0
                            ? `Chưa có thêm đối tác mới đăng ký cho ${maxPartners - acceptedApps.length} vị trí còn lại`
                            : 'Chưa có người đăng ký vào danh sách chờ'}
                        </p>
                        <p className="text-slate-600 dark:text-slate-400">
                          Khi có người nhấn "Gửi yêu cầu tham gia hợp đồng", tên của họ sẽ hiện tại đây để bạn chọn và xác nhận.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                          {waitingApps.map((app) => {
                            const appType = getAccountTypeInfo({
                              role: app.applicantRole,
                              accountType: app.applicantAccountType,
                              customAccountLabel: app.applicantAccountLabel
                            });
                            const isSelected = selectedAppId === app.id;
                            return (
                              <button
                                key={app.id}
                                type="button"
                                onClick={() => {
                                  setSelectedAppId(app.id);
                                  setSelectedOverrideTaskId(
                                    app.targetTaskId || selectedPost.jointVentureTasks?.[0]?.id || ''
                                  );
                                }}
                                className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-start justify-between gap-3 ${
                                  isSelected
                                    ? 'bg-amber-100/90 dark:bg-amber-950/60 border-amber-600 dark:border-amber-500 shadow-xs'
                                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 hover:border-amber-400'
                                }`}
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                                      {app.applicantName}
                                    </span>
                                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                      · {appType.icon} {appType.shortLabel}
                                    </span>
                                    <span className="text-[11px] font-bold text-amber-600 flex items-center gap-0.5">
                                      · <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {app.applicantRating || 4.8}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-300">
                                    SĐT: <span className="font-mono font-semibold">{app.applicantPhone}</span> · Đăng ký lúc {formatDateTimeVN(app.createdAt)}
                                  </p>
                                  {app.targetTaskTitle && (
                                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                                      Đăng ký công việc: {app.targetTaskTitle}
                                      {app.proposedHiringMode
                                        ? ` · ${getHiringModeLabel(app.proposedHiringMode, 'demand')}`
                                        : ''}
                                    </p>
                                  )}
                                  {app.proposedNote && (
                                    <p className="text-xs italic text-slate-700 dark:text-slate-300">
                                      "{app.proposedNote}"
                                    </p>
                                  )}
                                </div>

                                <div
                                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                                    isSelected
                                      ? 'bg-amber-600 border-amber-600 text-white'
                                      : 'border-slate-300 dark:border-slate-600'
                                  }`}
                                >
                                  {isSelected && <CheckCircle2 className="w-4 h-4" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Author optional task reassignment for Joint Venture */}
                        {isJointVentureDemand && selectedPost.jointVentureTasks && (
                          <div className="p-3 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1.5 text-xs">
                            <label className="block font-bold text-slate-800 dark:text-slate-200">
                              Công đoạn giao cho đối tác đang chọn
                            </label>
                            <select
                              value={effectiveSlotTaskId || ''}
                              onChange={(e) => setSelectedOverrideTaskId(e.target.value)}
                              className="w-full p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-xs font-bold text-slate-900 dark:text-white"
                            >
                              {selectedPost.jointVentureTasks.map((task) => (
                                <option key={task.id} value={task.id}>
                                  {task.categoryName} ({task.areaSize} {task.areaUnit} × {formatVND(task.price)} ={' '}
                                  {formatVND(Math.round(task.areaSize * task.price))})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Flexible Payment Mode Selector */}
                        <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                          <p className="font-bold text-slate-800 dark:text-slate-200">
                            Tùy chỉnh phương thức thanh toán
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            {[
                              { id: 'full_upfront' as PaymentMode, label: 'Chuyển toàn bộ (100%)', desc: 'Tạm giữ đủ giá trị' },
                              { id: 'deposit_percent' as PaymentMode, label: 'Đặt cọc theo %', desc: 'Tùy chọn % trả trước' },
                              { id: 'per_session' as PaymentMode, label: 'Trả từng buổi xong', desc: 'Xong buổi nào trả buổi đó' },
                            ].map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setPaymentMode(opt.id)}
                                className={`p-2.5 rounded-xl border text-left transition-colors ${
                                  paymentMode === opt.id
                                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-600 text-emerald-950 dark:text-emerald-200'
                                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                <p className="font-bold leading-snug">{opt.label}</p>
                                <p className="text-[11px] opacity-75 mt-0.5">{opt.desc}</p>
                              </button>
                            ))}
                          </div>
                          {paymentMode === 'deposit_percent' && (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Mức cọc:</span>
                              {[20, 30, 50].map((pct) => (
                                <button
                                  key={pct}
                                  type="button"
                                  onClick={() => setDepositPercent(pct)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono tabular-nums border ${
                                    depositPercent === pct
                                      ? 'bg-emerald-700 text-white border-emerald-700'
                                      : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  }`}
                                >
                                  {pct}%
                                </button>
                              ))}
                              <div className="flex items-center gap-1 ml-auto">
                                <input
                                  type="number"
                                  min={10}
                                  max={90}
                                  value={depositPercent}
                                  onChange={(e) => setDepositPercent(Math.max(10, Math.min(90, Number(e.target.value) || 10)))}
                                  className="w-16 px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 font-mono tabular-nums font-bold text-xs text-center"
                                />
                                <span className="text-[11px] font-bold text-slate-500">%</span>
                              </div>
                            </div>
                          )}
                          {paymentMode === 'per_session' && (
                            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-mono tabular-nums">
                              Dự kiến {demandSessionCount} buổi · ~{formatVND(Math.round(slotEscrowBreakdown.totalAmount / Math.max(1, demandSessionCount)))}/buổi (thanh toán sau khi mỗi buổi đạt 100%).
                            </p>
                          )}
                        </div>

                        {/* Wallet Escrow Validation Box */}
                        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-300">
                              {slotEscrowBreakdown.taskTitle
                                ? `Tiền dịch vụ "${slotEscrowBreakdown.taskTitle}" (${slotEscrowBreakdown.volume} ${slotEscrowBreakdown.unit} × ${formatVND(slotEscrowBreakdown.unitPrice)}):`
                                : `Tiền dịch vụ (${slotEscrowBreakdown.volume} ${slotEscrowBreakdown.unit} × ${formatVND(slotEscrowBreakdown.unitPrice)}):`}
                            </span>
                            <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                              {formatVND(slotEscrowBreakdown.baseAmount)}
                            </span>
                          </div>
                          {slotEscrowBreakdown.extraShare > 0 && (
                            <div className="flex items-center justify-between">
                              <span className="text-slate-600 dark:text-slate-300">
                                {isJointVentureDemand ? 'Phân bổ vật tư / phụ phí suất này:' : 'Vật tư & phụ phí thêm:'}
                              </span>
                              <span className="font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
                                + {formatVND(slotEscrowBreakdown.extraShare)}
                              </span>
                            </div>
                          )}
                          <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-slate-700">
                            <span className="text-slate-700 dark:text-slate-300">Tổng giá trị hợp đồng:</span>
                            <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                              {formatVND(slotEscrowBreakdown.totalAmount)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-300">
                              Phí giao dịch (cộng thẳng TK {PLATFORM_ACCOUNT_NAME} · {PLATFORM_ACCOUNT_NUMBER}):
                            </span>
                            <span className="font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
                              + {formatVND(PLATFORM_FEE)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-800 dark:text-slate-200">
                              {paymentMode === 'full_upfront'
                                ? 'Tổng trừ ví ngay (100% + phí GD):'
                                : paymentMode === 'deposit_percent'
                                ? `Tổng trừ ví ngay (Cọc ${depositPercent}% + phí GD):`
                                : 'Tổng trừ ví ban đầu (Phí GD):'}
                            </span>
                            <span className="font-extrabold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 text-sm">
                              {formatVND(demandUpfrontWithFee)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-600 dark:text-slate-300">Số dư ví hiện tại của bạn:</span>
                            <span
                              className={`font-extrabold font-mono tabular-nums text-sm ${
                                providerWalletBalance < demandUpfrontWithFee
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-emerald-700 dark:text-emerald-400'
                              }`}
                            >
                              {formatVND(providerWalletBalance)}
                            </span>
                          </div>
                        </div>

                        {providerWalletBalance < demandUpfrontWithFee && (
                          <div className="p-3.5 rounded-xl bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                              <span>
                                Số dư ví không đủ ({formatVND(providerWalletBalance)} / {formatVND(demandUpfrontWithFee)}). Vui lòng nạp thêm hoặc chọn Đặt cọc / Trả từng buổi!
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowWalletModal(true)}
                              className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-extrabold shrink-0"
                            >
                              Nạp tiền ngay
                            </button>
                          </div>
                        )}

                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                          <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>
                            {isJointVentureDemand
                              ? `Xác nhận xong đối tác này, hệ thống giữ lại danh sách chờ cho đến khi đủ ${maxPartners} đối tác.`
                              : 'Sau khi xác nhận, danh sách chờ sẽ đóng. Chỉ người tham gia được chọn mới có quyền cập nhật tiến độ 0%–100%.'}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={!selectedAppId || providerWalletBalance < demandUpfrontWithFee}
                          onClick={handleConfirmDemandSelection}
                          className={`w-full py-3.5 rounded-2xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 ${
                            !selectedAppId || providerWalletBalance < demandUpfrontWithFee
                              ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-500 cursor-not-allowed'
                              : 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-600/20 active:scale-95'
                          }`}
                        >
                          <FileCheck2 className="w-5 h-5" />
                          <span>
                            {`XÁC NHẬN CHỌN ĐỐI TÁC & TRỪ ${formatVND(demandUpfrontWithFee)}`}
                          </span>
                        </button>
                      </>
                    )
                  )}
                </div>
              ) : (
                /* NON-AUTHOR ON DEMAND POST: SEND APPLICATION TO WAITLIST */
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 space-y-4">
                  {isMyAppAccepted ? (
                    <div className="p-4 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 font-bold space-y-2 text-xs">
                      <p>
                        Chúc mừng! Chủ bài đăng đã chọn bạn tham gia hợp đồng này
                        {myAcceptedApp?.targetTaskTitle ? ` (${myAcceptedApp.targetTaskTitle})` : ''}.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const myTxn = transactions.find(
                            (t) =>
                              t.postId === selectedPost.id &&
                              (t.participantId === currentUser.id || t.providerId === currentUser.id)
                          );
                          setPendingTransactionFocus({ postId: selectedPost.id, txnId: myTxn?.id });
                          setSelectedPost(null);
                          setActiveTab('transactions');
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-extrabold text-xs"
                      >
                        Vào cập nhật tiến trình ngay
                      </button>
                    </div>
                  ) : isWaitlistClosed ? (
                    <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                      Bài đăng yêu cầu dịch vụ này đã chọn đủ đối tác ({acceptedApps.length}/{maxPartners}) và đóng danh sách chờ.
                    </div>
                  ) : myWaitingApp ? (
                    <div className="p-4 rounded-xl bg-amber-100/80 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-200 space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 font-extrabold">
                        <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400" />
                        <span>Bạn đang nằm trong danh sách chờ duyệt hợp đồng</span>
                      </div>
                      {myWaitingApp.targetTaskTitle && (
                        <p className="font-semibold">
                          Công đoạn đăng ký: {myWaitingApp.targetTaskTitle}
                        </p>
                      )}
                      <p>
                        Đã gửi yêu cầu lúc {formatDateTimeVN(myWaitingApp.createdAt)}. Vui lòng chờ{' '}
                        <strong>{selectedPost.authorName}</strong> xem và xác nhận chọn bạn.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyDemand} className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {isJointVentureDemand
                            ? `Đăng Ký Tham Gia Hợp Tác Liên Doanh (${acceptedApps.length}/${maxPartners} suất đã chốt)`
                            : 'Đăng Ký Tham Gia Hợp Đồng Yêu Cầu Này'}
                        </h4>
                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 font-mono tabular-nums shrink-0">
                          {waitingApps.length} đang chờ
                        </span>
                      </div>

                      {isJointVentureDemand && selectedPost.jointVentureTasks && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                            Chọn dịch vụ / công đoạn bạn nhận làm trong gói liên doanh
                          </label>
                          <select
                            value={selectedApplyTaskId}
                            onChange={(e) => setSelectedApplyTaskId(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-amber-300 dark:border-amber-800 text-xs font-bold text-slate-900 dark:text-white"
                          >
                            {selectedPost.jointVentureTasks.map((task) => (
                              <option key={task.id} value={task.id}>
                                {task.categoryName}
                                {task.hiringMode ? ` · ${getHiringModeLabel(task.hiringMode, 'demand')}` : ''} —{' '}
                                {formatVND(Math.round(task.areaSize * task.price))}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Lời nhắn / cam kết gửi chủ bài đăng (tùy chọn)
                        </label>
                        <input
                          type="text"
                          value={applyNote}
                          onChange={(e) => setApplyNote(e.target.value)}
                          placeholder="Ví dụ: Có sẵn 2 máy, làm ngay đúng ngày, đảm bảo sạch đẹp..."
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-amber-300 dark:border-amber-800 text-xs text-slate-900 dark:text-white"
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-sm shadow-lg shadow-amber-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <FileCheck2 className="w-5 h-5" />
                        <span>
                          {isJointVentureDemand ? 'GỬI YÊU CẦU THAM GIA LIÊN DOANH' : 'GỬI YÊU CẦU THAM GIA HỢP ĐỒNG'}
                        </span>
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* SUPPLY POST WORKFLOW: Direct Join Form + Participant Wallet Deduction + Active Contracts List */
            <div className="space-y-4">
              {supplyContractsForPost.length > 0 && (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-extrabold text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
                      {isAuthor
                        ? `Hợp đồng khách đã tham gia & tạm giữ (${supplyContractsForPost.length})`
                        : `Hợp đồng bạn đã tham gia trên dịch vụ này (${supplyContractsForPost.length})`}
                    </h4>
                    <button
                      type="button"
                      onClick={() => {
                        if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
                        setPendingTransactionFocus({
                          postId: selectedPost.id,
                          txnId: supplyContractsForPost[0]?.id,
                        });
                        setSelectedPost(null);
                        setActiveTab('transactions');
                      }}
                      className="text-xs font-extrabold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0"
                    >
                      Mở Hợp Đồng & Tiến Trình →
                    </button>
                  </div>

                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {supplyContractsForPost.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/70 flex items-center justify-between gap-3 text-xs"
                      >
                        <div className="space-y-0.5 min-w-0">
                          <p className="font-extrabold text-slate-900 dark:text-white truncate">
                            <span className="tabular-nums text-emerald-800 dark:text-emerald-300 mr-1.5">{c.contractCode}</span>
                            · {isAuthor ? c.farmerName : c.providerName}
                          </p>
                          <p className="text-slate-600 dark:text-slate-300 tabular-nums">
                            {c.areaVolume} {c.unit} · {formatVND(c.totalAmount)} ({c.escrowReleased ? 'Đã giải ngân' : 'Đang tạm giữ'})
                          </p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                            Tiến độ: <strong className="tabular-nums text-emerald-700 dark:text-emerald-400">{c.progressPercent ?? 0}%</strong> · {c.progressStepTitle || 'Đang thực hiện'}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (redirectTimerRef.current) window.clearTimeout(redirectTimerRef.current);
                            setPendingTransactionFocus({ postId: selectedPost.id, txnId: c.id });
                            setSelectedPost(null);
                            setActiveTab('transactions');
                          }}
                          className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] shrink-0"
                        >
                          {isAuthor && c.status !== 'completed' ? 'Cập nhật tiến trình' : 'Xem tiến trình'}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {isAuthor ? (
                <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 text-xs text-slate-700 dark:text-slate-300 space-y-2">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300">
                    Đây là bài đăng Cung cấp dịch vụ của bạn.
                  </p>
                  <p>
                    Khi có khách bấm "Tham gia hợp đồng", hệ thống sẽ trừ tiền từ ví của khách để tạm giữ và hiển thị hợp đồng ngay phía trên cũng như trong tab Hợp Đồng & Tiến Độ để bạn cập nhật tiến độ (0%–100%) và nhận giải ngân.
                  </p>
                </div>
              ) : !showSupplyForm ? (
                <button
                  type="button"
                  onClick={() => setShowSupplyForm(true)}
                  className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-lg shadow-emerald-700/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <FileCheck2 className="w-5 h-5" />
                  <span>
                    {supplyContractsForPost.length > 0 ? 'THAM GIA THÊM HỢP ĐỒNG MỚI' : 'THAM GIA HỢP ĐỒNG'}
                  </span>
                </button>
              ) : (
                <form
                  onSubmit={handleJoinSupply}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-emerald-400 dark:border-emerald-700 space-y-4 animate-fade-in"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="font-extrabold text-emerald-950 dark:text-emerald-100 text-sm">
                      Thông Tin Tham Gia Hợp Đồng Dịch Vụ
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowSupplyForm(false)}
                      className="text-xs text-slate-500 hover:underline font-semibold"
                    >
                      Đóng lại
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {selectedPost.hiringMode === 'machine_rental' || ['máy', 'ngày', 'ca'].includes(selectedPost.areaUnit)
                          ? `Số lượng máy để thuê (${selectedPost.areaUnit})`
                          : selectedPost.pricingMode === 'vehicle' || ['xe', 'chuyến'].includes(selectedPost.areaUnit)
                          ? `Số lượng xe / chuyến (${selectedPost.areaUnit})`
                          : ['kg', 'tấn'].includes(selectedPost.areaUnit)
                          ? `Sản lượng / Khối lượng (${selectedPost.areaUnit})`
                          : `Diện tích đất (${selectedPost.areaUnit})`}
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={orderArea}
                        onChange={(e) => setOrderArea(Number(e.target.value))}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-emerald-300 dark:border-emerald-700 font-bold text-sm font-mono tabular-nums"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Ngày thực hiện
                      </label>
                      <input
                        type="date"
                        required
                        value={orderDate}
                        onChange={(e) => setOrderDate(e.target.value)}
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-emerald-300 dark:border-emerald-700 font-bold text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 text-xs mb-1">
                      Địa điểm cụ thể & Yêu cầu thực hiện
                    </label>
                    <input
                      type="text"
                      value={orderTerms}
                      onChange={(e) => setOrderTerms(e.target.value)}
                      placeholder="Ví dụ: Ấp 2, ruộng sát kênh T5, làm buổi sáng sớm..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-emerald-300 dark:border-emerald-700 text-xs"
                    />
                  </div>

                  {/* Extra material / surcharge items in Supply join form */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        Chi phí vật tư / phụ phí thêm (Phân, thuốc, giống, nước, bốc xếp...)
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setJoinExtraCosts((prev) => [
                            ...prev,
                            { id: `join-ex-${Date.now()}`, label: '', amount: 0 }
                          ])
                        }
                        className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-emerald-600 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold flex items-center gap-1 shrink-0"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Thêm mục</span>
                      </button>
                    </div>
                    {joinExtraCosts.length === 0 ? (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Chưa có vật tư thêm. Bấm "+ Thêm mục" nếu cần cộng thêm tiền vật tư vào hợp đồng.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {joinExtraCosts.map((item) => (
                          <div key={item.id} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                            <input
                              type="text"
                              value={item.label}
                              onChange={(e) =>
                                setJoinExtraCosts((prev) =>
                                  prev.map((row) => (row.id === item.id ? { ...row, label: e.target.value } : row))
                                )
                              }
                              placeholder="Tên vật tư / phụ phí"
                              className="flex-1 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs"
                            />
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min="0"
                                step="10000"
                                value={item.amount}
                                onChange={(e) =>
                                  setJoinExtraCosts((prev) =>
                                    prev.map((row) =>
                                      row.id === item.id
                                        ? { ...row, amount: Math.max(0, Number(e.target.value) || 0) }
                                        : row
                                    )
                                  )
                                }
                                placeholder="Số tiền"
                                className="w-32 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold font-mono tabular-nums"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  setJoinExtraCosts((prev) => prev.filter((row) => row.id !== item.id))
                                }
                                className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/60"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Flexible Payment Mode Selector in Supply Join Form */}
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
                    <p className="font-bold text-slate-800 dark:text-slate-200">
                      Tùy chỉnh phương thức thanh toán
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'full_upfront' as PaymentMode, label: 'Chuyển toàn bộ (100%)', desc: 'Tạm giữ đủ ngay' },
                        { id: 'deposit_percent' as PaymentMode, label: 'Đặt cọc theo %', desc: 'Chọn % trả trước' },
                        { id: 'per_session' as PaymentMode, label: 'Trả từng buổi xong', desc: 'Hoàn thành mới trả' },
                      ].map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setPaymentMode(opt.id)}
                          className={`p-2.5 rounded-xl border text-left transition-colors ${
                            paymentMode === opt.id
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-600 text-emerald-950 dark:text-emerald-200'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          <p className="font-bold leading-snug">{opt.label}</p>
                          <p className="text-[11px] opacity-75 mt-0.5">{opt.desc}</p>
                        </button>
                      ))}
                    </div>
                    {paymentMode === 'deposit_percent' && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">Mức cọc:</span>
                        {[20, 30, 50].map((pct) => (
                          <button
                            key={pct}
                            type="button"
                            onClick={() => setDepositPercent(pct)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-mono tabular-nums border ${
                              depositPercent === pct
                                ? 'bg-emerald-700 text-white border-emerald-700'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {pct}%
                          </button>
                        ))}
                        <div className="flex items-center gap-1 ml-auto">
                          <input
                            type="number"
                            min={10}
                            max={90}
                            value={depositPercent}
                            onChange={(e) => setDepositPercent(Math.max(10, Math.min(90, Number(e.target.value) || 10)))}
                            className="w-16 px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 font-mono tabular-nums font-bold text-xs text-center"
                          />
                          <span className="text-[11px] font-bold text-slate-500">%</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Financial Check Box */}
                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">
                        {selectedPost.hiringMode === 'machine_rental' || ['máy', 'ngày', 'ca'].includes(selectedPost.areaUnit)
                          ? `Chi phí thuê máy (${Math.max(1, Number(orderArea) || 1)} ${selectedPost.areaUnit} × ${formatVND(selectedPost.price)}):`
                          : `Tiền dịch vụ (${Math.max(1, Number(orderArea) || 1)} ${selectedPost.areaUnit} × ${formatVND(selectedPost.price)}):`}
                      </span>
                      <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                        {formatVND(supplyBaseTotal)}
                      </span>
                    </div>
                    {joinExtraTotal > 0 && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 dark:text-slate-300">Chi phí vật tư / phụ phí thêm:</span>
                        <span className="font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
                          + {formatVND(joinExtraTotal)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center justify-between pt-1 border-t border-emerald-200/70 dark:border-emerald-800/70">
                      <span className="text-slate-700 dark:text-slate-300">Tổng giá trị hợp đồng:</span>
                      <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                        {formatVND(supplyContractTotal)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">
                        Phí giao dịch (cộng thẳng TK {PLATFORM_ACCOUNT_NAME} · {PLATFORM_ACCOUNT_NUMBER}):
                      </span>
                      <span className="font-bold font-mono tabular-nums text-amber-700 dark:text-amber-400">
                        + {formatVND(PLATFORM_FEE)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {paymentMode === 'full_upfront'
                          ? 'Tổng trừ ví ngay (100% + phí GD):'
                          : paymentMode === 'deposit_percent'
                          ? `Tổng trừ ví ngay (Cọc ${depositPercent}% + phí GD):`
                          : 'Tổng trừ ví ban đầu (Phí GD):'}
                      </span>
                      <span className="text-base font-extrabold font-mono tabular-nums text-emerald-800 dark:text-emerald-300">
                        {formatVND(supplyUpfrontWithFee)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 dark:text-slate-300">Số dư ví hiện tại của bạn:</span>
                      <span
                        className={`text-sm font-extrabold font-mono tabular-nums ${
                          providerWalletBalance < supplyUpfrontWithFee
                            ? 'text-rose-600 dark:text-rose-400'
                            : 'text-emerald-700 dark:text-emerald-400'
                        }`}
                      >
                        {formatVND(providerWalletBalance)}
                      </span>
                    </div>
                  </div>

                  {providerWalletBalance < supplyUpfrontWithFee && (
                    <div className="p-3.5 rounded-xl bg-rose-100 dark:bg-rose-950/70 border border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200 text-xs font-bold flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <span>
                          Số dư ví không đủ! Cần {formatVND(supplyUpfrontWithFee)}, hiện có {formatVND(providerWalletBalance)}. Bạn có thể nạp tiền hoặc chọn Đặt cọc / Trả từng buổi.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowWalletModal(true)}
                        className="px-3.5 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-extrabold shrink-0"
                      >
                        Nạp tiền ngay
                      </button>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-start gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      Với bài Cung cấp dịch vụ, chỉ chủ bài đăng ({selectedPost.authorName}) mới có quyền cập nhật tiến độ và ghi chi tiết hành động thực hiện.
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={providerWalletBalance < supplyUpfrontWithFee}
                    className={`w-full py-3.5 rounded-xl font-extrabold text-sm transition-all ${
                      providerWalletBalance < supplyUpfrontWithFee
                        ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-emerald-700 hover:bg-emerald-800 text-white shadow-md active:scale-95'
                    }`}
                  >
                    {`XÁC NHẬN THAM GIA & TRỪ ${formatVND(supplyUpfrontWithFee)}`}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* Author Edit / Admin Delete Bottom Bar */}
          {(isAuthor || canDelete) && (
            <div className="pt-2 border-t border-black/10 dark:border-white/10 flex flex-col sm:flex-row gap-3">
              {canDelete && (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isAdmin && !isAuthor ? 'XÓA BÀI (QUYỀN ADMIN)' : 'XÓA BÀI NÀY'}</span>
                </button>
              )}

              {isAuthor && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingPost(selectedPost);
                    setSelectedPost(null);
                    setActiveTab('create');
                  }}
                  className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>CHỈNH SỬA BÀI ĐĂNG</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">
                Xác nhận xóa bài đăng?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Bạn có chắc chắn muốn xóa bài đăng <strong>"{selectedPost.title}"</strong> không? Sau khi xóa, bài đăng sẽ không còn hiển thị trên sàn giao dịch.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  deletePost(selectedPost.id);
                  setShowDeleteConfirm(false);
                  setSelectedPost(null);
                }}
                className="flex-1 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md transition-colors"
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
