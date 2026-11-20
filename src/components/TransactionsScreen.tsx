import React, { useState, useMemo, useEffect } from 'react';
import { useAgri } from '../context/AgriContext';
import { formatWorkScheduleSummary, formatDateVN } from '../utils/formatters';
import {
  ChevronRight,
  Lock,
  LogIn,
  UserPlus,
  CheckCircle2,
  Image as ImageIcon,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { AgriTransaction, ServicePost } from '../types';
import { TransactionDetailPage } from './TransactionDetailPage';

type SourceTab = 'posted' | 'collaborated' | 'all_admin';
type AccessModeFilter = 'all' | 'execute' | 'view';
type CompletionFilter = 'all' | 'incomplete' | 'completed';

interface CompactStripItem {
  id: string;
  post?: ServicePost;
  linkedTxns: AgriTransaction[];
  initialTxnId?: string;
  title: string;
  imageUrl?: string;
  executorName: string;
  executorPhone: string;
  scheduleText: string;
  mode: 'execute' | 'view';
  isCompleted: boolean;
  progressPercent: number;
  doneExecutors: number;
  totalExecutors: number;
  waitingAppsCount: number;
  isWaitingAppOnly?: boolean;
}

const CompactThumb: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [failed, setFailed] = useState(false);
  return (
    <div className="w-11 h-11 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <ImageIcon className="w-4 h-4 text-slate-400" />
      )}
    </div>
  );
};

export const TransactionsScreen: React.FC = () => {
  const {
    posts,
    applications,
    transactions,
    currentUser,
    isAuthenticated,
    openAuthModal,
    setSelectedPost,
    setActiveTab,
    pendingTransactionFocus,
    setPendingTransactionFocus,
  } = useAgri();

  const [sourceTab, setSourceTab] = useState<SourceTab>('posted');
  const [modeFilter, setModeFilter] = useState<AccessModeFilter>('all');
  const [completionFilter, setCompletionFilter] = useState<CompletionFilter>('all');
  const [openedSelection, setOpenedSelection] = useState<{
    postId?: string;
    txnId?: string;
  } | null>(null);

  useEffect(() => {
    if (pendingTransactionFocus && (pendingTransactionFocus.postId || pendingTransactionFocus.txnId)) {
      const matchedTxn = pendingTransactionFocus.txnId
        ? transactions.find((t) => t.id === pendingTransactionFocus.txnId)
        : undefined;
      setOpenedSelection({
        postId: pendingTransactionFocus.postId || matchedTxn?.postId,
        txnId: pendingTransactionFocus.txnId,
      });
      setPendingTransactionFocus(null);
      document.getElementById('app-main-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [pendingTransactionFocus, transactions, setPendingTransactionFocus]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4">
        <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6 text-emerald-700 dark:text-emerald-400" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
              Đăng nhập để quản lý Giao dịch & Tiến trình
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Theo dõi các bài đã đăng, bài đã hợp tác, cập nhật chi tiết tiến trình từng buổi và trao đổi trực tiếp với đối tác.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 sm:max-w-sm sm:mx-auto">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="w-full min-h-[42px] px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <LogIn className="w-4 h-4 shrink-0" />
              <span>Đăng nhập ngay</span>
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="w-full min-h-[42px] px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white text-xs font-bold flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>Đăng ký tài khoản</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Helper: check if currentUser is authorized to execute/update progress on a transaction
  const isUserExecutorOfTxn = (txn: AgriTransaction): boolean => {
    const updaterId =
      txn.progressUpdaterId ||
      (txn.originPostType === 'demand' ? txn.participantId : txn.postAuthorId);
    return updaterId === currentUser.id;
  };

  // Build normalized strip items for "Bài đã đăng"
  const postedItems: CompactStripItem[] = useMemo(() => {
    const myPosts = posts.filter((p) => p.authorId === currentUser.id);
    return myPosts.map((post) => {
      const linkedTxns = transactions.filter(
        (t) => t.postId === post.id && t.status !== 'cancelled'
      );
      const waitingApps = applications.filter(
        (a) => a.postId === post.id && a.status === 'waiting'
      );
      const doneCount = linkedTxns.filter((t) => t.status === 'completed').length;
      const expectedSlots = post.isJointVenture
        ? Math.max(linkedTxns.length, post.maxPartners || post.jointVentureTasks?.length || 1)
        : Math.max(1, linkedTxns.length);
      const isCompleted =
        linkedTxns.length > 0 &&
        doneCount === linkedTxns.length &&
        (!post.isJointVenture || linkedTxns.length >= expectedSlots);
      const avgPct =
        linkedTxns.length > 0
          ? Math.round(
              linkedTxns.reduce((sum, t) => sum + (t.progressPercent || 0), 0) / linkedTxns.length
            )
          : 0;

      // Supply post author is in Execution Mode; Demand post author is in View Mode
      const mode: 'execute' | 'view' = post.type === 'supply' ? 'execute' : 'view';

      const primaryTxn = linkedTxns[0];
      const executorName =
        linkedTxns.length > 1
          ? `${linkedTxns.length} người thực hiện`
          : primaryTxn
          ? primaryTxn.providerName
          : post.type === 'supply'
          ? post.authorName
          : waitingApps.length > 0
          ? `${waitingApps.length} ứng viên chờ duyệt`
          : 'Chưa có người thực hiện';

      const executorPhone =
        linkedTxns.length === 1 && primaryTxn
          ? primaryTxn.providerPhone
          : post.type === 'supply'
          ? post.authorPhone
          : primaryTxn?.providerPhone || post.authorPhone;

      const scheduleText =
        primaryTxn?.sessionProgress && primaryTxn.sessionProgress.length > 1
          ? `${primaryTxn.sessionProgress.filter((s) => s.status === 'completed').length}/${primaryTxn.sessionProgress.length} buổi · ${formatDateVN(
              (
                primaryTxn.sessionProgress.find((s) => s.status !== 'completed') ||
                primaryTxn.sessionProgress[primaryTxn.sessionProgress.length - 1]
              ).scheduledDate
            )}`
          : formatWorkScheduleSummary(primaryTxn || post);

      return {
        id: `post:${post.id}`,
        post,
        linkedTxns,
        initialTxnId: primaryTxn?.id,
        title: post.title,
        imageUrl: post.imageUrl,
        executorName,
        executorPhone,
        scheduleText,
        mode,
        isCompleted,
        progressPercent: avgPct,
        doneExecutors: doneCount,
        totalExecutors: linkedTxns.length,
        waitingAppsCount: waitingApps.length,
      };
    });
  }, [posts, transactions, applications, currentUser.id]);

  // Build normalized strip items for "Bài đã hợp tác" (group sibling contracts of the same post together so multi-executor tabs work seamlessly!)
  const collaboratedItems: CompactStripItem[] = useMemo(() => {
    const myCollabTxns = transactions.filter((t) => {
      const isMyOwnPost = t.postAuthorId === currentUser.id;
      const isParticipant =
        t.participantId === currentUser.id ||
        (!isMyOwnPost && (t.farmerId === currentUser.id || t.providerId === currentUser.id));
      return isParticipant && !isMyOwnPost && t.status !== 'cancelled';
    });

    // Group by postId (for joint venture / multi-partner posts, include all sibling txns on that post so tabs show all executors!)
    const seenPostIds = new Set<string>();
    const items: CompactStripItem[] = [];

    myCollabTxns.forEach((txn) => {
      if (seenPostIds.has(txn.postId)) return;
      seenPostIds.add(txn.postId);

      const parentPost = posts.find((p) => p.id === txn.postId);
      const isMultiPartnerPost = Boolean(parentPost?.isJointVenture || txn.isJointVenture);
      const groupTxns = isMultiPartnerPost
        ? transactions.filter((t) => t.postId === txn.postId && t.status !== 'cancelled')
        : myCollabTxns.filter((t) => t.postId === txn.postId);

      const myPrimaryTxn =
        groupTxns.find((t) => isUserExecutorOfTxn(t)) ||
        groupTxns.find((t) => t.participantId === currentUser.id || t.farmerId === currentUser.id) ||
        txn;

      const doneCount = groupTxns.filter((t) => t.status === 'completed').length;
      const expectedSlots = parentPost?.isJointVenture
        ? Math.max(groupTxns.length, parentPost.maxPartners || parentPost.jointVentureTasks?.length || 1)
        : groupTxns.length;
      const isCompleted =
        groupTxns.length > 0 &&
        doneCount === groupTxns.length &&
        (!parentPost?.isJointVenture || groupTxns.length >= expectedSlots);
      const avgPct = Math.round(
        groupTxns.reduce((sum, t) => sum + (t.progressPercent || 0), 0) / Math.max(1, groupTxns.length)
      );

      const mode: 'execute' | 'view' = groupTxns.some((t) => isUserExecutorOfTxn(t))
        ? 'execute'
        : 'view';

      const executorName =
        groupTxns.length > 1
          ? `${groupTxns.length} người thực hiện (${doneCount}/${groupTxns.length} xong)`
          : myPrimaryTxn.providerName;

      const scheduleText =
        myPrimaryTxn.sessionProgress && myPrimaryTxn.sessionProgress.length > 1
          ? `${myPrimaryTxn.sessionProgress.filter((s) => s.status === 'completed').length}/${myPrimaryTxn.sessionProgress.length} buổi · ${formatDateVN(
              (
                myPrimaryTxn.sessionProgress.find((s) => s.status !== 'completed') ||
                myPrimaryTxn.sessionProgress[myPrimaryTxn.sessionProgress.length - 1]
              ).scheduledDate
            )}`
          : formatWorkScheduleSummary(myPrimaryTxn);

      items.push({
        id: `collab:${txn.postId}`,
        post: parentPost,
        linkedTxns: groupTxns,
        initialTxnId: myPrimaryTxn.id,
        title: parentPost?.title || myPrimaryTxn.serviceName,
        imageUrl: parentPost?.imageUrl,
        executorName,
        executorPhone: myPrimaryTxn.providerPhone,
        scheduleText,
        mode,
        isCompleted,
        progressPercent: avgPct,
        doneExecutors: doneCount,
        totalExecutors: groupTxns.length,
        waitingAppsCount: 0,
      });
    });

    // Also include waiting demand applications submitted by currentUser
    const myWaitingApps = applications.filter(
      (a) => a.applicantId === currentUser.id && a.status === 'waiting' && !seenPostIds.has(a.postId)
    );
    myWaitingApps.forEach((app) => {
      const parentPost = posts.find((p) => p.id === app.postId);
      if (!parentPost) return;
      items.push({
        id: `wait:${app.id}`,
        post: parentPost,
        linkedTxns: [],
        title: parentPost.title,
        imageUrl: parentPost.imageUrl,
        executorName: `Đang chờ ${parentPost.authorName} duyệt`,
        executorPhone: parentPost.authorPhone,
        scheduleText: formatWorkScheduleSummary(parentPost),
        mode: 'execute',
        isCompleted: false,
        progressPercent: 0,
        doneExecutors: 0,
        totalExecutors: 0,
        waitingAppsCount: 1,
        isWaitingAppOnly: true,
      });
    });

    return items;
  }, [posts, transactions, applications, currentUser.id]);

  // Admin All Platform Items
  const adminAllItems: CompactStripItem[] = useMemo(() => {
    if (currentUser.role !== 'admin') return [];
    const postIds = Array.from(new Set(transactions.map((t) => t.postId)));
    return postIds.map((pid) => {
      const groupTxns = transactions.filter((t) => t.postId === pid && t.status !== 'cancelled');
      const parentPost = posts.find((p) => p.id === pid);
      const first = groupTxns[0];
      const doneCount = groupTxns.filter((t) => t.status === 'completed').length;
      const isCompleted = groupTxns.length > 0 && doneCount === groupTxns.length;
      const avgPct =
        groupTxns.length > 0
          ? Math.round(groupTxns.reduce((s, t) => s + (t.progressPercent || 0), 0) / groupTxns.length)
          : 0;
      return {
        id: `admin:${pid}`,
        post: parentPost,
        linkedTxns: groupTxns,
        initialTxnId: first?.id,
        title: parentPost?.title || first?.serviceName || 'Hợp đồng dịch vụ',
        imageUrl: parentPost?.imageUrl,
        executorName:
          groupTxns.length > 1
            ? `${groupTxns.length} người thực hiện`
            : first?.providerName || 'Chưa xác định',
        executorPhone: first?.providerPhone || parentPost?.authorPhone || '',
        scheduleText: first ? formatWorkScheduleSummary(first) : 'Linh hoạt',
        mode: groupTxns.some((t) => isUserExecutorOfTxn(t)) ? 'execute' : 'view',
        isCompleted,
        progressPercent: avgPct,
        doneExecutors: doneCount,
        totalExecutors: groupTxns.length,
        waitingAppsCount: 0,
      };
    });
  }, [posts, transactions, currentUser.role, currentUser.id]);

  // If user clicked a strip -> open dedicated standalone TransactionDetailPage!
  if (openedSelection) {
    const targetPost = openedSelection.postId
      ? posts.find((p) => p.id === openedSelection.postId)
      : undefined;
    const allPostTxns = openedSelection.postId
      ? transactions.filter((t) => t.postId === openedSelection.postId && t.status !== 'cancelled')
      : [];

    // Filter linked transactions visible to the current user (for Joint Venture or author/admin, show all partner tabs on that post)
    const visibleTxns = targetPost?.isJointVenture ||
      targetPost?.authorId === currentUser.id ||
      currentUser.role === 'admin'
      ? allPostTxns
      : allPostTxns.filter(
          (t) =>
            t.farmerId === currentUser.id ||
            t.providerId === currentUser.id ||
            t.participantId === currentUser.id ||
            t.id === openedSelection.txnId
        );

    return (
      <TransactionDetailPage
        post={targetPost}
        linkedTxns={visibleTxns}
        initialTxnId={openedSelection.txnId}
        onBack={() => setOpenedSelection(null)}
      />
    );
  }

  const baseList =
    sourceTab === 'posted'
      ? postedItems
      : sourceTab === 'collaborated'
      ? collaboratedItems
      : adminAllItems;

  const filteredItems = baseList.filter((item) => {
    if (modeFilter !== 'all' && item.mode !== modeFilter) return false;
    if (completionFilter === 'completed' && !item.isCompleted) return false;
    if (completionFilter === 'incomplete' && item.isCompleted) return false;
    return true;
  });

  // Dynamic counts for secondary filters
  const countExecute = baseList.filter((i) => i.mode === 'execute').length;
  const countView = baseList.filter((i) => i.mode === 'view').length;
  const countIncomplete = baseList.filter(
    (i) => (modeFilter === 'all' || i.mode === modeFilter) && !i.isCompleted
  ).length;
  const countCompleted = baseList.filter(
    (i) => (modeFilter === 'all' || i.mode === modeFilter) && i.isCompleted
  ).length;

  const handleOpenStrip = (item: CompactStripItem) => {
    if (item.isWaitingAppOnly && item.post) {
      setSelectedPost(item.post);
      return;
    }
    setOpenedSelection({
      postId: item.post?.id || item.linkedTxns[0]?.postId,
      txnId: item.initialTxnId,
    });
    document.getElementById('app-main-scroll')?.scrollTo({ top: 0, behavior: 'smooth' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="progress-typo space-y-5 pb-24">
      {/* Top Header + Primary Source Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-tight">
            Quản Lý Giao Dịch & Tiến Trình
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-snug">
            Nhấn vào từng thanh để mở trang tiến trình chi tiết, theo dõi đa người thực hiện và nhắn tin trực tiếp.
          </p>
        </div>

        {/* Primary Split: Bài đã đăng / Bài đã hợp tác (NO "mình") */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto sm:self-start">
          <button
            type="button"
            onClick={() => setSourceTab('posted')}
            className={`flex-1 sm:flex-initial min-h-[38px] px-2.5 sm:px-3.5 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap text-center ${
              sourceTab === 'posted'
                ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Bài đã đăng ({postedItems.length})
          </button>
          <button
            type="button"
            onClick={() => setSourceTab('collaborated')}
            className={`flex-1 sm:flex-initial min-h-[38px] px-2.5 sm:px-3.5 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap text-center ${
              sourceTab === 'collaborated'
                ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Bài đã hợp tác ({collaboratedItems.length})
          </button>
          {currentUser.role === 'admin' && (
            <button
              type="button"
              onClick={() => setSourceTab('all_admin')}
              className={`flex-1 sm:flex-initial min-h-[38px] px-2 sm:px-3 py-2 rounded-lg text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap text-center ${
                sourceTab === 'all_admin'
                  ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Toàn sàn ({adminAllItems.length})
            </button>
          )}
        </div>
      </div>

      {/* Secondary Sub-Filter Toolbar: Mode (Quản lí / Xem) & Completion (Chưa hoàn thành / Đã hoàn thành) */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2 p-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        {/* Access Mode Segmented Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-1 w-full sm:w-auto">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">
            Chế độ:
          </span>
          <div className="grid grid-cols-3 sm:flex items-center gap-1">
            {[
              { id: 'all' as AccessModeFilter, label: `Tất cả (${baseList.length})` },
              { id: 'execute' as AccessModeFilter, label: `Quản lí (${countExecute})` },
              { id: 'view' as AccessModeFilter, label: `Xem (${countView})` },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setModeFilter(btn.id)}
                className={`min-h-[34px] px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap text-center truncate ${
                  modeFilter === btn.id
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Completion Status Segmented Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-1 w-full sm:w-auto">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 px-1">
            Nhiệm vụ:
          </span>
          <div className="grid grid-cols-3 sm:flex items-center gap-1">
            {[
              { id: 'all' as CompletionFilter, label: 'Tất cả' },
              { id: 'incomplete' as CompletionFilter, label: `Chưa xong (${countIncomplete})` },
              { id: 'completed' as CompletionFilter, label: `Hoàn thành (${countCompleted})` },
            ].map((btn) => (
              <button
                key={btn.id}
                type="button"
                onClick={() => setCompletionFilter(btn.id)}
                className={`min-h-[34px] px-2 sm:px-3 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold transition-colors whitespace-nowrap text-center truncate ${
                  completionFilter === btn.id
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Compact Slim Horizontal Strip List (NOT Accordion) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-8 sm:p-10 text-center space-y-3">
            <p className="font-bold text-sm text-slate-700 dark:text-slate-200">
              Không có giao dịch nào phù hợp với bộ lọc hiện tại
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {baseList.length > 0
                ? 'Hãy thử chuyển sang bộ lọc chế độ hoặc trạng thái khác để xem các nhiệm vụ.'
                : sourceTab === 'posted'
                ? 'Bạn chưa đăng bài dịch vụ nào. Hãy tạo bài đăng mới để theo dõi tiến trình tại đây.'
                : 'Bạn chưa tham gia hợp tác hợp đồng nào. Hãy vào Trang chủ để nhận việc hoặc đặt dịch vụ.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {(modeFilter !== 'all' || completionFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setModeFilter('all');
                    setCompletionFilter('all');
                  }}
                  className="min-h-[38px] px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Xóa bộ lọc</span>
                </button>
              )}
              {baseList.length === 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab(sourceTab === 'posted' ? 'create' : 'home')}
                  className="min-h-[38px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
                >
                  {sourceTab === 'posted' ? '+ Đăng bài ngay' : 'Khám phá Trang chủ'}
                </button>
              )}
            </div>
          </div>
        ) : (
          filteredItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleOpenStrip(item)}
              className="w-full px-3.5 sm:px-4 py-2.5 flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              {/* Small Thumbnail Image */}
              <CompactThumb src={item.imageUrl} alt={item.title} />

              {/* Compact 2-line Content Block */}
              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white truncate leading-snug">
                    {item.title}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700 shrink-0 hidden sm:inline">
                    ·
                  </span>
                  <span
                    className={`text-[11px] font-bold shrink-0 hidden sm:inline whitespace-nowrap ${
                      item.mode === 'execute'
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {item.mode === 'execute' ? 'Quản lí' : 'Chỉ xem'}
                  </span>
                </div>

                {/* Brief Metadata Line: Executor · Phone · Schedule */}
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 truncate leading-snug">
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[180px] sm:max-w-[240px]">
                    {item.executorName}
                  </span>
                  {item.executorPhone && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums shrink-0">{item.executorPhone}</span>
                    </>
                  )}
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums truncate">{item.scheduleText}</span>
                </div>
              </div>

              {/* Right Side: Compact Progress Indicator & Page Arrow */}
              <div className="flex items-center gap-2.5 shrink-0">
                {item.isWaitingAppOnly ? (
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 inline-flex items-center gap-1 whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Chờ duyệt</span>
                  </span>
                ) : item.totalExecutors === 0 ? (
                  <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap">
                    {item.waitingAppsCount > 0 ? `${item.waitingAppsCount} chờ duyệt` : 'Chưa có HĐ'}
                  </span>
                ) : item.isCompleted ? (
                  <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="text-xs font-bold tabular-nums whitespace-nowrap">
                      100%
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="hidden sm:block w-14 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${item.progressPercent}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold tabular-nums text-emerald-700 dark:text-emerald-400 w-9 text-right">
                      {item.progressPercent}%
                    </span>
                  </div>
                )}

                <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
