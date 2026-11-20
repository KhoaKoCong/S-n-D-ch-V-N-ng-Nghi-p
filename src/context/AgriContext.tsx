import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  UserProfile,
  ServiceCategory,
  ServicePost,
  AgriTransaction,
  WalletTransaction,
  TopUpRequest,
  ChatMessage,
  ReviewItem,
  AgriNotification,
  UserRole,
  AccountType,
  ContractApplication,
  ProgressMilestone,
  ProgressUpdateItem,
  ExtraCostItem,
  ServiceHiringMode,
  PaymentMode,
  PaymentPlan,
  SessionProgressRecord,
  WorkSchedule
} from '../types';
import {
  computeExtraCostsTotal,
  computeJointVentureSlotBreakdown,
  formatWorkScheduleSummary,
  buildContractSessionDates,
  computeNextRecurringDate,
  computeUpfrontPayment,
  formatDateVN
} from '../utils/formatters';
import {
  INITIAL_CATEGORIES,
  MOCK_USERS,
  INITIAL_POSTS,
  INITIAL_APPLICATIONS,
  INITIAL_TRANSACTIONS,
  INITIAL_WALLET_TRANSACTIONS,
  INITIAL_TOPUPS,
  INITIAL_CHATS,
  INITIAL_REVIEWS,
  INITIAL_NOTIFICATIONS
} from '../mockData';

interface AgriContextType {
  currentUser: UserProfile;
  isAuthenticated: boolean;
  allUsers: UserProfile[];
  setCurrentUserRole: (role: UserRole) => void;
  switchUser: (userId: string) => void;
  logoutUser: () => void;
  registerUser: (userData: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: UserRole;
    accountType?: AccountType;
    customAccountLabel?: string;
    province?: string;
    district?: string;
    address?: string;
    machineryType?: string;
    capacity?: string;
    authProvider?: 'credentials' | 'google';
  }) => { success: boolean; message: string; user?: UserProfile };
  loginUser: (emailOrPhone: string, password?: string) => { success: boolean; message: string; user?: UserProfile };
  deleteUser: (userId: string) => { success: boolean; message: string };
  showAuthModal: boolean;
  setShowAuthModal: (val: boolean) => void;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode: 'login' | 'register') => void;
  categories: ServiceCategory[];
  posts: ServicePost[];
  applications: ContractApplication[];
  transactions: AgriTransaction[];
  walletTransactions: WalletTransaction[];
  topupRequests: TopUpRequest[];
  chatMessages: ChatMessage[];
  reviews: ReviewItem[];
  notifications: AgriNotification[];
  providerWalletBalance: number; // Current active user's wallet balance
  getUserWalletBalance: (userId: string) => number;
  showOnboarding: boolean;
  setShowOnboarding: (val: boolean) => void;
  activeTab: 'home' | 'news' | 'create' | 'transactions' | 'profile' | 'admin';
  setActiveTab: (tab: 'home' | 'news' | 'create' | 'transactions' | 'profile' | 'admin') => void;
  selectedPost: ServicePost | null;
  setSelectedPost: (post: ServicePost | null) => void;
  editingPost: ServicePost | null;
  setEditingPost: (post: ServicePost | null) => void;
  selectedChatTxnId: string | null;
  setSelectedChatTxnId: (id: string | null) => void;
  pendingTransactionFocus: { postId?: string; txnId?: string } | null;
  setPendingTransactionFocus: (focus: { postId?: string; txnId?: string } | null) => void;
  showWalletModal: boolean;
  setShowWalletModal: (val: boolean) => void;
  showSyncModal: boolean;
  setShowSyncModal: (val: boolean) => void;
  
  // Actions
  createPost: (newPost: Omit<ServicePost, 'id' | 'createdAt' | 'authorRating' | 'authorVerified'>) => void;
  updatePost: (postId: string, updatedFields: Partial<Omit<ServicePost, 'id' | 'createdAt'>>) => { success: boolean; message: string };
  updatePostDefaultMilestones: (postId: string, milestones: ProgressMilestone[]) => { success: boolean; message: string };
  deletePost: (postId: string) => { success: boolean; message: string };
  applyForDemandPost: (
    postId: string,
    proposedNote?: string,
    options?: { targetTaskId?: string; targetTaskTitle?: string; proposedHiringMode?: ServiceHiringMode }
  ) => { success: boolean; message: string };
  confirmDemandApplicant: (
    postId: string,
    applicationId: string,
    overrideTaskId?: string,
    paymentOptions?: { mode: PaymentMode; depositPercent?: number }
  ) => { success: boolean; message: string; insufficientFunds?: boolean; required?: number; balance?: number; txnId?: string };
  joinSupplyPost: (
    postId: string,
    areaVolume: number,
    executionDate: string,
    workTerms: string,
    customExtraCosts?: ExtraCostItem[],
    paymentOptions?: { mode: PaymentMode; depositPercent?: number; workSchedule?: WorkSchedule }
  ) => { success: boolean; message: string; insufficientFunds?: boolean; required?: number; balance?: number; txnId?: string };
  updateContractProgress: (txnId: string, percent: number, stepLabel: string, note: string) => { success: boolean; message: string };
  saveContractMilestones: (
    txnId: string,
    milestones: ProgressMilestone[],
    note?: string,
    overridePercent?: number
  ) => { success: boolean; message: string };
  saveSessionProgress: (
    txnId: string,
    sessionId: string,
    milestones: ProgressMilestone[],
    summaryNote?: string
  ) => { success: boolean; message: string };
  appendNextRecurringSession: (txnId: string) => { success: boolean; message: string };
  settleTransactionPayment: (
    txnId: string,
    options?: { sessionId?: string }
  ) => { success: boolean; message: string; insufficientFunds?: boolean; required?: number; balance?: number };
  createTransactionFromPost: (post: ServicePost, areaVolume: number, executionDate: string, workTerms: string) => { success: boolean; error?: string; txnId?: string };
  updateTransactionStatus: (txnId: string, newStatus: AgriTransaction['status']) => { success: boolean; message: string };
  requestTopUp: (amount: number) => { success: boolean; request: TopUpRequest };
  confirmTopUpImmediate: (requestId: string) => { success: boolean; message: string; newBalance?: number };
  adminApproveTopUp: (requestId: string) => void;
  adminRejectTopUp: (requestId: string) => void;
  adminAddCategory: (category: Omit<ServiceCategory, 'id'>) => void;
  sendChatMessage: (txnId: string, text: string) => void;
  addReview: (txnId: string, targetUserId: string, rating: number, comment: string) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsReadForCurrentUser: () => void;
  updateUserProfile: (updatedData: Partial<UserProfile>) => { success: boolean; message: string };
  syncAllData: () => { success: boolean; message: string };
  restoreDefaultData: () => { success: boolean; message: string };
}

const AgriContext = createContext<AgriContextType | undefined>(undefined);

export const PLATFORM_FEE = 3000; // 3.000 VNĐ / giao dịch cộng thẳng về tài khoản sàn
export const PLATFORM_ACCOUNT_NUMBER = '104888853717';
export const PLATFORM_ACCOUNT_NAME = 'Huỳnh Công Khoa';

function buildDefaultMilestones(progressPercent = 0, template?: ProgressMilestone[]): ProgressMilestone[] {
  if (template && template.length > 0) {
    return template.map((m, i) => ({
      ...m,
      id: m.id || `ms-${Date.now()}-${i}`,
      actionDetail: m.actionDetail || '',
      completed: progressPercent === 100 ? true : Boolean(m.completed),
    }));
  }
  const baseSteps: { title: string; actionDetail: string }[] = [
    {
      title: 'Chuẩn bị thiết bị & khảo sát ruộng',
      actionDetail: 'Kiểm tra máy móc, nhiên liệu/vật tư và ranh thửa trước khi vận hành.',
    },
    {
      title: 'Triển khai công việc giai đoạn đầu',
      actionDetail: 'Thực hiện đợt thi công đầu tiên đúng quy trình kỹ thuật và tốc độ tiêu chuẩn.',
    },
    {
      title: 'Hoàn thành phần lớn khối lượng',
      actionDetail: 'Tiếp tục hoàn thiện phần diện tích còn lại, xử lý kỹ các góc bờ khó.',
    },
    {
      title: 'Nghiệm thu & bàn giao 100%',
      actionDetail: 'Kiểm tra kết quả thực tế cùng bên thuê và xác nhận hoàn tất buổi làm.',
    },
  ];
  const doneCount = Math.round((Math.max(0, Math.min(100, progressPercent)) / 100) * baseSteps.length);
  return baseSteps.map((step, idx) => ({
    id: `ms-init-${idx + 1}`,
    title: step.title,
    actionDetail: step.actionDetail,
    completed: idx < doneCount,
  }));
}

function buildInitialSessions(
  txnId: string,
  totalAmount: number,
  executionDate: string,
  workSchedule?: WorkSchedule,
  template?: ProgressMilestone[],
  initialPercent = 0,
  isCompleted = false,
  paymentMode: PaymentMode = 'full_upfront'
): SessionProgressRecord[] {
  const dates = buildContractSessionDates(workSchedule, executionDate, 12);
  const count = Math.max(1, dates.length);
  const baseShare = Math.floor(totalAmount / count);
  const remainder = totalAmount - baseShare * count;

  return dates.map((scheduledDate, idx) => {
    const isFirst = idx === 0;
    const sessionPct = isCompleted ? 100 : isFirst ? initialPercent : 0;
    const status: SessionProgressRecord['status'] = isCompleted
      ? 'completed'
      : isFirst
      ? 'in_progress'
      : 'pending';
    const sessionAmount = baseShare + (idx === 0 ? remainder : 0);
    return {
      id: `${txnId}-sess-${idx + 1}`,
      sessionIndex: idx + 1,
      scheduledDate,
      status,
      progressPercent: sessionPct,
      sessionAmount,
      paid: isCompleted && paymentMode !== 'per_session' ? true : isCompleted,
      completedAt: isCompleted ? new Date().toISOString() : undefined,
      milestones: buildDefaultMilestones(
        sessionPct,
        template?.map((m, mIdx) => ({
          ...m,
          id: `${txnId}-s${idx + 1}-m${mIdx + 1}`,
          completed: isCompleted ? true : isFirst ? Boolean(m.completed) : false,
        }))
      ),
    };
  });
}

function hydrateTransaction(t: AgriTransaction): AgriTransaction {
  const originPostType = t.originPostType || 'demand';
  const postAuthorId = t.postAuthorId || (originPostType === 'demand' ? t.farmerId : t.providerId);
  const participantId = t.participantId || (originPostType === 'demand' ? t.providerId : t.farmerId);
  const progressUpdaterId =
    t.progressUpdaterId || (originPostType === 'demand' ? participantId : postAuthorId);
  const progressPercent = typeof t.progressPercent === 'number'
    ? t.progressPercent
    : t.status === 'completed'
    ? 100
    : t.status === 'in_progress'
    ? 50
    : 0;
  const milestones =
    Array.isArray(t.progressMilestones) && t.progressMilestones.length > 0
      ? t.progressMilestones
      : buildDefaultMilestones(progressPercent);
  const escrowAmount = typeof t.escrowAmount === 'number' ? t.escrowAmount : t.totalAmount;
  const escrowReleased = typeof t.escrowReleased === 'boolean' ? t.escrowReleased : t.status === 'completed';
  const paymentPlan: PaymentPlan = t.paymentPlan || {
    mode: 'full_upfront',
    upfrontAmount: escrowAmount,
    releasedAmount: escrowReleased ? escrowAmount : 0,
    remainingAmount: escrowReleased ? 0 : Math.max(0, t.totalAmount - escrowAmount),
  };
  const sessionProgress =
    Array.isArray(t.sessionProgress) && t.sessionProgress.length > 0
      ? t.sessionProgress
      : buildInitialSessions(
          t.id,
          t.totalAmount,
          t.executionDate,
          t.workSchedule,
          milestones,
          progressPercent,
          t.status === 'completed',
          paymentPlan.mode
        );

  return {
    ...t,
    originPostType,
    postAuthorId,
    participantId,
    progressUpdaterId,
    progressPercent,
    progressStepTitle:
      t.progressStepTitle ||
      (progressPercent === 100 ? 'Hoàn thành 100% & Giải ngân' : `Đang thực hiện (${progressPercent}%)`),
    progressMilestones: milestones,
    sessionProgress,
    paymentPlan,
    progressUpdates: Array.isArray(t.progressUpdates) ? t.progressUpdates : [],
    escrowAmount,
    escrowReleased,
  };
}

export const AgriProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(() => {
    const saved = localStorage.getItem('agri_all_users');
    if (saved) {
      try {
        let parsed: UserProfile[] = JSON.parse(saved);
        if (!localStorage.getItem('agri_schema_v2')) {
          const mockList = Object.values(MOCK_USERS);
          const merged = [...parsed];
          mockList.forEach(mu => {
            const idx = merged.findIndex(u => u.id === mu.id);
            if (idx === -1) {
              if (mu.role === 'admin' && merged.some(u => u.role === 'admin')) return;
              merged.push(mu);
            } else if (!merged[idx].accountType) {
              merged[idx] = { ...merged[idx], accountType: mu.accountType };
            }
          });
          parsed = merged;
        }
        if (!localStorage.getItem('agri_schema_v8')) {
          parsed = parsed.map((u) =>
            u.id === 'user-admin' || u.role === 'admin'
              ? {
                  ...u,
                  name: u.name.includes('Quản Trị') || u.name.includes('Nguyễn Văn Thanh')
                    ? 'Huỳnh Công Khoa (Quản Trị Sàn)'
                    : u.name,
                  phone: PLATFORM_ACCOUNT_NUMBER,
                }
              : u
          );
        }
        return parsed;
      } catch {
        return Object.values(MOCK_USERS);
      }
    }
    return Object.values(MOCK_USERS);
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const saved = localStorage.getItem('agri_is_authenticated');
    if (saved === 'false') return false;
    return true;
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    const savedId = localStorage.getItem('agri_current_user_id');
    if (savedId) {
      const found = allUsers.find(u => u.id === savedId);
      if (found) return found;
    }
    return allUsers[0] || MOCK_USERS['user-farmer-1'];
  });

  const [currentRole, setCurrentRole] = useState<UserRole>('farmer');

  const [categories, setCategories] = useState<ServiceCategory[]>(() => {
    const saved = localStorage.getItem('agri_categories');
    if (saved) {
      try {
        const parsed: ServiceCategory[] = JSON.parse(saved);
        const isV4 = Boolean(localStorage.getItem('agri_schema_v4'));
        const merged = parsed.map((cat) => {
          const base = INITIAL_CATEGORIES.find((ic) => ic.id === cat.id);
          if (!base) return cat;
          const shouldUpgradeDefaults = !isV4 && ['cat-8', 'cat-9', 'cat-10', 'cat-11', 'cat-12', 'cat-13'].includes(cat.id);
          return {
            ...base,
            ...cat,
            demandLabel: base.demandLabel,
            supplyLabel: base.supplyLabel,
            supportedPostTypes: base.supportedPostTypes,
            pricingGroup: base.pricingGroup,
            supportsHiringMode: base.supportsHiringMode,
            suggestedExtras: base.suggestedExtras,
            defaultUnit: shouldUpgradeDefaults ? base.defaultUnit : cat.defaultUnit || base.defaultUnit,
            defaultPrice: shouldUpgradeDefaults ? base.defaultPrice : cat.defaultPrice || base.defaultPrice,
          };
        });
        INITIAL_CATEGORIES.forEach((base) => {
          if (!merged.some((m) => m.id === base.id)) {
            merged.push(base);
          }
        });
        return merged;
      } catch {
        return INITIAL_CATEGORIES;
      }
    }
    return INITIAL_CATEGORIES;
  });

  const [posts, setPosts] = useState<ServicePost[]>(() => {
    const saved = localStorage.getItem('agri_posts');
    if (saved) {
      try {
        let parsed: ServicePost[] = JSON.parse(saved);
        if (!localStorage.getItem('agri_schema_v5')) {
          const sampleJv = INITIAL_POSTS.find((p) => p.id === 'post-6');
          if (sampleJv && !parsed.some((p) => p.id === 'post-6')) {
            parsed = [sampleJv, ...parsed];
          }
        }
        if (!localStorage.getItem('agri_schema_v6')) {
          const sampleJv = INITIAL_POSTS.find((p) => p.id === 'post-6');
          parsed = parsed.map((p) => {
            if (p.id === 'post-6' && sampleJv) {
              return { ...sampleJv, status: p.status };
            }
            if (p.type === 'supply' && ['post-2', 'post-3', 'post-5'].includes(p.id)) {
              return { ...p, executionDate: '' };
            }
            return p;
          });
        }
        return parsed.map((p) => ({
          ...p,
          imageUrl:
            typeof p.imageUrl === 'string'
              ? p.imageUrl.replace(/^\/src\/assets\/images\//, '/images/')
              : p.imageUrl,
        }));
      } catch {
        return INITIAL_POSTS;
      }
    }
    return INITIAL_POSTS;
  });

  const [applications, setApplications] = useState<ContractApplication[]>(() => {
    const saved = localStorage.getItem('agri_applications');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_APPLICATIONS;
      }
    }
    return INITIAL_APPLICATIONS;
  });

  const [transactions, setTransactions] = useState<AgriTransaction[]>(() => {
    const saved = localStorage.getItem('agri_transactions');
    if (saved) {
      try {
        let parsed: AgriTransaction[] = JSON.parse(saved);
        if (!localStorage.getItem('agri_schema_v7')) {
          const sampleMap = new Map(INITIAL_TRANSACTIONS.map((s) => [s.id, s]));
          parsed = parsed.map((t) => {
            if (t.id === 'txn-2026-001' && !t.sessionProgress && sampleMap.has('txn-2026-001')) {
              return sampleMap.get('txn-2026-001')!;
            }
            return t;
          });
          ['txn-2026-jv-1', 'txn-2026-jv-2'].forEach((sid) => {
            const sample = sampleMap.get(sid);
            if (sample && !parsed.some((t) => t.id === sid)) {
              parsed.push(sample);
            }
          });
        }
        if (!localStorage.getItem('agri_schema_v8') || !localStorage.getItem('agri_schema_v9')) {
          parsed = parsed.map((t) => ({
            ...t,
            feeAmount: PLATFORM_FEE,
          }));
        }
        return parsed.map(hydrateTransaction);
      } catch {
        return INITIAL_TRANSACTIONS.map(hydrateTransaction);
      }
    }
    return INITIAL_TRANSACTIONS.map(hydrateTransaction);
  });

  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>(() => {
    const saved = localStorage.getItem('agri_wallet_txns');
    if (saved) {
      try {
        let parsed: WalletTransaction[] = JSON.parse(saved);
        if (!localStorage.getItem('agri_schema_v2')) {
          const merged = [...parsed];
          INITIAL_WALLET_TRANSACTIONS.forEach(wtx => {
            if (!merged.some(existing => existing.userId === wtx.userId)) {
              merged.push(wtx);
            }
          });
          parsed = merged;
        }
        if (!localStorage.getItem('agri_schema_v8')) {
          parsed = parsed.map((w) => ({
            ...w,
            description: w.description
              .replace(/0368666219/g, PLATFORM_ACCOUNT_NUMBER)
              .replace(/NGUYEN VAN THANH/gi, PLATFORM_ACCOUNT_NAME)
              .replace(/Nguyễn Văn Thanh/gi, PLATFORM_ACCOUNT_NAME),
          }));
          if (!parsed.some((w) => w.id === 'wtx-admin-fee-000')) {
            const adminSeedFee = INITIAL_WALLET_TRANSACTIONS.find((w) => w.id === 'wtx-admin-fee-000');
            if (adminSeedFee) parsed = [adminSeedFee, ...parsed];
          }
        }
        if (!localStorage.getItem('agri_schema_v9')) {
          parsed = parsed.map((w) => {
            if (w.id === 'wtx-003') {
              return {
                ...w,
                amount: -PLATFORM_FEE,
                balanceAfter: w.balanceBefore - PLATFORM_FEE,
                description: w.description.replace(/\+5\.000 ₫/g, '+3.000 ₫'),
              };
            }
            if (w.id === 'wtx-admin-fee-000') {
              return {
                ...w,
                amount: PLATFORM_FEE,
                balanceAfter: w.balanceBefore + PLATFORM_FEE,
                description: w.description.replace(/\+5\.000 ₫/g, '+3.000 ₫'),
              };
            }
            return w;
          });
        }
        return parsed;
      } catch {
        return INITIAL_WALLET_TRANSACTIONS;
      }
    }
    return INITIAL_WALLET_TRANSACTIONS;
  });

  const [topupRequests, setTopupRequests] = useState<TopUpRequest[]>(() => {
    const saved = localStorage.getItem('agri_topup_requests');
    if (saved) {
      try {
        let parsed: TopUpRequest[] = JSON.parse(saved);
        if (!localStorage.getItem('agri_schema_v8')) {
          parsed = parsed.map((r) => ({
            ...r,
            transferToPhone: PLATFORM_ACCOUNT_NUMBER,
            transferToName: PLATFORM_ACCOUNT_NAME,
          }));
        }
        return parsed;
      } catch {
        return INITIAL_TOPUPS;
      }
    }
    return INITIAL_TOPUPS;
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('agri_chat_msgs');
    return saved ? JSON.parse(saved) : INITIAL_CHATS;
  });

  const [reviews, setReviews] = useState<ReviewItem[]>(() => {
    const saved = localStorage.getItem('agri_reviews');
    return saved ? JSON.parse(saved) : INITIAL_REVIEWS;
  });

  const [notifications, setNotifications] = useState<AgriNotification[]>(() => {
    const saved = localStorage.getItem('agri_notifications');
    if (saved) {
      try {
        let parsed: AgriNotification[] = JSON.parse(saved);
        if (!localStorage.getItem('agri_schema_v8')) {
          parsed = parsed.map((n) => ({
            ...n,
            message: n.message
              .replace(/0368666219/g, PLATFORM_ACCOUNT_NUMBER)
              .replace(/NGUYEN VAN THANH/gi, PLATFORM_ACCOUNT_NAME)
              .replace(/Nguyễn Văn Thanh/gi, PLATFORM_ACCOUNT_NAME),
            targetTab:
              n.targetTab ||
              (n.type === 'contract' || n.type === 'chat'
                ? 'transactions'
                : n.type === 'order'
                ? 'home'
                : undefined),
            openWallet: n.openWallet ?? n.type === 'wallet',
          }));
          // Merge initial deep-linked notifications if missing so farmer/admin see clickable samples
          INITIAL_NOTIFICATIONS.forEach((seed) => {
            if (!parsed.some((p) => p.id === seed.id)) {
              parsed = [seed, ...parsed];
            }
          });
        }
        if (!localStorage.getItem('agri_schema_v9')) {
          parsed = parsed.map((n) =>
            n.id === 'notif-admin-1'
              ? {
                  ...n,
                  title: n.title.replace(/\+5\.000 ₫/g, '+3.000 ₫'),
                  message: n.message.replace(/\+5\.000 ₫/g, '+3.000 ₫'),
                }
              : n
          );
        }
        return parsed;
      } catch {
        return INITIAL_NOTIFICATIONS;
      }
    }
    return INITIAL_NOTIFICATIONS;
  });

  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return !localStorage.getItem('agri_onboarding_completed');
  });

  const [activeTab, setActiveTab] = useState<'home' | 'news' | 'create' | 'transactions' | 'profile' | 'admin'>('home');
  const [selectedPost, setSelectedPost] = useState<ServicePost | null>(null);
  const [editingPost, setEditingPost] = useState<ServicePost | null>(null);
  const [selectedChatTxnId, setSelectedChatTxnId] = useState<string | null>(null);
  const [pendingTransactionFocus, setPendingTransactionFocus] = useState<{ postId?: string; txnId?: string } | null>(null);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);

  const openAuthModal = (mode: 'login' | 'register') => {
    setAuthModalMode(mode);
    setShowAuthModal(true);
  };

  // Cross-tab real-time storage synchronization
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === 'agri_posts') setPosts(JSON.parse(e.newValue));
        if (e.key === 'agri_applications') setApplications(JSON.parse(e.newValue));
        if (e.key === 'agri_all_users') setAllUsers(JSON.parse(e.newValue));
        if (e.key === 'agri_transactions') setTransactions(JSON.parse(e.newValue));
        if (e.key === 'agri_wallet_txns') setWalletTransactions(JSON.parse(e.newValue));
        if (e.key === 'agri_categories') setCategories(JSON.parse(e.newValue));
        if (e.key === 'agri_current_user_id') {
          const user = allUsers.find(u => u.id === e.newValue);
          if (user) setCurrentUser(user);
        }
      } catch {}
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('agri_schema_v2', 'true');
    localStorage.setItem('agri_schema_v3', 'true');
    localStorage.setItem('agri_schema_v4', 'true');
    localStorage.setItem('agri_schema_v5', 'true');
    localStorage.setItem('agri_schema_v6', 'true');
    localStorage.setItem('agri_schema_v7', 'true');
    localStorage.setItem('agri_schema_v8', 'true');
    localStorage.setItem('agri_schema_v9', 'true');
  }, []);

  // Sync users to localStorage
  useEffect(() => {
    localStorage.setItem('agri_all_users', JSON.stringify(allUsers));
  }, [allUsers]);

  useEffect(() => {
    localStorage.setItem('agri_current_user_id', currentUser.id);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('agri_is_authenticated', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  // Switch to any existing or created user
  const switchUser = (userId: string) => {
    const target = allUsers.find(u => u.id === userId);
    if (target) {
      setCurrentUser(target);
      setCurrentRole(target.role);
      setIsAuthenticated(true);
    }
  };

  // Logout to Guest Mode cleanly while preserving all local accounts & data
  const logoutUser = () => {
    setIsAuthenticated(false);
    setSelectedChatTxnId(null);
    setShowWalletModal(false);
    if (activeTab === 'admin' || activeTab === 'create') {
      setActiveTab('home');
    }
  };

  // Sync role helper (backward compatible with quick role switcher)
  const setCurrentUserRole = (role: UserRole) => {
    // Find first user with that role
    const matching = allUsers.find(u => u.role === role);
    if (matching) {
      setCurrentUser(matching);
      setCurrentRole(role);
    } else {
      // Or update current user's role
      const updated: UserProfile = { ...currentUser, role };
      setCurrentUser(updated);
      setAllUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
    }
  };

  // Register new account (manual or Google Gmail)
  const registerUser = (userData: {
    name: string;
    email: string;
    phone: string;
    password?: string;
    role: UserRole;
    accountType?: AccountType;
    customAccountLabel?: string;
    province?: string;
    district?: string;
    address?: string;
    machineryType?: string;
    capacity?: string;
    authProvider?: 'credentials' | 'google';
  }): { success: boolean; message: string; user?: UserProfile } => {
    // Enforce strictly 1 Admin account on the platform
    if (userData.role === 'admin' || userData.accountType === 'admin') {
      const hasAdmin = allUsers.some(u => u.role === 'admin');
      if (hasAdmin) {
        return {
          success: false,
          message: 'Hệ thống chỉ cho phép duy nhất 1 tài khoản Quản trị viên (Admin). Vui lòng chọn loại tài khoản khác!'
        };
      }
    }

    // Check if email or phone already exists
    const existing = allUsers.find(
      u => (u.email && u.email.toLowerCase() === userData.email.toLowerCase()) || 
           (u.phone && userData.phone && u.phone === userData.phone)
    );

    if (existing) {
      return { success: false, message: 'Email hoặc Số điện thoại này đã được đăng ký tài khoản!' };
    }

    const resolvedAccountType: AccountType =
      userData.accountType ||
      (userData.role === 'admin' ? 'admin' : userData.role === 'provider' ? 'workshop_owner' : 'farmer');

    const newUserId = `user-${Date.now()}`;
    const avatarSeed = encodeURIComponent(userData.name);
    const newUser: UserProfile = {
      id: newUserId,
      name: userData.name,
      email: userData.email,
      phone: userData.phone || '0900000000',
      role: userData.role,
      accountType: resolvedAccountType,
      customAccountLabel: resolvedAccountType === 'custom' ? (userData.customAccountLabel?.trim() || 'Đối tác nông nghiệp') : undefined,
      address: userData.address || `${userData.district || 'Châu Thành'}, ${userData.province || 'An Giang'}`,
      province: userData.province || 'An Giang',
      district: userData.district || 'Châu Thành',
      avatarUrl: userData.authProvider === 'google' 
        ? `https://api.dicebear.com/7.x/bottts/svg?seed=${avatarSeed}`
        : `https://api.dicebear.com/7.x/avataaars/svg?seed=${avatarSeed}`,
      verified: true,
      businessName: (userData.role === 'provider' || resolvedAccountType === 'enterprise' || resolvedAccountType === 'workshop_owner')
        ? `Cơ sở ${userData.name}`
        : undefined,
      machineryType: userData.machineryType || (userData.role === 'provider' ? 'Drone DJI Agras & Máy Nông Nghiệp' : undefined),
      capacity: userData.capacity || (userData.role === 'provider' ? '30 ha/ngày' : undefined),
      serviceRadiusKm: userData.role === 'provider' ? 30 : undefined,
      experienceYears: userData.role === 'provider' ? 3 : undefined,
      rating: 5.0,
      reviewCount: 1,
      completedDeals: 0,
      password: userData.password,
      authProvider: userData.authProvider || 'credentials'
    };

    setAllUsers(prev => [newUser, ...prev]);
    setCurrentUser(newUser);
    setCurrentRole(newUser.role);
    setIsAuthenticated(true);

    // Every new account receives an initial starting wallet balance so balance is always visible & usable
    const startingBalance = resolvedAccountType === 'enterprise' ? 100000 : 50000;
    const initWalletTx: WalletTransaction = {
      id: `wtx-${Date.now()}`,
      userId: newUserId,
      amount: startingBalance,
      balanceBefore: 0,
      balanceAfter: startingBalance,
      type: 'topup',
      description: 'Tặng số dư khởi đầu kích hoạt tài khoản mới trên sàn',
      referenceId: 'WELCOME-GIFT',
      timestamp: new Date().toISOString()
    };
    setWalletTransactions(prev => [initWalletTx, ...prev]);

    const welcomeNotif: AgriNotification = {
      id: `notif-${Date.now()}`,
      userId: newUserId,
      title: 'Chào mừng gia nhập Sàn Dịch Vụ Nông Nghiệp',
      message: `Chào mừng ${newUser.name}! Tài khoản đã kích hoạt thành công với số dư khởi đầu ${startingBalance.toLocaleString('vi-VN')} ₫.`,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
      targetTab: 'profile',
    };
    setNotifications(prev => [welcomeNotif, ...prev]);

    return { success: true, message: 'Đăng ký tài khoản thành công!', user: newUser };
  };

  // Login with Email / Phone and Password (or Google Gmail mock)
  const loginUser = (emailOrPhone: string, password?: string): { success: boolean; message: string; user?: UserProfile } => {
    const found = allUsers.find(
      u => u.email.toLowerCase() === emailOrPhone.toLowerCase() || u.phone === emailOrPhone
    );

    if (!found) {
      return { success: false, message: 'Tài khoản không tồn tại trên hệ thống sàn!' };
    }

    if (password && found.password && found.password !== password) {
      return { success: false, message: 'Mật khẩu không chính xác, vui lòng kiểm tra lại!' };
    }

    setCurrentUser(found);
    setCurrentRole(found.role);
    setIsAuthenticated(true);
    return { success: true, message: 'Đăng nhập thành công!', user: found };
  };

  // Delete user account and cascade delete all their posts from home and platform
  const deleteUser = (userId: string): { success: boolean; message: string } => {
    const targetUser = allUsers.find(u => u.id === userId);
    if (!targetUser) {
      return { success: false, message: 'Tài khoản không tồn tại!' };
    }

    if (allUsers.length <= 1) {
      return { success: false, message: 'Hệ thống cần tối thiểu 1 tài khoản để vận hành sàn!' };
    }

    // 1. Cascade delete all posts created by this user and their applications
    setPosts(prev => prev.filter(p => p.authorId !== userId));
    setApplications(prev => prev.filter(a => a.applicantId !== userId));

    // 2. Clear selected post or editing post if it belonged to this user
    if (selectedPost && selectedPost.authorId === userId) {
      setSelectedPost(null);
    }
    if (editingPost && editingPost.authorId === userId) {
      setEditingPost(null);
    }

    // 3. Remove user from allUsers
    const remainingUsers = allUsers.filter(u => u.id !== userId);
    setAllUsers(remainingUsers);

    // 4. If current active user is the one deleted, switch to the first remaining user
    if (currentUser.id === userId) {
      const nextUser = remainingUsers[0];
      setCurrentUser(nextUser);
      setCurrentRole(nextUser.role);
    }

    return {
      success: true,
      message: `Đã xóa tài khoản "${targetUser.name}" và toàn bộ bài đăng liên quan khỏi sàn!`
    };
  };

  // Wallet balance helper for any user
  const getUserWalletBalance = (userId: string): number => {
    return walletTransactions
      .filter(tx => tx.userId === userId)
      .reduce((sum, tx) => sum + tx.amount, 0);
  };

  // Resolve platform owner account ID (Huỳnh Công Khoa · 104888853717)
  const getPlatformOwnerId = (): string => {
    return allUsers.find((u) => u.role === 'admin')?.id || 'user-admin';
  };

  // Current active user's wallet balance computed dynamically for ANY account
  const providerWalletBalance = getUserWalletBalance(currentUser.id);

  // Persist storage helpers
  useEffect(() => {
    localStorage.setItem('agri_posts', JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem('agri_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('agri_transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('agri_wallet_txns', JSON.stringify(walletTransactions));
  }, [walletTransactions]);

  useEffect(() => {
    localStorage.setItem('agri_topup_requests', JSON.stringify(topupRequests));
  }, [topupRequests]);

  useEffect(() => {
    localStorage.setItem('agri_chat_msgs', JSON.stringify(chatMessages));
  }, [chatMessages]);

  useEffect(() => {
    localStorage.setItem('agri_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('agri_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Update user profile and automatically cascade synchronization to their authored posts
  const updateUserProfile = (updatedData: Partial<UserProfile>): { success: boolean; message: string } => {
    const updatedUser: UserProfile = {
      ...currentUser,
      ...updatedData
    };

    setCurrentUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));

    // Cascade update to all posts authored by this user
    setPosts(prev => prev.map(post => {
      if (post.authorId === updatedUser.id) {
        return {
          ...post,
          authorName: updatedUser.name,
          authorPhone: updatedUser.phone,
          province: updatedData.province || post.province,
          district: updatedData.district || post.district,
          authorVerified: updatedUser.verified,
          authorRating: updatedUser.rating
        };
      }
      return post;
    }));

    if (selectedPost && selectedPost.authorId === updatedUser.id) {
      setSelectedPost({
        ...selectedPost,
        authorName: updatedUser.name,
        authorPhone: updatedUser.phone,
        province: updatedData.province || selectedPost.province,
        district: updatedData.district || selectedPost.district
      });
    }

    return {
      success: true,
      message: 'Thông tin cá nhân và bài đăng đã được đồng bộ hóa thành công!'
    };
  };

  // Synchronize all data across accounts and posts
  const syncAllData = (): { success: boolean; message: string } => {
    // 1. Re-sync all posts author info with current allUsers
    setPosts(prev => prev.map(post => {
      const author = allUsers.find(u => u.id === post.authorId);
      if (author) {
        return {
          ...post,
          authorName: author.name,
          authorPhone: author.phone,
          authorVerified: author.verified,
          authorRating: author.rating
        };
      }
      return post;
    }));

    // 2. Persist cleanly to localStorage
    localStorage.setItem('agri_posts', JSON.stringify(posts));
    localStorage.setItem('agri_all_users', JSON.stringify(allUsers));
    localStorage.setItem('agri_current_user_id', currentUser.id);

    return {
      success: true,
      message: 'Toàn bộ dữ liệu tài khoản, bài đăng và hợp đồng đã được đồng bộ mới nhất!'
    };
  };

  // Restore default sample data (re-populates rich initial demo posts, users, transactions)
  const restoreDefaultData = (): { success: boolean; message: string } => {
    const defaultUsers = Object.values(MOCK_USERS);
    setAllUsers(defaultUsers);
    setCurrentUser(MOCK_USERS['user-farmer-1']);
    setPosts(INITIAL_POSTS);
    setApplications(INITIAL_APPLICATIONS);
    setCategories(INITIAL_CATEGORIES);
    setTransactions(INITIAL_TRANSACTIONS);
    setWalletTransactions(INITIAL_WALLET_TRANSACTIONS);
    setTopupRequests(INITIAL_TOPUPS);
    setChatMessages(INITIAL_CHATS);
    setReviews(INITIAL_REVIEWS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setSelectedPost(null);
    setEditingPost(null);

    // Save to localStorage
    localStorage.setItem('agri_all_users', JSON.stringify(defaultUsers));
    localStorage.setItem('agri_current_user_id', 'user-farmer-1');
    localStorage.setItem('agri_posts', JSON.stringify(INITIAL_POSTS));
    localStorage.setItem('agri_applications', JSON.stringify(INITIAL_APPLICATIONS));
    localStorage.setItem('agri_categories', JSON.stringify(INITIAL_CATEGORIES));
    localStorage.setItem('agri_transactions', JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem('agri_wallet_txns', JSON.stringify(INITIAL_WALLET_TRANSACTIONS));
    localStorage.setItem('agri_topup_requests', JSON.stringify(INITIAL_TOPUPS));
    localStorage.setItem('agri_chat_msgs', JSON.stringify(INITIAL_CHATS));
    localStorage.setItem('agri_reviews', JSON.stringify(INITIAL_REVIEWS));
    localStorage.setItem('agri_notifications', JSON.stringify(INITIAL_NOTIFICATIONS));
    localStorage.setItem('agri_schema_v4', 'true');
    localStorage.setItem('agri_schema_v5', 'true');

    return {
      success: true,
      message: 'Đã khôi phục và đồng bộ lại toàn bộ dữ liệu gốc của Sàn Nông Nghiệp thành công!'
    };
  };

  // Create post
  const createPost = (newPostData: Omit<ServicePost, 'id' | 'createdAt' | 'authorRating' | 'authorVerified'>) => {
    const newPost: ServicePost = {
      ...newPostData,
      id: `post-${Date.now()}`,
      authorAccountType: currentUser.accountType,
      authorAccountLabel: currentUser.accountType === 'custom' ? currentUser.customAccountLabel : undefined,
      authorRating: currentUser.rating,
      authorVerified: currentUser.verified,
      createdAt: new Date().toISOString(),
    };
    setPosts(prev => [newPost, ...prev]);

    // Add notification
    const newNotif: AgriNotification = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: 'Đăng tin thành công',
      message: `Bài đăng "${newPost.title}" đã được duyệt và hiển thị trên sàn.`,
      type: 'order',
      read: false,
      createdAt: new Date().toISOString(),
      targetTab: 'home',
      targetPostId: newPost.id,
    };
    setNotifications(prev => [newNotif, ...prev]);
  };

  // Update existing post (STRICTLY author only)
  const updatePost = (postId: string, updatedFields: Partial<Omit<ServicePost, 'id' | 'createdAt'>>): { success: boolean; message: string } => {
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) {
      return { success: false, message: 'Không tìm thấy bài đăng để chỉnh sửa!' };
    }

    const targetPost = posts[postIndex];
    // Strict authorization: ONLY the creator of the post can edit it
    if (targetPost.authorId !== currentUser.id) {
      return { success: false, message: 'Chỉ tài khoản tạo bài đăng mới có quyền chỉnh sửa bài viết này!' };
    }

    const updatedPost: ServicePost = {
      ...targetPost,
      ...updatedFields,
    };

    setPosts(prev => prev.map(p => p.id === postId ? updatedPost : p));

    // If currently selected post is this one, update selectedPost as well
    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(updatedPost);
    }

    const notif: AgriNotification = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: 'Cập nhật bài đăng thành công',
      message: `Bài đăng "${updatedPost.title}" đã được lưu các thay đổi mới.`,
      type: 'order',
      read: false,
      createdAt: new Date().toISOString(),
      targetTab: 'home',
      targetPostId: updatedPost.id,
    };
    setNotifications(prev => [notif, ...prev]);

    return { success: true, message: 'Cập nhật bài đăng thành công!' };
  };

  // Delete post
  const deletePost = (postId: string): { success: boolean; message: string } => {
    const targetPost = posts.find(p => p.id === postId);
    if (!targetPost) {
      return { success: false, message: 'Bài đăng không tồn tại hoặc đã bị xóa!' };
    }

    // Authorization: author or admin
    if (currentUser.role !== 'admin' && targetPost.authorId !== currentUser.id) {
      return { success: false, message: 'Bạn không có quyền xóa bài đăng này!' };
    }

    setPosts(prev => prev.filter(p => p.id !== postId));
    setApplications(prev => prev.filter(a => a.postId !== postId));

    if (selectedPost && selectedPost.id === postId) {
      setSelectedPost(null);
    }

    if (editingPost && editingPost.id === postId) {
      setEditingPost(null);
    }

    const notif: AgriNotification = {
      id: `notif-${Date.now()}`,
      userId: currentUser.id,
      title: 'Đã xóa bài đăng',
      message: `Bài đăng "${targetPost.title}" đã được gỡ bỏ khỏi sàn giao dịch.`,
      type: 'order',
      read: false,
      createdAt: new Date().toISOString(),
    };
    setNotifications(prev => [notif, ...prev]);

    return { success: true, message: 'Đã xóa bài đăng thành công!' };
  };

  // 1. DEMAND POST WORKFLOW: Non-author applies to join the contract waitlist (single or multi-partner joint venture)
  const applyForDemandPost = (
    postId: string,
    proposedNote?: string,
    options?: { targetTaskId?: string; targetTaskTitle?: string; proposedHiringMode?: ServiceHiringMode }
  ): { success: boolean; message: string } => {
    const post = posts.find(p => p.id === postId);
    if (!post) {
      return { success: false, message: 'Không tìm thấy bài đăng yêu cầu dịch vụ!' };
    }
    if (post.type !== 'demand') {
      return { success: false, message: 'Chỉ bài đăng yêu cầu dịch vụ mới dùng danh sách chờ!' };
    }
    const maxPartners = post.isJointVenture ? Math.max(1, post.maxPartners || post.jointVentureTasks?.length || 1) : 1;
    const acceptedCount = applications.filter(a => a.postId === postId && a.status === 'accepted').length;
    if (post.status !== 'active' || acceptedCount >= maxPartners) {
      return { success: false, message: 'Bài đăng này đã đủ số lượng đối tác và đóng danh sách chờ.' };
    }
    if (post.authorId === currentUser.id) {
      return { success: false, message: 'Bạn là chủ bài đăng, không thể tự gửi yêu cầu tham gia!' };
    }

    const alreadyInList = applications.some(
      a => a.postId === postId && a.applicantId === currentUser.id && (a.status === 'waiting' || a.status === 'accepted')
    );
    if (alreadyInList) {
      return { success: false, message: 'Bạn đã gửi yêu cầu hoặc đã được duyệt tham gia bài đăng này rồi!' };
    }

    const matchedTask =
      post.isJointVenture && options?.targetTaskId
        ? post.jointVentureTasks?.find(t => t.id === options.targetTaskId)
        : post.isJointVenture && post.jointVentureTasks?.length
        ? post.jointVentureTasks[0]
        : undefined;

    const newApp: ContractApplication = {
      id: `app-${Date.now()}`,
      postId,
      applicantId: currentUser.id,
      applicantName: currentUser.name,
      applicantPhone: currentUser.phone,
      applicantRole: currentUser.role,
      applicantAccountType: currentUser.accountType,
      applicantAccountLabel: currentUser.customAccountLabel,
      applicantRating: currentUser.rating,
      targetTaskId: options?.targetTaskId || matchedTask?.id,
      targetTaskTitle: options?.targetTaskTitle || matchedTask?.categoryName,
      proposedHiringMode: options?.proposedHiringMode || matchedTask?.hiringMode || post.hiringMode,
      proposedNote: proposedNote?.trim() || 'Sẵn sàng nhận việc đúng tiến độ và đơn giá bài đăng.',
      status: 'waiting',
      createdAt: new Date().toISOString(),
    };

    setApplications(prev => [newApp, ...prev]);

    const notif: AgriNotification = {
      id: `notif-${Date.now()}`,
      userId: post.authorId,
      title: post.isJointVenture ? 'Có đối tác đăng ký hợp tác liên doanh' : 'Có người gửi yêu cầu tham gia hợp đồng',
      message: `${currentUser.name} đã đăng ký${newApp.targetTaskTitle ? ` công việc "${newApp.targetTaskTitle}"` : ''} vào danh sách chờ cho bài "${post.title}".`,
      type: 'order',
      read: false,
      createdAt: new Date().toISOString(),
      targetTab: 'home',
      targetPostId: post.id,
    };
    setNotifications(prev => [notif, ...prev]);

    return {
      success: true,
      message: 'Đã gửi yêu cầu tham gia hợp đồng vào danh sách chờ thành công!'
    };
  };

  // 2. DEMAND POST WORKFLOW: Author selects 1 applicant (or up to maxPartners in Joint Venture), pays according to chosen payment mode
  const confirmDemandApplicant = (
    postId: string,
    applicationId: string,
    overrideTaskId?: string,
    paymentOptions?: { mode: PaymentMode; depositPercent?: number }
  ): { success: boolean; message: string; insufficientFunds?: boolean; required?: number; balance?: number; txnId?: string } => {
    const post = posts.find(p => p.id === postId);
    if (!post || post.type !== 'demand') {
      return { success: false, message: 'Không tìm thấy bài đăng yêu cầu dịch vụ!' };
    }
    if (post.authorId !== currentUser.id) {
      return { success: false, message: 'Chỉ người đăng bài mới có quyền duyệt chọn người tham gia hợp đồng!' };
    }

    const acceptedApps = applications.filter(a => a.postId === postId && a.status === 'accepted');
    const maxPartners = post.isJointVenture ? Math.max(1, post.maxPartners || post.jointVentureTasks?.length || 1) : 1;
    if (post.status !== 'active' || acceptedApps.length >= maxPartners) {
      return { success: false, message: 'Bài đăng này đã chọn đủ số lượng đối tác và đóng danh sách chờ.' };
    }

    const app = applications.find(a => a.id === applicationId && a.postId === postId && a.status === 'waiting');
    if (!app) {
      return { success: false, message: 'Ứng viên không còn trong danh sách chờ hợp lệ!' };
    }

    const effectiveTaskId = overrideTaskId || app.targetTaskId;
    const slotBreakdown = computeJointVentureSlotBreakdown(post, effectiveTaskId, acceptedApps.length);
    const areaVolume = slotBreakdown.volume;
    const unitLabel = slotBreakdown.unit;
    const extraCostsTotal = slotBreakdown.extraShare;
    const totalAmount = slotBreakdown.totalAmount;
    const extraCosts: ExtraCostItem[] = !post.isJointVenture ? (post.extraCosts || []) : (
      extraCostsTotal > 0 ? [{ id: `jv-ex-${Date.now()}`, label: 'Phần vật tư/phụ phí phân bổ', amount: extraCostsTotal }] : []
    );

    const paymentMode: PaymentMode = paymentOptions?.mode || 'full_upfront';
    const depositPercent =
      paymentMode === 'deposit_percent'
        ? Math.max(10, Math.min(90, Math.round(paymentOptions?.depositPercent || 30)))
        : undefined;
    const upfrontAmount = computeUpfrontPayment(totalAmount, paymentMode, depositPercent);
    const totalUpfrontWithFee = upfrontAmount + PLATFORM_FEE;
    const authorBalance = getUserWalletBalance(currentUser.id);

    if (authorBalance < totalUpfrontWithFee) {
      return {
        success: false,
        insufficientFunds: true,
        required: totalUpfrontWithFee,
        balance: authorBalance,
        message: `Số dư ví không đủ! Cần ${totalUpfrontWithFee.toLocaleString('vi-VN')} ₫ (gồm phí giao dịch +3.000 ₫), hiện có ${authorBalance.toLocaleString('vi-VN')} ₫.`
      };
    }

    const txnId = `txn-${Date.now()}`;
    const contractCode = `HD-AGRI-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const resolvedTaskTitle = slotBreakdown.taskTitle || app.targetTaskTitle;
    const resolvedHiringMode = slotBreakdown.hiringMode || app.proposedHiringMode || post.hiringMode;
    const serviceLabel = resolvedTaskTitle ? `${post.categoryName} · ${resolvedTaskTitle}` : post.categoryName;

    const initialSessions = buildInitialSessions(
      txnId,
      totalAmount,
      post.executionDate,
      post.workSchedule,
      undefined,
      0,
      false,
      paymentMode
    );
    const perSessionAmount =
      paymentMode === 'per_session' ? Math.round(totalAmount / Math.max(1, initialSessions.length)) : undefined;

    const paymentPlan: PaymentPlan = {
      mode: paymentMode,
      depositPercent,
      upfrontAmount,
      releasedAmount: 0,
      remainingAmount: Math.max(0, totalAmount - upfrontAmount),
      perSessionAmount,
    };

    // Deduct upfront escrow (if any) + 3.000₫ transaction fee, and credit +3.000₫ straight into Huỳnh Công Khoa (104888853717)
    const ownerId = getPlatformOwnerId();
    const ownerBaseBalance = getUserWalletBalance(ownerId);
    const walletEntries: WalletTransaction[] = [];
    let runningAuthorBalance = authorBalance;

    if (upfrontAmount > 0) {
      walletEntries.push({
        id: `wtx-escrow-${Date.now()}`,
        userId: currentUser.id,
        amount: -upfrontAmount,
        balanceBefore: runningAuthorBalance,
        balanceAfter: runningAuthorBalance - upfrontAmount,
        type: 'contract_escrow',
        description:
          paymentMode === 'deposit_percent'
            ? `Đặt cọc ${depositPercent}% hợp đồng ${contractCode} (${serviceLabel}) - Giao cho ${app.applicantName}`
            : `Thanh toán tạm giữ 100% hợp đồng ${contractCode} (${serviceLabel}) - Giao cho ${app.applicantName}`,
        referenceId: txnId,
        timestamp: now,
      });
      runningAuthorBalance -= upfrontAmount;
    }

    walletEntries.unshift({
      id: `wtx-fee-payer-${Date.now() + 1}`,
      userId: currentUser.id,
      amount: -PLATFORM_FEE,
      balanceBefore: runningAuthorBalance,
      balanceAfter: runningAuthorBalance - PLATFORM_FEE,
      type: 'platform_fee',
      description: `Phí giao dịch sàn +3.000 ₫ (HĐ ${contractCode}) chuyển thẳng vào TK ${PLATFORM_ACCOUNT_NAME} (${PLATFORM_ACCOUNT_NUMBER})`,
      referenceId: `${txnId}-fee`,
      timestamp: now,
    });
    runningAuthorBalance -= PLATFORM_FEE;

    const ownerBefore = ownerId === currentUser.id ? runningAuthorBalance : ownerBaseBalance;
    walletEntries.unshift({
      id: `wtx-fee-owner-${Date.now() + 2}`,
      userId: ownerId,
      amount: PLATFORM_FEE,
      balanceBefore: ownerBefore,
      balanceAfter: ownerBefore + PLATFORM_FEE,
      type: 'platform_fee',
      description: `Thu phí giao dịch +3.000 ₫ (HĐ ${contractCode}) cộng thẳng vào TK ${PLATFORM_ACCOUNT_NAME} (${PLATFORM_ACCOUNT_NUMBER})`,
      referenceId: `${txnId}-owner-fee`,
      timestamp: now,
    });

    setWalletTransactions(prev => [...walletEntries, ...prev]);

    const payModeDesc =
      paymentMode === 'full_upfront'
        ? `thanh toán tạm giữ 100% (${upfrontAmount.toLocaleString('vi-VN')} ₫ + phí GD 3.000 ₫)`
        : paymentMode === 'deposit_percent'
        ? `đặt cọc ${depositPercent}% (${upfrontAmount.toLocaleString('vi-VN')} ₫ + phí GD 3.000 ₫), còn lại ${(totalAmount - upfrontAmount).toLocaleString('vi-VN')} ₫`
        : `trả từng buổi sau khi hoàn thành (${(perSessionAmount || totalAmount).toLocaleString('vi-VN')} ₫/buổi · phí GD 3.000 ₫)`;

    const newTxn: AgriTransaction = {
      id: txnId,
      contractCode,
      postId: post.id,
      originPostType: 'demand',
      postAuthorId: post.authorId,
      participantId: app.applicantId,
      progressUpdaterId: app.applicantId,
      serviceName: serviceLabel,
      hiringMode: resolvedHiringMode,
      isJointVenture: post.isJointVenture,
      jointVentureTaskTitle: resolvedTaskTitle,
      farmerId: post.authorId,
      farmerName: post.authorName,
      farmerPhone: post.authorPhone,
      providerId: app.applicantId,
      providerName: app.applicantName,
      providerPhone: app.applicantPhone,
      location: `${post.district}, ${post.province}`,
      executionDate: post.executionDate,
      workSchedule: post.workSchedule,
      scheduleSummary: post.workSchedule ? formatWorkScheduleSummary(post) : undefined,
      areaVolume,
      unit: unitLabel,
      unitPrice: slotBreakdown.unitPrice,
      extraCosts,
      extraCostsTotal,
      totalAmount,
      workTerms: post.requirements || post.description,
      status: 'in_progress',
      progressPercent: 0,
      progressStepTitle: `Buổi 1 (${formatDateVN(initialSessions[0].scheduledDate)}): Chờ người thực hiện cập nhật`,
      progressMilestones: initialSessions[0].milestones,
      sessionProgress: initialSessions,
      paymentPlan,
      progressUpdates: [
        {
          id: `prog-${Date.now()}`,
          percent: 0,
          stepLabel: 'Khởi tạo hợp đồng (0%)',
          note: `Chủ bài đăng ${post.authorName} đã chọn ${app.applicantName}${resolvedTaskTitle ? ` đảm nhận "${resolvedTaskTitle}"` : ''} và ${payModeDesc}.`,
          updatedById: currentUser.id,
          updatedByName: currentUser.name,
          timestamp: now,
        }
      ],
      escrowAmount: upfrontAmount,
      escrowReleased: false,
      feeDeducted: true,
      feeAmount: PLATFORM_FEE,
      createdAt: now,
    };

    setTransactions(prev => [newTxn, ...prev]);

    const newAcceptedCount = acceptedApps.length + 1;
    const shouldCloseWaitlist = newAcceptedCount >= maxPartners;

    setApplications(prev =>
      prev.map(a => {
        if (a.postId !== postId) return a;
        if (a.id === applicationId) {
          return {
            ...a,
            status: 'accepted',
            targetTaskId: effectiveTaskId || a.targetTaskId,
            targetTaskTitle: resolvedTaskTitle || a.targetTaskTitle,
          };
        }
        if (shouldCloseWaitlist && a.status === 'waiting') {
          return { ...a, status: 'declined' };
        }
        return a;
      })
    );

    if (shouldCloseWaitlist) {
      setPosts(prev => prev.map(p => (p.id === postId ? { ...p, status: 'in_negotiation' } : p)));
      if (selectedPost && selectedPost.id === postId) {
        setSelectedPost({ ...selectedPost, status: 'in_negotiation' });
      }
    }

    const notifParticipant: AgriNotification = {
      id: `notif-${Date.now()}-1`,
      userId: app.applicantId,
      title: 'Bạn đã được chọn tham gia hợp đồng',
      message: `${post.authorName} đã xác nhận bạn thực hiện hợp đồng ${contractCode} (${serviceLabel} · ${payModeDesc}). Bạn có thể ghi tiến trình chi tiết ngay!`,
      type: 'contract',
      read: false,
      createdAt: now,
      targetTab: 'transactions',
      targetPostId: post.id,
      targetTxnId: txnId,
    };
    const notifAuthor: AgriNotification = {
      id: `notif-${Date.now()}-2`,
      userId: post.authorId,
      title: 'Xác nhận hợp đồng thành công',
      message: `Đã xác nhận ${app.applicantName} cho hợp đồng ${contractCode} (${payModeDesc}).`,
      type: 'contract',
      read: false,
      createdAt: now,
      targetTab: 'transactions',
      targetPostId: post.id,
      targetTxnId: txnId,
    };
    const notifOwnerFee: AgriNotification = {
      id: `notif-${Date.now()}-3`,
      userId: ownerId,
      title: 'Cộng phí giao dịch +3.000 ₫',
      message: `Hợp đồng ${contractCode} vừa cộng thẳng +3.000 ₫ vào TK ${PLATFORM_ACCOUNT_NAME} (${PLATFORM_ACCOUNT_NUMBER}).`,
      type: 'wallet',
      read: false,
      createdAt: now,
      targetTab: 'admin',
      openWallet: true,
    };
    setNotifications(prev => [notifParticipant, notifAuthor, notifOwnerFee, ...prev]);

    return {
      success: true,
      txnId,
      message: `Đã xác nhận ${app.applicantName} tham gia hợp đồng ${contractCode} (${newAcceptedCount}/${maxPartners} đối tác) — ${payModeDesc}!`
    };
  };

  // 3. SUPPLY POST WORKFLOW: Participant fills details, chooses flexible payment mode, joins contract
  const joinSupplyPost = (
    postId: string,
    areaVolume: number,
    executionDate: string,
    workTerms: string,
    customExtraCosts?: ExtraCostItem[],
    paymentOptions?: { mode: PaymentMode; depositPercent?: number; workSchedule?: WorkSchedule }
  ): { success: boolean; message: string; insufficientFunds?: boolean; required?: number; balance?: number; txnId?: string } => {
    const post = posts.find(p => p.id === postId);
    if (!post || post.type !== 'supply') {
      return { success: false, message: 'Không tìm thấy bài đăng cung cấp dịch vụ!' };
    }
    if (post.authorId === currentUser.id) {
      return { success: false, message: 'Bạn là chủ bài đăng cung cấp dịch vụ, không thể tự tham gia hợp đồng của mình!' };
    }

    const validVolume = Math.max(1, Number(areaVolume) || 1);
    const resolvedExtras: ExtraCostItem[] = customExtraCosts !== undefined ? customExtraCosts : (post.extraCosts || []);
    const extraCostsTotal = computeExtraCostsTotal(resolvedExtras);
    const baseTotal = Math.round(validVolume * post.price);
    const totalAmount = baseTotal + extraCostsTotal;

    const paymentMode: PaymentMode = paymentOptions?.mode || 'full_upfront';
    const depositPercent =
      paymentMode === 'deposit_percent'
        ? Math.max(10, Math.min(90, Math.round(paymentOptions?.depositPercent || 30)))
        : undefined;
    const upfrontAmount = computeUpfrontPayment(totalAmount, paymentMode, depositPercent);
    const totalUpfrontWithFee = upfrontAmount + PLATFORM_FEE;
    const participantBalance = getUserWalletBalance(currentUser.id);

    if (participantBalance < totalUpfrontWithFee) {
      return {
        success: false,
        insufficientFunds: true,
        required: totalUpfrontWithFee,
        balance: participantBalance,
        message: `Số dư ví không đủ! Cần ${totalUpfrontWithFee.toLocaleString('vi-VN')} ₫ (gồm phí giao dịch +3.000 ₫), hiện có ${participantBalance.toLocaleString('vi-VN')} ₫.`
      };
    }

    const txnId = `txn-${Date.now()}`;
    const contractCode = `HD-AGRI-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const unitLabel = post.areaUnit || (post.pricingMode === 'vehicle' ? 'xe' : 'ha');
    const resolvedWorkSchedule = paymentOptions?.workSchedule || {
      type: 'single_day',
      singleDate: executionDate,
      totalOccurrences: 1,
    };

    const initialSessions = buildInitialSessions(
      txnId,
      totalAmount,
      executionDate,
      resolvedWorkSchedule,
      post.defaultMilestones?.map((m) => ({ ...m, completed: false })),
      0,
      false,
      paymentMode
    );
    const perSessionAmount =
      paymentMode === 'per_session' ? Math.round(totalAmount / Math.max(1, initialSessions.length)) : undefined;

    const paymentPlan: PaymentPlan = {
      mode: paymentMode,
      depositPercent,
      upfrontAmount,
      releasedAmount: 0,
      remainingAmount: Math.max(0, totalAmount - upfrontAmount),
      perSessionAmount,
    };

    // Deduct upfront escrow (if any) + 3.000₫ transaction fee, and credit +3.000₫ straight into Huỳnh Công Khoa (104888853717)
    const ownerId = getPlatformOwnerId();
    const ownerBaseBalance = getUserWalletBalance(ownerId);
    const walletEntries: WalletTransaction[] = [];
    let runningParticipantBalance = participantBalance;

    if (upfrontAmount > 0) {
      walletEntries.push({
        id: `wtx-escrow-${Date.now()}`,
        userId: currentUser.id,
        amount: -upfrontAmount,
        balanceBefore: runningParticipantBalance,
        balanceAfter: runningParticipantBalance - upfrontAmount,
        type: 'contract_escrow',
        description:
          paymentMode === 'deposit_percent'
            ? `Đặt cọc ${depositPercent}% tham gia hợp đồng ${contractCode} (${post.categoryName}) với ${post.authorName}`
            : `Thanh toán tạm giữ 100% tham gia hợp đồng ${contractCode} (${post.categoryName}) với ${post.authorName}`,
        referenceId: txnId,
        timestamp: now,
      });
      runningParticipantBalance -= upfrontAmount;
    }

    walletEntries.unshift({
      id: `wtx-fee-payer-${Date.now() + 1}`,
      userId: currentUser.id,
      amount: -PLATFORM_FEE,
      balanceBefore: runningParticipantBalance,
      balanceAfter: runningParticipantBalance - PLATFORM_FEE,
      type: 'platform_fee',
      description: `Phí giao dịch sàn +3.000 ₫ (HĐ ${contractCode}) chuyển thẳng vào TK ${PLATFORM_ACCOUNT_NAME} (${PLATFORM_ACCOUNT_NUMBER})`,
      referenceId: `${txnId}-fee`,
      timestamp: now,
    });
    runningParticipantBalance -= PLATFORM_FEE;

    const ownerBefore = ownerId === currentUser.id ? runningParticipantBalance : ownerBaseBalance;
    walletEntries.unshift({
      id: `wtx-fee-owner-${Date.now() + 2}`,
      userId: ownerId,
      amount: PLATFORM_FEE,
      balanceBefore: ownerBefore,
      balanceAfter: ownerBefore + PLATFORM_FEE,
      type: 'platform_fee',
      description: `Thu phí giao dịch +3.000 ₫ (HĐ ${contractCode}) cộng thẳng vào TK ${PLATFORM_ACCOUNT_NAME} (${PLATFORM_ACCOUNT_NUMBER})`,
      referenceId: `${txnId}-owner-fee`,
      timestamp: now,
    });

    setWalletTransactions(prev => [...walletEntries, ...prev]);

    const payModeDesc =
      paymentMode === 'full_upfront'
        ? `thanh toán tạm giữ 100% (${upfrontAmount.toLocaleString('vi-VN')} ₫ + phí GD 3.000 ₫)`
        : paymentMode === 'deposit_percent'
        ? `đặt cọc ${depositPercent}% (${upfrontAmount.toLocaleString('vi-VN')} ₫ + phí GD 3.000 ₫)`
        : `trả từng buổi sau khi hoàn thành (${(perSessionAmount || totalAmount).toLocaleString('vi-VN')} ₫/buổi · phí GD 3.000 ₫)`;

    const newTxn: AgriTransaction = {
      id: txnId,
      contractCode,
      postId: post.id,
      originPostType: 'supply',
      postAuthorId: post.authorId,
      participantId: currentUser.id,
      progressUpdaterId: post.authorId,
      serviceName: post.categoryName,
      hiringMode: post.hiringMode,
      farmerId: currentUser.id,
      farmerName: currentUser.name,
      farmerPhone: currentUser.phone,
      providerId: post.authorId,
      providerName: post.authorName,
      providerPhone: post.authorPhone,
      location: `${post.district}, ${post.province}`,
      executionDate,
      workSchedule: resolvedWorkSchedule,
      scheduleSummary: formatWorkScheduleSummary({ executionDate, workSchedule: resolvedWorkSchedule }),
      areaVolume: validVolume,
      unit: unitLabel,
      unitPrice: post.price,
      extraCosts: resolvedExtras,
      extraCostsTotal,
      totalAmount,
      workTerms: workTerms?.trim() || 'Thực hiện dịch vụ đúng cam kết chất lượng và thời gian.',
      status: 'in_progress',
      progressPercent: 0,
      progressStepTitle: `Buổi 1 (${formatDateVN(initialSessions[0].scheduledDate)}): Chờ bên cung cấp cập nhật`,
      progressMilestones: initialSessions[0].milestones,
      sessionProgress: initialSessions,
      paymentPlan,
      progressUpdates: [
        {
          id: `prog-${Date.now()}`,
          percent: 0,
          stepLabel: 'Khởi tạo hợp đồng (0%)',
          note: `${currentUser.name} đã tham gia hợp đồng và chọn ${payModeDesc}.`,
          updatedById: currentUser.id,
          updatedByName: currentUser.name,
          timestamp: now,
        }
      ],
      escrowAmount: upfrontAmount,
      escrowReleased: false,
      feeDeducted: true,
      feeAmount: PLATFORM_FEE,
      createdAt: now,
    };

    setTransactions(prev => [newTxn, ...prev]);

    const notifOwner: AgriNotification = {
      id: `notif-${Date.now()}-1`,
      userId: post.authorId,
      title: 'Có khách tham gia hợp đồng mới',
      message: `${currentUser.name} đã tham gia hợp đồng ${contractCode} (${validVolume} ${unitLabel}, ${payModeDesc}).`,
      type: 'contract',
      read: false,
      createdAt: now,
      targetTab: 'transactions',
      targetPostId: post.id,
      targetTxnId: txnId,
    };
    const notifJoiner: AgriNotification = {
      id: `notif-${Date.now()}-2`,
      userId: currentUser.id,
      title: 'Tham gia hợp đồng thành công',
      message: `Đã tạo hợp đồng ${contractCode} (${payModeDesc}).`,
      type: 'contract',
      read: false,
      createdAt: now,
      targetTab: 'transactions',
      targetPostId: post.id,
      targetTxnId: txnId,
    };
    const notifOwnerFee: AgriNotification = {
      id: `notif-${Date.now()}-3`,
      userId: ownerId,
      title: 'Cộng phí giao dịch +3.000 ₫',
      message: `Hợp đồng ${contractCode} vừa cộng thẳng +3.000 ₫ vào TK ${PLATFORM_ACCOUNT_NAME} (${PLATFORM_ACCOUNT_NUMBER}).`,
      type: 'wallet',
      read: false,
      createdAt: now,
      targetTab: 'admin',
      openWallet: true,
    };
    setNotifications(prev => [notifOwner, notifJoiner, notifOwnerFee, ...prev]);

    return {
      success: true,
      txnId,
      message: `Tham gia hợp đồng ${contractCode} thành công (${payModeDesc})!`
    };
  };

  // 4. ROLE-RESTRICTED PROGRESS TRACKING & 100% DISBURSEMENT
  const updateContractProgress = (
    txnId: string,
    percent: number,
    stepLabel: string,
    note: string
  ): { success: boolean; message: string } => {
    const txn = transactions.find(t => t.id === txnId);
    if (!txn) {
      return { success: false, message: 'Không tìm thấy hợp đồng giao dịch!' };
    }
    if (txn.status === 'completed') {
      return { success: false, message: 'Hợp đồng này đã hoàn tất 100% và giải ngân rồi.' };
    }
    if (txn.status === 'cancelled') {
      return { success: false, message: 'Hợp đồng đã bị hủy, không thể cập nhật tiến độ.' };
    }

    const allowedUpdaterId =
      txn.progressUpdaterId || (txn.originPostType === 'demand' ? txn.participantId : txn.postAuthorId);

    if (currentUser.id !== allowedUpdaterId) {
      return {
        success: false,
        message:
          txn.originPostType === 'demand'
            ? 'Với bài Yêu cầu dịch vụ, chỉ người tham gia thực hiện hợp đồng mới có quyền cập nhật tiến độ!'
            : 'Với bài Cung cấp dịch vụ, chỉ chủ bài đăng mới có quyền cập nhật tiến độ!'
      };
    }

    const clampedPercent = Math.max(0, Math.min(100, Math.round(percent)));
    const resolvedStep = stepLabel.trim() || (clampedPercent === 100 ? 'Hoàn thành 100% & Nghiệm thu' : `Tiến độ ${clampedPercent}%`);
    const now = new Date().toISOString();

    const newLog: ProgressUpdateItem = {
      id: `prog-${Date.now()}`,
      percent: clampedPercent,
      stepLabel: resolvedStep,
      note: note.trim() || `Cập nhật tiến độ đạt ${clampedPercent}%.`,
      updatedById: currentUser.id,
      updatedByName: currentUser.name,
      timestamp: now,
    };

    if (clampedPercent === 100) {
      const executorId = txn.providerId;
      const shouldRelease = !txn.escrowReleased && (txn.escrowAmount || txn.totalAmount) > 0;
      const payoutAmount = txn.escrowAmount || txn.totalAmount;

      if (shouldRelease) {
        const execBal = getUserWalletBalance(executorId);
        const balAfterPayout = execBal + payoutAmount;
        const payoutTx: WalletTransaction = {
          id: `wtx-payout-${Date.now()}`,
          userId: executorId,
          amount: payoutAmount,
          balanceBefore: execBal,
          balanceAfter: balAfterPayout,
          type: 'contract_payout',
          description: `Giải ngân hoàn tất 100% hợp đồng ${txn.contractCode} (${txn.serviceName})`,
          referenceId: txn.id,
          timestamp: now,
        };

        const newEntries: WalletTransaction[] = [payoutTx];

        if (!txn.feeDeducted) {
          const ownerId = getPlatformOwnerId();
          const ownerBal = getUserWalletBalance(ownerId);
          const feeTx: WalletTransaction = {
            id: `wtx-fee-${Date.now() + 1}`,
            userId: executorId,
            amount: -PLATFORM_FEE,
            balanceBefore: balAfterPayout,
            balanceAfter: balAfterPayout - PLATFORM_FEE,
            type: 'platform_fee',
            description: `Phí giao dịch sàn +3.000 ₫ (HĐ ${txn.contractCode}) chuyển thẳng vào TK ${PLATFORM_ACCOUNT_NAME} (${PLATFORM_ACCOUNT_NUMBER})`,
            referenceId: `${txn.id}-fee`,
            timestamp: now,
          };
          const ownerFeeTx: WalletTransaction = {
            id: `wtx-fee-owner-${Date.now() + 2}`,
            userId: ownerId,
            amount: PLATFORM_FEE,
            balanceBefore: ownerBal,
            balanceAfter: ownerBal + PLATFORM_FEE,
            type: 'platform_fee',
            description: `Thu phí giao dịch +3.000 ₫ (HĐ ${txn.contractCode}) cộng thẳng vào TK ${PLATFORM_ACCOUNT_NAME} (${PLATFORM_ACCOUNT_NUMBER})`,
            referenceId: `${txn.id}-owner-fee`,
            timestamp: now,
          };
          newEntries.unshift(ownerFeeTx, feeTx);
        }

        setWalletTransactions(prev => {
          if (prev.some(w => w.referenceId === txn.id && w.type === 'contract_payout')) {
            return prev;
          }
          return [...newEntries, ...prev];
        });
      }

      setTransactions(prev =>
        prev.map(t =>
          t.id === txnId
            ? {
                ...t,
                status: 'completed',
                progressPercent: 100,
                progressStepTitle: resolvedStep,
                progressUpdates: [...(t.progressUpdates || []), newLog],
                escrowReleased: true,
                feeDeducted: true,
                completedAt: now,
              }
            : t
        )
      );

      if (txn.originPostType === 'demand') {
        const parentPost = posts.find(p => p.id === txn.postId);
        if (!parentPost?.isJointVenture) {
          setPosts(prev => prev.map(p => (p.id === txn.postId ? { ...p, status: 'completed' } : p)));
        } else {
          const maxP = Math.max(1, parentPost.maxPartners || parentPost.jointVentureTasks?.length || 1);
          const acceptedCount = applications.filter(a => a.postId === txn.postId && a.status === 'accepted').length;
          const allOtherCompleted = transactions
            .filter(t => t.postId === txn.postId && t.id !== txn.id && t.status !== 'cancelled')
            .every(t => t.status === 'completed');
          if (acceptedCount >= maxP && allOtherCompleted) {
            setPosts(prev => prev.map(p => (p.id === txn.postId ? { ...p, status: 'completed' } : p)));
          }
        }
      }

      const notifExec: AgriNotification = {
        id: `notif-${Date.now()}-1`,
        userId: executorId,
        title: 'Hoàn thành 100% & Đã giải ngân vào ví',
        message: `Hợp đồng ${txn.contractCode} đạt 100%. Đã giải ngân +${payoutAmount.toLocaleString('vi-VN')} ₫ vào ví của bạn.`,
        type: 'wallet',
        read: false,
        createdAt: now,
        openWallet: true,
      };
      const notifHirer: AgriNotification = {
        id: `notif-${Date.now()}-2`,
        userId: txn.farmerId,
        title: 'Hợp đồng đã hoàn tất 100%',
        message: `Hợp đồng ${txn.contractCode} đã đạt 100% tiến độ và hoàn tất giải ngân cho bên thực hiện.`,
        type: 'contract',
        read: false,
        createdAt: now,
        targetTab: 'transactions',
        targetPostId: txn.postId,
        targetTxnId: txn.id,
      };
      setNotifications(prev => [notifExec, notifHirer, ...prev]);

      return {
        success: true,
        message: `Đã cập nhật tiến độ 100%! Hợp đồng hoàn tất và đã giải ngân ${payoutAmount.toLocaleString('vi-VN')} ₫.`
      };
    }

    setTransactions(prev =>
      prev.map(t =>
        t.id === txnId
          ? {
              ...t,
              status: 'in_progress',
              progressPercent: clampedPercent,
              progressStepTitle: resolvedStep,
              progressUpdates: [...(t.progressUpdates || []), newLog],
            }
          : t
      )
    );

    return {
      success: true,
      message: `Đã cập nhật tiến độ hợp đồng ${txn.contractCode} lên ${clampedPercent}%!`
    };
  };

  // 4B. CUSTOM PROGRESS MILESTONES BAR (Editable by Supply post author OR Demand post participant)
  const saveContractMilestones = (
    txnId: string,
    milestones: ProgressMilestone[],
    note?: string,
    overridePercent?: number
  ): { success: boolean; message: string } => {
    if (!isAuthenticated) {
      return { success: false, message: 'Vui lòng đăng nhập tài khoản để cập nhật tiến trình!' };
    }
    const txn = transactions.find((t) => t.id === txnId);
    if (!txn) {
      return { success: false, message: 'Không tìm thấy hợp đồng giao dịch!' };
    }
    if (txn.status === 'completed') {
      return { success: false, message: 'Hợp đồng này đã hoàn tất 100% và giải ngân rồi.' };
    }
    if (txn.status === 'cancelled') {
      return { success: false, message: 'Hợp đồng đã bị hủy, không thể chỉnh sửa tiến trình.' };
    }

    const allowedUpdaterId =
      txn.progressUpdaterId || (txn.originPostType === 'demand' ? txn.participantId : txn.postAuthorId);

    if (currentUser.id !== allowedUpdaterId) {
      return {
        success: false,
        message:
          txn.originPostType === 'demand'
            ? 'Chỉ người tham gia thực hiện cho bài Yêu cầu dịch vụ mới có quyền chỉnh sửa và ghi tiến trình!'
            : 'Chỉ người đăng bài Cung cấp dịch vụ mới có quyền chỉnh sửa và ghi tiến trình!'
      };
    }

    const cleanedMilestones = milestones
      .map((m, idx) => ({
        ...m,
        id: m.id || `ms-${Date.now()}-${idx}`,
        title: m.title.trim() || `Bước ${idx + 1}`,
      }))
      .filter((m) => m.title.length > 0);

    if (cleanedMilestones.length === 0) {
      return { success: false, message: 'Vui lòng giữ ít nhất 1 bước công việc trên thanh tiến trình!' };
    }

    const completedCount = cleanedMilestones.filter((m) => m.completed).length;
    const computedPercent =
      typeof overridePercent === 'number'
        ? Math.max(0, Math.min(100, Math.round(overridePercent)))
        : Math.round((completedCount / cleanedMilestones.length) * 100);

    const lastDone = [...cleanedMilestones].reverse().find((m) => m.completed);
    const nextPending = cleanedMilestones.find((m) => !m.completed);
    const stepLabel =
      computedPercent === 100
        ? 'Hoàn thành 100% toàn bộ tiến trình & Nghiệm thu'
        : lastDone
        ? `Đã xong: ${lastDone.title} (${completedCount}/${cleanedMilestones.length} bước)`
        : nextPending
        ? `Đang chuẩn bị: ${nextPending.title}`
        : `Tiến trình ${computedPercent}%`;

    const resolvedNote =
      note?.trim() ||
      `Cập nhật thanh tiến trình: ${completedCount}/${cleanedMilestones.length} bước hoàn tất (${computedPercent}%).`;

    // Persist milestones onto the transaction immediately
    setTransactions((prev) =>
      prev.map((t) =>
        t.id === txnId
          ? {
              ...t,
              progressMilestones: cleanedMilestones,
            }
          : t
      )
    );

    // Delegate percent, audit log, and 100% auto-disbursement to updateContractProgress
    return updateContractProgress(txnId, computedPercent, stepLabel, resolvedNote);
  };

  // 4C. SESSION-BASED PROGRESS TRACKING (Supports 1-time & Multi-Day / Recurring with Next-Day Auto-Advance)
  const saveSessionProgress = (
    txnId: string,
    sessionId: string,
    milestones: ProgressMilestone[],
    summaryNote?: string
  ): { success: boolean; message: string } => {
    if (!isAuthenticated) {
      return { success: false, message: 'Vui lòng đăng nhập tài khoản để cập nhật tiến trình!' };
    }
    const txn = transactions.find((t) => t.id === txnId);
    if (!txn) {
      return { success: false, message: 'Không tìm thấy hợp đồng giao dịch!' };
    }
    if (txn.status === 'cancelled') {
      return { success: false, message: 'Hợp đồng đã bị hủy, không thể cập nhật tiến trình.' };
    }

    const allowedUpdaterId =
      txn.progressUpdaterId || (txn.originPostType === 'demand' ? txn.participantId : txn.postAuthorId);
    if (currentUser.id !== allowedUpdaterId) {
      return {
        success: false,
        message:
          txn.originPostType === 'demand'
            ? 'Chế độ xem: Chỉ người đảm nhận thực hiện mới có quyền ghi chi tiết & cập nhật tiến trình!'
            : 'Chế độ xem: Chỉ chủ bài cung cấp dịch vụ mới có quyền ghi chi tiết & cập nhật tiến trình!',
      };
    }

    const cleanedMilestones = milestones
      .map((m, idx) => ({
        ...m,
        id: m.id || `ms-${Date.now()}-${idx}`,
        title: m.title.trim() || `Bước ${idx + 1}`,
        actionDetail: m.actionDetail?.trim() || '',
        updatedAt: new Date().toISOString(),
      }))
      .filter((m) => m.title.length > 0);

    if (cleanedMilestones.length === 0) {
      return { success: false, message: 'Cần có ít nhất 1 bước công việc trong thanh tiến trình!' };
    }

    const existingSessions =
      txn.sessionProgress && txn.sessionProgress.length > 0
        ? txn.sessionProgress
        : buildInitialSessions(
            txn.id,
            txn.totalAmount,
            txn.executionDate,
            txn.workSchedule,
            txn.progressMilestones,
            txn.progressPercent,
            txn.status === 'completed',
            txn.paymentPlan?.mode || 'full_upfront'
          );

    const targetIdx = existingSessions.findIndex((s) => s.id === sessionId);
    if (targetIdx === -1) {
      return { success: false, message: 'Không tìm thấy buổi làm việc cần cập nhật!' };
    }

    const completedSteps = cleanedMilestones.filter((m) => m.completed).length;
    const sessionPercent = Math.round((completedSteps / cleanedMilestones.length) * 100);
    const now = new Date().toISOString();
    const sessionCompleted = sessionPercent === 100;

    const updatedSessions: SessionProgressRecord[] = existingSessions.map((s, idx) => {
      if (idx === targetIdx) {
        return {
          ...s,
          milestones: cleanedMilestones,
          progressPercent: sessionPercent,
          status: sessionCompleted ? 'completed' : 'in_progress',
          summaryNote: summaryNote !== undefined ? summaryNote.trim() : s.summaryNote,
          completedAt: sessionCompleted ? s.completedAt || now : undefined,
        };
      }
      return s;
    });

    // If current session reached 100%, unlock the next scheduled session (or auto-append next recurring date if applicable)
    if (sessionCompleted) {
      const nextIdx = targetIdx + 1;
      if (nextIdx < updatedSessions.length) {
        if (updatedSessions[nextIdx].status === 'pending') {
          updatedSessions[nextIdx] = {
            ...updatedSessions[nextIdx],
            status: 'in_progress',
          };
        }
      } else if (
        txn.workSchedule?.type === 'recurring' &&
        (txn.workSchedule.totalOccurrences || 0) > updatedSessions.length
      ) {
        const lastSess = updatedSessions[updatedSessions.length - 1];
        const nextDate = computeNextRecurringDate(lastSess.scheduledDate, txn.workSchedule);
        updatedSessions.push({
          id: `${txn.id}-sess-${updatedSessions.length + 1}`,
          sessionIndex: updatedSessions.length + 1,
          scheduledDate: nextDate,
          status: 'in_progress',
          progressPercent: 0,
          sessionAmount: lastSess.sessionAmount || txn.paymentPlan?.perSessionAmount || 0,
          paid: false,
          milestones: cleanedMilestones.map((m, mIdx) => ({
            ...m,
            id: `${txn.id}-s${updatedSessions.length + 1}-m${mIdx + 1}`,
            completed: false,
          })),
        });
      }
    }

    const totalSessions = updatedSessions.length;
    const allSessionsDone = updatedSessions.every((s) => s.status === 'completed' && s.progressPercent === 100);
    const overallPercent = allSessionsDone
      ? 100
      : Math.round(
          updatedSessions.reduce((sum, s) => sum + (s.progressPercent || 0), 0) / Math.max(1, totalSessions)
        );

    const activeSess =
      updatedSessions.find((s) => s.status !== 'completed') || updatedSessions[updatedSessions.length - 1];
    const targetSess = updatedSessions[targetIdx];
    const stepLabel = allSessionsDone
      ? 'Hoàn thành 100% toàn bộ các buổi làm'
      : sessionCompleted
      ? `Hoàn thành Buổi ${targetSess.sessionIndex} (${formatDateVN(targetSess.scheduledDate)}) · Chuyển sang ngày tiếp theo ${formatDateVN(activeSess.scheduledDate)}`
      : `Buổi ${targetSess.sessionIndex} (${formatDateVN(targetSess.scheduledDate)}): Đạt ${sessionPercent}%`;

    const newLog: ProgressUpdateItem = {
      id: `prog-${Date.now()}`,
      percent: overallPercent,
      stepLabel,
      note:
        summaryNote?.trim() ||
        `Cập nhật Buổi ${targetSess.sessionIndex} (${formatDateVN(targetSess.scheduledDate)}): ${completedSteps}/${cleanedMilestones.length} bước (${sessionPercent}%).`,
      updatedById: currentUser.id,
      updatedByName: currentUser.name,
      timestamp: now,
    };

    // Release upfront escrow to executor when ALL sessions hit 100%
    let nextEscrowReleased = txn.escrowReleased;
    let nextFeeDeducted = txn.feeDeducted;
    const existingPlan: PaymentPlan = txn.paymentPlan || {
      mode: 'full_upfront',
      upfrontAmount: txn.escrowAmount || txn.totalAmount,
      releasedAmount: txn.escrowReleased ? txn.escrowAmount || txn.totalAmount : 0,
      remainingAmount: txn.escrowReleased ? 0 : Math.max(0, txn.totalAmount - (txn.escrowAmount || 0)),
    };
    let nextPaymentPlan: PaymentPlan = { ...existingPlan };

    if (allSessionsDone && !txn.escrowReleased && txn.escrowAmount > 0) {
      const executorId = txn.providerId;
      const execBal = getUserWalletBalance(executorId);
      const payoutAmount = txn.escrowAmount;
      const balAfterPayout = execBal + payoutAmount;
      const payoutTx: WalletTransaction = {
        id: `wtx-payout-${Date.now()}`,
        userId: executorId,
        amount: payoutAmount,
        balanceBefore: execBal,
        balanceAfter: balAfterPayout,
        type: 'contract_payout',
        description: `Giải ngân tạm giữ hợp đồng ${txn.contractCode} (${txn.serviceName}) khi hoàn tất 100%`,
        referenceId: `${txn.id}-escrow`,
        timestamp: now,
      };
      const entries: WalletTransaction[] = [payoutTx];
      if (!txn.feeDeducted) {
        const ownerId = getPlatformOwnerId();
        const ownerBal = getUserWalletBalance(ownerId);
        entries.unshift(
          {
            id: `wtx-fee-owner-${Date.now() + 2}`,
            userId: ownerId,
            amount: PLATFORM_FEE,
            balanceBefore: ownerBal,
            balanceAfter: ownerBal + PLATFORM_FEE,
            type: 'platform_fee',
            description: `Thu phí giao dịch +3.000 ₫ (HĐ ${txn.contractCode}) cộng thẳng vào TK ${PLATFORM_ACCOUNT_NAME} (${PLATFORM_ACCOUNT_NUMBER})`,
            referenceId: `${txn.id}-owner-fee`,
            timestamp: now,
          },
          {
            id: `wtx-fee-${Date.now() + 1}`,
            userId: executorId,
            amount: -PLATFORM_FEE,
            balanceBefore: balAfterPayout,
            balanceAfter: balAfterPayout - PLATFORM_FEE,
            type: 'platform_fee',
            description: `Phí giao dịch sàn +3.000 ₫ (HĐ ${txn.contractCode}) chuyển thẳng vào TK ${PLATFORM_ACCOUNT_NAME} (${PLATFORM_ACCOUNT_NUMBER})`,
            referenceId: `${txn.id}-fee`,
            timestamp: now,
          }
        );
        nextFeeDeducted = true;
      }
      setWalletTransactions((prev) => {
        if (prev.some((w) => w.referenceId === `${txn.id}-escrow` && w.type === 'contract_payout')) {
          return prev;
        }
        return [...entries, ...prev];
      });
      nextEscrowReleased = true;
      nextPaymentPlan = {
        ...nextPaymentPlan,
        releasedAmount: nextPaymentPlan.releasedAmount + payoutAmount,
      };
      if (nextPaymentPlan.mode === 'full_upfront') {
        nextPaymentPlan.remainingAmount = 0;
        updatedSessions.forEach((s) => {
          s.paid = true;
        });
      }
    }

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === txnId
          ? {
              ...t,
              status: allSessionsDone ? 'completed' : 'in_progress',
              progressPercent: overallPercent,
              progressStepTitle: stepLabel,
              progressMilestones: activeSess.milestones,
              sessionProgress: updatedSessions,
              paymentPlan: nextPaymentPlan,
              progressUpdates: [...(t.progressUpdates || []), newLog],
              escrowReleased: nextEscrowReleased,
              feeDeducted: nextFeeDeducted,
              completedAt: allSessionsDone ? now : t.completedAt,
            }
          : t
      )
    );

    // Notify counterparty when progress is saved
    const notifyTargetId = currentUser.id === txn.farmerId ? txn.providerId : txn.farmerId;
    setNotifications((prev) => [
      {
        id: `notif-prog-${Date.now()}`,
        userId: notifyTargetId,
        title: allSessionsDone
          ? `Hoàn tất 100% hợp đồng ${txn.contractCode}`
          : `Cập nhật tiến trình ${txn.contractCode} (${overallPercent}%)`,
        message: `${currentUser.name}: ${stepLabel}`,
        type: 'contract',
        read: false,
        createdAt: now,
        targetTab: 'transactions',
        targetPostId: txn.postId,
        targetTxnId: txn.id,
      },
      ...prev,
    ]);

    // Check overall parent post completion when ALL executors on that post are completed
    if (allSessionsDone && txn.originPostType === 'demand') {
      const parentPost = posts.find((p) => p.id === txn.postId);
      if (parentPost) {
        const siblingTxns = transactions.filter(
          (t) => t.postId === txn.postId && t.id !== txn.id && t.status !== 'cancelled'
        );
        const allSiblingsDone = siblingTxns.every((t) => t.status === 'completed');
        const maxP = parentPost.isJointVenture
          ? Math.max(1, parentPost.maxPartners || parentPost.jointVentureTasks?.length || 1)
          : 1;
        const totalPartnersCount = siblingTxns.length + 1;
        if (allSiblingsDone && totalPartnersCount >= maxP) {
          setPosts((prev) => prev.map((p) => (p.id === txn.postId ? { ...p, status: 'completed' } : p)));
        }
      }
    }

    if (allSessionsDone) {
      const payoutMsg =
        nextEscrowReleased && txn.escrowAmount > 0
          ? ` Đã giải ngân ${txn.escrowAmount.toLocaleString('vi-VN')} ₫ vào ví.`
          : '';
      const remainMsg =
        nextPaymentPlan.remainingAmount > 0
          ? ` Phần còn lại (${nextPaymentPlan.remainingAmount.toLocaleString('vi-VN')} ₫) chờ bên thuê tất toán.`
          : '';
      return {
        success: true,
        message: `Đã hoàn thành 100% toàn bộ nhiệm vụ! Tab của bạn đã chuyển xanh hoàn tất.${payoutMsg}${remainMsg}`,
      };
    }

    if (sessionCompleted && totalSessions > 1) {
      return {
        success: true,
        message: `Buổi ${targetSess.sessionIndex} (${formatDateVN(targetSess.scheduledDate)}) đạt 100%! Đã mở tiếp tiến trình cho ngày kế tiếp (${formatDateVN(activeSess.scheduledDate)}).`,
      };
    }

    return {
      success: true,
      message: `Đã lưu tiến trình Buổi ${targetSess.sessionIndex} đạt ${sessionPercent}%!`,
    };
  };

  // Append an additional recurring session date when executor wants to log the next cycle
  const appendNextRecurringSession = (txnId: string): { success: boolean; message: string } => {
    if (!isAuthenticated) {
      return { success: false, message: 'Vui lòng đăng nhập để thêm buổi tiếp theo!' };
    }
    const txn = transactions.find((t) => t.id === txnId);
    if (!txn) return { success: false, message: 'Không tìm thấy hợp đồng!' };
    const allowedUpdaterId =
      txn.progressUpdaterId || (txn.originPostType === 'demand' ? txn.participantId : txn.postAuthorId);
    if (currentUser.id !== allowedUpdaterId) {
      return { success: false, message: 'Chỉ bên thực hiện mới có thể tạo thêm buổi kế tiếp!' };
    }
    const sessions = txn.sessionProgress || [];
    const lastSess = sessions[sessions.length - 1];
    const nextDate = computeNextRecurringDate(lastSess?.scheduledDate || txn.executionDate, txn.workSchedule);
    const nextIndex = sessions.length + 1;
    const template = lastSess?.milestones || txn.progressMilestones;
    const newSession: SessionProgressRecord = {
      id: `${txn.id}-sess-${Date.now()}`,
      sessionIndex: nextIndex,
      scheduledDate: nextDate,
      status: lastSess?.status === 'completed' ? 'in_progress' : 'pending',
      progressPercent: 0,
      sessionAmount: lastSess?.sessionAmount || txn.paymentPlan?.perSessionAmount || 0,
      paid: false,
      milestones: buildDefaultMilestones(
        0,
        template?.map((m, idx) => ({ ...m, id: `${txn.id}-s${nextIndex}-m${idx + 1}`, completed: false }))
      ),
    };
    const nextSessions = [...sessions, newSession];
    const overallPercent = Math.round(
      nextSessions.reduce((s, item) => s + item.progressPercent, 0) / nextSessions.length
    );

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === txnId
          ? {
              ...t,
              status: 'in_progress',
              progressPercent: overallPercent,
              sessionProgress: nextSessions,
            }
          : t
      )
    );
    return {
      success: true,
      message: `Đã mở thêm Buổi ${nextIndex} cho ngày ${formatDateVN(nextDate)}!`,
    };
  };

  // 4D. FLEXIBLE PAYMENT SETTLEMENT (Payer settles a completed session OR remaining balance after deposit)
  const settleTransactionPayment = (
    txnId: string,
    options?: { sessionId?: string }
  ): { success: boolean; message: string; insufficientFunds?: boolean; required?: number; balance?: number } => {
    if (!isAuthenticated) {
      return { success: false, message: 'Vui lòng đăng nhập để thực hiện thanh toán!' };
    }
    const txn = transactions.find((t) => t.id === txnId);
    if (!txn) return { success: false, message: 'Không tìm thấy hợp đồng!' };
    if (currentUser.id !== txn.farmerId) {
      return { success: false, message: 'Chỉ bên trả tiền (bên thuê dịch vụ) mới có quyền thanh toán khoản này!' };
    }

    const plan: PaymentPlan = txn.paymentPlan || {
      mode: 'full_upfront',
      upfrontAmount: txn.escrowAmount || txn.totalAmount,
      releasedAmount: txn.escrowReleased ? txn.escrowAmount || txn.totalAmount : 0,
      remainingAmount: txn.escrowReleased ? 0 : Math.max(0, txn.totalAmount - (txn.escrowAmount || 0)),
    };

    const sessions = txn.sessionProgress || [];
    let amountToPay = 0;
    let descriptionPayer = '';
    let descriptionExec = '';
    let refKey = '';

    if (options?.sessionId) {
      const targetSess = sessions.find((s) => s.id === options.sessionId);
      if (!targetSess) return { success: false, message: 'Không tìm thấy buổi làm cần thanh toán!' };
      if (targetSess.paid) return { success: false, message: 'Buổi làm này đã được thanh toán rồi!' };
      if (targetSess.status !== 'completed') {
        return { success: false, message: 'Chỉ thanh toán khi buổi làm đã hoàn thành 100%!' };
      }
      amountToPay = Math.max(
        0,
        Math.round(
          targetSess.sessionAmount || plan.perSessionAmount || Math.round(txn.totalAmount / Math.max(1, sessions.length))
        )
      );
      descriptionPayer = `Thanh toán Buổi ${targetSess.sessionIndex} (${formatDateVN(targetSess.scheduledDate)}) - HĐ ${txn.contractCode}`;
      descriptionExec = `Nhận thanh toán Buổi ${targetSess.sessionIndex} (${formatDateVN(targetSess.scheduledDate)}) - HĐ ${txn.contractCode}`;
      refKey = `${txn.id}-pay-sess-${targetSess.id}`;
    } else {
      amountToPay = Math.max(0, Math.round(plan.remainingAmount));
      if (amountToPay <= 0) {
        return { success: false, message: 'Hợp đồng này đã được thanh toán đủ 100%!' };
      }
      descriptionPayer = `Tất toán phần còn lại hợp đồng ${txn.contractCode} (${txn.serviceName})`;
      descriptionExec = `Nhận tất toán phần còn lại hợp đồng ${txn.contractCode} (${txn.serviceName})`;
      refKey = `${txn.id}-settle-remain`;
    }

    const payerBalance = getUserWalletBalance(txn.farmerId);
    if (payerBalance < amountToPay) {
      return {
        success: false,
        insufficientFunds: true,
        required: amountToPay,
        balance: payerBalance,
        message: `Số dư ví không đủ! Cần ${amountToPay.toLocaleString('vi-VN')} ₫, hiện có ${payerBalance.toLocaleString('vi-VN')} ₫. Vui lòng nạp thêm tiền vào ví.`,
      };
    }

    const now = new Date().toISOString();
    const execBalance = getUserWalletBalance(txn.providerId);
    const payerTx: WalletTransaction = {
      id: `wtx-pay-${Date.now()}`,
      userId: txn.farmerId,
      amount: -amountToPay,
      balanceBefore: payerBalance,
      balanceAfter: payerBalance - amountToPay,
      type: 'contract_escrow',
      description: descriptionPayer,
      referenceId: refKey,
      timestamp: now,
    };
    const execTx: WalletTransaction = {
      id: `wtx-rcv-${Date.now() + 1}`,
      userId: txn.providerId,
      amount: amountToPay,
      balanceBefore: execBalance,
      balanceAfter: execBalance + amountToPay,
      type: 'contract_payout',
      description: descriptionExec,
      referenceId: refKey,
      timestamp: now,
    };
    const newEntries: WalletTransaction[] = [execTx, payerTx];
    let nextFeeDeducted = txn.feeDeducted;
    if (!txn.feeDeducted) {
      const ownerId = getPlatformOwnerId();
      const ownerBal = getUserWalletBalance(ownerId);
      newEntries.unshift(
        {
          id: `wtx-fee-owner-${Date.now() + 3}`,
          userId: ownerId,
          amount: PLATFORM_FEE,
          balanceBefore: ownerBal,
          balanceAfter: ownerBal + PLATFORM_FEE,
          type: 'platform_fee',
          description: `Thu phí giao dịch +3.000 ₫ (HĐ ${txn.contractCode}) cộng thẳng vào TK ${PLATFORM_ACCOUNT_NAME} (${PLATFORM_ACCOUNT_NUMBER})`,
          referenceId: `${txn.id}-owner-fee`,
          timestamp: now,
        },
        {
          id: `wtx-fee-${Date.now() + 2}`,
          userId: txn.providerId,
          amount: -PLATFORM_FEE,
          balanceBefore: execBalance + amountToPay,
          balanceAfter: execBalance + amountToPay - PLATFORM_FEE,
          type: 'platform_fee',
          description: `Phí giao dịch sàn +3.000 ₫ (HĐ ${txn.contractCode}) chuyển thẳng vào TK ${PLATFORM_ACCOUNT_NAME} (${PLATFORM_ACCOUNT_NUMBER})`,
          referenceId: `${txn.id}-fee`,
          timestamp: now,
        }
      );
      nextFeeDeducted = true;
    }

    setWalletTransactions((prev) => [...newEntries, ...prev]);

    const updatedSessions = sessions.map((s) => {
      if (options?.sessionId) {
        return s.id === options.sessionId ? { ...s, paid: true } : s;
      }
      return { ...s, paid: true };
    });

    const nextRemaining = Math.max(0, plan.remainingAmount - amountToPay);
    const nextPlan: PaymentPlan = {
      ...plan,
      releasedAmount: plan.releasedAmount + amountToPay,
      remainingAmount: nextRemaining,
    };

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === txnId
          ? {
              ...t,
              sessionProgress: updatedSessions,
              paymentPlan: nextPlan,
              feeDeducted: nextFeeDeducted,
              escrowReleased: nextRemaining === 0 ? true : t.escrowReleased,
            }
          : t
      )
    );

    setNotifications((prev) => [
      {
        id: `notif-${Date.now()}-pay`,
        userId: txn.providerId,
        title: 'Đã nhận thanh toán hợp đồng',
        message: `${txn.farmerName} vừa thanh toán +${amountToPay.toLocaleString('vi-VN')} ₫ cho ${txn.contractCode}.`,
        type: 'wallet',
        read: false,
        createdAt: now,
        targetTab: 'transactions',
        targetPostId: txn.postId,
        targetTxnId: txn.id,
        openWallet: true,
      },
      ...prev,
    ]);

    return {
      success: true,
      message: `Đã thanh toán thành công ${amountToPay.toLocaleString('vi-VN')} ₫ cho ${txn.providerName}!`,
    };
  };

  // Allow supply post author to customize/edit default milestone template on their posted supply service
  const updatePostDefaultMilestones = (
    postId: string,
    milestones: ProgressMilestone[]
  ): { success: boolean; message: string } => {
    if (!isAuthenticated) {
      return { success: false, message: 'Vui lòng đăng nhập để chỉnh sửa tiến trình!' };
    }
    const post = posts.find((p) => p.id === postId);
    if (!post) {
      return { success: false, message: 'Không tìm thấy bài đăng!' };
    }
    if (post.authorId !== currentUser.id || post.type !== 'supply') {
      return { success: false, message: 'Chỉ chủ bài đăng Cung cấp dịch vụ mới được chỉnh sửa khung tiến trình này!' };
    }
    const cleaned = milestones
      .map((m, idx) => ({
        ...m,
        id: m.id || `pms-${Date.now()}-${idx}`,
        title: m.title.trim() || `Bước ${idx + 1}`,
        actionDetail: m.actionDetail?.trim() || '',
      }))
      .filter((m) => m.title.length > 0);
    if (cleaned.length === 0) {
      return { success: false, message: 'Cần có ít nhất 1 bước trong khung tiến trình!' };
    }
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, defaultMilestones: cleaned } : p))
    );
    return { success: true, message: `Đã lưu khung tiến trình gồm ${cleaned.length} bước cho bài cung cấp dịch vụ!` };
  };

  // Legacy wrapper for supply/demand contract creation
  const createTransactionFromPost = (
    post: ServicePost,
    areaVolume: number,
    executionDate: string,
    workTerms: string
  ): { success: boolean; error?: string; txnId?: string } => {
    if (post.type === 'supply') {
      const res = joinSupplyPost(post.id, areaVolume, executionDate, workTerms);
      return { success: res.success, error: res.success ? undefined : res.message, txnId: res.txnId };
    }
    const res = applyForDemandPost(post.id, workTerms);
    return { success: res.success, error: res.success ? undefined : res.message };
  };

  // Update transaction status (supports manual status transition if ever called)
  const updateTransactionStatus = (
    txnId: string,
    newStatus: AgriTransaction['status']
  ): { success: boolean; message: string } => {
    if (newStatus === 'completed') {
      return updateContractProgress(txnId, 100, 'Hoàn thành 100% & Giải ngân', 'Xác nhận hoàn tất hợp đồng.');
    }

    setTransactions(prev =>
      prev.map(t =>
        t.id === txnId
          ? {
              ...t,
              status: newStatus,
              completedAt: t.completedAt
            }
          : t
      )
    );

    return { success: true, message: 'Cập nhật trạng thái hợp đồng thành công!' };
  };

  // Top-up request to Viettel Money: 104888853717 - Huỳnh Công Khoa
  const requestTopUp = (amount: number): { success: boolean; request: TopUpRequest } => {
    const validAmount = Math.max(1000, Math.round(Number(amount) || 0));
    const reqId = `topup-req-${Date.now()}`;
    const transferCode = `NAPTIEN AGRI${Math.floor(100 + Math.random() * 900)}`;

    const newReq: TopUpRequest = {
      id: reqId,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      amount: validAmount,
      transferChannel: 'Viettel Money',
      transferToPhone: PLATFORM_ACCOUNT_NUMBER,
      transferToName: PLATFORM_ACCOUNT_NAME,
      transferCode,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    setTopupRequests(prev => [newReq, ...prev]);

    return { success: true, request: newReq };
  };

  // Shared credit helper used by both instant top-up confirmation & admin approval
  const creditTopUpRequest = (req: TopUpRequest): number => {
    const curBalance = walletTransactions
      .filter(tx => tx.userId === req.userId)
      .reduce((sum, tx) => sum + tx.amount, 0);

    const balanceBefore = curBalance;
    const balanceAfter = balanceBefore + req.amount;

    const newWalletTx: WalletTransaction = {
      id: `wtx-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: req.userId,
      amount: req.amount,
      balanceBefore,
      balanceAfter,
      type: 'topup',
      description: `Nạp tiền Viettel Money (${PLATFORM_ACCOUNT_NUMBER} - ${PLATFORM_ACCOUNT_NAME}) - Mã ${req.transferCode}`,
      referenceId: req.id,
      timestamp: new Date().toISOString(),
    };

    setWalletTransactions(prev => {
      // Idempotent guard: never credit same request twice
      if (prev.some(tx => tx.referenceId === req.id && tx.type === 'topup')) {
        return prev;
      }
      return [newWalletTx, ...prev];
    });

    setTopupRequests(prev =>
      prev.map(r =>
        r.id === req.id
          ? { ...r, status: 'approved', processedAt: new Date().toISOString() }
          : r
      )
    );

    const notif: AgriNotification = {
      id: `notif-${Date.now()}`,
      userId: req.userId,
      title: 'Nạp tiền thành công',
      message: `Tài khoản đã được cộng +${req.amount.toLocaleString('vi-VN')} ₫. Số dư mới: ${balanceAfter.toLocaleString('vi-VN')} ₫.`,
      type: 'wallet',
      read: false,
      createdAt: new Date().toISOString(),
      openWallet: true,
    };

    setNotifications(prev => [notif, ...prev]);
    return balanceAfter;
  };

  // User confirms transfer completed -> immediately credits wallet
  const confirmTopUpImmediate = (requestId: string): { success: boolean; message: string; newBalance?: number } => {
    const req = topupRequests.find(r => r.id === requestId);
    if (!req) {
      return { success: false, message: 'Không tìm thấy lệnh nạp tiền!' };
    }
    if (req.status === 'approved') {
      return {
        success: true,
        message: 'Lệnh nạp tiền này đã được cộng vào ví trước đó!',
        newBalance: getUserWalletBalance(req.userId)
      };
    }
    if (req.status === 'rejected') {
      return { success: false, message: 'Lệnh nạp tiền này đã bị từ chối!' };
    }

    const newBalance = creditTopUpRequest(req);
    return {
      success: true,
      message: `Đã nạp thành công +${req.amount.toLocaleString('vi-VN')} ₫ vào ví tài khoản!`,
      newBalance
    };
  };

  // Admin approves top-up
  const adminApproveTopUp = (requestId: string) => {
    const req = topupRequests.find(r => r.id === requestId);
    if (!req || req.status !== 'pending') return;
    creditTopUpRequest(req);
  };

  const adminRejectTopUp = (requestId: string) => {
    setTopupRequests(prev =>
      prev.map(r =>
        r.id === requestId
          ? { ...r, status: 'rejected', processedAt: new Date().toISOString() }
          : r
      )
    );
  };

  // Admin add service category
  const adminAddCategory = (newCatData: Omit<ServiceCategory, 'id'>) => {
    const newCategory: ServiceCategory = {
      ...newCatData,
      id: `cat-${Date.now()}`,
    };
    setCategories(prev => [...prev, newCategory]);
  };

  // Chat message
  const sendChatMessage = (txnId: string, text: string) => {
    const now = new Date().toISOString();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      contractId: txnId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderRole: currentUser.role,
      text,
      timestamp: now,
    };
    setChatMessages(prev => [...prev, newMsg]);

    const txn = transactions.find((t) => t.id === txnId);
    if (txn) {
      const receiverId = currentUser.id === txn.farmerId ? txn.providerId : txn.farmerId;
      if (receiverId && receiverId !== currentUser.id) {
        setNotifications((prev) => [
          {
            id: `notif-chat-${Date.now()}`,
            userId: receiverId,
            title: `Tin nhắn mới · ${txn.contractCode}`,
            message: `${currentUser.name}: "${text.slice(0, 80)}${text.length > 80 ? '...' : ''}"`,
            type: 'chat',
            read: false,
            createdAt: now,
            targetTab: 'transactions',
            targetPostId: txn.postId,
            targetTxnId: txn.id,
          },
          ...prev,
        ]);
      }
    }
  };

  // Add review
  const addReview = (txnId: string, targetUserId: string, rating: number, comment: string) => {
    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      transactionId: txnId,
      reviewerId: currentUser.id,
      reviewerName: currentUser.name,
      reviewerRole: currentUser.role,
      targetUserId,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };
    setReviews(prev => [newRev, ...prev]);

    // Mark transaction as reviewed
    setTransactions(prev =>
      prev.map(t => {
        if (t.id === txnId) {
          if (currentUser.role === 'farmer') {
            return { ...t, hasReviewedFarmer: true };
          } else {
            return { ...t, hasReviewedProvider: true };
          }
        }
        return t;
      })
    );
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const markAllNotificationsReadForCurrentUser = () => {
    setNotifications((prev) =>
      prev.map((n) =>
        !n.userId || n.userId === currentUser.id ? { ...n, read: true } : n
      )
    );
  };

  return (
    <AgriContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        allUsers,
        setCurrentUserRole,
        switchUser,
        logoutUser,
        registerUser,
        loginUser,
        deleteUser,
        showAuthModal,
        setShowAuthModal,
        authModalMode,
        openAuthModal,
        categories,
        posts,
        applications,
        transactions,
        walletTransactions,
        topupRequests,
        chatMessages,
        reviews,
        notifications,
        providerWalletBalance,
        getUserWalletBalance,
        showOnboarding,
        setShowOnboarding: (val: boolean) => {
          setShowOnboarding(val);
          if (!val) {
            localStorage.setItem('agri_onboarding_completed', 'true');
          }
        },
        activeTab,
        setActiveTab,
        selectedPost,
        setSelectedPost,
        editingPost,
        setEditingPost,
        selectedChatTxnId,
        setSelectedChatTxnId,
        pendingTransactionFocus,
        setPendingTransactionFocus,
        showWalletModal,
        setShowWalletModal,
        createPost,
        updatePost,
        updatePostDefaultMilestones,
        deletePost,
        applyForDemandPost,
        confirmDemandApplicant,
        joinSupplyPost,
        updateContractProgress,
        saveContractMilestones,
        saveSessionProgress,
        appendNextRecurringSession,
        settleTransactionPayment,
        createTransactionFromPost,
        updateTransactionStatus,
        requestTopUp,
        confirmTopUpImmediate,
        adminApproveTopUp,
        adminRejectTopUp,
        adminAddCategory,
        sendChatMessage,
        addReview,
        markNotificationAsRead,
        markAllNotificationsReadForCurrentUser,
        showSyncModal,
        setShowSyncModal,
        updateUserProfile,
        syncAllData,
        restoreDefaultData,
      }}
    >
      {children}
    </AgriContext.Provider>
  );
};

export const useAgri = () => {
  const context = useContext(AgriContext);
  if (!context) {
    throw new Error('useAgri must be used within an AgriProvider');
  }
  return context;
};
