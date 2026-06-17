// Safe Storage Wrappers
const storage = {
  get: (key, fallback) => {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch (e) {
      return fallback;
    }
  },
  set: (key, val) => {
    try {
      localStorage.setItem(key, val);
    } catch (e) {}
  },
  sessionGet: (key, fallback) => {
    try {
      const val = sessionStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch (e) {
      return fallback;
    }
  },
  sessionSet: (key, val) => {
    try {
      sessionStorage.setItem(key, val);
    } catch (e) {}
  }
};

// Application State
const state = {
  language: storage.get('bekcan_lang', 'tr'),
  activeTab: 'view-schedule',
  selectedDay: '',
  selectedCategory: 'All',
  searchQuery: '',
  sessions: [],
  speakers: [],
  conference: {},
  likes: JSON.parse(storage.get('bekcan_likes', '[]')),
  dislikes: JSON.parse(storage.get('bekcan_dislikes', '[]')),
  selectedSessionId: null,
  deferredPrompt: null
};

// UI Elements
const el = {
  langToggle: document.getElementById('lang-toggle'),
  searchInput: document.getElementById('search-input'),
  daySelector: document.getElementById('day-selector'),
  categoryCarousel: document.getElementById('category-carousel'),
  scheduleList: document.getElementById('schedule-list'),
  likesList: document.getElementById('likes-list'),
  pastList: document.getElementById('past-list'),
  nowNextContainer: document.getElementById('now-next-container'),
  bottomNavItems: document.querySelectorAll('.nav-item'),
  views: document.querySelectorAll('.app-view'),
  
  // Modal Elements
  modal: document.getElementById('detail-modal'),
  modalClose: document.getElementById('modal-close'),
  modalCategory: document.getElementById('modal-category'),
  modalTitle: document.getElementById('modal-title'),
  modalTime: document.getElementById('modal-time'),
  modalRoom: document.getElementById('modal-room'),
  modalDescription: document.getElementById('modal-description'),
  modalBtnLike: document.getElementById('modal-btn-like'),
  modalBtnDislike: document.getElementById('modal-btn-dislike'),
  modalSpeakersContainer: document.getElementById('modal-speakers-container'),
  
  // Speaker Modal Elements
  speakerModal: document.getElementById('speaker-modal'),
  speakerModalClose: document.getElementById('speaker-modal-close'),
  speakerDetailName: document.getElementById('speaker-detail-name'),
  speakerDetailTitle: document.getElementById('speaker-detail-title'),
  speakerDetailInstitution: document.getElementById('speaker-detail-institution'),
  speakerDetailContact: document.getElementById('speaker-detail-contact'),
  speakerDetailBio: document.getElementById('speaker-detail-bio'),
  speakerSessionsList: document.getElementById('speaker-sessions-list'),
  
  // BEKCAN Popup
  bekcanPopup: document.getElementById('bekcan-popup'),
  bekcanPopupClose: document.getElementById('bekcan-popup-close'),
  bekcanNotifyBtn: document.getElementById('bekcan-notify-btn'),
  bekcanVisitBtn: document.getElementById('bekcan-visit-btn'),
  
  // Install Card
  installCard: document.getElementById('install-card'),
  installBtn: document.getElementById('install-btn'),
  
  // Timeline Elements
  timelineViewport: document.getElementById('timeline-viewport'),
  timelineCanvas: document.getElementById('timeline-canvas'),
  timelineNowLine: document.getElementById('timeline-now-line'),
  timelineTimeAxis: document.getElementById('timeline-time-axis'),
  timelineTracks: document.getElementById('timeline-tracks'),
  timelineTimeDisplay: document.getElementById('timeline-time-display')
};

// Language Dictionary for static text
const dictionary = {
  tr: {
    langText: 'EN',
    langFlag: '🇬🇧',
    searchPlaceholder: 'Konuşmacı, konu veya salon ara...',
    listTitle: 'Tüm Oturumlar',
    noSessions: 'Eşleşen oturum bulunamadı.',
    noLikes: 'Henüz hiçbir oturumu beğenmediniz.',
    noPast: 'Henüz geçmiş oturum yok.',
    nowLabel: 'Şu Anda',
    nextLabel: 'Sıradaki',
    timeLeft: 'kaldı',
    startsIn: 'başlıyor',
    min: 'dk',
    noActiveSession: 'Şu an aktif bir oturum yok',
    confEnded: 'Konferans sona erdi',
    speakerLabel: 'Konuşmacı',
    roomLabel: 'Salon',
    categoryAll: 'Tümü',
    likeBtn: 'Beğendim',
    dislikeBtn: 'Beğenmedim',
    howSession: 'Bu oturumu nasıl buldunuz?'
  },
  en: {
    langText: 'TR',
    langFlag: '🇹🇷',
    searchPlaceholder: 'Search speaker, topic or room...',
    listTitle: 'All Sessions',
    noSessions: 'No matching sessions found.',
    noLikes: 'You haven\'t liked any sessions yet.',
    noPast: 'No past sessions yet.',
    nowLabel: 'Now Playing',
    nextLabel: 'Next Up',
    timeLeft: 'left',
    startsIn: 'starts in',
    min: 'min',
    noActiveSession: 'No active session right now',
    confEnded: 'Conference has ended',
    speakerLabel: 'Speaker',
    roomLabel: 'Room',
    categoryAll: 'All',
    likeBtn: 'Like',
    dislikeBtn: 'Dislike',
    howSession: 'How did you find this session?'
  }
};

const categoryTranslations = {
  'Welcome': { tr: 'Karşılama', en: 'Welcome' },
  'Keynote': { tr: 'Açılış', en: 'Keynote' },
  'Break': { tr: 'Mola', en: 'Break' },
  'Web Dev': { tr: 'Web Gel.', en: 'Web Dev' },
  'Mobile': { tr: 'Mobil', en: 'Mobile' },
  'UI/UX': { tr: 'Tasarım', en: 'UI/UX' },
  'Security': { tr: 'Güvenlik', en: 'Security' },
  'Cloud': { tr: 'Bulut', en: 'Cloud' },
  'Panel': { tr: 'Panel', en: 'Panel' },
  'Data Science': { tr: 'Veri Bilimi', en: 'Data Science' },
  'DevOps': { tr: 'DevOps', en: 'DevOps' },
  'Web3': { tr: 'Web3', en: 'Web3' }
};

function getCategoryName(category, lang) {
  if (!category) return '';
  if (categoryTranslations[category]) {
    return categoryTranslations[category][lang] || category;
  }
  return category;
}

// Format local date as YYYY-MM-DD
function getLocalDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Cross-browser/Safari compatible date parser
function parseDate(dateStr) {
  const d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  
  // Fallback for Safari offsets
  const fallbackStr = dateStr.replace(/([+-]\d{2}):(\d{2})$/, ' GMT$1$2');
  const dFallback = new Date(fallbackStr);
  if (!isNaN(dFallback.getTime())) return dFallback;
  
  return new Date(); 
}

// Normalize category name for custom styling classes
function getCategoryClass(category) {
  if (!category) return 'cat-break';
  return 'cat-' + category.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

// Calculate if a session is currently happening
function isSessionNow(session, nowTime) {
  const start = parseDate(session.start);
  const end = parseDate(session.end);
  return nowTime >= start && nowTime < end;
}

// Format start/end string to HH:MM - HH:MM
function formatSessionTimeRange(startStr, endStr) {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const startHour = String(start.getHours()).padStart(2, '0');
  const startMin = String(start.getMinutes()).padStart(2, '0');
  const endHour = String(end.getHours()).padStart(2, '0');
  const endMin = String(end.getMinutes()).padStart(2, '0');
  return `${startHour}:${startMin} - ${endHour}:${endMin}`;
}

// Helper: Formats multiple speakers as plain text
function getSpeakersHtml(session) {
  if (!session.speaker_ids || session.speaker_ids.length === 0) return '';
  const names = session.speaker_ids.map(spId => {
    const sp = state.speakers.find(s => s.id === spId);
    return sp ? sp.name : '';
  }).filter(Boolean);
  
  if (names.length === 0) return '';
  return `<div class="session-speaker">${names.join(', ')}</div>`;
}
