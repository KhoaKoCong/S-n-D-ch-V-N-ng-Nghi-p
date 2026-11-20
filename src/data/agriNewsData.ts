import { LiveNewsResponse, NewsCategory } from '../types';

export interface ProvinceWeatherConfig {
  province: string;
  region: string;
  lat: number;
  lon: number;
}

export interface DailyForecastItem {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  rainProb: number;
  windMax: number;
}

export interface ProvinceWeatherData {
  province: string;
  region: string;
  source: 'live';
  updatedAt: string;
  tempC: number;
  apparentTempC: number;
  humidity: number;
  windKmh: number;
  precipitationMm: number;
  weatherCode: number;
  daily: DailyForecastItem[];
}

export const PROVINCE_WEATHER_CONFIGS: ProvinceWeatherConfig[] = [
  { province: 'An Giang', region: 'Đồng bằng sông Cửu Long', lat: 10.3864, lon: 105.4352 },
  { province: 'Đồng Tháp', region: 'Đồng bằng sông Cửu Long', lat: 10.4603, lon: 105.6329 },
  { province: 'Cần Thơ', region: 'Đồng bằng sông Cửu Long', lat: 10.0452, lon: 105.7469 },
  { province: 'Kiên Giang', region: 'Đồng bằng sông Cửu Long', lat: 10.0125, lon: 105.0809 },
  { province: 'Long An', region: 'Đồng bằng sông Cửu Long', lat: 10.5359, lon: 106.4137 },
  { province: 'Sóc Trăng', region: 'Đồng bằng sông Cửu Long', lat: 9.6025, lon: 105.9739 },
  { province: 'Tiền Giang', region: 'Đồng bằng sông Cửu Long', lat: 10.3601, lon: 106.3600 },
  { province: 'Lâm Đồng', region: 'Tây Nguyên', lat: 11.9404, lon: 108.4583 },
];

export const NEWS_CATEGORY_TABS: { id: 'all' | NewsCategory; label: string }[] = [
  { id: 'all', label: 'Tất cả' },
  { id: 'thoi-su', label: 'Thời sự' },
  { id: 'nong-nghiep', label: 'Nông nghiệp' },
  { id: 'kinh-te', label: 'Kinh tế & Thị trường' },
  { id: 'thoi-tiet', label: 'Thời tiết & Môi trường' },
];

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
  'thoi-su': 'Thời sự',
  'nong-nghiep': 'Nông nghiệp',
  'kinh-te': 'Kinh tế',
  'thoi-tiet': 'Thời tiết & Môi trường',
};

export function describeWeatherCode(code: number): {
  label: string;
  icon: 'sun' | 'partly' | 'cloud' | 'rain' | 'storm';
} {
  if (code === 0) return { label: 'Trời nắng quang', icon: 'sun' };
  if (code >= 1 && code <= 2) return { label: 'Nắng nhẹ, ít mây', icon: 'partly' };
  if (code === 3 || (code >= 45 && code <= 48)) return { label: 'Nhiều mây, trời dịu', icon: 'cloud' };
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { label: 'Có mưa rào rải rác', icon: 'rain' };
  if (code >= 95) return { label: 'Mưa dông, gió giật', icon: 'storm' };
  return { label: 'Có mây thay đổi', icon: 'partly' };
}

export function getAgriWeatherAdvisory(data: ProvinceWeatherData): {
  droneStatus: 'good' | 'caution' | 'avoid';
  droneText: string;
  fieldNote: string;
} {
  const isStormOrHeavyRain = data.weatherCode >= 80 || data.precipitationMm >= 4;
  if (isStormOrHeavyRain || data.windKmh >= 24) {
    return {
      droneStatus: 'avoid',
      droneText: 'Tạm hoãn phun Drone & thu hoạch',
      fieldNote:
        'Gió lớn hoặc có mưa dông dễ làm trôi thuốc BVTV và gây đổ ngã lúa. Nên kiểm tra cống thoát nước và chờ trời tạnh ráo.',
    };
  }
  if (data.windKmh >= 15 || data.precipitationMm > 0.5 || data.humidity >= 88) {
    return {
      droneStatus: 'caution',
      droneText: 'Lưu ý gió/ẩm khi phun thuốc',
      fieldNote:
        'Nên ưu tiên phun Drone vào sáng sớm (5h30–8h30) khi gió lặng, hạn chế phun sát giờ mưa chiều để thuốc bám lá tốt.',
    };
  }
  return {
    droneStatus: 'good',
    droneText: 'Thuận lợi bay Drone & gặt lúa',
    fieldNote:
      'Gió êm, độ ẩm ổn định và ít khả năng mưa. Thời điểm lý tưởng để phun thuốc BVTV, gieo sạ bằng Drone hoặc vận hành máy gặt.',
  };
}

export function formatRelativeTimeVN(isoDate: string): string {
  const ts = Date.parse(isoDate);
  if (Number.isNaN(ts)) return '';
  const diffMs = Date.now() - ts;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const hh = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${dd}/${mm} · ${hh}:${min}`;
}

export function formatExactDateTimeVN(isoDate: string): string {
  const ts = Date.parse(isoDate);
  if (Number.isNaN(ts)) return '';
  const d = new Date(ts);
  return d.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export async function fetchProvinceWeather(
  province: string,
  forceRefresh = false
): Promise<ProvinceWeatherData> {
  const config =
    PROVINCE_WEATHER_CONFIGS.find((c) => c.province === province) || PROVINCE_WEATHER_CONFIGS[0];

  // Primary path: server-side cached Open-Meteo proxy
  try {
    const query = `/api/weather?province=${encodeURIComponent(config.province)}${forceRefresh ? '&refresh=1' : ''}`;
    const resp = await fetch(query, { cache: 'no-store' });
    if (resp.ok) {
      const json = (await resp.json()) as ProvinceWeatherData;
      if (json && typeof json.tempC === 'number') {
        return json;
      }
    }
  } catch {
    // Fall through to direct Open-Meteo live call below
  }

  // Secondary live path: direct browser request to Open-Meteo (still 100% live real data)
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 7000);
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${config.lat}&longitude=${config.lon}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max` +
      `&timezone=Asia%2FHo_Chi_Minh&forecast_days=5`;

    const resp = await fetch(url, { signal: controller.signal });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();

    const cur = json.current || {};
    const dailyRaw = json.daily || {};
    const times: string[] = Array.isArray(dailyRaw.time) ? dailyRaw.time : [];

    const daily: DailyForecastItem[] = times.slice(0, 5).map((dateStr, idx) => ({
      date: dateStr,
      weatherCode: Number(dailyRaw.weather_code?.[idx] ?? 1),
      tempMax: Math.round(Number(dailyRaw.temperature_2m_max?.[idx] ?? 31)),
      tempMin: Math.round(Number(dailyRaw.temperature_2m_min?.[idx] ?? 24)),
      rainProb: Math.round(Number(dailyRaw.precipitation_probability_max?.[idx] ?? 0)),
      windMax: Math.round(Number(dailyRaw.wind_speed_10m_max?.[idx] ?? 10)),
    }));

    return {
      province: config.province,
      region: config.region,
      source: 'live',
      updatedAt: new Date().toISOString(),
      tempC: Math.round(Number(cur.temperature_2m ?? 30)),
      apparentTempC: Math.round(Number(cur.apparent_temperature ?? cur.temperature_2m ?? 30)),
      humidity: Math.round(Number(cur.relative_humidity_2m ?? 75)),
      windKmh: Math.round(Number(cur.wind_speed_10m ?? 10)),
      precipitationMm: Number(Number(cur.precipitation ?? 0).toFixed(1)),
      weatherCode: Number(cur.weather_code ?? 1),
      daily,
    };
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function fetchLiveNews(forceRefresh = false): Promise<LiveNewsResponse> {
  const resp = await fetch(`/api/news${forceRefresh ? '?refresh=1' : ''}`, {
    cache: 'no-store',
  });
  const data = (await resp.json().catch(() => null)) as LiveNewsResponse | null;
  if (!resp.ok || !data || !Array.isArray(data.articles)) {
    throw new Error(data?.error || 'Không thể tải bản tin thời sự trực tuyến lúc này.');
  }
  return data;
}
