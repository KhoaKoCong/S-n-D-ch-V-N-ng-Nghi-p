import React, { useState } from 'react';
import { useAgri } from '../context/AgriContext';
import {
  X,
  RefreshCw,
  RotateCcw,
  CheckCircle2,
  Database,
  UserCheck,
  ShieldCheck,
  Edit,
  Save,
  AlertTriangle
} from 'lucide-react';

export const SyncModal: React.FC = () => {
  const {
    showSyncModal,
    setShowSyncModal,
    syncAllData,
    restoreDefaultData,
    currentUser,
    updateUserProfile,
    posts,
    allUsers,
    transactions
  } = useAgri();

  const [activeTab, setActiveTab] = useState<'sync' | 'editProfile'>('sync');
  const [syncStatusMsg, setSyncStatusMsg] = useState<string | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Profile Edit states
  const [name, setName] = useState(currentUser.name);
  const [phone, setPhone] = useState(currentUser.phone);
  const [province, setProvince] = useState(currentUser.province || 'An Giang');
  const [district, setDistrict] = useState(currentUser.district || 'Châu Thành');
  const [machineryType, setMachineryType] = useState(currentUser.machineryType || '');
  const [capacity, setCapacity] = useState(currentUser.capacity || '');

  // Reset form when currentUser changes
  React.useEffect(() => {
    setName(currentUser.name);
    setPhone(currentUser.phone);
    setProvince(currentUser.province || 'An Giang');
    setDistrict(currentUser.district || 'Châu Thành');
    setMachineryType(currentUser.machineryType || '');
    setCapacity(currentUser.capacity || '');
  }, [currentUser]);

  if (!showSyncModal) return null;

  const handleManualSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      const res = syncAllData();
      setIsSyncing(false);
      setSyncStatusMsg(res.message);
      setTimeout(() => setSyncStatusMsg(null), 4000);
    }, 400);
  };

  const handleRestoreDefaults = () => {
    const res = restoreDefaultData();
    setShowRestoreConfirm(false);
    setSyncStatusMsg(res.message);
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const res = updateUserProfile({
      name,
      phone,
      province,
      district,
      machineryType: currentUser.role === 'provider' ? machineryType : undefined,
      capacity: currentUser.role === 'provider' ? capacity : undefined
    });
    setSyncStatusMsg(res.message);
    setTimeout(() => setSyncStatusMsg(null), 4000);
  };

  const provinces = ['An Giang', 'Đồng Tháp', 'Cần Thơ', 'Kiên Giang', 'Long An', 'Sóc Trăng'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold">
              <RefreshCw className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
                Trung Tâm Đồng Bộ Dữ Liệu
              </h3>
              <p className="text-xs text-slate-500">Đồng bộ tức thì giữa tài khoản & bài đăng trên sàn</p>
            </div>
          </div>
          <button
            onClick={() => setShowSyncModal(false)}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 pt-3 gap-3">
          <button
            onClick={() => setActiveTab('sync')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'sync'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Đồng bộ & Khôi phục</span>
          </button>

          <button
            onClick={() => setActiveTab('editProfile')}
            className={`pb-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'editProfile'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Sửa & Đồng bộ thông tin cá nhân</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 flex-1">
          {syncStatusMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
              <span>{syncStatusMsg}</span>
            </div>
          )}

          {activeTab === 'sync' ? (
            <div className="space-y-5">
              {/* Status summary */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Trạng thái kết nối dữ liệu:
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Thời gian thực (Real-time)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-1">
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {posts.length}
                    </p>
                    <span className="text-[10px] text-slate-500 block font-medium">Bài đăng sàn</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {allUsers.length}
                    </p>
                    <span className="text-[10px] text-slate-500 block font-medium">Tài khoản</span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                    <p className="text-lg font-black text-emerald-700 dark:text-emerald-400 tabular-nums">
                      {transactions.length}
                    </p>
                    <span className="text-[10px] text-slate-500 block font-medium">Hợp đồng</span>
                  </div>
                </div>
              </div>

              {/* Action 1: Manual Sync Now */}
              <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 space-y-2">
                <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100 font-bold text-sm">
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>1. Đồng bộ hóa dữ liệu ngay lập tức</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Làm mới toàn bộ dữ liệu, đồng bộ hóa tên tài khoản, số điện thoại người đăng vào tất cả bài đăng trên Trang chủ, Tìm kiếm và Hồ sơ cá nhân.
                </p>
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="w-full py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'ĐANG ĐỒNG BỘ...' : 'BẤM ĐỂ ĐỒNG BỘ DỮ LIỆU NGAY'}</span>
                </button>
              </div>

              {/* Action 2: Restore Original Demo Data */}
              <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-950/30 space-y-2">
                <div className="flex items-center gap-2 text-amber-900 dark:text-amber-100 font-bold text-sm">
                  <RotateCcw className="w-4 h-4" />
                  <span>2. Khôi phục dữ liệu gốc mẫu (Khuyên dùng khi lỡ xóa bài)</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Nếu bạn đã xóa thử các bài đăng hoặc tài khoản và muốn khôi phục lại toàn bộ dữ liệu mẫu ban đầu (8 bài đăng phun thuốc, gieo sạ drone, máy gặt, cày bừa, tài khoản mẫu), hãy bấm khôi phục tại đây.
                </p>
                <button
                  type="button"
                  onClick={() => setShowRestoreConfirm(true)}
                  className="w-full py-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>KHÔI PHỤC TOÀN BỘ DỮ LIỆU GỐC</span>
                </button>
              </div>
            </div>
          ) : (
            /* Tab Edit Profile and auto-sync into posts */
            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-900 dark:text-blue-200 text-xs">
                💡 Khi bạn lưu thông tin ở đây, hệ thống sẽ <strong>tự động đồng bộ ngay</strong> tên, số điện thoại và địa chỉ mới vào toàn bộ các bài đăng của bạn trên sàn!
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Họ và tên hiển thị:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Số điện thoại liên hệ:
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tỉnh / Thành phố:
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {provinces.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Huyện / Thị xã:
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {currentUser.role === 'provider' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Loại máy móc / Thiết bị cung cấp:
                    </label>
                    <input
                      type="text"
                      value={machineryType}
                      onChange={(e) => setMachineryType(e.target.value)}
                      placeholder="Ví dụ: Drone DJI Agras T40, Máy gặt Kubota DC70..."
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Công suất phục vụ:
                    </label>
                    <input
                      type="text"
                      value={capacity}
                      onChange={(e) => setCapacity(e.target.value)}
                      placeholder="Ví dụ: 50 ha/ngày"
                      className="w-full p-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs shadow-md transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>LƯU & ĐỒNG BỘ TOÀN DIỆN VÀO BÀI ĐĂNG</span>
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Confirmation modal for restore */}
      {showRestoreConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">
                Khôi phục toàn bộ dữ liệu gốc?
              </h4>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tất cả bài đăng mẫu, 3 tài khoản mẫu và các hợp đồng mẫu sẽ được khôi phục nguyên vẹn về trạng thái ban đầu của sàn.
              </p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRestoreConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRestoreDefaults}
                className="flex-1 py-2.5 rounded-xl bg-amber-600 text-white text-xs font-bold hover:bg-amber-700"
              >
                Xác nhận khôi phục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
