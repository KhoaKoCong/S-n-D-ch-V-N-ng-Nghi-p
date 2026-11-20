import React, { useState, useEffect } from 'react';
import { useAgri } from '../context/AgriContext';
import { formatVND, formatDateTimeVN } from '../utils/formatters';
import {
  X,
  Copy,
  Check,
  ShieldCheck,
  ArrowRight,
  Clock,
  CheckCircle2,
  Wallet
} from 'lucide-react';
import { TopUpRequest } from '../types';

export const TopUpModal: React.FC = () => {
  const {
    showWalletModal,
    setShowWalletModal,
    requestTopUp,
    confirmTopUpImmediate,
    providerWalletBalance,
    currentUser,
    topupRequests,
    walletTransactions
  } = useAgri();

  const [selectedAmount, setSelectedAmount] = useState<number>(50000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [submittedRequest, setSubmittedRequest] = useState<TopUpRequest | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [confirmMsg, setConfirmMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Reset modal transient states whenever active user changes or modal opens/closes
  useEffect(() => {
    setSubmittedRequest(null);
    setConfirmMsg(null);
    setErrorMsg(null);
  }, [currentUser.id, showWalletModal]);

  if (!showWalletModal) return null;

  const amounts = [10000, 20000, 50000, 100000, 200000, 500000];
  const effectiveAmount = customAmount.trim() ? Number(customAmount.replace(/\D/g, '')) : selectedAmount;

  const myTopUpHistory = topupRequests.filter(r => r.userId === currentUser.id).slice(0, 5);
  const myRecentWalletTxns = walletTransactions.filter(tx => tx.userId === currentUser.id).slice(0, 4);

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleCreateTopUp = () => {
    setErrorMsg(null);
    setConfirmMsg(null);
    if (!effectiveAmount || effectiveAmount < 3000) {
      setErrorMsg('Số tiền nạp tối thiểu là 3.000 ₫');
      return;
    }
    const res = requestTopUp(effectiveAmount);
    if (res.success) {
      setSubmittedRequest(res.request);
    }
  };

  const handleConfirmNow = (reqId: string) => {
    setErrorMsg(null);
    const res = confirmTopUpImmediate(reqId);
    if (res.success) {
      setConfirmMsg(res.message);
      setSubmittedRequest(null);
      setCustomAmount('');
    } else {
      setErrorMsg(res.message);
    }
  };

  const closeModal = () => {
    setShowWalletModal(false);
    setSubmittedRequest(null);
    setConfirmMsg(null);
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-700 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold">
              💰
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Ví & Nạp Tiền Tài Khoản</h3>
              <p className="text-xs text-emerald-100">
                Tài khoản: <strong>{currentUser.name}</strong> · Viettel Money
              </p>
            </div>
          </div>
          <button
            onClick={closeModal}
            className="p-2 rounded-full hover:bg-white/10 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-800 dark:text-slate-100">
          {/* Current balance indicator */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">Số dư hiện tại của bạn:</p>
              <p className="text-2xl font-extrabold text-emerald-900 dark:text-emerald-100 tabular-nums">
                {formatVND(providerWalletBalance)}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 block">Phí giao dịch sàn</span>
              <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-200">+3.000 ₫ / giao dịch</span>
            </div>
          </div>

          {confirmMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <span>{confirmMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {!submittedRequest ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
                  Chọn mệnh giá nạp tiền:
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {amounts.map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => {
                        setSelectedAmount(amt);
                        setCustomAmount('');
                      }}
                      className={`py-2.5 px-3 rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-between border ${
                        !customAmount && selectedAmount === amt
                          ? 'bg-emerald-700 text-white border-emerald-800 shadow-md ring-2 ring-emerald-500/30'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                      }`}
                    >
                      <span>{formatVND(amt)}</span>
                      {!customAmount && selectedAmount === amt && <Check className="w-4 h-4 text-white shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Amount Input */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 text-slate-600 dark:text-slate-400">
                  Hoặc nhập số tiền tùy ý (VNĐ):
                </label>
                <input
                  type="number"
                  min={3000}
                  step={1000}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  placeholder="Ví dụ: 150000"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold text-sm"
                />
              </div>

              {/* Official Destination Account Box */}
              <div className="p-4 rounded-2xl border-2 border-emerald-600/40 bg-slate-50 dark:bg-slate-800/80 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Tài khoản nhận tiền chính thức của sàn
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200">
                    Viettel Money
                  </span>
                </div>

                <div className="space-y-2 text-xs sm:text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Số tài khoản:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-base text-slate-900 dark:text-white">104888853717</span>
                      <button
                        type="button"
                        onClick={() => handleCopy('104888853717', 'phone')}
                        className="p-1.5 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                        title="Sao chép"
                      >
                        {copiedField === 'phone' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Chủ tài khoản:</span>
                    <span className="font-bold text-slate-900 dark:text-white">Huỳnh Công Khoa</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 dark:text-slate-400">Số tiền nạp:</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 text-base">
                      {formatVND(effectiveAmount || 0)}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCreateTopUp}
                className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base shadow-lg shadow-emerald-700/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
              >
                <span>Tạo lệnh nạp tiền</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              {/* Recent TopUp Orders & Wallet Activity */}
              {(myTopUpHistory.length > 0 || myRecentWalletTxns.length > 0) && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Lệnh nạp & Biến động số dư gần đây</span>
                  </h4>

                  {myTopUpHistory.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">
                          +{formatVND(req.amount)} · <span className="font-mono text-emerald-700 dark:text-emerald-400">{req.transferCode}</span>
                        </p>
                        <p className="text-[10px] text-slate-400">{formatDateTimeVN(req.createdAt)}</p>
                      </div>

                      {req.status === 'pending' ? (
                        <button
                          type="button"
                          onClick={() => handleConfirmNow(req.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] shrink-0"
                        >
                          Xác nhận đã chuyển
                        </button>
                      ) : (
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] shrink-0 ${
                            req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {req.status === 'approved' ? 'Đã cộng tiền' : 'Đã từ chối'}
                        </span>
                      )}
                    </div>
                  ))}

                  {myRecentWalletTxns.map((wtx) => {
                    const isPlus = wtx.amount > 0;
                    return (
                      <div
                        key={wtx.id}
                        className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {wtx.description}
                          </p>
                          <p className="text-[10px] text-slate-400">{formatDateTimeVN(wtx.timestamp)}</p>
                        </div>
                        <span
                          className={`font-extrabold font-mono tabular-nums shrink-0 ${
                            isPlus ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}
                        >
                          {isPlus ? '+' : ''}{formatVND(wtx.amount)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Show generated order details & confirm transfer immediately or keep pending for admin */
            <div className="space-y-4 animate-fade-in">
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex gap-3 items-start">
                <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
                  <p className="font-bold">Lệnh nạp tiền đã tạo thành công!</p>
                  Vui lòng chuyển khoản qua <strong>Viettel Money</strong> đúng thông tin bên dưới, sau đó bấm <strong>"Xác nhận đã chuyển khoản"</strong> để tiền được cộng vào ví ngay lập tức.
                </div>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/70 space-y-3">
                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-slate-500">Kênh nạp:</span>
                  <span className="font-bold text-red-600">Viettel Money</span>
                </div>

                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-slate-500">Số tài khoản / SĐT:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-base text-slate-900 dark:text-white">
                      {submittedRequest.transferToPhone}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(submittedRequest.transferToPhone, 'phone2')}
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-slate-700 rounded-lg"
                    >
                      {copiedField === 'phone2' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-slate-500">Tên người nhận:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {submittedRequest.transferToName}
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs sm:text-sm">
                  <span className="text-slate-500">Số tiền nạp:</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 text-lg">
                    {formatVND(submittedRequest.amount)}
                  </span>
                </div>

                {/* CRITICAL TRANSFER CODE */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-1">
                    Nội dung chuyển khoản:
                  </span>
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-emerald-500">
                    <span className="font-mono font-extrabold text-emerald-700 dark:text-emerald-300 text-base">
                      {submittedRequest.transferCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(submittedRequest.transferCode, 'code')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      {copiedField === 'code' ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" /> Sao chép
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleConfirmNow(submittedRequest.id)}
                  className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>XÁC NHẬN ĐÃ CHUYỂN KHOẢN (CỘNG TIỀN NGAY)</span>
                </button>

                <button
                  type="button"
                  onClick={closeModal}
                  className="w-full py-3 rounded-2xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                >
                  Lưu lệnh chờ Admin duyệt sau
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
