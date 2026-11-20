import React, { useState } from 'react';
import { useAgri } from '../context/AgriContext';
import { ArrowRight, Check, X, ShieldCheck, Zap } from 'lucide-react';
import { IMAGES } from '../mockData';

export const OnboardingModal: React.FC = () => {
  const { showOnboarding, setShowOnboarding } = useAgri();
  const [currentStep, setCurrentStep] = useState(0);

  if (!showOnboarding) return null;

  const steps = [
    {
      icon: '🌾',
      badge: 'SÀN DỊCH VỤ NÔNG NGHIỆP',
      title: 'Kết Nối Nhu Cầu – Tìm Dịch Vụ – Giao Dịch Thuận Tiện',
      desc: 'Nền tảng công nghệ số hóa đầu tiên dành riêng cho bà con nông dân và các phi đội drone, chủ máy cày, máy gặt gặt hái mùa vàng.',
      image: IMAGES.hero,
    },
    {
      icon: '🔎',
      badge: 'TÌM KIẾM THÔNG MINH',
      title: 'Tìm Dịch Vụ Nông Nghiệp Dễ Dàng & Radar Gần Bạn',
      desc: 'Tra cứu nhanh các đội máy cắt, máy cày, phun thuốc sâu bệnh trong bán kính từ 5 km đến 50 km quanh cánh đồng của bạn.',
      image: IMAGES.droneSpray,
    },
    {
      icon: '📝',
      badge: 'ĐĂNG TIN HAI CHIỀU',
      title: 'Đăng Nhu Cầu Và Nhận Nhà Cung Cấp Phục Vụ Tận Nơi',
      desc: 'Đăng tải diện tích cánh đồng, chủng loại giống lúa và nhận báo giá cạnh tranh nhất ngay trên ứng dụng.',
      image: IMAGES.tractor,
    },
    {
      icon: '🛡️',
      badge: 'HỢP ĐỒNG MINH BẠCH',
      title: 'Giao Dịch Minh Bạch – Quản Lý Thuận Tiện – Phí GD +3.000 ₫',
      desc: 'Mỗi giao dịch cộng thêm 3.000 ₫ phí sàn chuyển thẳng vào tài khoản 104888853717 (Huỳnh Công Khoa). Nạp ví tiện lợi qua Viettel Money.',
      image: IMAGES.harvester,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowOnboarding(false);
    }
  };

  const cur = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
        {/* Top Image */}
        <div className="relative h-56 w-full bg-slate-900">
          <img
            src={cur.image}
            alt={cur.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <button
            onClick={() => setShowOnboarding(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-4">
            <span className="px-3 py-1 rounded-full bg-emerald-700 text-white text-xs font-bold shadow-md">
              {cur.badge}
            </span>
          </div>
        </div>

        {/* Text */}
        <div className="p-6 sm:p-8 space-y-5 text-center flex-1">
          <div className="text-4xl">{cur.icon}</div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {cur.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-md mx-auto">
            {cur.desc}
          </p>

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 pt-2">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep
                    ? 'w-8 bg-emerald-600'
                    : 'w-2 bg-slate-200 dark:bg-slate-700'
                }`}
              />
            ))}
          </div>

          {/* Action button */}
          <div className="pt-2">
            <button
              onClick={handleNext}
              className="w-full py-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-sm shadow-lg shadow-emerald-700/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>{currentStep === steps.length - 1 ? 'BẮT ĐẦU SỬ DỤNG' : 'TIẾP TỤC'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
