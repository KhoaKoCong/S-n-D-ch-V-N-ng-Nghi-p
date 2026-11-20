import { RecurrenceDuration, RecurrenceInterval, WorkSchedule } from '../types';

// Vietnamese currency and date formatting utilities

export function formatVND(amount: number): string {
  // Uses integer representation, Vietnamese standard separator
  return new Intl.NumberFormat('vi-VN').format(Math.round(amount)) + ' ₫';
}

export function formatDateVN(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTimeVN(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ' + 
           d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

export function getStatusBadge(status: string): { label: string; bg: string; text: string; border: string } {
  switch (status) {
    case 'pending_confirm':
      return { label: 'Chờ xác nhận', bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-800 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' };
    case 'confirmed':
      return { label: 'Đã xác nhận', bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-800 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800' };
    case 'in_progress':
      return { label: 'Đang thực hiện', bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-800 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' };
    case 'pending_completion':
      return { label: 'Chờ duyệt xong', bg: 'bg-purple-50 dark:bg-purple-950/40', text: 'text-purple-800 dark:text-purple-300', border: 'border-purple-200 dark:border-purple-800' };
    case 'completed':
      return { label: 'Đã hoàn tất', bg: 'bg-emerald-100 dark:bg-emerald-900/40', text: 'text-emerald-900 dark:text-emerald-200', border: 'border-emerald-300 dark:border-emerald-700' };
    case 'cancelled':
      return { label: 'Đã hủy', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700' };
    case 'disputed':
      return { label: 'Có khiếu nại', bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-800 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' };
    default:
      return { label: status, bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-700' };
  }
}

export function getAccountTypeInfo(user: {
  role: 'farmer' | 'provider' | 'admin';
  accountType?: string;
  customAccountLabel?: string;
}): { icon: string; shortLabel: string; fullLabel: string; badgeClass: string } {
  const type = user.accountType || (user.role === 'admin' ? 'admin' : user.role === 'provider' ? 'workshop_owner' : 'farmer');

  switch (type) {
    case 'admin':
      return {
        icon: '🛡️',
        shortLabel: 'Admin',
        fullLabel: '🛡️ Quản Trị Viên Hệ Thống',
        badgeClass: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
      };
    case 'enterprise':
      return {
        icon: '🏢',
        shortLabel: 'Doanh nghiệp',
        fullLabel: '🏢 Doanh Nghiệp Nông Nghiệp',
        badgeClass: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
      };
    case 'landowner':
      return {
        icon: '🏞️',
        shortLabel: 'Chủ đất',
        fullLabel: '🏞️ Chủ Đất / Chủ Ruộng Lớn',
        badgeClass: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300'
      };
    case 'workshop_owner':
      return {
        icon: '🏭',
        shortLabel: 'Chủ xưởng máy',
        fullLabel: '🏭 Chủ Xưởng Máy / Thiết Bị',
        badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
      };
    case 'custom': {
      const customName = user.customAccountLabel?.trim() || 'Tùy chỉnh';
      return {
        icon: '✨',
        shortLabel: customName,
        fullLabel: `✨ ${customName}`,
        badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300'
      };
    }
    case 'farmer':
    default:
      return {
        icon: '🌾',
        shortLabel: 'Nông dân',
        fullLabel: '🌾 Nông Dân Canh Tác',
        badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
      };
  }
}

export function getCategoryPricingGroup(categoryId: string, explicitGroup?: string): 'area_with_extras' | 'weight_or_vehicle' | 'flexible' {
  if (explicitGroup === 'area_with_extras' || explicitGroup === 'weight_or_vehicle' || explicitGroup === 'flexible') {
    return explicitGroup;
  }
  if (['cat-10', 'cat-11', 'cat-12', 'cat-13'].includes(categoryId)) {
    return 'weight_or_vehicle';
  }
  if (categoryId === 'cat-14') {
    return 'flexible';
  }
  return 'area_with_extras';
}

export function getCategoryDisplayLabel(
  cat: { name: string; demandLabel?: string; supplyLabel?: string },
  postType: 'demand' | 'supply'
): string {
  return postType === 'demand' ? cat.demandLabel || cat.name : cat.supplyLabel || cat.name;
}

export function computeExtraCostsTotal(extraCosts?: { amount: number }[]): number {
  if (!extraCosts || extraCosts.length === 0) return 0;
  return extraCosts.reduce((sum, item) => sum + Math.max(0, Math.round(Number(item.amount) || 0)), 0);
}

export function categorySupportsHiringMode(categoryId: string, explicitFlag?: boolean): boolean {
  if (typeof explicitFlag === 'boolean') return explicitFlag;
  return ['cat-1', 'cat-2', 'cat-3', 'cat-4', 'cat-5', 'cat-6'].includes(categoryId);
}

export function getHiringModeLabel(
  mode?: 'full_service' | 'machine_rental',
  postType: 'demand' | 'supply' = 'demand'
): string {
  if (mode === 'machine_rental') {
    return postType === 'supply' ? 'Cho thuê máy tự làm' : 'Thuê máy để tự làm';
  }
  return postType === 'supply' ? 'Cung cấp trọn gói (Có người làm)' : 'Thuê người làm hộ';
}

export function computePostGrandTotal(post: {
  isJointVenture?: boolean;
  jointVentureTasks?: { areaSize: number; price: number }[];
  pricingMode?: string;
  vehicleCount?: number;
  areaSize?: number;
  price: number;
  extraCosts?: { amount: number }[];
}): number {
  const extras = computeExtraCostsTotal(post.extraCosts);
  if (post.isJointVenture && post.jointVentureTasks && post.jointVentureTasks.length > 0) {
    const tasksSum = post.jointVentureTasks.reduce(
      (sum, t) => sum + Math.round(Math.max(1, t.areaSize || 1) * (t.price || 0)),
      0
    );
    return tasksSum + extras;
  }
  const vol =
    post.pricingMode === 'vehicle'
      ? Math.max(1, post.vehicleCount || post.areaSize || 1)
      : Math.max(1, post.areaSize || 1);
  return Math.round(vol * (post.price || 0)) + extras;
}

export function computeJointVentureSlotBreakdown(
  post: {
    isJointVenture?: boolean;
    maxPartners?: number;
    jointVentureTasks?: {
      id: string;
      categoryName: string;
      hiringMode?: 'full_service' | 'machine_rental';
      areaSize: number;
      areaUnit: string;
      price: number;
    }[];
    pricingMode?: string;
    vehicleCount?: number;
    areaSize?: number;
    areaUnit: string;
    price: number;
    extraCosts?: { amount: number }[];
  },
  targetTaskId?: string,
  alreadyAcceptedCount = 0
): {
  baseAmount: number;
  extraShare: number;
  totalAmount: number;
  volume: number;
  unit: string;
  unitPrice: number;
  taskTitle?: string;
  hiringMode?: 'full_service' | 'machine_rental';
} {
  const extrasTotal = computeExtraCostsTotal(post.extraCosts);

  if (!post.isJointVenture || !post.jointVentureTasks || post.jointVentureTasks.length === 0) {
    const vol =
      post.pricingMode === 'vehicle'
        ? Math.max(1, post.vehicleCount || post.areaSize || 1)
        : Math.max(1, post.areaSize || 1);
    const baseAmount = Math.round(vol * post.price);
    return {
      baseAmount,
      extraShare: extrasTotal,
      totalAmount: baseAmount + extrasTotal,
      volume: vol,
      unit: post.areaUnit || (post.pricingMode === 'vehicle' ? 'xe' : 'ha'),
      unitPrice: post.price,
    };
  }

  const maxP = Math.max(1, post.maxPartners || post.jointVentureTasks.length || 1);
  const perSlotExtra = Math.floor(extrasTotal / maxP);
  const remainder = extrasTotal - perSlotExtra * maxP;
  const extraShare = perSlotExtra + (alreadyAcceptedCount === 0 ? remainder : 0);

  const matchedTask =
    (targetTaskId && post.jointVentureTasks.find((t) => t.id === targetTaskId)) ||
    post.jointVentureTasks[alreadyAcceptedCount % post.jointVentureTasks.length];

  if (matchedTask) {
    const vol = Math.max(1, matchedTask.areaSize || 1);
    const baseAmount = Math.round(vol * matchedTask.price);
    return {
      baseAmount,
      extraShare,
      totalAmount: baseAmount + extraShare,
      volume: vol,
      unit: matchedTask.areaUnit || 'ha',
      unitPrice: matchedTask.price,
      taskTitle: matchedTask.categoryName,
      hiringMode: matchedTask.hiringMode,
    };
  }

  const totalTasks = post.jointVentureTasks.reduce(
    (s, t) => s + Math.round(Math.max(1, t.areaSize || 1) * t.price),
    0
  );
  const baseAmount = Math.round(totalTasks / maxP);
  return {
    baseAmount,
    extraShare,
    totalAmount: baseAmount + extraShare,
    volume: 1,
    unit: 'gói',
    unitPrice: baseAmount,
  };
}

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseISODate(str: string): Date | null {
  if (!str) return null;
  const parts = str.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
}

export function generateConsecutiveDates(startStr: string, endStr: string, maxDays = 180): string[] {
  const start = parseISODate(startStr);
  const end = parseISODate(endStr);
  if (!start || !end || start.getTime() > end.getTime()) return [];
  const result: string[] = [];
  const cursor = new Date(start.getTime());
  while (cursor.getTime() <= end.getTime() && result.length < maxDays) {
    result.push(toISODate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export function getRecurrenceIntervalLabel(interval?: RecurrenceInterval, customDays = 4): string {
  switch (interval) {
    case 'daily':
      return 'Hàng ngày';
    case 'every_2_days':
      return '2 ngày 1 lần';
    case 'every_3_days':
      return '3 ngày 1 lần';
    case 'weekly':
      return '1 tuần 1 lần';
    case 'biweekly':
      return '2 tuần 1 lần';
    case 'monthly':
      return '1 tháng 1 lần';
    case 'custom_days':
      return `${Math.max(1, customDays)} ngày 1 lần`;
    default:
      return 'Định kỳ';
  }
}

export function getRecurrenceDurationLabel(duration?: RecurrenceDuration, customMonths = 2): string {
  switch (duration) {
    case '1_week':
      return '1 tuần';
    case '2_weeks':
      return '2 tuần';
    case '1_month':
      return '1 tháng';
    case '3_months':
      return '3 tháng';
    case '6_months':
      return '6 tháng';
    case '1_year':
      return '1 năm';
    case 'custom_months':
      return `${Math.max(1, customMonths)} tháng`;
    default:
      return '1 tháng';
  }
}

export function calculateRecurringDates(
  startDateStr: string,
  interval: RecurrenceInterval = 'every_2_days',
  customIntervalDays = 4,
  duration: RecurrenceDuration = '1_month',
  customDurationMonths = 2
): {
  previewDates: string[];
  totalCount: number;
  endDateStr: string;
  intervalLabel: string;
  durationLabel: string;
} {
  const start = parseISODate(startDateStr) || new Date();
  const end = new Date(start.getTime());

  switch (duration) {
    case '1_week':
      end.setDate(end.getDate() + 6);
      break;
    case '2_weeks':
      end.setDate(end.getDate() + 13);
      break;
    case '1_month':
      end.setMonth(end.getMonth() + 1);
      break;
    case '3_months':
      end.setMonth(end.getMonth() + 3);
      break;
    case '6_months':
      end.setMonth(end.getMonth() + 6);
      break;
    case '1_year':
      end.setFullYear(end.getFullYear() + 1);
      break;
    case 'custom_months':
      end.setMonth(end.getMonth() + Math.max(1, Math.min(36, Math.round(customDurationMonths) || 1)));
      break;
  }

  const dates: string[] = [];
  const cursor = new Date(start.getTime());
  let guard = 0;

  while (cursor.getTime() <= end.getTime() && guard < 400) {
    dates.push(toISODate(cursor));
    guard++;
    switch (interval) {
      case 'daily':
        cursor.setDate(cursor.getDate() + 1);
        break;
      case 'every_2_days':
        cursor.setDate(cursor.getDate() + 2);
        break;
      case 'every_3_days':
        cursor.setDate(cursor.getDate() + 3);
        break;
      case 'weekly':
        cursor.setDate(cursor.getDate() + 7);
        break;
      case 'biweekly':
        cursor.setDate(cursor.getDate() + 14);
        break;
      case 'monthly':
        cursor.setMonth(cursor.getMonth() + 1);
        break;
      case 'custom_days':
        cursor.setDate(cursor.getDate() + Math.max(1, Math.min(90, Math.round(customIntervalDays) || 1)));
        break;
    }
  }

  return {
    previewDates: dates.slice(0, 8),
    totalCount: dates.length,
    endDateStr: toISODate(end),
    intervalLabel: getRecurrenceIntervalLabel(interval, customIntervalDays),
    durationLabel: getRecurrenceDurationLabel(duration, customDurationMonths),
  };
}

export function formatWorkScheduleSummary(item: {
  type?: 'demand' | 'supply';
  originPostType?: 'demand' | 'supply';
  executionDate?: string;
  workSchedule?: WorkSchedule;
  scheduleSummary?: string;
}): string {
  if (item.scheduleSummary) return item.scheduleSummary;
  const kind = item.originPostType || item.type;
  if (kind === 'supply' && !item.executionDate && !item.workSchedule) {
    return 'Linh hoạt theo lịch khách đặt';
  }
  const ws = item.workSchedule;
  if (ws) {
    if (ws.type === 'multi_days') {
      const dates = [...(ws.selectedDates || [])].sort();
      if (dates.length === 1) return `Ngày ${formatDateVN(dates[0])}`;
      if (dates.length > 1) {
        return `${dates.length} ngày (${formatDateVN(dates[0])} → ${formatDateVN(dates[dates.length - 1])})`;
      }
    }
    if (ws.type === 'recurring') {
      const intervalLabel = getRecurrenceIntervalLabel(ws.recurrenceInterval, ws.customIntervalDays);
      const durationLabel = getRecurrenceDurationLabel(ws.recurrenceDuration, ws.customDurationMonths);
      const start = ws.startDate || item.executionDate;
      const countText = ws.totalOccurrences ? ` · ~${ws.totalOccurrences} buổi` : '';
      return `Lặp ${intervalLabel} trong ${durationLabel}${start ? ` (từ ${formatDateVN(start)})` : ''}${countText}`;
    }
    if (ws.singleDate) {
      return `Ngày ${formatDateVN(ws.singleDate)}`;
    }
  }
  if (kind === 'supply' && !item.executionDate) {
    return 'Linh hoạt theo lịch khách đặt';
  }
  return item.executionDate ? formatDateVN(item.executionDate) : 'Linh hoạt theo lịch khách đặt';
}

export function buildContractSessionDates(
  workSchedule?: WorkSchedule,
  executionDate?: string,
  maxInitialSessions = 12
): string[] {
  const fallbackDate = executionDate || toISODate(new Date());
  if (!workSchedule) {
    return [fallbackDate];
  }

  if (workSchedule.type === 'multi_days') {
    if (workSchedule.selectedDates && workSchedule.selectedDates.length > 0) {
      const sorted = Array.from(new Set(workSchedule.selectedDates)).sort();
      return sorted.slice(0, maxInitialSessions);
    }
    if (workSchedule.rangeStartDate && workSchedule.rangeEndDate) {
      const dates = generateConsecutiveDates(workSchedule.rangeStartDate, workSchedule.rangeEndDate, maxInitialSessions);
      return dates.length > 0 ? dates : [fallbackDate];
    }
  }

  if (workSchedule.type === 'recurring') {
    const startStr = workSchedule.startDate || fallbackDate;
    const start = parseISODate(startStr) || new Date();
    const end = new Date(start.getTime());
    const duration = workSchedule.recurrenceDuration || '1_month';
    const customMonths = workSchedule.customDurationMonths || 2;
    switch (duration) {
      case '1_week':
        end.setDate(end.getDate() + 6);
        break;
      case '2_weeks':
        end.setDate(end.getDate() + 13);
        break;
      case '1_month':
        end.setMonth(end.getMonth() + 1);
        break;
      case '3_months':
        end.setMonth(end.getMonth() + 3);
        break;
      case '6_months':
        end.setMonth(end.getMonth() + 6);
        break;
      case '1_year':
        end.setFullYear(end.getFullYear() + 1);
        break;
      case 'custom_months':
        end.setMonth(end.getMonth() + Math.max(1, Math.min(36, Math.round(customMonths) || 1)));
        break;
    }

    const dates: string[] = [];
    const cursor = new Date(start.getTime());
    const interval = workSchedule.recurrenceInterval || 'every_2_days';
    const customDays = workSchedule.customIntervalDays || 4;

    while (cursor.getTime() <= end.getTime() && dates.length < maxInitialSessions) {
      dates.push(toISODate(cursor));
      switch (interval) {
        case 'daily':
          cursor.setDate(cursor.getDate() + 1);
          break;
        case 'every_2_days':
          cursor.setDate(cursor.getDate() + 2);
          break;
        case 'every_3_days':
          cursor.setDate(cursor.getDate() + 3);
          break;
        case 'weekly':
          cursor.setDate(cursor.getDate() + 7);
          break;
        case 'biweekly':
          cursor.setDate(cursor.getDate() + 14);
          break;
        case 'monthly':
          cursor.setMonth(cursor.getMonth() + 1);
          break;
        case 'custom_days':
          cursor.setDate(cursor.getDate() + Math.max(1, Math.min(90, Math.round(customDays) || 1)));
          break;
      }
    }
    return dates.length > 0 ? dates : [fallbackDate];
  }

  return [workSchedule.singleDate || fallbackDate];
}

export function computeNextRecurringDate(lastDateStr: string, workSchedule?: WorkSchedule): string {
  const base = parseISODate(lastDateStr) || new Date();
  const next = new Date(base.getTime());
  const interval = workSchedule?.recurrenceInterval || 'every_2_days';
  const customDays = workSchedule?.customIntervalDays || 4;
  switch (interval) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'every_2_days':
      next.setDate(next.getDate() + 2);
      break;
    case 'every_3_days':
      next.setDate(next.getDate() + 3);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'custom_days':
      next.setDate(next.getDate() + Math.max(1, Math.min(90, Math.round(customDays) || 1)));
      break;
    default:
      next.setDate(next.getDate() + 1);
  }
  return toISODate(next);
}

export function computeUpfrontPayment(
  totalAmount: number,
  mode: 'full_upfront' | 'deposit_percent' | 'per_session',
  depositPercent = 30
): number {
  const safeTotal = Math.max(0, Math.round(totalAmount));
  if (mode === 'full_upfront') return safeTotal;
  if (mode === 'deposit_percent') {
    const pct = Math.max(10, Math.min(90, Math.round(depositPercent) || 30));
    return Math.round((safeTotal * pct) / 100);
  }
  return 0; // Trả từng buổi sau khi hoàn thành
}

export function getPaymentPlanSummaryLabel(plan?: {
  mode: 'full_upfront' | 'deposit_percent' | 'per_session';
  depositPercent?: number;
}): string {
  if (!plan || plan.mode === 'full_upfront') return 'Chuyển toàn bộ (100%)';
  if (plan.mode === 'deposit_percent') return `Đặt cọc ${plan.depositPercent || 30}%`;
  return 'Trả từng buổi sau khi xong';
}



