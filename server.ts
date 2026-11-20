import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type NewsCategory = 'thoi-su' | 'nong-nghiep' | 'kinh-te' | 'thoi-tiet';
type NewsRegion = 'dbscl' | 'other';

interface LiveNewsArticle {
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

interface FeedConfig {
  url: string;
  source: string;
  sourceDomain: string;
  defaultCategory: NewsCategory;
  defaultRegion: NewsRegion;
  defaultRegionLabel: string;
  maxItems: number;
  kind?: 'rss' | 'sggp_html';
}

const NEWS_FEEDS: FeedConfig[] = [
  // === PRIMARY: Dedicated Mekong Delta (ĐBSCL) official press feeds ===
  {
    url: 'https://www.sggp.org.vn/dong-bang-song-cuu-long/',
    source: 'Sài Gòn Giải Phóng',
    sourceDomain: 'sggp.org.vn',
    defaultCategory: 'thoi-su',
    defaultRegion: 'dbscl',
    defaultRegionLabel: 'ĐBSCL',
    maxItems: 22,
    kind: 'sggp_html',
  },
  {
    url: 'https://baocantho.com.vn/rss/cate/thoi-su/',
    source: 'Báo Cần Thơ',
    sourceDomain: 'baocantho.com.vn',
    defaultCategory: 'thoi-su',
    defaultRegion: 'dbscl',
    defaultRegionLabel: 'Cần Thơ',
    maxItems: 15,
  },
  {
    url: 'https://baocantho.com.vn/rss/cate/kinh-te/',
    source: 'Báo Cần Thơ',
    sourceDomain: 'baocantho.com.vn',
    defaultCategory: 'kinh-te',
    defaultRegion: 'dbscl',
    defaultRegionLabel: 'Cần Thơ',
    maxItems: 15,
  },
  {
    url: 'https://baoangiang.com.vn/rss/cate/thoi-su/',
    source: 'Báo An Giang',
    sourceDomain: 'baoangiang.com.vn',
    defaultCategory: 'thoi-su',
    defaultRegion: 'dbscl',
    defaultRegionLabel: 'An Giang',
    maxItems: 16,
  },
  {
    url: 'https://baoangiang.com.vn/rss/cate/kinh-te/',
    source: 'Báo An Giang',
    sourceDomain: 'baoangiang.com.vn',
    defaultCategory: 'kinh-te',
    defaultRegion: 'dbscl',
    defaultRegionLabel: 'An Giang',
    maxItems: 16,
  },
  {
    url: 'https://baodongthap.vn/rss/cate/kinh-te/',
    source: 'Báo Đồng Tháp',
    sourceDomain: 'baodongthap.vn',
    defaultCategory: 'kinh-te',
    defaultRegion: 'dbscl',
    defaultRegionLabel: 'Đồng Tháp',
    maxItems: 15,
  },
  {
    url: 'https://baodongthap.vn/rss/cate/xa-hoi/',
    source: 'Báo Đồng Tháp',
    sourceDomain: 'baodongthap.vn',
    defaultCategory: 'thoi-su',
    defaultRegion: 'dbscl',
    defaultRegionLabel: 'Đồng Tháp',
    maxItems: 10,
  },
  {
    url: 'https://baocamau.vn/rss/cate/thoi-su/',
    source: 'Báo Cà Mau',
    sourceDomain: 'baocamau.vn',
    defaultCategory: 'thoi-su',
    defaultRegion: 'dbscl',
    defaultRegionLabel: 'Cà Mau',
    maxItems: 12,
  },
  {
    url: 'https://baocamau.vn/rss/cate/kinh-te/',
    source: 'Báo Cà Mau',
    sourceDomain: 'baocamau.vn',
    defaultCategory: 'kinh-te',
    defaultRegion: 'dbscl',
    defaultRegionLabel: 'Cà Mau',
    maxItems: 12,
  },

  // === SECONDARY: National mainstream feeds (Mekong Delta items promoted; other regions capped lower) ===
  {
    url: 'https://vnexpress.net/rss/thoi-su.rss',
    source: 'VnExpress',
    sourceDomain: 'vnexpress.net',
    defaultCategory: 'thoi-su',
    defaultRegion: 'other',
    defaultRegionLabel: 'Toàn quốc',
    maxItems: 22,
  },
  {
    url: 'https://vnexpress.net/rss/kinh-doanh.rss',
    source: 'VnExpress',
    sourceDomain: 'vnexpress.net',
    defaultCategory: 'kinh-te',
    defaultRegion: 'other',
    defaultRegionLabel: 'Toàn quốc',
    maxItems: 18,
  },
  {
    url: 'https://tuoitre.vn/rss/thoi-su.rss',
    source: 'Tuổi Trẻ',
    sourceDomain: 'tuoitre.vn',
    defaultCategory: 'thoi-su',
    defaultRegion: 'other',
    defaultRegionLabel: 'Toàn quốc',
    maxItems: 22,
  },
  {
    url: 'https://tuoitre.vn/rss/kinh-doanh.rss',
    source: 'Tuổi Trẻ',
    sourceDomain: 'tuoitre.vn',
    defaultCategory: 'kinh-te',
    defaultRegion: 'other',
    defaultRegionLabel: 'Toàn quốc',
    maxItems: 18,
  },
  {
    url: 'https://thanhnien.vn/rss/thoi-su.rss',
    source: 'Thanh Niên',
    sourceDomain: 'thanhnien.vn',
    defaultCategory: 'thoi-su',
    defaultRegion: 'other',
    defaultRegionLabel: 'Toàn quốc',
    maxItems: 20,
  },
  {
    url: 'https://thanhnien.vn/rss/kinh-te.rss',
    source: 'Thanh Niên',
    sourceDomain: 'thanhnien.vn',
    defaultCategory: 'kinh-te',
    defaultRegion: 'other',
    defaultRegionLabel: 'Toàn quốc',
    maxItems: 18,
  },
  {
    url: 'https://dantri.com.vn/rss/thoi-su.rss',
    source: 'Dân Trí',
    sourceDomain: 'dantri.com.vn',
    defaultCategory: 'thoi-su',
    defaultRegion: 'other',
    defaultRegionLabel: 'Toàn quốc',
    maxItems: 20,
  },
  {
    url: 'https://dantri.com.vn/rss/kinh-doanh.rss',
    source: 'Dân Trí',
    sourceDomain: 'dantri.com.vn',
    defaultCategory: 'kinh-te',
    defaultRegion: 'other',
    defaultRegionLabel: 'Toàn quốc',
    maxItems: 16,
  },
];

interface ProvinceCoord {
  province: string;
  region: string;
  lat: number;
  lon: number;
}

const PROVINCE_COORDS: ProvinceCoord[] = [
  { province: 'An Giang', region: 'Đồng bằng sông Cửu Long', lat: 10.3864, lon: 105.4352 },
  { province: 'Đồng Tháp', region: 'Đồng bằng sông Cửu Long', lat: 10.4603, lon: 105.6329 },
  { province: 'Cần Thơ', region: 'Đồng bằng sông Cửu Long', lat: 10.0452, lon: 105.7469 },
  { province: 'Kiên Giang', region: 'Đồng bằng sông Cửu Long', lat: 10.0125, lon: 105.0809 },
  { province: 'Long An', region: 'Đồng bằng sông Cửu Long', lat: 10.5359, lon: 106.4137 },
  { province: 'Sóc Trăng', region: 'Đồng bằng sông Cửu Long', lat: 9.6025, lon: 105.9739 },
  { province: 'Tiền Giang', region: 'Đồng bằng sông Cửu Long', lat: 10.3601, lon: 106.3600 },
  { province: 'Lâm Đồng', region: 'Tây Nguyên', lat: 11.9404, lon: 108.4583 },
];

const ALLOWED_IMAGE_SUFFIXES = [
  'vnecdn.net',
  'vnexpress.net',
  'tuoitre.vn',
  'tuoitre.com.vn',
  'thanhnien.vn',
  'thanhnien.com.vn',
  'dantri.com.vn',
  'vnncdn.net',
  'vietnamnet.vn',
  'mediacdn.vn',
  'nld.com.vn',
  'sggp.org.vn',
  'baocantho.com.vn',
  'baoangiang.com.vn',
  'baodongthap.vn',
  'baocamau.vn',
  'nongnghiep.vn',
  'nongnghiepmoitruong.vn',
];

const HTML_ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  ndash: '–',
  mdash: '—',
  lsquo: '‘',
  rsquo: '’',
  ldquo: '“',
  rdquo: '”',
  hellip: '…',
  Agrave: 'À', Aacute: 'Á', Acirc: 'Â', Atilde: 'Ã',
  agrave: 'à', aacute: 'á', acirc: 'â', atilde: 'ã',
  Egrave: 'È', Eacute: 'É', Ecirc: 'Ê',
  egrave: 'è', eacute: 'é', ecirc: 'ê',
  Igrave: 'Ì', Iacute: 'Í',
  igrave: 'ì', iacute: 'í',
  Ograve: 'Ò', Oacute: 'Ó', Ocirc: 'Ô', Otilde: 'Õ',
  ograve: 'ò', oacute: 'ó', ocirc: 'ô', otilde: 'õ',
  Ugrave: 'Ù', Uacute: 'Ú',
  ugrave: 'ù', uacute: 'ú',
  Yacute: 'Ý', yacute: 'ý',
  ETH: 'Đ', eth: 'đ',
};

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = parseInt(dec, 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    })
    .replace(/&([a-zA-Z]+);/g, (full: string, name: string) => HTML_ENTITY_MAP[name] ?? full);
}

function unwrapCdata(raw: string): string {
  const trimmed = raw.trim();
  const cdataMatch = trimmed.match(/^<!\[CDATA\[([\s\S]*?)\]\]>$/);
  return cdataMatch ? cdataMatch[1] : trimmed;
}

function extractTagValue(itemXml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = itemXml.match(regex);
  if (!match) return '';
  return unwrapCdata(match[1]);
}

function extractImageUrl(itemXml: string, rawDescription: string): string | null {
  const enclosureMatch = itemXml.match(/<enclosure[^>]*\burl=["']([^"']+)["'][^>]*>/i);
  if (enclosureMatch?.[1]) {
    return decodeHtmlEntities(enclosureMatch[1]).trim();
  }

  const mediaMatch = itemXml.match(/<media:(?:content|thumbnail)[^>]*\burl=["']([^"']+)["'][^>]*>/i);
  if (mediaMatch?.[1]) {
    return decodeHtmlEntities(mediaMatch[1]).trim();
  }

  const imgMatch = rawDescription.match(/<img[^>]*\bsrc=["']([^"']+)["'][^>]*>/i);
  if (imgMatch?.[1]) {
    return decodeHtmlEntities(imgMatch[1]).trim();
  }

  return null;
}

function cleanText(rawHtml: string): string {
  const withoutTags = rawHtml
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ');
  return decodeHtmlEntities(withoutTags)
    .replace(/\u202f|\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parsePubDate(rawDate: string): number {
  if (!rawDate) return Date.now();
  const normalized = rawDate
    .replace(/[\u202f\u00a0]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Handle "2026-11-19 05:13:32" (Báo Cà Mau) -> +07:00
  const ymdMatch = normalized.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (ymdMatch) {
    const iso = `${ymdMatch[1]}-${ymdMatch[2]}-${ymdMatch[3]}T${ymdMatch[4]}:${ymdMatch[5]}:${ymdMatch[6] || '00'}+07:00`;
    const parsed = Date.parse(iso);
    if (!Number.isNaN(parsed)) return parsed;
  }

  // Handle Vietnamese MM/DD/YYYY h:mm:ss AM/PM (Tuổi Trẻ) -> +07:00
  const mdyMatch = normalized.match(
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i
  );
  if (mdyMatch) {
    const month = Number(mdyMatch[1]);
    const day = Number(mdyMatch[2]);
    const year = Number(mdyMatch[3]);
    let hour = Number(mdyMatch[4]);
    const minute = Number(mdyMatch[5]);
    const second = Number(mdyMatch[6] || '0');
    const meridiem = mdyMatch[7].toUpperCase();
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}+07:00`;
    const parsed = Date.parse(iso);
    if (!Number.isNaN(parsed)) return parsed;
  }

  // Handle malformed timezone like "+07" -> "+0700"
  const fixedTz = normalized.replace(/([+-]\d{2})$/, '$100');
  const parsed = Date.parse(fixedTz);
  if (!Number.isNaN(parsed)) return parsed;

  return Date.now();
}

const DBSCL_REGION_MATCHERS: { label: string; keywords: string[] }[] = [
  { label: 'Cần Thơ', keywords: ['cần thơ', 'ninh kiều', 'cái răng', 'ô môn', 'thốt nốt', 'phong điền', 'cờ đỏ', 'thới lai', 'vĩnh thạnh'] },
  { label: 'An Giang', keywords: ['an giang', 'long xuyên', 'châu đốc', 'tịnh biên', 'tri tôn', 'châu phú', 'châu thành an giang', 'thoại sơn', 'tân châu', 'bảy núi', 'phú hữu'] },
  { label: 'Đồng Tháp', keywords: ['đồng tháp', 'cao lãnh', 'sa đéc', 'hồng ngự', 'tháp mười', 'đồng tháp mười', 'lấp vò', 'lai vung', 'tam nông', 'thanh bình'] },
  { label: 'Kiên Giang', keywords: ['kiên giang', 'rạch giá', 'phú quốc', 'hà tiên', 'giồng riềng', 'gò quao', 'hòn đất', 'kiên lương', 'u minh thượng'] },
  { label: 'Cà Mau', keywords: ['cà mau', 'năm căn', 'ngọc hiển', 'đầm dơi', 'cái nước', 'thới bình', 'u minh', 'đất mũi', 'cực nam'] },
  { label: 'Long An', keywords: ['long an', 'tân an', 'bến lức', 'đức hòa', 'cần giuộc', 'cần đước', 'kiến tường', 'mộc hóa', 'tân thạnh'] },
  { label: 'Tiền Giang', keywords: ['tiền giang', 'mỹ tho', 'cai lậy', 'cái bè', 'gò công', 'chợ gạo', 'tân phước'] },
  { label: 'Sóc Trăng', keywords: ['sóc trăng', 'trần đề', 'vĩnh châu', 'ngã năm', 'long phú', 'kế sách', 'mỹ xuyên'] },
  { label: 'Bến Tre', keywords: ['bến tre', 'châu thành bến tre', 'mỏ cày', 'ba tri', 'bình đại', 'chợ lách', 'giồng trôm'] },
  { label: 'Vĩnh Long', keywords: ['vĩnh long', 'bình minh', 'long hồ', 'mang thít', 'tam bình', 'trà ôn', 'vũng liêm'] },
  { label: 'Trà Vinh', keywords: ['trà vinh', 'duyên hải', 'cầu ngang', 'cầu kè', 'tiểu cần', 'trà cú'] },
  { label: 'Hậu Giang', keywords: ['hậu giang', 'vị thanh', 'ngã bảy', 'long mỹ', 'phụng hiệp', 'châu thành a'] },
  { label: 'Bạc Liêu', keywords: ['bạc liêu', 'giá rai', 'hòa bình bạc liêu', 'đông hải', 'hồng dân', 'phước long bạc liêu'] },
  { label: 'ĐBSCL', keywords: ['đbscl', 'đồng bằng sông cửu long', 'miền tây', 'tây nam bộ', 'sông hậu', 'sông tiền', 'sông mê kông', 'mê kông', 'tứ giác long xuyên', 'vùng đồng bằng'] },
];

function detectRegion(
  title: string,
  summary: string,
  defaultRegion: NewsRegion,
  defaultRegionLabel: string
): { region: NewsRegion; regionLabel: string } {
  const haystack = ` ${title.toLowerCase()} ${summary.toLowerCase()} `;
  for (const matcher of DBSCL_REGION_MATCHERS) {
    if (matcher.keywords.some((kw) => haystack.includes(kw))) {
      return { region: 'dbscl', regionLabel: matcher.label };
    }
  }
  return { region: defaultRegion, regionLabel: defaultRegionLabel };
}

const AGRI_KEYWORDS = [
  'nông nghiệp',
  'nông sản',
  'nông dân',
  'lúa gạo',
  'giá lúa',
  'giá gạo',
  'cây lúa',
  'trồng lúa',
  'xuất khẩu gạo',
  'sầu riêng',
  'cà phê',
  'hồ tiêu',
  'trái cây',
  'rau quả',
  'thủy sản',
  'hải sản',
  'nuôi tôm',
  'vuông tôm',
  'tôm hùm',
  'tôm thẻ',
  'cá tra',
  'chăn nuôi',
  'trồng trọt',
  'mùa màng',
  'thu hoạch',
  'phân bón',
  'bảo vệ thực vật',
  'hợp tác xã',
  'cánh đồng',
  'rầy nâu',
  'sâu bệnh',
  'vụ đông xuân',
  'vụ hè thu',
  'thủy lợi',
  'tưới tiêu',
  'nông thôn',
  'vườn cây',
  'nhà vườn',
  'thanh long',
  'cây ăn trái',
  'vật tư nông nghiệp',
  'máy gặt',
  'lâm nghiệp',
  'đất nông nghiệp',
  'nuôi trồng',
  'vật nuôi',
  'cây trồng',
  'đồng đất',
  'con giống',
];

const WEATHER_ENV_KEYWORDS = [
  'thời tiết',
  'dự báo thời tiết',
  'mưa lớn',
  'mưa rào',
  'mưa dông',
  'áp thấp',
  'cơn bão',
  'bão số',
  'triều cường',
  'ngập lụt',
  'ngập úng',
  'hạn hán',
  'xâm nhập mặn',
  'nắng nóng',
  'không khí lạnh',
  'rét đậm',
  'sạt lở',
  'khí tượng',
  'môi trường',
  'ô nhiễm',
  'biến đổi khí hậu',
  'thiên tai',
  'lốc xoáy',
  'gió giật',
  'mực nước',
  'rừng phòng hộ',
  'cháy rừng',
  'xả lũ',
];

const ECONOMY_KEYWORDS = [
  'giá vàng',
  'tỷ giá',
  'chứng khoán',
  'ngân hàng',
  'lãi suất',
  'xuất khẩu',
  'nhập khẩu',
  'doanh nghiệp',
  'thị trường',
  'kinh tế',
  'xăng dầu',
  'thuế',
  'bất động sản',
  'đầu tư',
  'tiêu dùng',
  'thương mại',
  'thương lái',
];

function classifyCategory(title: string, summary: string, defaultCategory: NewsCategory): NewsCategory {
  const haystack = ` ${title.toLowerCase()} ${summary.toLowerCase()} `;
  if (AGRI_KEYWORDS.some((kw) => haystack.includes(kw))) {
    return 'nong-nghiep';
  }
  if (WEATHER_ENV_KEYWORDS.some((kw) => haystack.includes(kw))) {
    return 'thoi-tiet';
  }
  if (defaultCategory === 'kinh-te' || ECONOMY_KEYWORDS.some((kw) => haystack.includes(kw))) {
    return 'kinh-te';
  }
  return 'thoi-su';
}

function isAllowedImageHost(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  return ALLOWED_IMAGE_SUFFIXES.some((suffix) => lower === suffix || lower.endsWith(`.${suffix}`));
}

function toProxiedImageUrl(rawUrl: string | null): string | null {
  if (!rawUrl) return null;
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    if (!isAllowedImageHost(parsed.hostname)) return null;
    return `/api/image-proxy?url=${encodeURIComponent(parsed.toString())}`;
  } catch {
    return null;
  }
}

function stableId(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
  }
  return `live-${(hash >>> 0).toString(36)}`;
}

async function fetchSggpDbsclPage(feed: FeedConfig): Promise<LiveNewsArticle[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const resp = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
      },
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status} for ${feed.url}`);
    const html = await resp.text();
    const articleBlocks = html.match(/<article\b[^>]*class=["'][^"']*story[^"']*["'][^>]*>[\s\S]*?<\/article>/gi) || [];
    const results: LiveNewsArticle[] = [];
    const now = Date.now();

    for (let idx = 0; idx < articleBlocks.length && results.length < feed.maxItems; idx++) {
      const block = articleBlocks[idx];
      const hrefMatch = block.match(/<a[^>]*\bhref=["'](https?:\/\/www\.sggp\.org\.vn\/[^"']+\.html)["'][^>]*>/i);
      const titleMatch =
        block.match(/<h[1-4][^>]*class=["'][^"']*story__heading[^"']*["'][^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/i) ||
        block.match(/<a[^>]*\btitle=["']([^"']+)["'][^>]*>/i);
      const imgMatch =
        block.match(/<img[^>]*\bdata-src=["']([^"']+)["'][^>]*>/i) ||
        block.match(/<img[^>]*\bsrc=["']([^"']+)["'][^>]*>/i);
      const summaryMatch = block.match(/<div[^>]*class=["'][^"']*story__summary[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);

      const url = hrefMatch?.[1]?.trim() || '';
      const title = cleanText(titleMatch?.[1] || '');
      if (!url || !title) continue;

      const rawImageUrl = imgMatch?.[1] ? decodeHtmlEntities(imgMatch[1]).trim() : null;
      const imageUrl = toProxiedImageUrl(rawImageUrl);

      // Extract real date from SGGP image path e.g. /2026_11_19/ when available
      let publishedTimestamp = now - idx * 20 * 60 * 1000;
      const datePathMatch = rawImageUrl?.match(/\/(\d{4})_(\d{2})_(\d{2})\//);
      if (datePathMatch) {
        const dateTs = Date.parse(`${datePathMatch[1]}-${datePathMatch[2]}-${datePathMatch[3]}T12:00:00+07:00`);
        if (!Number.isNaN(dateTs)) {
          // Keep chronological freshness offset for same-day items
          const todayIso = new Date(now + 7 * 3600 * 1000).toISOString().slice(0, 10);
          const itemIso = `${datePathMatch[1]}-${datePathMatch[2]}-${datePathMatch[3]}`;
          publishedTimestamp = itemIso === todayIso ? now - idx * 18 * 60 * 1000 : dateTs - idx * 60 * 1000;
        }
      }

      const summary = cleanText(summaryMatch?.[1] || '') || `${title} — Tin tức khu vực Đồng bằng sông Cửu Long trên Báo Sài Gòn Giải Phóng.`;
      const category = classifyCategory(title, summary, feed.defaultCategory);
      const detected = detectRegion(title, summary, feed.defaultRegion, feed.defaultRegionLabel);

      results.push({
        id: stableId(url),
        category,
        region: 'dbscl',
        regionLabel: detected.regionLabel === 'Toàn quốc' ? 'ĐBSCL' : detected.regionLabel,
        title,
        summary,
        url,
        imageUrl,
        rawImageUrl,
        source: feed.source,
        sourceDomain: feed.sourceDomain,
        publishedAt: new Date(publishedTimestamp).toISOString(),
        publishedTimestamp,
      });
    }

    return results;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchSingleFeed(feed: FeedConfig): Promise<LiveNewsArticle[]> {
  if (feed.kind === 'sggp_html') {
    return fetchSggpDbsclPage(feed);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);
  try {
    const resp = await fetch(feed.url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        Accept: 'application/rss+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
    });
    if (!resp.ok) {
      throw new Error(`HTTP ${resp.status} for ${feed.url}`);
    }
    const xml = await resp.text();
    const itemMatches = xml.match(/<item\b[^>]*>[\s\S]*?<\/item>/gi) || [];
    const results: LiveNewsArticle[] = [];
    const now = Date.now();
    const maxAgeMs = 30 * 24 * 60 * 60 * 1000;

    for (const itemXml of itemMatches) {
      if (results.length >= feed.maxItems) break;

      const rawTitle = extractTagValue(itemXml, 'title');
      const rawLink = extractTagValue(itemXml, 'link');
      const rawDesc = extractTagValue(itemXml, 'description');
      const rawDate = extractTagValue(itemXml, 'pubDate');

      const title = cleanText(rawTitle);
      let url = cleanText(rawLink);
      if (!title || !url || !/^https?:\/\//i.test(url)) continue;

      // Some provincial CMS feeds (e.g. Báo Đồng Tháp) emit homepage as <link>; route safely to their search URL
      try {
        const parsedLink = new URL(url);
        if (parsedLink.pathname === '/' || parsedLink.pathname === '') {
          url = `${parsedLink.origin}/tim-kiem/?q=${encodeURIComponent(title)}`;
        }
      } catch {
        continue;
      }

      const summary = cleanText(rawDesc);
      const publishedTimestamp = parsePubDate(rawDate);
      if (now - publishedTimestamp > maxAgeMs) continue;

      const rawImageUrl = extractImageUrl(itemXml, rawDesc);
      const imageUrl = toProxiedImageUrl(rawImageUrl);
      const category = classifyCategory(title, summary, feed.defaultCategory);
      const detected = detectRegion(title, summary, feed.defaultRegion, feed.defaultRegionLabel);

      // For local Mekong Delta newspapers, skip purely national/foreign reprints without local relevance if we already have plenty,
      // but keep all local Mekong Delta items tagged as dbscl
      const isLocalPaper = feed.defaultRegion === 'dbscl';
      const region: NewsRegion = detected.region === 'dbscl' ? 'dbscl' : isLocalPaper ? 'dbscl' : 'other';
      const regionLabel =
        detected.region === 'dbscl'
          ? detected.regionLabel
          : isLocalPaper
          ? feed.defaultRegionLabel
          : 'Toàn quốc';

      results.push({
        id: stableId(`${url}#${title}`),
        category,
        region,
        regionLabel,
        title,
        summary: summary || title,
        url,
        imageUrl,
        rawImageUrl,
        source: feed.source,
        sourceDomain: feed.sourceDomain,
        publishedAt: new Date(publishedTimestamp).toISOString(),
        publishedTimestamp,
      });
    }

    return results;
  } finally {
    clearTimeout(timer);
  }
}

interface NewsCache {
  fetchedAt: number;
  articles: LiveNewsArticle[];
  activeSources: string[];
  regionCounts: { dbscl: number; other: number };
}

const NEWS_CACHE_TTL_MS = 5 * 60 * 1000;
let newsCache: NewsCache | null = null;
let inflightNewsPromise: Promise<NewsCache> | null = null;

async function getAggregatedNews(forceRefresh = false): Promise<{ cache: NewsCache; fromCache: boolean }> {
  const now = Date.now();
  if (!forceRefresh && newsCache && now - newsCache.fetchedAt < NEWS_CACHE_TTL_MS) {
    return { cache: newsCache, fromCache: true };
  }

  if (!forceRefresh && inflightNewsPromise) {
    const cache = await inflightNewsPromise;
    return { cache, fromCache: true };
  }

  const promise = (async (): Promise<NewsCache> => {
    const settled = await Promise.allSettled(NEWS_FEEDS.map((feed) => fetchSingleFeed(feed)));
    const allItems: LiveNewsArticle[] = [];
    const sourceSet = new Set<string>();

    settled.forEach((res, idx) => {
      if (res.status === 'fulfilled' && res.value.length > 0) {
        sourceSet.add(NEWS_FEEDS[idx].source);
        allItems.push(...res.value);
      }
    });

    // Deduplicate by URL and normalized title; prefer items with real images and Mekong Delta regional tag
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();
    const deduped: LiveNewsArticle[] = [];

    allItems.sort((a, b) => {
      // Slightly prefer items with real images on exact tie, otherwise newest first
      if (b.publishedTimestamp !== a.publishedTimestamp) {
        return b.publishedTimestamp - a.publishedTimestamp;
      }
      return (b.imageUrl ? 1 : 0) - (a.imageUrl ? 1 : 0);
    });

    for (const item of allItems) {
      const normUrl = item.url.replace(/[?#].*$/, '').toLowerCase();
      const normTitle = item.title.toLowerCase().replace(/[^a-z0-9à-ỹ]+/gi, ' ').trim();
      const isSearchUrl = item.url.includes('/tim-kiem/?q=');
      if ((!isSearchUrl && seenUrls.has(normUrl)) || seenTitles.has(normTitle)) continue;
      if (!isSearchUrl) seenUrls.add(normUrl);
      seenTitles.add(normTitle);
      deduped.push(item);
    }

    // Separate Mekong Delta (ĐBSCL) vs other regions
    const dbsclItems = deduped.filter((a) => a.region === 'dbscl');
    const otherItems = deduped.filter((a) => a.region !== 'dbscl');

    // Sort ĐBSCL items so items with crisp real press images come first among recent stories
    dbsclItems.sort((a, b) => {
      const aHasImg = a.imageUrl ? 1 : 0;
      const bHasImg = b.imageUrl ? 1 : 0;
      // Within 48 hours, strongly prioritize articles with real press photos for editorial quality
      const aRecent = Date.now() - a.publishedTimestamp < 48 * 3600 * 1000 ? 1 : 0;
      const bRecent = Date.now() - b.publishedTimestamp < 48 * 3600 * 1000 ? 1 : 0;
      if (aRecent && bRecent && aHasImg !== bHasImg) {
        return bHasImg - aHasImg;
      }
      return b.publishedTimestamp - a.publishedTimestamp;
    });

    // Focus heavily on Mekong Delta (~80% ĐBSCL, ~20% other regions capped at 18 items)
    const selectedDbscl = dbsclItems.slice(0, 82);
    const maxOther = Math.min(18, Math.max(8, Math.round(selectedDbscl.length * 0.25)));
    const selectedOther = otherItems.filter((a) => Boolean(a.imageUrl)).slice(0, maxOther);

    // Interleave: Top 4 Lead + Featured slots are 100% ĐBSCL, then ~4 ĐBSCL : 1 other-region rhythm
    const merged: LiveNewsArticle[] = [];
    let dIdx = 0;
    let oIdx = 0;

    // First 4 headline slots: Mekong Delta focus
    while (dIdx < Math.min(4, selectedDbscl.length)) {
      merged.push(selectedDbscl[dIdx++]);
    }

    while (dIdx < selectedDbscl.length || oIdx < selectedOther.length) {
      for (let k = 0; k < 4 && dIdx < selectedDbscl.length; k++) {
        merged.push(selectedDbscl[dIdx++]);
      }
      if (oIdx < selectedOther.length) {
        merged.push(selectedOther[oIdx++]);
      }
    }

    const updated: NewsCache = {
      fetchedAt: Date.now(),
      articles: merged,
      activeSources: Array.from(sourceSet),
      regionCounts: {
        dbscl: selectedDbscl.length,
        other: selectedOther.length,
      },
    };

    if (updated.articles.length > 0) {
      newsCache = updated;
    }
    return updated;
  })();

  inflightNewsPromise = promise;
  try {
    const cache = await promise;
    return { cache, fromCache: false };
  } finally {
    inflightNewsPromise = null;
  }
}

interface WeatherDailyItem {
  date: string;
  weatherCode: number;
  tempMax: number;
  tempMin: number;
  rainProb: number;
  windMax: number;
}

interface WeatherPayload {
  province: string;
  region: string;
  source: string;
  updatedAt: string;
  tempC: number;
  apparentTempC: number;
  humidity: number;
  windKmh: number;
  precipitationMm: number;
  weatherCode: number;
  daily: WeatherDailyItem[];
}

interface WeatherCacheEntry {
  fetchedAt: number;
  payload: WeatherPayload;
}

const WEATHER_CACHE_TTL_MS = 10 * 60 * 1000;
const weatherCache = new Map<string, WeatherCacheEntry>();

function describeWmoCodeVN(code: number): string {
  if (code === 0) return 'Trời quang đãng, nắng đẹp';
  if (code <= 2) return 'Ít mây, có nắng nhẹ';
  if (code === 3) return 'Nhiều mây, trời âm u';
  if (code === 45 || code === 48) return 'Có sương mù';
  if (code >= 51 && code <= 57) return 'Mưa phùn nhẹ';
  if (code >= 61 && code <= 65) return 'Có mưa vừa đến mưa to';
  if (code >= 80 && code <= 82) return 'Mưa rào rải rác';
  if (code >= 95) return 'Mưa dông, có khả năng sấm sét và gió giật';
  return 'Mây thay đổi';
}

async function fetchProvinceWeatherData(
  requestedProvince: string,
  forceRefresh = false
): Promise<{ payload: WeatherPayload; cached: boolean }> {
  const config =
    PROVINCE_COORDS.find((p) => p.province.toLowerCase() === requestedProvince.toLowerCase()) ||
    PROVINCE_COORDS[0];

  const cached = weatherCache.get(config.province);
  if (!forceRefresh && cached && Date.now() - cached.fetchedAt < WEATHER_CACHE_TTL_MS) {
    return { payload: cached.payload, cached: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 7000);

  try {
    const apiUrl =
      `https://api.open-meteo.com/v1/forecast?latitude=${config.lat}&longitude=${config.lon}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m` +
      `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max` +
      `&timezone=Asia%2FHo_Chi_Minh&forecast_days=5`;

    const upstream = await fetch(apiUrl, { signal: controller.signal });
    if (!upstream.ok) {
      throw new Error(`Open-Meteo HTTP ${upstream.status}`);
    }

    const json = (await upstream.json()) as {
      current?: Record<string, number>;
      daily?: {
        time?: string[];
        weather_code?: number[];
        temperature_2m_max?: number[];
        temperature_2m_min?: number[];
        precipitation_probability_max?: number[];
        wind_speed_10m_max?: number[];
      };
    };

    const cur = json.current || {};
    const dailyRaw = json.daily || {};
    const times = Array.isArray(dailyRaw.time) ? dailyRaw.time : [];

    const daily: WeatherDailyItem[] = times.slice(0, 5).map((dateStr, idx) => ({
      date: dateStr,
      weatherCode: Number(dailyRaw.weather_code?.[idx] ?? 1),
      tempMax: Math.round(Number(dailyRaw.temperature_2m_max?.[idx] ?? 31)),
      tempMin: Math.round(Number(dailyRaw.temperature_2m_min?.[idx] ?? 24)),
      rainProb: Math.round(Number(dailyRaw.precipitation_probability_max?.[idx] ?? 0)),
      windMax: Math.round(Number(dailyRaw.wind_speed_10m_max?.[idx] ?? 10)),
    }));

    const payload: WeatherPayload = {
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

    weatherCache.set(config.province, { fetchedAt: Date.now(), payload });
    return { payload, cached: false };
  } finally {
    clearTimeout(timer);
  }
}

function detectMentionedProvinces(text: string, fallbackProvince?: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const p of PROVINCE_COORDS) {
    if (lower.includes(p.province.toLowerCase())) {
      matched.push(p.province);
    }
  }
  if (matched.length > 0) return matched.slice(0, 3);
  const defaultList: string[] = [];
  if (fallbackProvince && PROVINCE_COORDS.some((p) => p.province.toLowerCase() === fallbackProvince.toLowerCase())) {
    defaultList.push(fallbackProvince);
  }
  if (!defaultList.includes('An Giang')) defaultList.push('An Giang');
  if (!defaultList.includes('Cần Thơ')) defaultList.push('Cần Thơ');
  return defaultList.slice(0, 2);
}

type AiRoutingTier = 'fast' | 'smart';
type AiModePreference = 'auto' | 'fast' | 'smart';

interface AiRouteDecision {
  tier: AiRoutingTier;
  model: string;
  thinkingLevel: ThinkingLevel;
  label: string;
}

function classifyTaskComplexity(
  message: string,
  hasImage: boolean,
  preferredMode: AiModePreference = 'auto'
): AiRouteDecision {
  if (preferredMode === 'fast') {
    return {
      tier: 'fast',
      model: 'gemini-3.1-flash-lite',
      thinkingLevel: hasImage ? ThinkingLevel.LOW : ThinkingLevel.MINIMAL,
      label: hasImage ? 'AI Nhanh • Chẩn đoán ảnh' : 'AI Nhanh',
    };
  }
  if (preferredMode === 'smart') {
    return {
      tier: 'smart',
      model: 'gemini-4-hydrogen',
      thinkingLevel: ThinkingLevel.LOW,
      label: hasImage ? 'AI Chuyên sâu • Chẩn đoán ảnh' : 'AI Chuyên sâu',
    };
  }

  // Automatic smart routing:
  // 1. Any crop/pest photo diagnosis -> always use Smart AI for highest visual accuracy
  if (hasImage) {
    return {
      tier: 'smart',
      model: 'gemini-4-hydrogen',
      thinkingLevel: ThinkingLevel.LOW,
      label: 'AI Chuyên sâu • Chẩn đoán ảnh',
    };
  }

  const lower = message.toLowerCase();
  const wordCount = message.trim().split(/\s+/).filter(Boolean).length;

  // 2. Complex agricultural diagnostics, pest/disease treatment protocols, calculations, or multi-part questions
  const complexPatterns = [
    /chẩn đoán|phân biệt|triệu chứng|biểu hiện|vàng lá|cháy lá|cháy bìa lá|đạo ôn|rầy nâu|sâu đục thân|sâu cuốn lá|nhện gié|lem lép hạt|thối rễ|thối trái|xì mủ|nứt thân|bọ trĩ|ruồi vàng|tuyến trùng|nấm hồng|sâu bệnh.*hoành hành|phòng trị/,
    /hoạt chất|phối thuốc|pha thuốc|liều lượng|phác đồ|quy trình xử lý|cách trị|trị bệnh|khắc phục|dập dịch|kháng thuốc|cách xử lý/,
    /phân tích|so sánh|tính toán|lập kế hoạch|chi phí|lợi nhuận|cải tạo đất|độ ph|rửa mặn|quy trình canh tác|giải pháp lâu dài/,
  ];

  const hasMultipleQuestions = (message.match(/[?？]/g) || []).length >= 2;
  const isComplex =
    wordCount >= 32 ||
    hasMultipleQuestions ||
    complexPatterns.some((re) => re.test(lower));

  if (isComplex) {
    return {
      tier: 'smart',
      model: 'gemini-4-hydrogen',
      thinkingLevel: ThinkingLevel.LOW,
      label: 'AI Chuyên sâu',
    };
  }

  // 3. Fast & direct tasks (app guide, weather lookup, quick news summary, greetings)
  return {
    tier: 'fast',
    model: 'gemini-3.1-flash-lite',
    thinkingLevel: ThinkingLevel.MINIMAL,
    label: 'AI Nhanh',
  };
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise
      .then((val) => {
        clearTimeout(timer);
        resolve(val);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(fallback);
      });
  });
}

async function buildLiveAgriContext(userText: string, userProvince?: string): Promise<string> {
  const sections: string[] = [];
  const lower = userText.toLowerCase();

  const wantsWeather =
    /thời tiết|mưa|nắng|gió|nhiệt độ|bão|áp thấp|độ ẩm|phun thuốc|drone|dự báo|phơi lúa|an giang|cần thơ|đồng tháp|kiên giang|long an|sóc trăng|tiền giang|lâm đồng/.test(
      lower
    );

  const wantsNews =
    /tin tức|thời sự|báo chí|bản tin|giá lúa|giá gạo|sầu riêng|nông sản|thị trường|xuất khẩu|xâm nhập mặn|triều cường|tin mới|miền tây.*mới|đbscl.*mới|tình hình.*đbscl|tình hình.*miền tây/.test(
      lower
    );

  if (!wantsWeather && !wantsNews) {
    return '';
  }

  const provinces = detectMentionedProvinces(userText, userProvince);

  // Use cached data immediately when warm; cap any cold upstream wait to 2.5s so chat stays snappy
  const [weatherResults, newsResult] = await Promise.all([
    wantsWeather
      ? withTimeout(
          Promise.allSettled(provinces.map((prov) => fetchProvinceWeatherData(prov, false))),
          2500,
          []
        )
      : Promise.resolve([]),
    wantsNews
      ? newsCache
        ? Promise.resolve({ cache: newsCache, fromCache: true })
        : withTimeout(getAggregatedNews(false).catch(() => null), 2500, null)
      : Promise.resolve(null),
  ]);

  if (weatherResults.length > 0) {
    const lines: string[] = [];
    for (const res of weatherResults) {
      if (res.status === 'fulfilled') {
        const w = res.value.payload;
        const forecastStr = w.daily
          .slice(0, 3)
          .map(
            (d) =>
              `${d.date}: ${d.tempMin}-${d.tempMax}°C, mưa ${d.rainProb}%, gió max ${d.windMax} km/h (${describeWmoCodeVN(d.weatherCode)})`
          )
          .join(' | ');
        lines.push(
          `- ${w.province} (${w.region}): Hiện tại ${w.tempC}°C (cảm giác ${w.apparentTempC}°C), ẩm ${w.humidity}%, gió ${w.windKmh} km/h, mưa ${w.precipitationMm}mm — ${describeWmoCodeVN(w.weatherCode)}. Dự báo 3 ngày: ${forecastStr}.`
        );
      }
    }
    if (lines.length > 0) {
      sections.push(`DỮ LIỆU THỜI TIẾT THỰC TẾ MỚI CẬP NHẬT (Open-Meteo):\n${lines.join('\n')}`);
    }
  }

  if (newsResult && newsResult.cache.articles.length > 0) {
    const topArticles = newsResult.cache.articles.slice(0, 10);
    const newsLines = topArticles.map((a, idx) => {
      const dateVN = new Date(a.publishedTimestamp).toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      const shortSum = a.summary.length > 130 ? `${a.summary.slice(0, 127)}...` : a.summary;
      return `${idx + 1}. [${a.regionLabel} | ${a.source} | ${dateVN}] ${a.title} — ${shortSum}`;
    });
    sections.push(
      `BẢN TIN THỜI SỰ & NÔNG NGHIỆP THỰC TẾ MỚI NHẤT TẬP TRUNG ĐBSCL (Nguồn báo chính thống Việt Nam):\n${newsLines.join('\n')}`
    );
  }

  return sections.join('\n\n');
}

const APP_KNOWLEDGE_BASE = `THÔNG TIN HƯỚNG DẪN SỬ DỤNG ỨNG DỤNG "SÀN DỊCH VỤ NÔNG NGHIỆP":
- Ứng dụng kết nối trực tiếp Nông dân (người cần thuê dịch vụ/máy móc) và Nhà cung cấp (chủ máy bay phun thuốc Drone, máy gặt đập liên hợp, máy cày bừa, gieo sạ, thu hoạch, nhân công, hợp tác xã).
- 5 Mục chính trên thanh điều hướng:
  1. Trang chủ: Xem danh sách bài đăng Cần thuê dịch vụ & Nhận làm dịch vụ, lọc theo loại dịch vụ/tỉnh thành, xem chi tiết bài đăng, ứng tuyển nhận việc hoặc đặt thuê. Nhấn vào khu vực Tiến độ ở trang chủ sẽ chuyển thẳng tới màn hình Tiến trình công việc.
  2. Tin tức: Cập nhật bản tin thời sự, nông nghiệp, kinh tế tập trung khu vực Đồng bằng sông Cửu Long (ĐBSCL) lấy từ báo chính thống Việt Nam (SGGP, Báo Cần Thơ, Báo An Giang, Báo Đồng Tháp, Báo Cà Mau, VnExpress, Tuổi Trẻ, Thanh Niên, Dân Trí) và Dự báo thời tiết thực tế 5 ngày cho 8 tỉnh trọng điểm ĐBSCL & Tây Nguyên.
  3. Đăng bài: Tạo bài đăng "Cần tìm dịch vụ", "Nhận làm dịch vụ" hoặc "Hợp tác liên doanh". Hỗ trợ chọn lịch làm việc 1 ngày, nhiều ngày liên tiếp hoặc định kỳ, tùy chọn thanh toán đặt cọc theo % hoặc thanh toán đủ.
  4. Giao dịch & Tiến trình: Quản lý hợp đồng đã chốt, xem tiến trình làm việc chi tiết theo từng bước và từng buổi/ngày, chủ máy cập nhật ảnh hiện trường, trao đổi trực tiếp qua chat giao dịch, xác nhận nghiệm thu để giải ngân.
  5. Cá nhân: Quản lý thông tin tài khoản, chuyển đổi vai trò/đăng nhập, xem số dư ví & lịch sử ví, nạp tiền vào ví, và bật/tắt chế độ Sáng/Tối trong mục Cài đặt cá nhân.
- Quy định Ví & Thanh toán:
  + Nạp tiền qua Viettel Money về số tài khoản 104888853717 (Chủ tài khoản: Huỳnh Công Khoa), có thể tải biên lai/ảnh chuyển khoản để đối chiếu nhanh.
  + Phí kết nối/phí sàn minh bạch khi xác nhận hợp đồng (3.000₫/giao dịch). Tiền đặt cọc hoặc thanh toán được tạm giữ an toàn trên hệ thống cho đến khi hai bên nghiệm thu hoàn thành công việc.`;

const AGRI_ASSISTANT_SYSTEM_PROMPT = `Bạn là "Trợ lý Nông Vụ AI" tích hợp ngay trong ứng dụng "Sàn Dịch Vụ Nông Nghiệp" dành cho bà con nông dân Việt Nam (đặc biệt là vùng Đồng bằng sông Cửu Long và Tây Nguyên).

NGUYÊN TẮC GIAO TIẾP:
- Xưng "Trợ lý" và gọi người dùng là "bà con" (hoặc "anh/chị" nếu họ tự xưng). Giọng điệu gần gũi, chân thành, dễ hiểu, thực tế như kỹ sư nông nghiệp đi thăm đồng cùng bà con.
- Trình bày ngắn gọn, rõ ràng, chia mục bằng chữ in đậm (**...**) và gạch đầu dòng để bà con dễ đọc trên màn hình điện thoại ngoài ruộng.
- Không bịa đặt số liệu thời tiết hay tin tức. Nếu dữ liệu thực tế được cung cấp trong ngữ cảnh bên dưới, hãy trích dẫn chính xác số liệu, nguồn báo và ngày giờ.

CHUYÊN MÔN HỖ TRỢ:
1. Hướng dẫn sử dụng app: Giải đáp từng bước rõ ràng cách đăng bài, thuê phun Drone/máy cắt, nạp ví Viettel Money, theo dõi tiến trình, bật chế độ sáng/tối, xem tin tức & thời tiết.
2. Thời tiết nông vụ: Dựa trên dữ liệu Open-Meteo thực tế được cung cấp, tư vấn luôn lịch làm đồng phù hợp (ví dụ gió > 15 km/h hoặc xác suất mưa > 60% thì lưu ý khi phun thuốc Drone / phơi lúa).
3. Thời sự & thị trường nông sản: Tóm tắt ngắn gọn các tin nóng ĐBSCL, giá lúa gạo, trái cây, thủy sản, hạn mặn từ bản tin thực tế mới nhất được đính kèm.
4. Sâu bệnh & Chẩn đoán hình ảnh (QUAN TRỌNG):
   - Khi bà con gửi ảnh lá lúa, thân cây, trái cây, côn trùng hay đất/nước, hãy quan sát thật kỹ hình ảnh và trả lời theo 4 phần ngắn gọn:
     **1. Chẩn đoán từ hình ảnh:** Nêu dấu hiệu nhìn thấy trên ảnh và tên sâu/bệnh khả nghi nhất (nếu ảnh mờ, thiếu sáng hoặc chụp quá xa, nói thẳng và hướng dẫn bà con chụp cận cảnh mặt trên/dưới lá rõ nét hơn).
     **2. Cách xử lý ngay tại ruộng/vườn:** Hướng dẫn biện pháp canh tác (rút/giữ nước, tỉa cành, cắt nguồn bệnh) kết hợp nhóm hoạt chất BVTV phù hợp đang phổ biến ở Việt Nam. Luôn nhắc nguyên tắc **4 đúng** (đúng thuốc, đúng liều, đúng lúc, đúng cách) và đảm bảo **thời gian cách ly**.
     **3. Phòng ngừa lây lan:** Lưu ý bón phân cân đối (giảm đạm khi cây đang bị bệnh đạo ôn/cháy bìa lá), thăm đồng định kỳ.
     **4. Gợi ý trên Sàn Dịch Vụ:** Nếu cần dập dịch nhanh trên diện rộng (như rầy nâu, sâu cuốn lá, đạo ôn, lem lép hạt), gợi ý bà con mở mục **Trang chủ** hoặc **Đăng bài** để gọi đội **Phun thuốc Drone** gần khu vực cho kịp thời vụ.
   - Nếu bà con hỏi chung về sâu bệnh đang hoành hành theo mùa vụ ở ĐBSCL (rầy nâu, đạo ôn lá/cổ bông, cháy bìa lá, sâu đục thân, sâu cuốn lá, nhện gié, bệnh thối trái/xì mủ sầu riêng, ốc bươu vàng...), hãy phân tích nguyên nhân thời tiết (ẩm độ cao, mưa nắng xen kẽ) và cách phòng trị thiết thực.

${APP_KNOWLEDGE_BASE}`;

function getRefererForHost(hostname: string): string {
  const h = hostname.toLowerCase();
  if (h.includes('vnecdn') || h.includes('vnexpress')) return 'https://vnexpress.net/';
  if (h.includes('tuoitre')) return 'https://tuoitre.vn/';
  if (h.includes('thanhnien')) return 'https://thanhnien.vn/';
  if (h.includes('dantri')) return 'https://dantri.com.vn/';
  if (h.includes('sggp')) return 'https://www.sggp.org.vn/';
  if (h.includes('baocantho')) return 'https://baocantho.com.vn/';
  if (h.includes('baoangiang')) return 'https://baoangiang.com.vn/';
  if (h.includes('baodongthap')) return 'https://baodongthap.vn/';
  if (h.includes('baocamau')) return 'https://baocamau.vn/';
  if (h.includes('vnncdn') || h.includes('vietnamnet')) return 'https://vietnamnet.vn/';
  if (h.includes('nld')) return 'https://nld.com.vn/';
  return `https://${hostname}/`;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '10mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });

  app.get('/api/news', async (req, res) => {
    try {
      const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';
      const { cache, fromCache } = await getAggregatedNews(forceRefresh);

      if (cache.articles.length === 0) {
        res.status(503).json({
          error: 'Chưa thể kết nối nguồn báo chí trực tuyến. Vui lòng thử lại sau giây lát.',
          articles: [],
          sources: [],
          updatedAt: new Date().toISOString(),
        });
        return;
      }

      const countsByCategory: Record<string, number> = {
        all: cache.articles.length,
        'thoi-su': 0,
        'nong-nghiep': 0,
        'kinh-te': 0,
        'thoi-tiet': 0,
      };

      for (const a of cache.articles) {
        countsByCategory[a.category] = (countsByCategory[a.category] || 0) + 1;
      }

      res.setHeader('Cache-Control', 'no-store');
      res.json({
        articles: cache.articles,
        sources: cache.activeSources,
        countsByCategory,
        regionCounts: cache.regionCounts,
        cached: fromCache,
        updatedAt: new Date(cache.fetchedAt).toISOString(),
      });
    } catch (err) {
      console.error('[API /api/news] Error:', err);
      res.status(502).json({
        error: 'Không thể tải bản tin thời sự trực tuyến lúc này.',
        articles: [],
        sources: [],
        updatedAt: new Date().toISOString(),
      });
    }
  });

  app.get('/api/image-proxy', async (req, res) => {
    const rawUrl = typeof req.query.url === 'string' ? req.query.url : '';
    if (!rawUrl || rawUrl.length > 2048) {
      res.status(400).send('Invalid image url');
      return;
    }

    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      res.status(400).send('Malformed image url');
      return;
    }

    if ((parsed.protocol !== 'https:' && parsed.protocol !== 'http:') || !isAllowedImageHost(parsed.hostname)) {
      res.status(403).send('Image host not allowed');
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);

    try {
      const upstream = await fetch(parsed.toString(), {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
          Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
          Referer: getRefererForHost(parsed.hostname),
        },
      });

      if (!upstream.ok) {
        res.status(upstream.status).send('Upstream image error');
        return;
      }

      const contentType = upstream.headers.get('content-type') || 'image/jpeg';
      if (!contentType.toLowerCase().startsWith('image/')) {
        res.status(415).send('Not an image');
        return;
      }

      const arrayBuffer = await upstream.arrayBuffer();
      if (arrayBuffer.byteLength > 8 * 1024 * 1024) {
        res.status(413).send('Image too large');
        return;
      }

      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=3600, stale-while-revalidate=86400');
      res.send(Buffer.from(arrayBuffer));
    } catch {
      res.status(502).send('Failed to fetch upstream image');
    } finally {
      clearTimeout(timer);
    }
  });

  app.get('/api/weather', async (req, res) => {
    const requestedProvince = typeof req.query.province === 'string' ? req.query.province.trim() : 'An Giang';
    const forceRefresh = req.query.refresh === '1' || req.query.refresh === 'true';

    try {
      const { payload, cached } = await fetchProvinceWeatherData(requestedProvince, forceRefresh);
      res.setHeader('Cache-Control', 'no-store');
      res.json({ ...payload, cached });
    } catch (err) {
      console.error('[API /api/weather] Error:', err);
      res.status(503).json({
        error: `Không thể lấy dữ liệu thời tiết thực tế tại ${requestedProvince}. Vui lòng thử làm mới.`,
      });
    }
  });

  app.post('/api/ai/chat', async (req, res) => {
    const body = (req.body || {}) as {
      message?: unknown;
      history?: unknown;
      image?: { data?: unknown; mimeType?: unknown } | null;
      mode?: unknown;
      stream?: unknown;
      context?: { province?: unknown; activeTab?: unknown; userName?: unknown; userRole?: unknown };
    };

    const wantsStream =
      body.stream === true || (req.headers.accept || '').includes('text/event-stream');

    const sendError = (status: number, error: string, code?: string) => {
      if (wantsStream && res.headersSent) {
        res.write(`data: ${JSON.stringify({ type: 'error', error, code })}\n\n`);
        res.end();
        return;
      }
      res.status(status).json({ error, code });
    };

    try {
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
        sendError(
          503,
          'Chưa cấu hình khóa GEMINI_API_KEY trên máy chủ. Vui lòng thiết lập GEMINI_API_KEY trong mục Settings > Secrets của AI Studio.',
          'MISSING_API_KEY'
        );
        return;
      }

      const rawMessage = typeof body?.message === 'string' ? body.message.trim() : '';
      const imageData =
        body?.image && typeof body.image.data === 'string' ? body.image.data.trim() : '';
      const imageMimeType =
        body?.image && typeof body.image.mimeType === 'string'
          ? body.image.mimeType.trim()
          : 'image/jpeg';

      if (!rawMessage && !imageData) {
        sendError(400, 'Vui lòng nhập câu hỏi hoặc gửi kèm hình ảnh.');
        return;
      }

      if (imageData && !/^image\/(jpeg|jpg|png|webp|gif|heic|heif)$/i.test(imageMimeType)) {
        sendError(400, 'Định dạng ảnh không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG hoặc WEBP.');
        return;
      }

      if (imageData && imageData.length > 9 * 1024 * 1024) {
        sendError(413, 'Ảnh quá lớn. Vui lòng chọn ảnh dung lượng nhỏ hơn.');
        return;
      }

      const preferredMode: AiModePreference =
        body?.mode === 'fast' || body?.mode === 'smart' ? body.mode : 'auto';
      const userProvince =
        typeof body?.context?.province === 'string' ? body.context.province.trim() : undefined;
      const activeTab =
        typeof body?.context?.activeTab === 'string' ? body.context.activeTab.trim() : undefined;
      const userName =
        typeof body?.context?.userName === 'string' ? body.context.userName.trim() : undefined;

      const effectiveMessage =
        rawMessage ||
        'Bà con gửi hình ảnh này nhờ Trợ lý kiểm tra giúp đây là sâu bệnh hay vấn đề gì trên cây trồng và hướng dẫn cách xử lý chi tiết nhé.';

      const route = classifyTaskComplexity(effectiveMessage, Boolean(imageData), preferredMode);

      if (wantsStream) {
        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();
        res.write(
          `data: ${JSON.stringify({
            type: 'meta',
            tier: route.tier,
            tierLabel: route.label,
          })}\n\n`
        );
      }

      const liveContext = await buildLiveAgriContext(effectiveMessage, userProvince);

      const nowVN = new Date().toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const runtimeInfoParts: string[] = [
        `Thời điểm hiện tại (giờ Việt Nam): ${nowVN}`,
      ];
      if (userName) runtimeInfoParts.push(`Tên người đang hỏi: ${userName}`);
      if (userProvince) runtimeInfoParts.push(`Tỉnh/thành người dùng: ${userProvince}`);
      if (activeTab) runtimeInfoParts.push(`Màn hình người dùng đang mở: ${activeTab}`);
      if (route.tier === 'fast') {
        runtimeInfoParts.push(
          'Yêu cầu tốc độ: Trả lời trực diện, súc tích, dễ đọc nhanh trên điện thoại.'
        );
      }

      const fullSystemInstruction = [
        AGRI_ASSISTANT_SYSTEM_PROMPT,
        `NGỮ CẢNH PHIÊN HIỆN TẠI:\n${runtimeInfoParts.join('\n')}`,
        liveContext ? `DỮ LIỆU TRỰC TUYẾN MỚI NHẤT ĐỂ TRẢ LỜI CHÍNH XÁC:\n${liveContext}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      // Sanitize prior multi-turn conversation history with strict user -> model alternation
      const rawHistory = Array.isArray(body?.history) ? body.history : [];
      const historyContents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
      for (const item of rawHistory.slice(-8)) {
        if (!item || typeof item !== 'object') continue;
        const rec = item as { role?: unknown; text?: unknown; hasImage?: unknown };
        const role = rec.role === 'model' ? 'model' : rec.role === 'user' ? 'user' : null;
        const text = typeof rec.text === 'string' ? rec.text.trim() : '';
        if (!role || !text) continue;
        // Conversation history must begin with a user turn
        if (historyContents.length === 0 && role !== 'user') continue;
        const labeledText =
          rec.hasImage && role === 'user' ? `[Người dùng có gửi ảnh] ${text}` : text;
        const clipped = labeledText.slice(0, 1600);
        const last = historyContents[historyContents.length - 1];
        if (last && last.role === role) {
          last.parts[0].text = `${last.parts[0].text}\n${clipped}`.slice(0, 2000);
        } else {
          historyContents.push({ role, parts: [{ text: clipped }] });
        }
      }
      // Ensure history ends on a model turn so appending current user turn stays strictly alternating
      while (historyContents.length > 0 && historyContents[historyContents.length - 1].role === 'user') {
        historyContents.pop();
      }

      const currentUserParts: Array<
        { text: string } | { inlineData: { mimeType: string; data: string } }
      > = [];

      const hasImage = Boolean(imageData);
      if (imageData) {
        const pureBase64 = imageData.includes(',') ? imageData.split(',').pop() || '' : imageData;
        currentUserParts.push({
          inlineData: {
            mimeType: imageMimeType === 'image/jpg' ? 'image/jpeg' : imageMimeType,
            data: pureBase64,
          },
        });
      }

      const finalUserText = hasImage
        ? `${effectiveMessage.slice(0, 3600)}\n\n(Hãy quan sát kỹ hình ảnh đính kèm, mô tả rõ dấu hiệu thấy được trên lá/cây/sâu bệnh trong ảnh, chẩn đoán nguyên nhân khả nghi nhất và đưa ra hướng dẫn xử lý thực tế từng bước cho bà con nông dân.)`
        : effectiveMessage.slice(0, 4000);
      currentUserParts.push({ text: finalUserText });

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });

      const contents = [...historyContents, { role: 'user' as const, parts: currentUserParts }];

      // Resilient candidate chain: if primary model experiences transient 503 high demand / overload,
      // seamlessly fall over to our secondary multimodal Gemini model so photo diagnosis never fails!
      const candidateModels: Array<{
        model: string;
        thinkingLevel: ThinkingLevel;
        tier: AiRoutingTier;
        label: string;
        delayBeforeMs?: number;
      }> =
        route.model === 'gemini-4-hydrogen'
          ? [
              {
                model: 'gemini-4-hydrogen',
                thinkingLevel: route.thinkingLevel,
                tier: 'smart',
                label: route.label,
              },
              {
                model: 'gemini-3.1-flash-lite',
                thinkingLevel: hasImage ? ThinkingLevel.MEDIUM : ThinkingLevel.LOW,
                tier: 'smart',
                label: hasImage ? 'AI Chuyên sâu • Chẩn đoán ảnh' : 'AI Chuyên sâu',
                delayBeforeMs: 200,
              },
            ]
          : [
              {
                model: 'gemini-3.1-flash-lite',
                thinkingLevel: route.thinkingLevel,
                tier: 'fast',
                label: route.label,
              },
              {
                model: 'gemini-4-hydrogen',
                thinkingLevel: ThinkingLevel.LOW,
                tier: 'smart',
                label: hasImage ? 'AI Chuyên sâu • Chẩn đoán ảnh' : 'AI Chuyên sâu',
                delayBeforeMs: 200,
              },
            ];

      const isRetryableError = (err: unknown): boolean => {
        const e = err as { status?: number; message?: string };
        const st = typeof e?.status === 'number' ? e.status : 0;
        const msg = e?.message || '';
        return (
          st === 503 ||
          st === 500 ||
          st === 504 ||
          st === 429 ||
          /503|unavailable|high demand|overloaded|deadline|temporarily|resource_exhausted/i.test(msg)
        );
      };

      const raceWithAttemptTimeout = <T,>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
        return new Promise<T>((resolve, reject) => {
          const timer = setTimeout(() => {
            const err = new Error('Primary model timeout (503 high demand)') as Error & { status?: number };
            err.status = 503;
            reject(err);
          }, timeoutMs);
          promise
            .then((val) => {
              clearTimeout(timer);
              resolve(val);
            })
            .catch((err) => {
              clearTimeout(timer);
              reject(err);
            });
        });
      };

      let lastErr: unknown = null;

      if (wantsStream) {
        let streamedAnyChunk = false;

        for (let i = 0; i < candidateModels.length; i++) {
          const candidate = candidateModels[i];
          const hasFallback = i < candidateModels.length - 1;
          if (candidate.delayBeforeMs) {
            await new Promise((r) => setTimeout(r, candidate.delayBeforeMs));
          }

          try {
            const streamPromise = ai.models.generateContentStream({
              model: candidate.model,
              contents,
              config: {
                systemInstruction: fullSystemInstruction,
                thinkingConfig: {
                  thinkingLevel: candidate.thinkingLevel,
                },
              },
            });

            // If primary model stalls for > 9s under high demand and we have a fallback, fail over quickly
            const stream = hasFallback
              ? await raceWithAttemptTimeout(streamPromise, 9000)
              : await streamPromise;

            const iterator = stream[Symbol.asyncIterator]();
            const firstNext = hasFallback
              ? await raceWithAttemptTimeout(iterator.next(), 9000)
              : await iterator.next();

            let fullText = '';
            let current = firstNext;
            while (!current.done) {
              const piece = current.value?.text;
              if (piece) {
                streamedAnyChunk = true;
                fullText += piece;
                res.write(`data: ${JSON.stringify({ type: 'chunk', text: piece })}\n\n`);
              }
              current = await iterator.next();
            }

            if (!fullText.trim()) {
              throw new Error('Empty model response');
            }

            res.write(
              `data: ${JSON.stringify({
                type: 'done',
                timestamp: new Date().toISOString(),
                tier: candidate.tier,
                tierLabel: candidate.label,
                groundedWithLiveData: Boolean(liveContext),
              })}\n\n`
            );
            res.end();
            return;
          } catch (attemptErr) {
            lastErr = attemptErr;
            console.warn(
              `[API /api/ai/chat] Attempt ${i + 1} (${candidate.model}) failed:`,
              (attemptErr as Error)?.message?.slice(0, 180)
            );
            if (streamedAnyChunk || !isRetryableError(attemptErr)) {
              break;
            }
          }
        }

        throw lastErr || new Error('Không thể nhận phản hồi từ AI.');
      }

      for (let i = 0; i < candidateModels.length; i++) {
        const candidate = candidateModels[i];
        const hasFallback = i < candidateModels.length - 1;
        if (candidate.delayBeforeMs) {
          await new Promise((r) => setTimeout(r, candidate.delayBeforeMs));
        }

        try {
          const respPromise = ai.models.generateContent({
            model: candidate.model,
            contents,
            config: {
              systemInstruction: fullSystemInstruction,
              thinkingConfig: {
                thinkingLevel: candidate.thinkingLevel,
              },
            },
          });

          const response = hasFallback
            ? await raceWithAttemptTimeout(respPromise, 12000)
            : await respPromise;

          const replyText = response.text?.trim();
          if (!replyText) {
            throw new Error('Empty model response');
          }

          res.setHeader('Cache-Control', 'no-store');
          res.json({
            reply: replyText,
            timestamp: new Date().toISOString(),
            tier: candidate.tier,
            tierLabel: candidate.label,
            groundedWithLiveData: Boolean(liveContext),
          });
          return;
        } catch (attemptErr) {
          lastErr = attemptErr;
          console.warn(
            `[API /api/ai/chat] Attempt ${i + 1} (${candidate.model}) failed:`,
            (attemptErr as Error)?.message?.slice(0, 180)
          );
          if (!isRetryableError(attemptErr)) {
            break;
          }
        }
      }

      throw lastErr || new Error('Không thể nhận phản hồi từ AI.');
    } catch (err: unknown) {
      console.error('[API /api/ai/chat] Gemini Error:', err);
      const errObj = err as { status?: number; message?: string };
      const status = typeof errObj?.status === 'number' ? errObj.status : 500;
      const rawMsg = errObj?.message || 'Lỗi kết nối máy chủ AI.';

      if (status === 401 || status === 403 || /api key|permission|forbidden/i.test(rawMsg)) {
        sendError(
          403,
          'Khóa GEMINI_API_KEY không hợp lệ hoặc không có quyền truy cập. Vui lòng kiểm tra lại trong Settings > Secrets.',
          'INVALID_API_KEY'
        );
        return;
      }
      if (status === 429 || /quota|rate limit|resource_exhausted/i.test(rawMsg)) {
        sendError(
          429,
          'Hệ thống AI đang quá tải lượt hỏi lúc này. Bà con vui lòng đợi vài giây rồi thử lại nhé.',
          'RATE_LIMIT'
        );
        return;
      }
      if (status === 503 || /503|high demand|unavailable|overloaded/i.test(rawMsg)) {
        sendError(
          503,
          'Máy chủ AI đang có lượng truy cập rất cao trong giây lát. Bà con vui lòng nhấn gửi lại sau vài giây nhé.',
          'SERVICE_BUSY'
        );
        return;
      }

      sendError(502, 'Không thể kết nối Trợ lý AI lúc này. Bà con vui lòng thử gửi lại nhé.');
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir, { maxAge: '1h' }));
    // Backward compatibility for any legacy /src/assets/images/* URLs stored in client browsers
    app.use('/src/assets/images', express.static(path.join(distDir, 'images'), { maxAge: '1h' }));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AgriConnect server listening on http://0.0.0.0:${PORT}`);
    // Silently warm Mekong Delta news & primary province weather in background so AI replies instantly
    void Promise.allSettled([
      getAggregatedNews(false),
      fetchProvinceWeatherData('An Giang', false),
      fetchProvinceWeatherData('Cần Thơ', false),
    ]);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
