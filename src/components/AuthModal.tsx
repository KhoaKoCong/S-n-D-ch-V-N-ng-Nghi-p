import React, { useState, useEffect } from 'react';
import { useAgri } from '../context/AgriContext';
import { AccountType, UserRole } from '../types';
import { getAccountTypeInfo } from '../utils/formatters';
import {
  X,
  User,
  Mail,
  Lock,
  Phone,
  Check,
  AlertCircle,
  LogIn,
  UserPlus,
  ArrowRight
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { showAuthModal, setShowAuthModal, authModalMode, registerUser, loginUser, switchUser, allUsers } = useAgri();

  const [mode, setMode] = useState<'register' | 'login'>(authModalMode || 'login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('farmer');
  const [customAccountLabel, setCustomAccountLabel] = useState('');
  const [serviceSideRole, setServiceSideRole] = useState<'farmer' | 'provider'>('provider');
  const [province, setProvince] = useState('An Giang');
  const [district, setDistrict] = useState('Châu Thành');
  const [machineryType, setMachineryType] = useState('02 Drone DJI T50 + Máy Gặt');

  // Status feedback
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (showAuthModal) {
      setMode(authModalMode || 'login');
      setErrorMsg(null);
      setSuccessMsg(null);
    }
  }, [showAuthModal, authModalMode]);

  if (!showAuthModal) return null;

  const hasExistingAdmin = allUsers.some(u => u.role === 'admin');

  const resolveSystemRole = (): UserRole => {
    if (accountType === 'admin') return 'admin';
    if (accountType === 'farmer' || accountType === 'landowner') return 'farmer';
    if (accountType === 'workshop_owner') return 'provider';
    // enterprise or custom uses selected serviceSideRole
    return serviceSideRole;
  };

  const handleClose = () => {
    setShowAuthModal(false);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  const handleSelectAccountType = (type: AccountType) => {
    if (type === 'admin' && hasExistingAdmin) {
      setErrorMsg('Hệ thống chỉ cho phép 1 tài khoản Quản trị viên (Admin) duy nhất!');
      return;
    }
    setErrorMsg(null);
    setAccountType(type);
    if (type === 'enterprise' || type === 'workshop_owner') {
      setServiceSideRole('provider');
    } else if (type === 'farmer' || type === 'landowner') {
      setServiceSideRole('farmer');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setErrorMsg('Vui lòng nhập họ và tên hoặc tên doanh nghiệp');
      return;
    }
    if (accountType === 'custom' && !customAccountLabel.trim()) {
      setErrorMsg('Vui lòng nhập tên loại tài khoản tùy chỉnh của bạn');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMsg('Mật khẩu tối thiểu phải từ 6 ký tự');
      return;
    }

    const resolvedRole = resolveSystemRole();
    setIsSubmitting(true);
    const res = registerUser({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim() || '0988112233',
      password,
      role: resolvedRole,
      accountType,
      customAccountLabel: accountType === 'custom' ? customAccountLabel.trim() : undefined,
      province,
      district,
      machineryType: resolvedRole === 'provider' ? machineryType : undefined,
      authProvider: 'credentials'
    });

    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setSuccessMsg(res.message);
      setTimeout(() => {
        handleClose();
      }, 1200);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Vui lòng nhập Email hoặc Số điện thoại đăng nhập');
      return;
    }

    setIsSubmitting(true);
    const res = loginUser(email.trim(), password);
    setIsSubmitting(false);

    if (!res.success) {
      setErrorMsg(res.message);
    } else {
      setSuccessMsg(`Đăng nhập thành công! Chào mừng ${res.user?.name}`);
      setTimeout(() => {
        handleClose();
      }, 1000);
    }
  };

  // Google Gmail 1-Click Fast Auth
  const handleGoogleAuth = () => {
    setErrorMsg(null);
    const resolvedRole = resolveSystemRole();
    if (resolvedRole === 'admin' && hasExistingAdmin) {
      setErrorMsg('Hệ thống chỉ cho phép duy nhất 1 tài khoản Admin!');
      return;
    }

    const randomNum = Math.floor(100 + Math.random() * 900);
    const gmailAccount = name.trim()
      ? `${name.trim().toLowerCase().replace(/\s+/g, '')}${randomNum}@gmail.com`
      : `nongnghiep.vn${randomNum}@gmail.com`;

    const typeTitleMap: Record<AccountType, string> = {
      farmer: 'Nông Dân',
      landowner: 'Chủ Đất',
      workshop_owner: 'Chủ Xưởng Máy',
      enterprise: 'Doanh Nghiệp',
      custom: customAccountLabel.trim() || 'Tùy Chỉnh',
      admin: 'Admin'
    };

    const googleName = name.trim() || `${typeTitleMap[accountType]} #${randomNum}`;

    const res = registerUser({
      name: googleName,
      email: gmailAccount,
      phone: `098${randomNum}${Math.floor(1000 + Math.random() * 9000)}`,
      role: resolvedRole,
      accountType,
      customAccountLabel: accountType === 'custom' ? (customAccountLabel.trim() || 'Đối tác tùy chỉnh') : undefined,
      province,
      district,
      machineryType: resolvedRole === 'provider' ? machineryType : undefined,
      authProvider: 'google'
    });

    if (res.success) {
      setSuccessMsg(`Đã liên kết tài khoản Gmail: ${gmailAccount}`);
      setTimeout(() => {
        handleClose();
      }, 1200);
    } else {
      const loginRes = loginUser(gmailAccount);
      if (loginRes.success) {
        setSuccessMsg(`Đã đăng nhập bằng Gmail: ${gmailAccount}`);
        setTimeout(() => {
          handleClose();
        }, 1000);
      } else {
        setErrorMsg(res.message);
      }
    }
  };

  const provinces = ['An Giang', 'Đồng Tháp', 'Cần Thơ', 'Kiên Giang', 'Long An', 'Sóc Trăng', 'Tiền Giang', 'Vĩnh Long'];

  const accountOptions: { id: AccountType; icon: string; label: string; desc: string; disabled?: boolean }[] = [
    { id: 'farmer', icon: '🌾', label: 'Nông dân', desc: 'Thuê dịch vụ canh tác' },
    { id: 'landowner', icon: '🏞️', label: 'Chủ đất', desc: 'Quản lý ruộng / thuê dịch vụ' },
    { id: 'workshop_owner', icon: '🏭', label: 'Chủ xưởng máy', desc: 'Cung cấp máy gặt, drone' },
    { id: 'enterprise', icon: '🏢', label: 'Doanh nghiệp', desc: 'Đơn vị bao tiêu & cơ giới' },
    { id: 'custom', icon: '✨', label: 'Tùy chỉnh', desc: 'Tự đặt loại tài khoản' },
    {
      id: 'admin',
      icon: '🛡️',
      label: 'Admin',
      desc: hasExistingAdmin ? 'Đã có 1 Admin' : 'Quản trị hệ thống',
      disabled: hasExistingAdmin
    }
  ];

  const resolvedRole = resolveSystemRole();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-xl font-bold">
              🌾
            </div>
            <div>
              <h3 className="font-extrabold text-base leading-tight">
                {mode === 'register' ? 'Tạo Tài Khoản Người Dùng Mới' : 'Đăng Nhập Sàn Nông Nghiệp'}
              </h3>
              <p className="text-xs text-emerald-100">
                Chọn loại tài khoản phù hợp để tham gia sàn giao dịch
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch between Register and Login */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Tạo Tài Khoản Mới</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
            }}
            className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <LogIn className="w-4 h-4" />
            <span>Đăng Nhập</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700 dark:text-slate-300">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2 font-semibold">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Quick Google Gmail Button */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleGoogleAuth}
              className="w-full py-3 px-4 rounded-2xl border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-white font-bold text-xs transition-all flex items-center justify-center gap-2.5 shadow-xs"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>{mode === 'register' ? 'Đăng ký nhanh với tài khoản Gmail' : 'Đăng nhập nhanh với Google Gmail'}</span>
            </button>
            <div className="flex items-center gap-3 text-slate-400 text-[10px]">
              <span className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700"></span>
              <span>hoặc điền thông tin bên dưới</span>
              <span className="flex-1 h-[1px] bg-slate-200 dark:bg-slate-700"></span>
            </div>
          </div>

          {mode === 'register' ? (
            <form onSubmit={handleRegister} className="space-y-4">
              {/* Account Type Selection */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Chọn loại tài khoản của bạn:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {accountOptions.map((opt) => {
                    const isSelected = accountType === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        disabled={opt.disabled}
                        onClick={() => handleSelectAccountType(opt.id)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          opt.disabled
                            ? 'opacity-50 cursor-not-allowed bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                            : isSelected
                            ? 'bg-emerald-700 text-white border-emerald-800 shadow-sm font-bold ring-2 ring-emerald-500/30'
                            : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500'
                        }`}
                      >
                        <span className="text-lg block mb-0.5">{opt.icon}</span>
                        <span className="block font-bold leading-tight">{opt.label}</span>
                        <span className={`text-[10px] block mt-0.5 ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                          {opt.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Account Name input when Custom is selected */}
              {accountType === 'custom' && (
                <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 space-y-2.5 animate-fade-in">
                  <label className="block font-bold text-purple-900 dark:text-purple-200">
                    Nhập tên loại tài khoản tùy chỉnh:
                  </label>
                  <input
                    type="text"
                    required
                    value={customAccountLabel}
                    onChange={(e) => setCustomAccountLabel(e.target.value)}
                    placeholder="Ví dụ: Hợp tác xã, Thương lái thu mua, Kỹ sư nông nghiệp..."
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-purple-300 dark:border-purple-700 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              )}

              {/* Activity role toggle for Enterprise & Custom */}
              {(accountType === 'enterprise' || accountType === 'custom') && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 space-y-1.5">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">
                    Chức năng giao dịch chính trên sàn:
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setServiceSideRole('farmer')}
                      className={`py-2 px-3 rounded-lg font-bold text-xs border transition-all ${
                        serviceSideRole === 'farmer'
                          ? 'bg-amber-600 text-white border-amber-700'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      🌾 Cần thuê dịch vụ
                    </button>
                    <button
                      type="button"
                      onClick={() => setServiceSideRole('provider')}
                      className={`py-2 px-3 rounded-lg font-bold text-xs border transition-all ${
                        serviceSideRole === 'provider'
                          ? 'bg-emerald-700 text-white border-emerald-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      🚁 Cung cấp dịch vụ
                    </button>
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Họ và tên / Tên đơn vị
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ví dụ: Trần Văn Hùng, Công ty Nông Nghiệp..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Địa chỉ Email (Gmail)
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="vidu@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Số điện thoại
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0918xxxxxx"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Mật khẩu đăng nhập
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Tối thiểu 6 ký tự"
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Location */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Tỉnh / Thành
                  </label>
                  <select
                    value={province}
                    onChange={(e) => setProvince(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  >
                    {provinces.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Quận / Huyện
                  </label>
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="Châu Thành, Thoại Sơn..."
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Provider Machinery Info if Provider */}
              {resolvedRole === 'provider' && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <label className="block font-bold text-emerald-900 dark:text-emerald-200">
                    Máy móc / Thiết bị / Năng lực phục vụ:
                  </label>
                  <input
                    type="text"
                    value={machineryType}
                    onChange={(e) => setMachineryType(e.target.value)}
                    placeholder="Ví dụ: 03 Drone DJI T50, 2 máy gặt Kubota..."
                    className="w-full p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-700 text-slate-900 dark:text-white font-semibold"
                  />
                </div>
              )}

              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                🎁 Tài khoản mới được tặng sẵn số dư khởi đầu (50.000 ₫ - 100.000 ₫) và hỗ trợ nạp thêm qua Viettel Money.
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <span>HOÀN TẤT TẠO TÀI KHOẢN</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Email (Gmail) hoặc Số điện thoại
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email hoặc số điện thoại..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Nhập mật khẩu của bạn..."
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>ĐĂNG NHẬP VÀO SÀN</span>
              </button>

              {allUsers.length > 0 && (
                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                    Hoặc đăng nhập nhanh 1 chạm vào tài khoản đã có:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {allUsers.slice(0, 6).map((u) => {
                      const info = getAccountTypeInfo(u);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => {
                            switchUser(u.id);
                            handleClose();
                          }}
                          className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 text-left flex items-center gap-2 transition-colors"
                        >
                          <img
                            src={u.avatarUrl}
                            alt={u.name}
                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-emerald-500/50"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{u.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                              {info.shortLabel} · {u.phone}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
