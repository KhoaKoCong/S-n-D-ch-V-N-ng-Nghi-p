import React, { useState, useEffect } from 'react';
import { useAgri } from '../context/AgriContext';
import {
  formatVND,
  formatDateVN,
  formatDateTimeVN,
  getHiringModeLabel,
  formatWorkScheduleSummary,
  getPaymentPlanSummaryLabel,
  computeExtraCostsTotal,
} from '../utils/formatters';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Circle,
  Clock,
  MessageSquare,
  Phone,
  Calendar,
  Plus,
  Trash2,
  Save,
  Lock,
  ExternalLink,
  Users,
  Wallet,
  Star,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Edit3,
  Eye,
  CalendarPlus,
} from 'lucide-react';
import {
  AgriTransaction,
  ProgressMilestone,
  ServicePost,
  SessionProgressRecord,
} from '../types';

interface TransactionDetailPageProps {
  post?: ServicePost;
  linkedTxns: AgriTransaction[];
  initialTxnId?: string;
  onBack: () => void;
}

const FALLBACK_TEMPLATE_STEPS: ProgressMilestone[] = [
  {
    id: 'tpl-1',
    title: 'Chuẩn bị thiết bị & khảo sát ruộng',
    actionDetail: 'Kiểm tra máy móc, nhiên liệu/vật tư và ranh thửa trước khi vận hành.',
    completed: false,
  },
  {
    id: 'tpl-2',
    title: 'Triển khai công việc giai đoạn đầu',
    actionDetail: 'Thực hiện thi công đợt đầu đúng quy trình kỹ thuật đã cam kết.',
    completed: false,
  },
  {
    id: 'tpl-3',
    title: 'Hoàn thành phần lớn khối lượng',
    actionDetail: 'Hoàn thiện toàn bộ khu vực còn lại và xử lý kỹ các góc bờ.',
    completed: false,
  },
  {
    id: 'tpl-4',
    title: 'Nghiệm thu & bàn giao 100%',
    actionDetail: 'Nghiệm thu trực tiếp với bên thuê và xác nhận hoàn tất buổi làm.',
    completed: false,
  },
];

export const TransactionDetailPage: React.FC<TransactionDetailPageProps> = ({
  post,
  linkedTxns,
  initialTxnId,
  onBack,
}) => {
  const {
    currentUser,
    applications,
    chatMessages,
    providerWalletBalance,
    setShowWalletModal,
    setSelectedChatTxnId,
    setSelectedPost,
    saveSessionProgress,
    appendNextRecurringSession,
    settleTransactionPayment,
    updatePostDefaultMilestones,
    addReview,
  } = useAgri();

  // Default active executor tab: prefer initialTxnId, or the contract where currentUser is executor, or first txn
  const resolveDefaultTxnId = () => {
    if (initialTxnId && linkedTxns.some((t) => t.id === initialTxnId)) return initialTxnId;
    const myExecTxn = linkedTxns.find(
      (t) =>
        (t.progressUpdaterId || (t.originPostType === 'demand' ? t.participantId : t.postAuthorId)) ===
        currentUser.id
    );
    return myExecTxn?.id || linkedTxns[0]?.id || '';
  };

  const [activeTxnId, setActiveTxnId] = useState<string>(resolveDefaultTxnId);
  const [imgFailed, setImgFailed] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
    insufficientFunds?: boolean;
  } | null>(null);

  // Expanded completed session logs (to review details of past 100% sessions)
  const [expandedDoneSessions, setExpandedDoneSessions] = useState<Record<string, boolean>>({});

  // Local editable drafts keyed by `${txnId}::${sessionId}`
  const [sessionDrafts, setSessionDrafts] = useState<
    Record<
      string,
      {
        milestones: ProgressMilestone[];
        summaryNote: string;
        newTitle: string;
        newDetail: string;
      }
    >
  >({});

  // Pre-contract template draft for supply posts without contracts yet
  const [templateDraft, setTemplateDraft] = useState<{
    milestones: ProgressMilestone[];
    newTitle: string;
    newDetail: string;
  }>(() => ({
    milestones:
      post?.defaultMilestones && post.defaultMilestones.length > 0
        ? post.defaultMilestones.map((m) => ({ ...m }))
        : FALLBACK_TEMPLATE_STEPS.map((m, idx) => ({ ...m, id: `tpl-${idx + 1}` })),
    newTitle: '',
    newDetail: '',
  }));

  // Review modal state
  const [reviewTargetTxn, setReviewTargetTxn] = useState<AgriTransaction | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    if (linkedTxns.length > 0 && !linkedTxns.some((t) => t.id === activeTxnId)) {
      setActiveTxnId(resolveDefaultTxnId());
    }
  }, [linkedTxns.length, activeTxnId]);

  const showBanner = (type: 'success' | 'error', text: string, insufficientFunds = false) => {
    setFeedback({ type, text, insufficientFunds });
    window.setTimeout(() => {
      setFeedback((prev) => (prev?.text === text ? null : prev));
    }, 5500);
  };

  const activeTxn = linkedTxns.find((t) => t.id === activeTxnId) || linkedTxns[0];
  const waitingApps = post
    ? applications.filter((a) => a.postId === post.id && a.status === 'waiting')
    : [];

  // Overall multi-executor mission status
  const nonCancelledTxns = linkedTxns.filter((t) => t.status !== 'cancelled');
  const completedExecutorsCount = nonCancelledTxns.filter((t) => t.status === 'completed').length;
  const totalExecutorsCount = nonCancelledTxns.length;
  const expectedPartners = post?.isJointVenture
    ? Math.max(totalExecutorsCount, post.maxPartners || post.jointVentureTasks?.length || 1)
    : Math.max(1, totalExecutorsCount);
  const isOverallCompleted =
    totalExecutorsCount > 0 &&
    completedExecutorsCount === totalExecutorsCount &&
    (!post?.isJointVenture || totalExecutorsCount >= expectedPartners);
  const overallAvgPercent =
    totalExecutorsCount > 0
      ? Math.round(
          nonCancelledTxns.reduce((sum, t) => sum + (t.progressPercent || 0), 0) /
            totalExecutorsCount
        )
      : 0;

  const displayTitle = post?.title || activeTxn?.serviceName || 'Chi tiết tiến trình công việc';
  const displayImage = post?.imageUrl;
  const displayLocation = post
    ? `${post.district}, ${post.province}`
    : activeTxn?.location || '';
  const displaySchedule = post
    ? formatWorkScheduleSummary(post)
    : activeTxn
    ? formatWorkScheduleSummary(activeTxn)
    : 'Linh hoạt';

  // Draft helpers for a specific session
  const getDraftKey = (txnId: string, sessionId: string) => `${txnId}::${sessionId}`;

  const getSessionDraft = (txn: AgriTransaction, session: SessionProgressRecord) => {
    const key = getDraftKey(txn.id, session.id);
    if (sessionDrafts[key]) return sessionDrafts[key];
    return {
      milestones:
        session.milestones && session.milestones.length > 0
          ? session.milestones.map((m) => ({ ...m, actionDetail: m.actionDetail || '' }))
          : FALLBACK_TEMPLATE_STEPS.map((m, idx) => ({
              ...m,
              id: `${session.id}-m-${idx + 1}`,
              completed: session.status === 'completed',
            })),
      summaryNote: session.summaryNote || '',
      newTitle: '',
      newDetail: '',
    };
  };

  const updateSessionDraft = (
    txn: AgriTransaction,
    session: SessionProgressRecord,
    patch: Partial<{
      milestones: ProgressMilestone[];
      summaryNote: string;
      newTitle: string;
      newDetail: string;
    }>
  ) => {
    const key = getDraftKey(txn.id, session.id);
    const cur = getSessionDraft(txn, session);
    setSessionDrafts((prev) => ({
      ...prev,
      [key]: { ...cur, ...patch },
    }));
  };

  const handleSaveSession = (txn: AgriTransaction, session: SessionProgressRecord) => {
    const draft = getSessionDraft(txn, session);
    const res = saveSessionProgress(txn.id, session.id, draft.milestones, draft.summaryNote);
    if (!res.success) {
      showBanner('error', res.message);
    } else {
      showBanner('success', res.message);
      const key = getDraftKey(txn.id, session.id);
      setSessionDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const handleSettlePayment = (txn: AgriTransaction, sessionId?: string) => {
    const res = settleTransactionPayment(txn.id, sessionId ? { sessionId } : undefined);
    showBanner(res.success ? 'success' : 'error', res.message, Boolean(res.insufficientFunds));
  };

  const handleSubmitReview = () => {
    if (!reviewTargetTxn) return;
    const targetUserId =
      currentUser.id === reviewTargetTxn.farmerId
        ? reviewTargetTxn.providerId
        : reviewTargetTxn.farmerId;
    addReview(reviewTargetTxn.id, targetUserId, reviewRating, reviewComment);
    setReviewTargetTxn(null);
    setReviewComment('');
    showBanner('success', 'Đã gửi đánh giá đối tác thành công!');
  };

  // Render an active/editable OR read-only session card
  const renderSessionWorkspaceCard = (
    txn: AgriTransaction,
    session: SessionProgressRecord,
    canEdit: boolean,
    isMultiSession: boolean,
    isNextAfterCompleted: boolean
  ) => {
    const draft = getSessionDraft(txn, session);
    const milestones = canEdit ? draft.milestones : session.milestones;
    const doneSteps = milestones.filter((m) => m.completed).length;
    const livePct =
      milestones.length > 0 ? Math.round((doneSteps / milestones.length) * 100) : session.progressPercent;
    const isPayer = currentUser.id === txn.farmerId;
    const isPerSessionPay = txn.paymentPlan?.mode === 'per_session';

    return (
      <div
        key={session.id}
        className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden"
      >
        {/* Session Header */}
        <div className="px-4 sm:px-5 py-3.5 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
          <div className="space-y-0.5">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-900 dark:text-white">
                {isMultiSession
                  ? isNextAfterCompleted
                    ? `Ngày tiếp theo · Buổi ${session.sessionIndex}`
                    : `Buổi ${session.sessionIndex}`
                  : 'Tiến trình thực hiện nhiệm vụ'}
              </span>
              <span className="text-slate-300 dark:text-slate-600">·</span>
              <span className="tabular-nums font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                {formatDateVN(session.scheduledDate)}
              </span>
              {isPerSessionPay && session.sessionAmount ? (
                <>
                  <span className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="tabular-nums font-bold text-slate-700 dark:text-slate-200">
                    {formatVND(session.sessionAmount)}
                  </span>
                </>
              ) : null}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
              {canEdit
                ? 'Bạn đang ở chế độ Quản lí: hãy mô tả chi tiết từng hành động và đánh dấu bước đã hoàn thành.'
                : 'Chế độ xem: theo dõi các hành động cụ thể do bên đảm nhận thực hiện ghi nhận.'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
              {livePct}%
            </span>
            <span className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
              ({doneSteps}/{milestones.length} bước)
            </span>
          </div>
        </div>

        {/* Progress Bar divided into N equal segments matching milestones.length */}
        <div className="px-4 sm:px-5 pt-4 pb-2">
          <div className="relative w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                livePct === 100 ? 'bg-emerald-600' : 'bg-emerald-500'
              }`}
              style={{ width: `${livePct}%` }}
            />
            {milestones.length > 1 && (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 flex"
              >
                {milestones.map((step, idx) => (
                  <div
                    key={step.id || idx}
                    className={`flex-1 h-full ${
                      idx < milestones.length - 1
                        ? 'border-r-2 border-white dark:border-slate-900'
                        : ''
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Steps List with Detailed Action Descriptions */}
        <div className="p-4 sm:p-5 space-y-3">
          {canEdit ? (
            <>
              <div className="space-y-3">
                {draft.milestones.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`p-3 rounded-xl border transition-colors space-y-2 ${
                      step.completed
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const updated = draft.milestones.map((m) =>
                            m.id === step.id ? { ...m, completed: !m.completed } : m
                          );
                          updateSessionDraft(txn, session, { milestones: updated });
                        }}
                        title={step.completed ? 'Bỏ chọn hoàn thành' : 'Đánh dấu hoàn thành bước này'}
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          step.completed
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-600 text-slate-400 hover:border-emerald-500'
                        }`}
                      >
                        <Check className="w-4 h-4" />
                      </button>

                      <span className="text-[11px] tabular-nums font-bold text-slate-400 shrink-0">
                        B{idx + 1}
                      </span>

                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => {
                          const updated = draft.milestones.map((m) =>
                            m.id === step.id ? { ...m, title: e.target.value } : m
                          );
                          updateSessionDraft(txn, session, { milestones: updated });
                        }}
                        placeholder={`Tên bước thực hiện ${idx + 1}...`}
                        className="flex-1 min-w-0 px-2.5 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />

                      {draft.milestones.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = draft.milestones.filter((m) => m.id !== step.id);
                            updateSessionDraft(txn, session, { milestones: updated });
                          }}
                          title="Xóa bước này"
                          className="w-8 h-8 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 shrink-0 flex items-center justify-center"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="pl-9">
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                        Mô tả cụ thể hành động thực hiện
                      </label>
                      <textarea
                        rows={2}
                        value={step.actionDetail || ''}
                        onChange={(e) => {
                          const updated = draft.milestones.map((m) =>
                            m.id === step.id ? { ...m, actionDetail: e.target.value } : m
                          );
                          updateSessionDraft(txn, session, { milestones: updated });
                        }}
                        placeholder="Ghi rõ cách làm, thời gian, diện tích, lượng vật tư hoặc kết quả cụ thể của bước này..."
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-600"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Step with Action Description */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-dashed border-slate-300 dark:border-slate-700 space-y-2">
                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  Thêm bước hành động mới vào buổi này
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={draft.newTitle}
                    onChange={(e) => updateSessionDraft(txn, session, { newTitle: e.target.value })}
                    placeholder="Tên bước mới (ví dụ: Phun dặm bờ Bắc)..."
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={draft.newDetail}
                    onChange={(e) => updateSessionDraft(txn, session, { newDetail: e.target.value })}
                    placeholder="Mô tả chi tiết hành động sẽ thực hiện..."
                    className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!draft.newTitle.trim()) return;
                    updateSessionDraft(txn, session, {
                      milestones: [
                        ...draft.milestones,
                        {
                          id: `ms-${Date.now()}`,
                          title: draft.newTitle.trim(),
                          actionDetail: draft.newDetail.trim(),
                          completed: false,
                        },
                      ],
                      newTitle: '',
                      newDetail: '',
                    });
                  }}
                  className="w-full sm:w-auto min-h-[38px] px-3.5 py-2 rounded-lg border border-emerald-600 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold inline-flex items-center justify-center gap-1 whitespace-nowrap"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Thêm bước công việc</span>
                </button>
              </div>

              {/* Session Summary Note & Save CTA */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                <input
                  type="text"
                  value={draft.summaryNote}
                  onChange={(e) => updateSessionDraft(txn, session, { summaryNote: e.target.value })}
                  placeholder="Ghi chú tổng kết tình hình thực tế buổi làm này..."
                  className="flex-1 min-h-[40px] px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleSaveSession(txn, session)}
                  className="w-full sm:w-auto min-h-[42px] px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {livePct === 100
                      ? isMultiSession
                        ? `Hoàn thành Buổi ${session.sessionIndex} (100%)`
                        : 'Hoàn thành nhiệm vụ (100%)'
                      : `Lưu tiến trình (${livePct}%)`}
                  </span>
                </button>
              </div>
            </>
          ) : (
            /* READ-ONLY VIEW MODE */
            <div className="space-y-2.5">
              {milestones.map((step, idx) => (
                <div
                  key={step.id}
                  className={`p-3 rounded-xl border flex items-start gap-3 ${
                    step.completed
                      ? 'bg-emerald-50/50 dark:bg-emerald-950/25 border-emerald-200 dark:border-emerald-800/70'
                      : 'bg-slate-50/60 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {step.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
                      <span className="tabular-nums text-slate-400 mr-1">{idx + 1}.</span>
                      {step.title}
                    </p>
                    {step.actionDetail ? (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                        {step.actionDetail}
                      </p>
                    ) : (
                      <p className="text-[11px] italic text-slate-400">
                        Chưa có mô tả chi tiết cho bước này.
                      </p>
                    )}
                  </div>
                </div>
              ))}

              {session.summaryNote && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-bold text-slate-900 dark:text-white">Ghi chú thực tế: </span>
                  {session.summaryNote}
                </div>
              )}

              {isPayer && isPerSessionPay && session.status === 'completed' && !session.paid && (
                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleSettlePayment(txn, session.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold inline-flex items-center gap-1.5 whitespace-nowrap"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Thanh toán buổi này ({formatVND(session.sessionAmount || 0)})</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="progress-typo space-y-5 pb-24 animate-fade-in">
      {/* Top Breadcrumb / Back Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[38px] px-3 sm:px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" />
          <span>Quay lại</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {post && post.type === 'demand' && post.authorId === currentUser.id && waitingApps.length > 0 && (
            <button
              type="button"
              onClick={() => setSelectedPost(post)}
              className="min-h-[38px] px-3 sm:px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] sm:text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Duyệt chờ ({waitingApps.length})</span>
            </button>
          )}
          {post && (
            <button
              type="button"
              onClick={() => setSelectedPost(post)}
              className="min-h-[38px] px-3 sm:px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-[11px] sm:text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>Bài đăng gốc</span>
            </button>
          )}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border text-xs font-bold flex flex-wrap items-center justify-between gap-3 ${
            feedback.type === 'error'
              ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          {feedback.insufficientFunds && (
            <button
              type="button"
              onClick={() => setShowWalletModal(true)}
              className="px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-extrabold whitespace-nowrap"
            >
              Nạp tiền vào ví
            </button>
          )}
        </div>
      )}

      {/* Post Summary Header Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
          {displayImage && !imgFailed ? (
            <img
              src={displayImage}
              alt={displayTitle}
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-slate-400" />
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-snug">
            {displayTitle}
          </h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>{displayLocation}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{displaySchedule}</span>
            {post && (
              <>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-bold text-slate-800 dark:text-slate-200">
                  {formatVND(post.price)}/{post.priceUnit.replace('₫/', '')}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Overall Mission Status Summary */}
        {totalExecutorsCount > 0 && (
          <div
            className={`px-4 py-2.5 rounded-xl border text-right shrink-0 ${
              isOverallCompleted
                ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
            }`}
          >
            <p
              className={`text-xs font-bold flex items-center justify-end gap-1.5 ${
                isOverallCompleted
                  ? 'text-emerald-800 dark:text-emerald-300'
                  : 'text-slate-800 dark:text-slate-200'
              }`}
            >
              {isOverallCompleted ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Nhiệm vụ tổng hoàn thành</span>
                </>
              ) : (
                <span>
                  Tiến độ tổng:{' '}
                  <span className="tabular-nums text-emerald-700 dark:text-emerald-400">
                    {overallAvgPercent}%
                  </span>
                </span>
              )}
            </p>
            <p className="text-[11px] tabular-nums text-slate-500 dark:text-slate-400 mt-0.5">
              Đã xong {completedExecutorsCount}/{expectedPartners} người thực hiện
            </p>
          </div>
        )}
      </div>

      {/* ===================== MULTI-EXECUTOR TABS BAR ===================== */}
      {linkedTxns.length > 0 ? (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                Danh sách người đảm nhận thực hiện ({linkedTxns.length}
                {post?.isJointVenture ? `/${expectedPartners} suất` : ''})
              </p>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Tab chuyển xanh khi người đó hoàn thành 100%
              </span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {linkedTxns.map((txn, idx) => {
                const isSelected = activeTxn?.id === txn.id;
                const isDone = txn.status === 'completed';
                const executorUpdaterId =
                  txn.progressUpdaterId ||
                  (txn.originPostType === 'demand' ? txn.participantId : txn.postAuthorId);
                const isMeExec = executorUpdaterId === currentUser.id;
                const tabTitle =
                  txn.originPostType === 'supply' && txn.postAuthorId === currentUser.id
                    ? `${txn.providerName} · HĐ ${txn.farmerName}`
                    : txn.providerName;

                return (
                  <button
                    key={txn.id}
                    type="button"
                    onClick={() => setActiveTxnId(txn.id)}
                    className={`px-3.5 py-2.5 rounded-xl border text-left transition-all shrink-0 flex items-center gap-2.5 ${
                      isDone
                        ? isSelected
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-950'
                        : isSelected
                        ? 'bg-slate-900 dark:bg-white border-slate-900 dark:border-white text-white dark:text-slate-900 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2
                        className={`w-4 h-4 shrink-0 ${
                          isSelected ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'
                        }`}
                      />
                    ) : (
                      <Clock className="w-4 h-4 shrink-0 opacity-70" />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-xs font-bold whitespace-nowrap">
                        <span>
                          {idx + 1}. {tabTitle}
                        </span>
                        {isMeExec && (
                          <span className="text-[10px] font-medium opacity-80">(Bạn thực hiện)</span>
                        )}
                      </div>
                      <div className="text-[11px] tabular-nums opacity-85 whitespace-nowrap">
                        {txn.jointVentureTaskTitle ? `${txn.jointVentureTaskTitle} · ` : ''}
                        {isDone ? 'Hoàn thành 100%' : `${txn.progressPercent || 0}%`}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ===================== SELECTED EXECUTOR DETAIL BODY ===================== */}
          {activeTxn &&
            (() => {
              const allowedUpdaterId =
                activeTxn.progressUpdaterId ||
                (activeTxn.originPostType === 'demand'
                  ? activeTxn.participantId
                  : activeTxn.postAuthorId);
              const isExecutionMode =
                currentUser.id === allowedUpdaterId && activeTxn.status !== 'cancelled';
              const isPayer = currentUser.id === activeTxn.farmerId;
              const msgCount = chatMessages.filter((m) => m.contractId === activeTxn.id).length;

              const sessions: SessionProgressRecord[] =
                activeTxn.sessionProgress && activeTxn.sessionProgress.length > 0
                  ? activeTxn.sessionProgress
                  : [
                      {
                        id: `${activeTxn.id}-sess-1`,
                        sessionIndex: 1,
                        scheduledDate: activeTxn.executionDate,
                        status: activeTxn.status === 'completed' ? 'completed' : 'in_progress',
                        progressPercent: activeTxn.progressPercent || 0,
                        milestones: activeTxn.progressMilestones || FALLBACK_TEMPLATE_STEPS,
                        sessionAmount: activeTxn.totalAmount,
                        paid: activeTxn.escrowReleased,
                      },
                    ];

              const isMultiSession =
                sessions.length > 1 ||
                activeTxn.workSchedule?.type === 'multi_days' ||
                activeTxn.workSchedule?.type === 'recurring';

              const completedSessions = sessions.filter((s) => s.status === 'completed');
              const activeSession = sessions.find((s) => s.status !== 'completed') || null;
              const upcomingSessions = activeSession
                ? sessions.filter((s) => s.sessionIndex > activeSession.sessionIndex)
                : [];

              const plan = activeTxn.paymentPlan || {
                mode: 'full_upfront' as const,
                upfrontAmount: activeTxn.escrowAmount || activeTxn.totalAmount,
                releasedAmount: activeTxn.escrowReleased
                  ? activeTxn.escrowAmount || activeTxn.totalAmount
                  : 0,
                remainingAmount: activeTxn.escrowReleased
                  ? 0
                  : Math.max(0, activeTxn.totalAmount - (activeTxn.escrowAmount || 0)),
              };

              return (
                <div className="space-y-4">
                  {/* Executor Contact, Mode & Payment Summary Bar */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-slate-100 dark:border-slate-800">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs">
                          <span className="tabular-nums font-bold text-slate-900 dark:text-white">
                            {activeTxn.contractCode}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span
                            className={`font-bold inline-flex items-center gap-1 ${
                              isExecutionMode
                                ? 'text-emerald-700 dark:text-emerald-400'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {isExecutionMode ? (
                              <>
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Quản lí</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5" />
                                <span>Chế độ xem</span>
                              </>
                            )}
                          </span>
                          {activeTxn.hiringMode && (
                            <>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span className="text-slate-600 dark:text-slate-400">
                                {getHiringModeLabel(activeTxn.hiringMode, activeTxn.originPostType)}
                              </span>
                            </>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-700 dark:text-slate-300">
                          <span>
                            Người thực hiện:{' '}
                            <strong className="font-semibold text-slate-900 dark:text-white">
                              {activeTxn.providerName}
                            </strong>
                          </span>
                          <span className="tabular-nums inline-flex items-center gap-1 text-slate-600 dark:text-slate-300">
                            <Phone className="w-3 h-3 text-emerald-600" />
                            {activeTxn.providerPhone}
                          </span>
                          <span className="text-slate-300 dark:text-slate-600">·</span>
                          <span>
                            Bên thuê:{' '}
                            <strong className="font-semibold text-slate-900 dark:text-white">
                              {activeTxn.farmerName}
                            </strong>{' '}
                            (<span className="tabular-nums">{activeTxn.farmerPhone}</span>)
                          </span>
                        </div>

                        <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                          Khối lượng: {activeTxn.areaVolume} {activeTxn.unit} ×{' '}
                          {formatVND(activeTxn.unitPrice)} ={' '}
                          <strong className="font-semibold text-slate-900 dark:text-white">
                            {formatVND(activeTxn.totalAmount)}
                          </strong>
                          {computeExtraCostsTotal(activeTxn.extraCosts) > 0
                            ? ` (gồm +${formatVND(computeExtraCostsTotal(activeTxn.extraCosts))} vật tư)`
                            : ''}
                        </p>
                      </div>

                      {/* Prominent Chat Popup Button right beside progress header */}
                      <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedChatTxnId(activeTxn.id)}
                          className="flex-1 md:flex-initial min-h-[40px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <MessageSquare className="w-4 h-4 shrink-0" />
                          <span>Nhắn tin{msgCount > 0 ? ` (${msgCount})` : ''}</span>
                        </button>

                        {activeTxn.status === 'completed' && (
                          <button
                            type="button"
                            onClick={() => setReviewTargetTxn(activeTxn)}
                            className="flex-1 md:flex-initial min-h-[40px] px-3.5 py-2 rounded-xl border border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs font-bold hover:bg-amber-100 inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
                          >
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />
                            <span>Đánh giá</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Flexible Payment Breakdown Strip */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Phương thức: </span>
                          <strong className="font-semibold text-slate-900 dark:text-white">
                            {getPaymentPlanSummaryLabel(plan)}
                          </strong>
                        </div>
                        <div className="tabular-nums">
                          <span className="text-slate-500 dark:text-slate-400">Đã tạm giữ: </span>
                          <strong className="font-semibold text-slate-900 dark:text-white">
                            {formatVND(plan.upfrontAmount)}
                          </strong>
                        </div>
                        <div className="tabular-nums">
                          <span className="text-slate-500 dark:text-slate-400">Đã giải ngân: </span>
                          <strong className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {formatVND(plan.releasedAmount)}
                          </strong>
                        </div>
                        <div className="tabular-nums">
                          <span className="text-slate-500 dark:text-slate-400">Còn lại: </span>
                          <strong
                            className={
                              plan.remainingAmount > 0
                                ? 'font-semibold text-amber-700 dark:text-amber-400'
                                : 'font-semibold text-emerald-700 dark:text-emerald-400'
                            }
                          >
                            {formatVND(plan.remainingAmount)}
                          </strong>
                        </div>
                        {isPayer && plan.remainingAmount > 0 && (
                          <div className="tabular-nums">
                            <span className="text-slate-500 dark:text-slate-400">Số dư ví: </span>
                            <strong className="font-semibold text-slate-900 dark:text-white">
                              {formatVND(providerWalletBalance)}
                            </strong>
                          </div>
                        )}
                      </div>

                      {isPayer && plan.remainingAmount > 0 && plan.mode !== 'per_session' && (
                        <button
                          type="button"
                          onClick={() => handleSettlePayment(activeTxn)}
                          className="w-full sm:w-auto min-h-[40px] px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                        >
                          <Wallet className="w-3.5 h-3.5 shrink-0" />
                          <span>Tất toán còn lại ({formatVND(plan.remainingAmount)})</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ===================== SESSIONS TIMELINE ===================== */}
                  {isMultiSession ? (
                    <div className="space-y-4">
                      {/* 1. Completed Sessions (100%) shown clearly at top */}
                      {completedSessions.length > 0 && (
                        <div className="space-y-2.5">
                          <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                            Các buổi đã hoàn thành ({completedSessions.length}/{sessions.length} buổi)
                          </p>
                          {completedSessions.map((sess) => {
                            const isExpanded = Boolean(expandedDoneSessions[sess.id]);
                            const canPayThisSession =
                              isPayer && plan.mode === 'per_session' && !sess.paid;

                            return (
                              <div
                                key={sess.id}
                                className="rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 overflow-hidden"
                              >
                                <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2.5">
                                  <div className="flex items-center gap-2.5 min-w-0">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <div className="min-w-0">
                                      <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100">
                                        Buổi {sess.sessionIndex} · Ngày{' '}
                                        <span className="tabular-nums">
                                          {formatDateVN(sess.scheduledDate)}
                                        </span>{' '}
                                        · Hoàn thành 100%
                                      </p>
                                      {sess.summaryNote && (
                                        <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 truncate">
                                          {sess.summaryNote}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0">
                                    {plan.mode === 'per_session' && (
                                      sess.paid ? (
                                        <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                                          Đã thanh toán ({formatVND(sess.sessionAmount || 0)})
                                        </span>
                                      ) : canPayThisSession ? (
                                        <button
                                          type="button"
                                          onClick={() => handleSettlePayment(activeTxn, sess.id)}
                                          className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-[11px] font-bold inline-flex items-center gap-1 whitespace-nowrap"
                                        >
                                          <Wallet className="w-3.5 h-3.5" />
                                          <span>Thanh toán buổi này ({formatVND(sess.sessionAmount || 0)})</span>
                                        </button>
                                      ) : (
                                        <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                                          Chờ bên thuê trả ({formatVND(sess.sessionAmount || 0)})
                                        </span>
                                      )
                                    )}

                                    <button
                                      type="button"
                                      onClick={() =>
                                        setExpandedDoneSessions((prev) => ({
                                          ...prev,
                                          [sess.id]: !prev[sess.id],
                                        }))
                                      }
                                      className="px-2.5 py-1.5 rounded-lg bg-white/80 dark:bg-slate-900/70 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-900 dark:text-emerald-200 inline-flex items-center gap-1 whitespace-nowrap"
                                    >
                                      <span>{isExpanded ? 'Thu gọn' : 'Chi tiết'}</span>
                                      {isExpanded ? (
                                        <ChevronUp className="w-3.5 h-3.5" />
                                      ) : (
                                        <ChevronDown className="w-3.5 h-3.5" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="px-4 pb-3.5 pt-2 border-t border-emerald-200/70 dark:border-emerald-800/70 space-y-2 bg-white/70 dark:bg-slate-900/60">
                                    {sess.milestones.map((m, mIdx) => (
                                      <div key={m.id} className="flex items-start gap-2 text-xs">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                        <div>
                                          <p className="font-bold text-slate-900 dark:text-white">
                                            {mIdx + 1}. {m.title}
                                          </p>
                                          {m.actionDetail && (
                                            <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                                              {m.actionDetail}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* 2. Active / Next Day Session Progress Card right below completed ones */}
                      {activeSession ? (
                        <div className="space-y-2">
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {completedSessions.length > 0
                              ? `Tiến trình ngày tiếp theo (${formatDateVN(activeSession.scheduledDate)})`
                              : `Tiến trình buổi hiện tại (${formatDateVN(activeSession.scheduledDate)})`}
                          </p>
                          {renderSessionWorkspaceCard(
                            activeTxn,
                            activeSession,
                            isExecutionMode,
                            true,
                            completedSessions.length > 0
                          )}
                        </div>
                      ) : (
                        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2 font-bold text-emerald-900 dark:text-emerald-200">
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            <span>
                              Tất cả {sessions.length} buổi làm của {activeTxn.providerName} đã đạt 100% hoàn thành!
                            </span>
                          </div>
                          {isExecutionMode && activeTxn.workSchedule?.type === 'recurring' && (
                            <button
                              type="button"
                              onClick={() => {
                                const res = appendNextRecurringSession(activeTxn.id);
                                showBanner(res.success ? 'success' : 'error', res.message);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-emerald-600 text-emerald-800 dark:text-emerald-300 font-bold inline-flex items-center gap-1.5 whitespace-nowrap"
                            >
                              <CalendarPlus className="w-4 h-4" />
                              <span>Mở thêm ngày lặp lại tiếp theo</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* 3. Upcoming Scheduled Dates Preview */}
                      {upcomingSessions.length > 0 && (
                        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                              Các ngày dự kiến tiếp theo ({upcomingSessions.length} buổi)
                            </p>
                            {isExecutionMode && activeTxn.workSchedule?.type === 'recurring' && (
                              <button
                                type="button"
                                onClick={() => {
                                  const res = appendNextRecurringSession(activeTxn.id);
                                  showBanner(res.success ? 'success' : 'error', res.message);
                                }}
                                className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                              >
                                <CalendarPlus className="w-3.5 h-3.5" />
                                <span>+ Thêm buổi lặp</span>
                              </button>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-slate-400 tabular-nums">
                            {upcomingSessions.map((u) => (
                              <span key={u.id}>
                                Buổi {u.sessionIndex}: {formatDateVN(u.scheduledDate)} (0%)
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* SINGLE-TIME TASK (100% = COMPLETE) */
                    renderSessionWorkspaceCard(
                      activeTxn,
                      sessions[0],
                      isExecutionMode && activeTxn.status !== 'completed',
                      false,
                      false
                    )
                  )}

                  {/* Recent Activity Footer */}
                  {activeTxn.progressUpdates && activeTxn.progressUpdates.length > 0 && (
                    <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Lịch sử cập nhật gần đây
                      </p>
                      <div className="space-y-1.5">
                        {[...activeTxn.progressUpdates]
                          .reverse()
                          .slice(0, 4)
                          .map((log) => (
                            <div
                              key={log.id}
                              className="text-xs text-slate-600 dark:text-slate-300 flex flex-wrap items-baseline justify-between gap-2 py-1 border-b border-slate-100 dark:border-slate-800 last:border-0"
                            >
                              <span>
                                <strong className="tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                                  [{log.percent}%]
                                </strong>{' '}
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {log.stepLabel}
                                </span>
                                {log.note ? ` — ${log.note}` : ''}
                              </span>
                              <span className="text-[11px] tabular-nums text-slate-400 shrink-0">
                                {formatDateTimeVN(log.timestamp)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}
        </>
      ) : post && post.type === 'supply' && post.authorId === currentUser.id ? (
        /* SUPPLY POST AUTHOR TEMPLATE EDITOR (NO CONTRACTS YET) */
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="space-y-1">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Thiết lập khung tiến trình & mô tả hành động mặc định
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Bài cung cấp dịch vụ này chưa có khách đặt hợp đồng. Bạn có thể soạn sẵn các bước và mô tả hành động cụ thể; khi khách tham gia, hệ thống sẽ áp dụng tự động.
            </p>
          </div>

          <div className="space-y-3">
            {templateDraft.milestones.map((step, idx) => (
              <div
                key={step.id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs tabular-nums font-bold text-emerald-700 dark:text-emerald-400">
                    B{idx + 1}
                  </span>
                  <input
                    type="text"
                    value={step.title}
                    onChange={(e) =>
                      setTemplateDraft((prev) => ({
                        ...prev,
                        milestones: prev.milestones.map((m) =>
                          m.id === step.id ? { ...m, title: e.target.value } : m
                        ),
                      }))
                    }
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white"
                  />
                  {templateDraft.milestones.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setTemplateDraft((prev) => ({
                          ...prev,
                          milestones: prev.milestones.filter((m) => m.id !== step.id),
                        }))
                      }
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  value={step.actionDetail || ''}
                  onChange={(e) =>
                    setTemplateDraft((prev) => ({
                      ...prev,
                      milestones: prev.milestones.map((m) =>
                        m.id === step.id ? { ...m, actionDetail: e.target.value } : m
                      ),
                    }))
                  }
                  placeholder="Mô tả chi tiết hành động sẽ thực hiện cho bước này..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300"
                />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={templateDraft.newTitle}
              onChange={(e) => setTemplateDraft((prev) => ({ ...prev, newTitle: e.target.value }))}
              placeholder="Tên bước mới..."
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
            <input
              type="text"
              value={templateDraft.newDetail}
              onChange={(e) => setTemplateDraft((prev) => ({ ...prev, newDetail: e.target.value }))}
              placeholder="Mô tả chi tiết hành động..."
              className="px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!templateDraft.newTitle.trim()) return;
                setTemplateDraft((prev) => ({
                  milestones: [
                    ...prev.milestones,
                    {
                      id: `tpl-${Date.now()}`,
                      title: prev.newTitle.trim(),
                      actionDetail: prev.newDetail.trim(),
                      completed: false,
                    },
                  ],
                  newTitle: '',
                  newDetail: '',
                }));
              }}
              className="w-full sm:w-auto min-h-[40px] px-3.5 py-2 rounded-xl border border-emerald-600 text-emerald-800 dark:text-emerald-300 text-xs font-bold inline-flex items-center justify-center gap-1 whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Thêm bước</span>
            </button>

            <button
              type="button"
              onClick={() => {
                const res = updatePostDefaultMilestones(post.id, templateDraft.milestones);
                showBanner(res.success ? 'success' : 'error', res.message);
              }}
              className="w-full sm:w-auto min-h-[40px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Save className="w-4 h-4" />
              <span>Lưu khung tiến trình mặc định</span>
            </button>
          </div>
        </div>
      ) : (
        /* DEMAND POST WITHOUT CONFIRMED PARTNERS YET */
        <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <Lock className="w-7 h-7 text-slate-400 mx-auto" />
          <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Chưa có người thực hiện nào được xác nhận cho bài đăng này
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
            {waitingApps.length > 0
              ? `Hiện có ${waitingApps.length} đối tác trong danh sách chờ. Hãy mở bài đăng gốc để xác nhận chọn đối tác và khởi tạo bảng tiến trình.`
              : 'Khi có đối tác đăng ký và được xác nhận, bảng tiến trình chi tiết từng người sẽ xuất hiện tại đây.'}
          </p>
          {post && (
            <button
              type="button"
              onClick={() => setSelectedPost(post)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
            >
              Mở bài đăng gốc
            </button>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewTargetTxn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Đánh giá đối tác · {reviewTargetTxn.contractCode}
            </h3>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setReviewRating(star)}
                  className="p-1"
                >
                  <Star
                    className={`w-7 h-7 ${
                      star <= reviewRating
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-slate-300 dark:text-slate-700'
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Nhận xét về chất lượng, đúng hẹn và thái độ làm việc..."
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
            />
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setReviewTargetTxn(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={handleSubmitReview}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
              >
                Gửi đánh giá
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
