import React, { useState } from 'react';
import { useAgri } from '../context/AgriContext';
import { formatVND, formatDateTimeVN, getAccountTypeInfo } from '../utils/formatters';
import {
  ShieldAlert,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  DollarSign,
  TrendingUp,
  FileCheck,
  FolderPlus,
  AlertTriangle,
  Trash2,
  Wallet
} from 'lucide-react';

export const AdminDashboardScreen: React.FC = () => {
  const {
    currentUser,
    allUsers,
    getUserWalletBalance,
    posts,
    deletePost,
    setSelectedPost,
    transactions,
    walletTransactions,
    topupRequests,
    adminApproveTopUp,
    adminRejectTopUp,
    categories,
    adminAddCategory
  } = useAgri();

  const [adminDeletePostId, setAdminDeletePostId] = useState<string | null>(null);

  // New category form
  const [showAddCat, setShowAddCat] = useState(false);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('🌾');
  const [catDesc, setCatDesc] = useState('');
  const [catUnit, setCatUnit] = useState('ha');
  const [catPrice, setCatPrice] = useState(150000);

  // Statistics
  const feeBearingTxns = transactions.filter((t) => t.feeDeducted || t.status === 'completed');
  const ownerAccount = allUsers.find((u) => u.role === 'admin');
  const ownerWalletBalance = ownerAccount ? getUserWalletBalance(ownerAccount.id) : 0;
  const ownerFeeCredits = walletTransactions
    .filter((w) => w.userId === (ownerAccount?.id || 'user-admin') && w.type === 'platform_fee' && w.amount > 0)
    .reduce((sum, w) => sum + w.amount, 0);
  const totalPlatformFees = Math.max(ownerFeeCredits, feeBearingTxns.length * 3000);
  const pendingTopUps = topupRequests.filter((r) => r.status === 'pending');
  const totalApprovedTopup = topupRequests
    .filter((r) => r.status === 'approved')
    .reduce((sum, r) => sum + r.amount, 0);

  const handleAddCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) return;
    adminAddCategory({
      name: catName,
      icon: catIcon,
      description: catDesc || 'Dịch vụ hỗ trợ sản xuất nông nghiệp',
      defaultUnit: catUnit,
      defaultPrice: Number(catPrice),
    });
    setCatName('');
    setCatDesc('');
    setShowAddCat(false);
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-900 dark:text-indigo-300 text-xs font-bold mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Khu Vực Quản Trị Hệ Thống Toàn Sàn</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Bảng Điều Khiển Quản Trị Viên (Admin)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Duyệt nạp tiền, giám sát phí giao dịch +3.000 ₫ cộng thẳng về TK Huỳnh Công Khoa (104888853717), quản lý danh mục và người dùng
          </p>
        </div>

        <button
          onClick={() => setShowAddCat(true)}
          className="px-4 py-2.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md flex items-center gap-2 self-start"
        >
          <FolderPlus className="w-4 h-4" />
          <span>Thêm danh mục dịch vụ mới</span>
        </button>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs text-slate-500 uppercase font-semibold">Phí Giao Dịch (+3.000 ₫/GD)</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
            {formatVND(totalPlatformFees)}
          </p>
          <p className="text-[11px] text-slate-400">
            Cộng thẳng TK 104888853717 (Số dư: <strong className="font-mono text-emerald-700 dark:text-emerald-400">{formatVND(ownerWalletBalance)}</strong>)
          </p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs text-slate-500 uppercase font-semibold">Chờ Duyệt Nạp Tiền</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
            {pendingTopUps.length} yêu cầu
          </p>
          <p className="text-[11px] text-slate-400">STK: 104888853717 · Huỳnh Công Khoa</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs text-slate-500 uppercase font-semibold">Hợp Đồng Giao Dịch</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {transactions.length} HĐ
          </p>
          <p className="text-[11px] text-slate-400">Đang thực hiện: {transactions.filter(t => t.status === 'in_progress').length}</p>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs text-slate-500 uppercase font-semibold">Tổng Bài Đăng Trên Sàn</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
            {posts.length} bài
          </p>
          <p className="text-[11px] text-slate-400">{categories.length} danh mục nông nghiệp</p>
        </div>
      </div>

      {/* TopUp Approval Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Phê Duyệt Lệnh Nạp Tiền Viettel Money
            </h2>
            <p className="text-xs text-slate-500">
              Đối soát thông tin người nạp và tài khoản nhận <strong>104888853717 (Huỳnh Công Khoa)</strong>
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            {pendingTopUps.length} lệnh chờ duyệt
          </span>
        </div>

        {topupRequests.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">Chưa có yêu cầu nạp tiền nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-400 font-semibold uppercase">
                  <th className="py-3 px-2">Mã nạp tiền</th>
                  <th className="py-3 px-2">Người nạp / SĐT</th>
                  <th className="py-3 px-2">Số tiền</th>
                  <th className="py-3 px-2">Kênh nhận tiền</th>
                  <th className="py-3 px-2">Thời gian</th>
                  <th className="py-3 px-2">Trạng thái</th>
                  <th className="py-3 px-2 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {topupRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-2 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      {req.transferCode}
                    </td>
                    <td className="py-3 px-2">
                      <p className="font-bold text-slate-900 dark:text-white">{req.userName}</p>
                      <p className="text-slate-400">{req.userPhone}</p>
                    </td>
                    <td className="py-3 px-2 font-bold text-sm text-slate-900 dark:text-white tabular-nums">
                      {formatVND(req.amount)}
                    </td>
                    <td className="py-3 px-2">
                      <p className="font-semibold text-red-600">{req.transferChannel}</p>
                      <p className="text-[11px] text-slate-400">{req.transferToPhone} - {req.transferToName}</p>
                    </td>
                    <td className="py-3 px-2 text-slate-400">
                      {formatDateTimeVN(req.createdAt)}
                    </td>
                    <td className="py-3 px-2">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          req.status === 'pending'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : req.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {req.status === 'pending' ? 'Chờ duyệt' : req.status === 'approved' ? 'Đã duyệt' : 'Từ chối'}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-right">
                      {req.status === 'pending' && (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => adminApproveTopUp(req.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs"
                          >
                            Duyệt nạp
                          </button>
                          <button
                            onClick={() => adminRejectTopUp(req.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs"
                          >
                            Từ chối
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Extend Categories Box */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Quản Lý Danh Mục Dịch Vụ Mở Rộng ({categories.length})
            </h2>
            <p className="text-xs text-slate-500">
              Quản trị viên có thể thêm danh mục mới tức thì mà không cần can thiệp mã nguồn
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map((c) => (
            <div
              key={c.id}
              className="p-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-xs"
            >
              <div className="text-2xl mb-1">{c.icon}</div>
              <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{c.name}</h4>
              <p className="text-[10px] text-slate-400 mt-1">
                Giá gốc: {formatVND(c.defaultPrice)}/{c.defaultUnit}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* All Users & Wallet Balances */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Danh Sách Tài Khoản & Số Dư Ví ({allUsers.length})</span>
            </h2>
            <p className="text-xs text-slate-500">
              Hệ thống giới hạn duy nhất 1 tài khoản Admin; hiển thị đầy đủ số dư ví của mọi nhóm tài khoản
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {allUsers.map((u) => {
            const accInfo = getAccountTypeInfo(u);
            const bal = getUserWalletBalance(u.id);
            return (
              <div
                key={u.id}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={u.avatarUrl}
                    alt={u.name}
                    className="w-9 h-9 rounded-full object-cover border border-emerald-500 shrink-0"
                  />
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{u.name}</p>
                    <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-bold ${accInfo.badgeClass}`}>
                      {accInfo.icon} {accInfo.shortLabel}
                    </span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-400 block">Số dư ví</span>
                  <span className="font-extrabold text-emerald-700 dark:text-emerald-400 tabular-nums">
                    {formatVND(bal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Admin Moderation: Delete Any Post */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-600" />
              <span>Kiểm Duyệt & Xóa Bài Đăng Toàn Sàn ({posts.length} bài)</span>
            </h2>
            <p className="text-xs text-slate-500">
              {currentUser.role === 'admin'
                ? 'Bạn đang dùng tài khoản Admin và có quyền xóa bất kỳ bài đăng nào vi phạm hoặc hết hạn'
                : 'Chỉ tài khoản Admin mới có quyền xóa bài đăng của người dùng khác tại đây'}
            </p>
          </div>
        </div>

        <div className="space-y-2.5">
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div onClick={() => setSelectedPost(post)} className="cursor-pointer space-y-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      post.type === 'demand'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    }`}
                  >
                    {post.type === 'demand' ? '🌾 Cần Thuê' : '🚁 Cung Cấp'}
                  </span>
                  <span className="text-slate-500 font-medium">{post.categoryName}</span>
                  <span className="text-slate-400">·</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{post.authorName}</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm line-clamp-1 hover:text-emerald-600">
                  {post.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  type="button"
                  onClick={() => setSelectedPost(post)}
                  className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-white font-bold"
                >
                  Xem
                </button>
                {(currentUser.role === 'admin' || currentUser.id === post.authorId) && (
                  <button
                    type="button"
                    onClick={() => setAdminDeletePostId(post.id)}
                    className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-1 shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa bài</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal Add Category */}
      {showAddCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white">
              Thêm Danh Mục Dịch Vụ Nông Nghiệp Mới
            </h3>

            <form onSubmit={handleAddCategorySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Tên dịch vụ
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="Ví dụ: Rửa hạt giống mầm nano..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Biểu tượng icon
                  </label>
                  <input
                    type="text"
                    value={catIcon}
                    onChange={(e) => setCatIcon(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Đơn vị tính
                  </label>
                  <input
                    type="text"
                    value={catUnit}
                    onChange={(e) => setCatUnit(e.target.value)}
                    placeholder="ha, tấn, công, giờ..."
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Đơn giá tham khảo (VNĐ)
                </label>
                <input
                  type="number"
                  value={catPrice}
                  onChange={(e) => setCatPrice(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCat(false)}
                  className="flex-1 py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  Lưu danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Delete Post Confirmation Modal */}
      {adminDeletePostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950 flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Xác nhận xóa bài đăng?</h4>
              <p className="text-xs text-slate-500 mt-1">Bài đăng này sẽ bị gỡ bỏ khỏi toàn bộ sàn giao dịch nông nghiệp.</p>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setAdminDeletePostId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  deletePost(adminDeletePostId);
                  setAdminDeletePostId(null);
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
