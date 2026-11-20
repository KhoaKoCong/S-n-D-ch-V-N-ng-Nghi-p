import React from 'react';
import { useAgri } from '../context/AgriContext';
import { formatVND, formatDateTimeVN } from '../utils/formatters';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldCheck,
  PlusCircle,
  Copy,
  Clock,
  AlertCircle
} from 'lucide-react';

export const WalletScreen: React.FC = () => {
  const {
    providerWalletBalance,
    walletTransactions,
    setShowWalletModal,
    confirmTopUpImmediate,
    topupRequests,
    currentUser
  } = useAgri();

  const myTopUps = topupRequests.filter(r => r.userId === currentUser.id);
  const myWalletTxns = walletTransactions.filter(tx => tx.userId === currentUser.id);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
            Ví Điện Tử & Quản Lý Số Dư Sàn
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Theo dõi số dư, nạp tiền Viettel Money, tạm giữ thanh toán hợp đồng & phí giao dịch +3.000 ₫/lần (cộng thẳng về TK Huỳnh Công Khoa)
          </p>
        </div>

        <button
          onClick={() => setShowWalletModal(true)}
          className="px-5 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-lg shadow-emerald-700/20 active:scale-95 transition-all flex items-center gap-2 self-start"
        >
          <PlusCircle className="w-4 h-4" />
          <span>NẠP TÀI KHOẢN NGAY</span>
        </button>
      </div>

      {/* Balance Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-emerald-800 to-teal-900 text-white shadow-xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-2xl">
              🌾
            </div>
            <div>
              <p className="text-xs text-emerald-200 uppercase font-semibold tracking-wider">
                Số Dư Khả Dụng Hiện Tại
              </p>
              <h2 className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight mt-0.5">
                {formatVND(providerWalletBalance)}
              </h2>
            </div>
          </div>

          <div className="text-right hidden sm:block">
            <span className="text-xs text-emerald-200 block">Tài khoản:</span>
            <span className="font-bold text-sm text-white">{currentUser.name}</span>
          </div>
        </div>

        {/* Warning or Status */}
        {providerWalletBalance < 3000 ? (
          <div className="p-3.5 rounded-2xl bg-rose-900/60 border border-rose-400/40 flex items-center gap-3 text-xs text-rose-100">
            <AlertCircle className="w-5 h-5 text-rose-300 shrink-0" />
            <div>
              <p className="font-bold">CẢNH BÁO: Số dư dưới 3.000 ₫!</p>
              <span>Bạn cần nạp thêm tiền để đảm bảo thanh toán và phí giao dịch (+3.000 ₫/giao dịch).</span>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/20 flex items-center gap-3 text-xs text-emerald-100">
            <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0" />
            <div>
              <p className="font-bold">Số dư tài khoản an toàn</p>
              <span>Đủ điều kiện tham gia & thanh toán hợp đồng trên sàn. Phí giao dịch cố định: +3.000 ₫/giao dịch.</span>
            </div>
          </div>
        )}

        {/* Official Account Info Box */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/10 space-y-2 text-xs">
          <div className="flex items-center justify-between pb-1 border-b border-white/10">
            <span className="text-emerald-200">Tài khoản nhận phí & nạp ví:</span>
            <span className="font-bold text-red-300">Viettel Money</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Số tài khoản:</span>
            <span className="font-mono font-bold text-white text-sm">104888853717</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-300">Chủ tài khoản:</span>
            <span className="font-bold text-white">Huỳnh Công Khoa</span>
          </div>
        </div>
      </div>

      {/* Topup requests status */}
      {myTopUps.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <span>Yêu Cầu Nạp Tiền Của Bạn ({myTopUps.filter(r => r.status === 'pending').length} chờ duyệt)</span>
          </h3>

          <div className="space-y-3">
            {myTopUps.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {req.transferCode}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="text-slate-500">{formatDateTimeVN(req.createdAt)}</span>
                  </div>
                  <p className="mt-1 font-medium text-slate-700 dark:text-slate-300">
                    Chuyển đến: {req.transferChannel} - {req.transferToPhone} ({req.transferToName})
                  </p>
                </div>

                <div className="flex items-center gap-3 self-end sm:self-center">
                  <span className="font-extrabold text-base text-slate-900 dark:text-white tabular-nums">
                    +{formatVND(req.amount)}
                  </span>
                  {req.status === 'pending' ? (
                    <button
                      type="button"
                      onClick={() => confirmTopUpImmediate(req.id)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                    >
                      Xác nhận đã chuyển
                    </button>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full font-bold ${
                        req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {req.status === 'approved' ? 'Đã cộng tiền' : 'Từ chối'}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <h3 className="font-bold text-base text-slate-900 dark:text-white">
          Lịch Sử Biến Động Số Dư ({myWalletTxns.length})
        </h3>

        <div className="space-y-3">
          {myWalletTxns.map((tx) => {
            const isPlus = tx.amount > 0;
            const typeLabel =
              tx.type === 'contract_escrow'
                ? 'Tạm giữ hợp đồng'
                : tx.type === 'contract_payout'
                ? 'Giải ngân 100%'
                : tx.type === 'platform_fee'
                ? 'Phí sàn'
                : tx.type === 'topup'
                ? 'Nạp tiền'
                : 'Điều chỉnh ví';
            return (
              <div
                key={tx.id}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-colors flex items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isPlus
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                    }`}
                  >
                    {isPlus ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      {tx.description}
                    </p>
                    <p className="text-slate-400 mt-0.5">
                      {typeLabel} · {formatDateTimeVN(tx.timestamp)} · Mã GD: {tx.referenceId}
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p
                    className={`text-base font-extrabold font-mono tabular-nums ${
                      isPlus ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {isPlus ? '+' : ''}{formatVND(tx.amount)}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono tabular-nums">
                    Số dư sau: {formatVND(tx.balanceAfter)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
