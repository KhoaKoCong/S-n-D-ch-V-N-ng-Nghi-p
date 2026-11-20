export type UserRole = 'farmer' | 'provider' | 'admin';

export type AccountType =
  | 'admin'
  | 'enterprise'
  | 'farmer'
  | 'landowner'
  | 'workshop_owner'
  | 'custom';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  role: UserRole;
  accountType?: AccountType;
  customAccountLabel?: string;
  address: string;
  province: string;
  district: string;
  avatarUrl: string;
  verified: boolean;
  businessName?: string;
  machineryType?: string;
  capacity?: string;
  serviceRadiusKm?: number;
  experienceYears?: number;
  rating: number;
  reviewCount: number;
  completedDeals: number;
  password?: string;
  authProvider?: 'credentials' | 'google';
}

export type PostType = 'demand' | 'supply'; // 'demand' = farmer needs service, 'supply' = provider offers service

export type CategoryPricingGroup = 'area_with_extras' | 'weight_or_vehicle' | 'flexible';

export type PricingMode = 'area' | 'weight' | 'vehicle' | 'flexible';

export type ServiceHiringMode = 'full_service' | 'machine_rental';

export type WorkScheduleType = 'single_day' | 'multi_days' | 'recurring';

export type RecurrenceInterval =
  | 'daily'
  | 'every_2_days'
  | 'every_3_days'
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'custom_days';

export type RecurrenceDuration =
  | '1_week'
  | '2_weeks'
  | '1_month'
  | '3_months'
  | '6_months'
  | '1_year'
  | 'custom_months';

export interface WorkSchedule {
  type: WorkScheduleType;
  singleDate?: string;
  selectedDates?: string[];
  rangeStartDate?: string;
  rangeEndDate?: string;
  recurrenceInterval?: RecurrenceInterval;
  customIntervalDays?: number;
  recurrenceDuration?: RecurrenceDuration;
  customDurationMonths?: number;
  startDate?: string;
  totalOccurrences?: number;
}

export interface ExtraCostItem {
  id: string;
  label: string;
  amount: number;
}

export interface JointVentureTask {
  id: string;
  categoryId: string;
  categoryName: string;
  hiringMode?: ServiceHiringMode;
  pricingMode?: PricingMode;
  areaSize: number;
  areaUnit: string;
  price: number;
  note?: string;
}

export interface ServiceCategory {
  id: string;
  name: string;
  demandLabel?: string;
  supplyLabel?: string;
  supportedPostTypes?: PostType[];
  pricingGroup?: CategoryPricingGroup;
  supportsHiringMode?: boolean;
  suggestedExtras?: string[];
  icon: string;
  description: string;
  defaultUnit: string;
  defaultPrice: number;
}

export interface ServicePost {
  id: string;
  type: PostType;
  categoryId: string;
  categoryName: string;
  title: string;
  description: string;
  authorId: string;
  authorName: string;
  authorPhone: string;
  authorRole: UserRole;
  authorAccountType?: AccountType;
  authorAccountLabel?: string;
  authorVerified: boolean;
  authorRating: number;
  province: string;
  district: string;
  locationDetail: string; // Required for demand, optional (workshop/garage address) for supply
  pricingMode?: PricingMode;
  hiringMode?: ServiceHiringMode;
  isJointVenture?: boolean;
  maxPartners?: number;
  jointVentureTasks?: JointVentureTask[];
  areaSize?: number; // ha, cong, kg, tan, or vehicle count
  areaUnit: string; // 'ha', 'công', 'kg', 'tấn', 'xe', 'chuyến', 'giờ', 'gói'
  vehicleCount?: number; // Explicit vehicle count for transport/buying if pricingMode === 'vehicle'
  price: number; // integer VNĐ per unit
  priceUnit: string; // '₫/ha', '₫/công', '₫/kg', '₫/tấn', '₫/xe', '₫/chuyến'
  extraCosts?: ExtraCostItem[];
  extraCostsTotal?: number;
  executionDate: string; // YYYY-MM-DD (required for demand, empty for supply)
  workSchedule?: WorkSchedule;
  defaultMilestones?: ProgressMilestone[]; // Optional custom milestone template defined by supply post author
  equipmentCount?: number;
  capacityPerDay?: string;
  requirements?: string;
  imageUrl?: string;
  status: 'active' | 'in_negotiation' | 'completed' | 'closed';
  createdAt: string;
  distanceKm?: number; // for radar/map
}

export type ContractApplicationStatus = 'waiting' | 'accepted' | 'declined';

export interface ContractApplication {
  id: string;
  postId: string;
  applicantId: string;
  applicantName: string;
  applicantPhone: string;
  applicantRole: UserRole;
  applicantAccountType?: AccountType;
  applicantAccountLabel?: string;
  applicantRating: number;
  targetTaskId?: string;
  targetTaskTitle?: string;
  proposedHiringMode?: ServiceHiringMode;
  proposedNote: string;
  status: ContractApplicationStatus;
  createdAt: string;
}

export interface ProgressMilestone {
  id: string;
  title: string;
  actionDetail?: string; // Mô tả cụ thể hành động sẽ thực hiện / đã thực hiện
  completed: boolean;
  note?: string;
  updatedAt?: string;
}

export type PaymentMode = 'full_upfront' | 'deposit_percent' | 'per_session';

export interface PaymentPlan {
  mode: PaymentMode;
  depositPercent?: number; // 10 - 90% khi chọn đặt cọc
  upfrontAmount: number; // Số tiền tạm giữ ban đầu khi chốt hợp đồng
  releasedAmount: number; // Số tiền đã giải ngân vào ví bên thực hiện
  remainingAmount: number; // Số tiền bên thuê còn cần thanh toán thêm
  perSessionAmount?: number; // Số tiền phân bổ mỗi buổi khi chọn trả từng buổi
}

export interface SessionProgressRecord {
  id: string;
  sessionIndex: number; // 1-based
  scheduledDate: string; // YYYY-MM-DD
  status: 'pending' | 'in_progress' | 'completed';
  progressPercent: number; // 0 - 100
  milestones: ProgressMilestone[];
  summaryNote?: string;
  sessionAmount?: number;
  paid?: boolean;
  completedAt?: string;
}

export interface ProgressUpdateItem {
  id: string;
  percent: number;
  stepLabel: string;
  note: string;
  updatedById: string;
  updatedByName: string;
  timestamp: string;
}

export type TransactionStatus = 
  | 'pending_confirm'       // Chờ xác nhận
  | 'confirmed'             // Đã xác nhận
  | 'in_progress'           // Đang thực hiện
  | 'pending_completion'    // Chờ xác nhận hoàn thành
  | 'completed'             // Đã hoàn tất (đã giải ngân & thu phí sàn 3.000đ)
  | 'cancelled'             // Hủy giao dịch
  | 'disputed';             // Có tranh chấp

export interface AgriTransaction {
  id: string;
  contractCode: string;
  postId: string;
  originPostType: PostType;     // 'demand' | 'supply'
  postAuthorId: string;         // Chủ bài đăng gốc
  participantId: string;        // Người tham gia / ứng viên được chọn
  progressUpdaterId: string;    // ID duy nhất được quyền cập nhật tiến độ
  serviceName: string;
  hiringMode?: ServiceHiringMode;
  isJointVenture?: boolean;
  jointVentureTaskTitle?: string;
  farmerId: string;
  farmerName: string;
  farmerPhone: string;
  providerId: string;
  providerName: string;
  providerPhone: string;
  location: string;
  executionDate: string;
  workSchedule?: WorkSchedule;
  scheduleSummary?: string;
  areaVolume: number;
  unit: string;
  unitPrice: number; // VNĐ
  extraCosts?: ExtraCostItem[];
  extraCostsTotal?: number;
  totalAmount: number; // VNĐ integer (base + extraCostsTotal)
  workTerms: string;
  status: TransactionStatus;
  progressPercent: number;      // 0 - 100
  progressStepTitle: string;
  progressMilestones?: ProgressMilestone[];
  sessionProgress?: SessionProgressRecord[]; // Danh sách tiến trình theo từng buổi/ngày
  paymentPlan?: PaymentPlan; // Tùy chọn thanh toán: toàn bộ / cọc % / trả từng buổi
  progressUpdates: ProgressUpdateItem[];
  escrowAmount: number;         // Giá trị tạm giữ hiện tại từ ví bên thuê
  escrowReleased: boolean;      // Đã giải ngân phần tạm giữ hay chưa
  feeDeducted: boolean;
  feeAmount: number; // 3000 VNĐ
  createdAt: string;
  completedAt?: string;
  hasReviewedFarmer?: boolean;
  hasReviewedProvider?: boolean;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number; // +/- VNĐ
  balanceBefore: number;
  balanceAfter: number;
  type: 'topup' | 'platform_fee' | 'refund' | 'contract_escrow' | 'contract_payout';
  description: string;
  referenceId: string;
  timestamp: string;
}

export interface TopUpRequest {
  id: string;
  userId: string;
  userName: string;
  userPhone: string;
  amount: number;
  transferChannel: string; // "Viettel Money"
  transferToPhone: string; // "104888853717"
  transferToName: string; // "Huỳnh Công Khoa"
  transferCode: string; // e.g. "NAPTIEN AGRI123"
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  processedAt?: string;
}

export interface ChatMessage {
  id: string;
  contractId?: string;
  postId?: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  imageUrl?: string;
  timestamp: string;
}

export interface ReviewItem {
  id: string;
  transactionId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerRole: UserRole;
  targetUserId: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface AgriNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'order' | 'contract' | 'wallet' | 'chat' | 'system';
  read: boolean;
  createdAt: string;
  targetTab?: 'home' | 'news' | 'create' | 'transactions' | 'profile' | 'admin';
  targetPostId?: string;
  targetTxnId?: string;
  openWallet?: boolean;
}

export type NewsCategory = 'thoi-su' | 'nong-nghiep' | 'kinh-te' | 'thoi-tiet';

export type NewsRegion = 'dbscl' | 'other';

export interface LiveNewsArticle {
  id: string;
  category: NewsCategory;
  region: NewsRegion;
  regionLabel: string;
  title: string;
  summary: string;
  url: string;
  imageUrl: string | null;
  rawImageUrl: string | null;
  source: string;
  sourceDomain: string;
  publishedAt: string;
  publishedTimestamp: number;
}

export interface LiveNewsResponse {
  articles: LiveNewsArticle[];
  sources: string[];
  countsByCategory: Record<'all' | NewsCategory, number>;
  regionCounts?: { dbscl: number; other: number };
  cached: boolean;
  updatedAt: string;
  error?: string;
}
