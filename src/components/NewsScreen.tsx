import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  NEWS_CATEGORY_LABELS,
  NEWS_CATEGORY_TABS,
  PROVINCE_WEATHER_CONFIGS,
  ProvinceWeatherData,
  describeWeatherCode,
  fetchLiveNews,
  fetchProvinceWeather,
  formatExactDateTimeVN,
  formatRelativeTimeVN,
  getAgriWeatherAdvisory,
} from '../data/agriNewsData';
import { LiveNewsArticle, NewsCategory } from '../types';
import { formatDateVN } from '../utils/formatters';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Droplets,
  ExternalLink,
  Newspaper,
  RefreshCw,
  Search,
  Sun,
  Wind,
  X,
} from 'lucide-react';

const WeatherIcon: React.FC<{ icon: 'sun' | 'partly' | 'cloud' | 'rain' | 'storm'; className?: string }> = ({
  icon,
  className = 'w-6 h-6',
}) => {
  switch (icon) {
    case 'sun':
      return <Sun className={`${className} text-amber-500`} />;
    case 'partly':
      return <CloudSun className={`${className} text-amber-500`} />;
    case 'cloud':
      return <Cloud className={`${className} text-slate-500 dark:text-slate-300`} />;
    case 'rain':
      return <CloudRain className={`${className} text-sky-600 dark:text-sky-400`} />;
    case 'storm':
      return <CloudLightning className={`${className} text-indigo-600 dark:text-indigo-400`} />;
  }
};

function getSourceAccentClass(source: string): string {
  switch (source) {
    case 'Báo Cần Thơ':
    case 'Báo An Giang':
    case 'Báo Đồng Tháp':
    case 'Báo Cà Mau':
      return 'text-emerald-700 dark:text-emerald-400';
    case 'Sài Gòn Giải Phóng':
      return 'text-indigo-700 dark:text-indigo-400';
    case 'VnExpress':
      return 'text-rose-700 dark:text-rose-400';
    case 'Tuổi Trẻ':
      return 'text-sky-700 dark:text-sky-400';
    case 'Thanh Niên':
      return 'text-teal-700 dark:text-teal-400';
    case 'Dân Trí':
      return 'text-emerald-700 dark:text-emerald-400';
    default:
      return 'text-emerald-700 dark:text-emerald-400';
  }
}

const PressPhoto: React.FC<{
  article: LiveNewsArticle;
  className?: string;
  imgClassName?: string;
}> = ({ article, className = '', imgClassName = '' }) => {
  const [stage, setStage] = useState<'proxy' | 'raw' | 'fallback'>(
    article.imageUrl ? 'proxy' : article.rawImageUrl ? 'raw' : 'fallback'
  );

  useEffect(() => {
    setStage(article.imageUrl ? 'proxy' : article.rawImageUrl ? 'raw' : 'fallback');
  }, [article.id, article.imageUrl, article.rawImageUrl]);

  const src = stage === 'proxy' ? article.imageUrl : stage === 'raw' ? article.rawImageUrl : null;

  if (!src || stage === 'fallback') {
    return (
      <div
        className={`w-full h-full bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-950 flex flex-col items-center justify-center p-3 text-center text-white ${className}`}
      >
        <Newspaper className="w-6 h-6 text-emerald-300/80 mb-1.5" />
        <span className="text-[11px] font-bold tracking-tight text-slate-200">{article.source}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={article.title}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        if (stage === 'proxy' && article.rawImageUrl) {
          setStage('raw');
        } else {
          setStage('fallback');
        }
      }}
      className={`w-full h-full object-cover ${imgClassName}`}
    />
  );
};

export const NewsScreen: React.FC = () => {
  const [selectedProvince, setSelectedProvince] = useState<string>('An Giang');
  const [weather, setWeather] = useState<ProvinceWeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState<boolean>(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  const [articles, setArticles] = useState<LiveNewsArticle[]>([]);
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const [newsUpdatedAt, setNewsUpdatedAt] = useState<string>('');
  const [loadingNews, setLoadingNews] = useState<boolean>(true);
  const [refreshingNews, setRefreshingNews] = useState<boolean>(false);
  const [newsError, setNewsError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<'all' | NewsCategory>('all');
  const [regionFilter, setRegionFilter] = useState<'all' | 'dbscl' | 'other'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [readingArticle, setReadingArticle] = useState<LiveNewsArticle | null>(null);

  const loadWeather = useCallback(async (prov: string, forceRefresh = false) => {
    setLoadingWeather(true);
    setWeatherError(null);
    try {
      const data = await fetchProvinceWeather(prov, forceRefresh);
      setWeather(data);
    } catch {
      setWeatherError(`Không thể kết nối dữ liệu thời tiết thực tế tại ${prov}. Vui lòng thử lại.`);
    } finally {
      setLoadingWeather(false);
    }
  }, []);

  const loadNews = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) {
      setRefreshingNews(true);
    } else {
      setLoadingNews(true);
    }
    setNewsError(null);
    try {
      const data = await fetchLiveNews(forceRefresh);
      setArticles(data.articles);
      setActiveSources(data.sources);
      setNewsUpdatedAt(data.updatedAt);
    } catch (err) {
      setNewsError(
        err instanceof Error ? err.message : 'Chưa thể tải bản tin thời sự trực tuyến. Vui lòng thử lại.'
      );
    } finally {
      setLoadingNews(false);
      setRefreshingNews(false);
    }
  }, []);

  useEffect(() => {
    loadWeather(selectedProvince);
  }, [selectedProvince, loadWeather]);

  useEffect(() => {
    loadNews(false);
  }, [loadNews]);

  useEffect(() => {
    if (!readingArticle) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setReadingArticle(null);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [readingArticle]);

  const regionScopedArticles = useMemo(() => {
    if (regionFilter === 'all') return articles;
    return articles.filter((a) => a.region === regionFilter);
  }, [articles, regionFilter]);

  const countsByCategory = useMemo(() => {
    const counts: Record<'all' | NewsCategory, number> = {
      all: regionScopedArticles.length,
      'thoi-su': 0,
      'nong-nghiep': 0,
      'kinh-te': 0,
      'thoi-tiet': 0,
    };
    for (const a of regionScopedArticles) {
      counts[a.category] = (counts[a.category] || 0) + 1;
    }
    return counts;
  }, [regionScopedArticles]);

  const regionCounts = useMemo(() => {
    let dbscl = 0;
    let other = 0;
    for (const a of articles) {
      if (a.region === 'dbscl') dbscl++;
      else other++;
    }
    return { dbscl, other };
  }, [articles]);

  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return regionScopedArticles.filter((article) => {
      const matchCategory = selectedCategory === 'all' || article.category === selectedCategory;
      const matchQuery =
        !q ||
        article.title.toLowerCase().includes(q) ||
        article.summary.toLowerCase().includes(q) ||
        article.source.toLowerCase().includes(q) ||
        (article.regionLabel || '').toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [regionScopedArticles, selectedCategory, searchQuery]);

  const isEditorialView = !searchQuery.trim() && filteredArticles.length >= 4;
  const leadArticle = isEditorialView ? filteredArticles[0] : null;
  const featuredArticles = isEditorialView ? filteredArticles.slice(1, 4) : [];
  const streamArticles = isEditorialView ? filteredArticles.slice(4) : filteredArticles;

  const currentDesc = weather ? describeWeatherCode(weather.weatherCode) : null;
  const advisory = weather ? getAgriWeatherAdvisory(weather) : null;

  return (
    <div className="space-y-6 sm:space-y-8 pb-24">
      {/* Masthead */}
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Tin Tức Đồng Bằng Sông Cửu Long & Thời Tiết
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Ưu tiên tin nóng khu vực ĐBSCL từ {activeSources.length > 0 ? activeSources.slice(0, 6).join(', ') : 'báo chí địa phương & trung ương'}, kèm tin chọn lọc các khu vực khác.
          </p>
        </div>
        {newsUpdatedAt && (
          <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-medium text-slate-500 dark:text-slate-400 shrink-0">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Đồng bộ lúc {formatExactDateTimeVN(newsUpdatedAt)}</span>
          </div>
        )}
      </header>

      {/* Live Provincial Weather Forecast Module (8 key Mekong Delta & Central Highlands provinces) */}
      <section className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200/80 dark:border-sky-800 flex items-center justify-center shrink-0">
              <CloudSun className="w-5 h-5 text-sky-700 dark:text-sky-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white truncate">
                Thời Tiết Thực Tế · ĐBSCL & Tây Nguyên
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 truncate">
                {weather
                  ? `${weather.region} · Cập nhật ${formatRelativeTimeVN(weather.updatedAt)}`
                  : 'Đang lấy số liệu khí tượng trực tiếp'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => loadWeather(selectedProvince, true)}
            disabled={loadingWeather}
            className="min-h-[38px] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingWeather ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Làm mới</span>
          </button>
        </div>

        {/* 1-Tap Province Selector Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
          {PROVINCE_WEATHER_CONFIGS.map((p) => {
            const isSelected = p.province === selectedProvince;
            return (
              <button
                key={p.province}
                type="button"
                onClick={() => setSelectedProvince(p.province)}
                className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors border ${
                  isSelected
                    ? 'bg-emerald-700 border-emerald-700 text-white'
                    : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-emerald-500'
                }`}
              >
                {p.province}
              </button>
            );
          })}
        </div>

        {weatherError ? (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-800 dark:text-rose-200">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{weatherError}</span>
            </div>
            <button
              type="button"
              onClick={() => loadWeather(selectedProvince, true)}
              className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold shrink-0"
            >
              Thử tải lại
            </button>
          </div>
        ) : loadingWeather || !weather || !currentDesc || !advisory ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-pulse">
            <div className="lg:col-span-5 h-40 rounded-2xl bg-slate-100 dark:bg-slate-800" />
            <div className="lg:col-span-7 h-40 rounded-2xl bg-slate-100 dark:bg-slate-800" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            {/* Current Conditions & Agri Advisory */}
            <div className="lg:col-span-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-4 flex flex-col justify-between gap-3.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {weather.province} · Cảm giác {weather.apparentTempC}°C
                  </p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl sm:text-4xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                      {weather.tempC}°C
                    </span>
                    <span className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {currentDesc.label}
                    </span>
                  </div>
                </div>
                <WeatherIcon icon={currentDesc.icon} className="w-9 h-9 sm:w-10 sm:h-10 shrink-0" />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-200/80 dark:border-slate-700 text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Độ ẩm</span>
                  <span className="font-bold tabular-nums text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <Droplets className="w-3.5 h-3.5 text-sky-600" />
                    {weather.humidity}%
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Sức gió</span>
                  <span className="font-bold tabular-nums text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <Wind className="w-3.5 h-3.5 text-emerald-600" />
                    {weather.windKmh} km/h
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Lượng mưa</span>
                  <span className="font-bold tabular-nums text-slate-900 dark:text-white flex items-center gap-1 mt-0.5">
                    <CloudRain className="w-3.5 h-3.5 text-indigo-600" />
                    {weather.precipitationMm} mm
                  </span>
                </div>
              </div>

              <div
                className={`p-3 rounded-xl border text-xs space-y-1 ${
                  advisory.droneStatus === 'good'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
                    : advisory.droneStatus === 'caution'
                    ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
                    : 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-950 dark:text-rose-200'
                }`}
              >
                <p className="font-extrabold flex items-center gap-1.5">
                  {advisory.droneStatus === 'good' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{advisory.droneText}</span>
                </p>
                <p className="leading-relaxed opacity-90">{advisory.fieldNote}</p>
              </div>
            </div>

            {/* 5-Day Forecast Strip */}
            <div className="lg:col-span-7 flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between gap-2 text-xs">
                <h3 className="font-bold text-slate-800 dark:text-slate-200">
                  Dự báo 5 ngày tới · {weather.province}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Nhiệt độ · Khả năng mưa · Gió cực đại
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 flex-1">
                {weather.daily.map((day, idx) => {
                  const desc = describeWeatherCode(day.weatherCode);
                  return (
                    <div
                      key={day.date}
                      className="p-2.5 sm:p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/70 flex flex-col justify-between gap-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {idx === 0 ? 'Hôm nay' : formatDateVN(day.date).slice(0, 5)}
                        </span>
                        <WeatherIcon icon={desc.icon} className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 min-h-[28px]">
                        {desc.label}
                      </p>
                      <div className="space-y-0.5 pt-1.5 border-t border-slate-200/70 dark:border-slate-700/70 tabular-nums">
                        <p className="font-extrabold text-slate-900 dark:text-white">
                          {day.tempMax}° <span className="text-slate-400 font-normal">/ {day.tempMin}°</span>
                        </p>
                        <p className="text-[11px] text-sky-700 dark:text-sky-400 font-semibold">
                          Mưa {day.rainProb}%
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Gió {day.windMax} km/h
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Báo Mới-Style Live Press News Section */}
      <section className="space-y-5">
        {/* Category Tabs, Region Scope, Search & Refresh Toolbar */}
        <div className="bg-white dark:bg-slate-900 p-3 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto">
              {NEWS_CATEGORY_TABS.map((tab) => {
                const isActive = selectedCategory === tab.id;
                const count = countsByCategory[tab.id] || 0;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-white dark:bg-slate-700 text-emerald-800 dark:text-emerald-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <span>{tab.label}</span>
                    {!loadingNews && count > 0 && (
                      <span className="text-[10px] opacity-65 tabular-nums">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm tin Cần Thơ, An Giang, lúa gạo..."
                  className="w-full min-h-[38px] pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <button
                type="button"
                onClick={() => loadNews(true)}
                disabled={loadingNews || refreshingNews}
                className="min-h-[38px] px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${refreshingNews ? 'animate-spin' : ''}`} />
                <span>Cập nhật</span>
              </button>
            </div>
          </div>

          {/* Regional Priority Selector */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5 overflow-x-auto">
              {[
                { id: 'all' as const, label: 'Ưu tiên ĐBSCL', count: articles.length },
                { id: 'dbscl' as const, label: 'Chỉ khu vực ĐBSCL', count: regionCounts.dbscl },
                { id: 'other' as const, label: 'Khu vực khác', count: regionCounts.other },
              ].map((opt) => {
                const active = regionFilter === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setRegionFilter(opt.id)}
                    className={`min-h-[32px] px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap shrink-0 transition-colors border ${
                      active
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                        : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                    {!loadingNews && opt.count > 0 && (
                      <span className="ml-1 opacity-70 tabular-nums">({opt.count})</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Loading Skeleton */}
        {loadingNews ? (
          <div className="space-y-5 animate-pulse">
            <div className="h-64 sm:h-72 rounded-3xl bg-slate-200/80 dark:bg-slate-800" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="h-56 rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
              <div className="h-56 rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
              <div className="h-56 rounded-2xl bg-slate-200/70 dark:bg-slate-800" />
            </div>
          </div>
        ) : newsError ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <AlertTriangle className="w-9 h-9 text-amber-500 mx-auto" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              {newsError}
            </h3>
            <button
              type="button"
              onClick={() => loadNews(true)}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold inline-flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Thử tải lại bản tin
            </button>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <Newspaper className="w-9 h-9 text-slate-400 mx-auto" />
            <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Chưa có bản tin nào khớp với mục hoặc từ khóa bạn đang chọn
            </h3>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setRegionFilter('all');
                setSearchQuery('');
              }}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold"
            >
              Xem tất cả bản tin mới nhất
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tier 1: Lead Story (Editorial Hero) */}
            {leadArticle && (
              <article
                onClick={() => setReadingArticle(leadArticle)}
                className="group cursor-pointer rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-600 transition-colors overflow-hidden grid grid-cols-1 lg:grid-cols-12"
              >
                <div className="lg:col-span-7 aspect-[16/10] sm:aspect-[16/9] lg:aspect-auto lg:min-h-[300px] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <PressPhoto
                    article={leadArticle}
                    imgClassName="group-hover:scale-[1.03] transition-transform duration-500"
                  />
                </div>
                <div className="lg:col-span-5 p-4 sm:p-6 flex flex-col justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                      <span className={`font-extrabold ${getSourceAccentClass(leadArticle.source)}`}>
                        {leadArticle.source}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className={leadArticle.region === 'dbscl' ? 'font-bold text-emerald-700 dark:text-emerald-400' : ''}>
                        {leadArticle.regionLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{NEWS_CATEGORY_LABELS[leadArticle.category]}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">{formatRelativeTimeVN(leadArticle.publishedAt)}</span>
                    </div>

                    <h2 className="text-lg sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-snug group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                      {leadArticle.title}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                      {leadArticle.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-bold text-emerald-700 dark:text-emerald-400">
                      Đọc tóm tắt & ảnh gốc
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 text-[11px] truncate max-w-[160px]">
                      {leadArticle.sourceDomain}
                    </span>
                  </div>
                </div>
              </article>
            )}

            {/* Tier 2: Featured Editorial Grid (3 stories) */}
            {featuredArticles.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
                {featuredArticles.map((article) => (
                  <article
                    key={article.id}
                    onClick={() => setReadingArticle(article)}
                    className="group cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-600 transition-colors overflow-hidden flex flex-col"
                  >
                    <div className="aspect-[16/10] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <PressPhoto
                        article={article}
                        imgClassName="group-hover:scale-[1.03] transition-transform duration-300"
                      />
                    </div>
                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between gap-2.5">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                          <span className={`font-extrabold ${getSourceAccentClass(article.source)}`}>
                            {article.source}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className={article.region === 'dbscl' ? 'font-bold text-emerald-700 dark:text-emerald-400' : ''}>
                            {article.regionLabel}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{formatRelativeTimeVN(article.publishedAt)}</span>
                        </div>
                        <h3 className="font-extrabold text-sm sm:text-[15px] text-slate-900 dark:text-white leading-snug line-clamp-3 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                          {article.title}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>
                  </article>
                ))}
              </div>
            )}

            {/* Tier 3: Báo Mới-Style Compact Breaking News Stream */}
            {streamArticles.length > 0 && (
              <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
                <div className="px-4 sm:px-5 py-3 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
                  <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                    {isEditorialView ? 'Dòng tin mới cập nhật' : `Kết quả (${streamArticles.length} bản tin)`}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sắp xếp mới nhất
                  </span>
                </div>

                {streamArticles.map((article) => (
                  <article
                    key={article.id}
                    onClick={() => setReadingArticle(article)}
                    className="group cursor-pointer p-3.5 sm:p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-start gap-3 sm:gap-4"
                  >
                    <div className="w-28 h-20 sm:w-40 sm:h-24 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden shrink-0">
                      <PressPhoto
                        article={article}
                        imgClassName="group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>

                    <div className="min-w-0 flex-1 flex flex-col justify-between gap-1.5">
                      <h3 className="font-bold text-[13px] sm:text-[15px] text-slate-900 dark:text-white leading-snug line-clamp-2 sm:line-clamp-2 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">
                        {article.title}
                      </h3>

                      <p className="hidden sm:line-clamp-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {article.summary}
                      </p>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 pt-0.5">
                        <span className={`font-extrabold ${getSourceAccentClass(article.source)}`}>
                          {article.source}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className={article.region === 'dbscl' ? 'font-bold text-emerald-700 dark:text-emerald-400' : ''}>
                          {article.regionLabel}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="tabular-nums">{formatRelativeTimeVN(article.publishedAt)}</span>
                        <span aria-hidden="true">·</span>
                        <span>{NEWS_CATEGORY_LABELS[article.category]}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* In-App Editorial Summary Reader Modal */}
      {readingArticle && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/75 backdrop-blur-xs"
          onClick={() => setReadingArticle(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative aspect-[16/10] sm:aspect-[16/9] w-full bg-slate-900 overflow-hidden">
              <PressPhoto article={readingArticle} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/25 pointer-events-none" />
              <button
                type="button"
                onClick={() => setReadingArticle(null)}
                aria-label="Đóng bản tin"
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[11px] font-semibold text-white/90">
                <span>Ảnh gốc từ {readingArticle.source}</span>
                <span className="tabular-nums">{formatExactDateTimeVN(readingArticle.publishedAt)}</span>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <span className={`font-extrabold ${getSourceAccentClass(readingArticle.source)}`}>
                  {readingArticle.source}
                </span>
                <span aria-hidden="true">·</span>
                <span className={readingArticle.region === 'dbscl' ? 'font-bold text-emerald-700 dark:text-emerald-400' : ''}>
                  {readingArticle.regionLabel}
                </span>
                <span aria-hidden="true">·</span>
                <span>{NEWS_CATEGORY_LABELS[readingArticle.category]}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums">{formatRelativeTimeVN(readingArticle.publishedAt)}</span>
              </div>

              <h2 className="text-lg sm:text-2xl font-extrabold leading-snug text-slate-900 dark:text-white">
                {readingArticle.title}
              </h2>

              <p className="text-sm sm:text-[15px] text-slate-700 dark:text-slate-300 leading-relaxed">
                {readingArticle.summary}
              </p>

              <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                Bản tin được tổng hợp trực tiếp từ trang báo điện tử <strong className="text-slate-700 dark:text-slate-200">{readingArticle.source}</strong>. Nhấn nút bên dưới để xem toàn bộ bài viết, hình ảnh và bình luận trên báo gốc.
              </p>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <a
                  href={readingArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[42px] px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <span>Đọc bài gốc trên {readingArticle.source}</span>
                  <ExternalLink className="w-4 h-4 shrink-0" />
                </a>

                <button
                  type="button"
                  onClick={() => setReadingArticle(null)}
                  className="min-h-[42px] px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold text-center transition-colors"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
