// Fallback Embedded Schedule Data for Offline/Local file:// usage
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

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
      .catch((err) => console.error('Service Worker registration failed:', err));
  });
}

// Handle PWA Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  state.deferredPrompt = e;
  if (el.installCard) {
    el.installCard.style.display = 'flex';
  }
});

// Initialize Application
async function init() {
  if (!storage.get('device_id')) {
    storage.set('device_id', crypto.randomUUID());
  }

  bindEvents();
  applyLanguage(state.language);
  await fetchSchedule();
  
  // Set default day
  const todayStr = getLocalDateString(new Date());
  if (state.conference.dates && state.conference.dates.includes(todayStr)) {
    state.selectedDay = todayStr;
  } else if (state.conference.dates && state.conference.dates.length > 0) {
    state.selectedDay = state.conference.dates[0];
  }
  
  // Ensure only the default schedule view and nav button are active on startup
  state.activeTab = 'view-schedule';
  if (el.bottomNavItems) {
    el.bottomNavItems.forEach(n => {
      if (n.dataset.target === 'view-schedule') n.classList.add('active');
      else n.classList.remove('active');
    });
  }
  if (el.views) {
    el.views.forEach(view => {
      if (view.id === 'view-schedule') view.classList.add('active');
      else view.classList.remove('active');
    });
  }

  renderDaySelector();
  renderCategoryCarousel();
  updateViews();
  startClockTick();
  
  // Show BEKCAN pop-up branding overlay on startup once per session (delayed to 10 seconds)
  if (!storage.sessionGet('bekcan_popup_shown', false) && el.bekcanPopup) {
    setTimeout(() => {
      el.bekcanPopup.classList.add('active');
      storage.sessionSet('bekcan_popup_shown', 'true');
    }, 10000);
  }
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

// Bind event listeners
function bindEvents() {
  // Lang toggle
  if (el.langToggle) {
    el.langToggle.addEventListener('click', () => {
      state.language = state.language === 'tr' ? 'en' : 'tr';
      storage.set('bekcan_lang', state.language);
      applyLanguage(state.language);
      renderDaySelector();
      renderCategoryCarousel();
      updateViews();
    });
  }

  // Search input
  if (el.searchInput) {
    el.searchInput.addEventListener('input', (e) => {
      state.searchQuery = e.target.value.toLowerCase();
      renderSessionList();
    });
  }

  // Bottom Nav
  el.bottomNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const target = e.currentTarget.dataset.target;
      state.activeTab = target;
      
      el.bottomNavItems.forEach(n => n.classList.remove('active'));
      e.currentTarget.classList.add('active');
      
      el.views.forEach(view => {
        if (view.id === target) {
          view.classList.add('active');
        } else {
          view.classList.remove('active');
        }
      });

      const mainEl = document.querySelector('.app-main');
      if (mainEl) mainEl.scrollTop = 0;
      
      if (target === 'view-schedule') {
        setTimeout(renderTimeline, 50);
      }
    });
  });

  // Modal Close
  if (el.modalClose) el.modalClose.addEventListener('click', closeModal);
  if (el.modal) {
    el.modal.addEventListener('click', (e) => {
      if (e.target === el.modal) closeModal();
    });
  }

  // Speaker Modal Close
  if (el.speakerModalClose) el.speakerModalClose.addEventListener('click', closeSpeakerModal);
  if (el.speakerModal) {
    el.speakerModal.addEventListener('click', (e) => {
      if (e.target === el.speakerModal) closeSpeakerModal();
    });
  }

  // Modal Votes
  if (el.modalBtnLike) {
    el.modalBtnLike.addEventListener('click', () => {
      if (state.selectedSessionId) toggleLike(state.selectedSessionId);
    });
  }
  if (el.modalBtnDislike) {
    el.modalBtnDislike.addEventListener('click', () => {
      if (state.selectedSessionId) toggleDislike(state.selectedSessionId);
    });
  }

  // BEKCAN Popup actions
  if (el.bekcanPopupClose) {
    el.bekcanPopupClose.addEventListener('click', () => el.bekcanPopup.classList.remove('active'));
  }
  if (el.bekcanPopup) {
    el.bekcanPopup.addEventListener('click', (e) => {
      if (e.target === el.bekcanPopup) el.bekcanPopup.classList.remove('active');
    });
  }
  if (el.bekcanNotifyBtn) {
    el.bekcanNotifyBtn.addEventListener('click', requestNotificationPermission);
  }
  if (el.bekcanVisitBtn) {
    el.bekcanVisitBtn.addEventListener('click', () => {
      window.open('https://bekcan.com', '_blank');
    });
  }

  // Install app button
  if (el.installBtn) {
    el.installBtn.addEventListener('click', async () => {
      if (!state.deferredPrompt) return;
      state.deferredPrompt.prompt();
      const { outcome } = await state.deferredPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      state.deferredPrompt = null;
      if (el.installCard) el.installCard.style.display = 'none';
    });
  }

  // Info Tab BEKCAN Logo click
  const infoBekcanLogo = document.getElementById('info-bekcan-logo');
  if (infoBekcanLogo && el.bekcanPopup) {
    infoBekcanLogo.addEventListener('click', () => {
      el.bekcanPopup.classList.add('active');
    });
  }

  // Registration Form
  const regForm = document.getElementById('registration-form');
  if (regForm) {
    // Populate form if data exists
    const savedData = storage.get('attendee_profile');
    if (savedData) {
      try {
        const p = JSON.parse(savedData);
        if (p.full_name) document.getElementById('reg-fullname').value = p.full_name;
        if (p.title) document.getElementById('reg-title').value = p.title;
        if (p.institution) document.getElementById('reg-institution').value = p.institution;
        if (p.email) document.getElementById('reg-email').value = p.email;
        if (p.phone) document.getElementById('reg-phone').value = p.phone;
      } catch (e) {}
    }

    regForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = document.getElementById('reg-submit-btn');
      const msg = document.getElementById('reg-success-msg');
      btn.disabled = true;
      btn.textContent = state.language === 'tr' ? 'Kaydediliyor...' : 'Saving...';

      const formData = {
        device_id: storage.get('device_id'),
        full_name: document.getElementById('reg-fullname').value,
        title: document.getElementById('reg-title').value,
        institution: document.getElementById('reg-institution').value,
        email: document.getElementById('reg-email').value,
        phone: document.getElementById('reg-phone').value
      };

      try {
        const res = await fetch(`/api/conferences/${window.location.pathname.split('/')[1] || 'bekcan2026'}/attendee`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (res.ok) {
          storage.set('attendee_profile', JSON.stringify(formData));
          msg.style.display = 'block';
          msg.style.color = '#16a34a';
          msg.textContent = state.language === 'tr' ? 'Bilgileriniz başarıyla kaydedildi!' : 'Your details have been saved successfully!';
          setTimeout(() => msg.style.display = 'none', 3000);
        } else {
          throw new Error('Server returned ' + res.status);
        }
      } catch (err) {
        msg.style.display = 'block';
        msg.style.color = '#dc2626';
        msg.textContent = state.language === 'tr' ? 'Bağlantı hatası: Sunucuya ulaşılamadı.' : 'Connection error: Cannot reach server.';
        console.error('Registration failed:', err);
      } finally {
        btn.disabled = false;
        btn.textContent = state.language === 'tr' ? 'Kaydet' : 'Save';
      }
    });
  }
}

// Request permission and send local browser notifications
function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert(state.language === 'tr' ? "Tarayıcınız bildirim desteği sunmuyor." : "Your browser does not support notifications.");
    return;
  }
  
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      new Notification("BEKCAN CMA", {
        body: state.language === 'tr' ? "Bildirimler başarıyla etkinleştirildi! Powered by BEKCAN." : "Notifications enabled successfully! Powered by BEKCAN.",
        icon: "./icon.png"
      });
      setTimeout(() => {
        if (el.bekcanPopup) el.bekcanPopup.classList.remove('active');
      }, 600);
    } else {
      alert(state.language === 'tr' ? "Bildirim izinleri reddedildi. Lütfen tarayıcı ayarlarından bildirimlere izin verin." : "Notification permissions denied. Please enable notifications in your browser settings.");
    }
  });
}

// Apply translated text labels to the DOM
function applyLanguage(lang) {
  let dict = dictionary[lang];
  if (!dict) {
    lang = 'tr';
    state.language = 'tr';
    dict = dictionary.tr;
  }
  
  document.documentElement.lang = lang;
  
  if (el.langToggle) {
    const txtNode = el.langToggle.querySelector('.lang-text');
    const flagNode = el.langToggle.querySelector('.lang-flag');
    if (txtNode) txtNode.textContent = dict.langText;
    if (flagNode) flagNode.textContent = dict.langFlag;
  }
  if (el.searchInput) {
    el.searchInput.placeholder = dict.searchPlaceholder;
  }
  
  document.querySelectorAll('[data-tr]').forEach(element => {
    element.textContent = state.language === 'tr' ? element.dataset.tr : element.dataset.en;
  });
  
  document.querySelectorAll('[data-tr-placeholder]').forEach(element => {
    element.placeholder = state.language === 'tr' ? element.dataset.trPlaceholder : element.dataset.enPlaceholder;
  });
}

// Fetch and load schedule (with file:// local fallback)
async function fetchSchedule() {
  const pathParts = window.location.pathname.split('/');
  const slug = pathParts[1] || 'bekcan2026';
  try {
    const response = await fetch(`/api/conferences/${slug}/schedule`);
    if (!response.ok) throw new Error('Failed to fetch schedule');
    const data = await response.json();
    state.sessions = data.sessions;
    state.speakers = data.speakers || [];
    state.conference = data.conference;
  } catch (error) {
    console.error('API Error:', error);
    alert("Konferans bilgileri yüklenemedi. Lütfen URL'i kontrol edin.");
  }
}

// Tick every 30s to update Now/Next widget & timeline
function startClockTick() {
  updateNowNextWidget();
  renderTimeline();
  setInterval(() => {
    updateNowNextWidget();
    renderSessionList();
    renderPastList();
    renderTimeline();
  }, 30000);
}

// Render dynamic day selectors (Safe for Safari)
function renderDaySelector() {
  if (!el.daySelector) return;
  el.daySelector.innerHTML = '';
  if (!state.conference.dates) return;
  
  state.conference.dates.forEach(dateStr => {
    const btn = document.createElement('button');
    btn.className = `day-btn ${state.selectedDay === dateStr ? 'active' : ''}`;
    
    const parts = dateStr.split('-');
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const options = { day: 'numeric', month: 'long' };
    const locale = state.language === 'tr' ? 'tr-TR' : 'en-US';
    btn.textContent = dateObj.toLocaleDateString(locale, options);
    
    btn.addEventListener('click', () => {
      state.selectedDay = dateStr;
      document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateViews();
    });
    
    el.daySelector.appendChild(btn);
  });
}

// Render dynamic category chips
function renderCategoryCarousel() {
  if (!el.categoryCarousel) return;
  el.categoryCarousel.innerHTML = '';
  const dict = dictionary[state.language] || dictionary.tr;
  
  const categories = [dict.categoryAll, ...new Set(state.sessions.map(s => s.category).filter(Boolean))];
  
  categories.forEach(cat => {
    const chip = document.createElement('div');
    const isAll = cat === dict.categoryAll;
    const isSelected = (isAll && state.selectedCategory === 'All') || (state.selectedCategory === cat);
    
    chip.className = `category-tag ${isSelected ? 'active' : ''}`;
    chip.textContent = isAll ? dict.categoryAll : getCategoryName(cat, state.language);
    
    chip.addEventListener('click', () => {
      state.selectedCategory = isAll ? 'All' : cat;
      document.querySelectorAll('.category-tag').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderSessionList();
    });
    
    el.categoryCarousel.appendChild(chip);
  });
}

// Update views containing session lists
function updateViews() {
  renderSessionList();
  renderPastList();
  renderLikesList();
  updateNowNextWidget();
  renderTimeline();
}

// Render primary schedule list based on search/day/category filters
function renderSessionList() {
  if (!el.scheduleList) return;
  el.scheduleList.innerHTML = '';
  
  const filtered = state.sessions.filter(session => {
    const sessionDate = getLocalDateString(parseDate(session.start));
    if (sessionDate !== state.selectedDay) return false;
    
    if (state.selectedCategory !== 'All' && session.category !== state.selectedCategory) return false;
    
    if (state.searchQuery) {
      let speakerNamesStr = '';
      if (session.speaker_ids && session.speaker_ids.length > 0) {
        speakerNamesStr = session.speaker_ids.map(spId => {
          const sp = state.speakers.find(s => s.id === spId);
          return sp ? sp.name : '';
        }).join(' ');
      }
      
      const title = (state.language === 'tr' ? session.title_tr : session.title_en).toLowerCase();
      const speakers = speakerNamesStr.toLowerCase();
      const room = session.room.toLowerCase();
      if (!title.includes(state.searchQuery) && 
          !speakers.includes(state.searchQuery) && 
          !room.includes(state.searchQuery)) {
        return false;
      }
    }
    return true;
  });
  
  const dict = dictionary[state.language] || dictionary.tr;
  if (filtered.length === 0) {
    el.scheduleList.innerHTML = `<div class="empty-state">
      <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
      <p>${dict.noSessions}</p>
    </div>`;
    return;
  }
  
  filtered.sort((a, b) => parseDate(a.start) - parseDate(b.start));
  const now = new Date();
  
  filtered.forEach(session => {
    const card = createSessionCard(session, now);
    el.scheduleList.appendChild(card);
  });
}

// Render completed sessions tab list
function renderPastList() {
  if (!el.pastList) return;
  el.pastList.innerHTML = '';
  const now = new Date();
  
  const pastSessions = state.sessions.filter(s => parseDate(s.end) < now);
  const dict = dictionary[state.language] || dictionary.tr;
  
  if (pastSessions.length === 0) {
    el.pastList.innerHTML = `<div class="empty-state">
      <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <p>${dict.noPast}</p>
    </div>`;
    return;
  }
  
  pastSessions.sort((a, b) => parseDate(a.start) - parseDate(b.start));
  
  pastSessions.forEach(session => {
    const card = createSessionCard(session, now);
    el.pastList.appendChild(card);
  });
}

// Render liked sessions tab list
function renderLikesList() {
  if (!el.likesList) return;
  el.likesList.innerHTML = '';
  
  const liked = state.sessions.filter(s => state.likes.includes(s.id));
  const dict = dictionary[state.language] || dictionary.tr;
  
  if (liked.length === 0) {
    el.likesList.innerHTML = `<div class="empty-state">
      <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
      <p>${dict.noLikes}</p>
    </div>`;
    return;
  }
  
  liked.sort((a, b) => parseDate(a.start) - parseDate(b.start));
  const now = new Date();
  
  liked.forEach(session => {
    const card = createSessionCard(session, now);
    el.likesList.appendChild(card);
  });
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

// Helper: Create a single Session HTML Card
function createSessionCard(session, nowTime) {
  const card = document.createElement('div');
  const isNow = isSessionNow(session, nowTime);
  card.className = `session-card ${getCategoryClass(session.category)} ${isNow ? 'now-playing' : ''}`;
  card.dataset.id = session.id;
  
  const title = state.language === 'tr' ? session.title_tr : session.title_en;
  const speakersHtml = getSpeakersHtml(session);
  const timeStr = formatSessionTimeRange(session.start, session.end);
  const isLiked = state.likes.includes(session.id);
  const isDisliked = state.dislikes.includes(session.id);
  const isBreak = session.category === 'Break' || session.category === 'Welcome';
  
  card.innerHTML = `
    <div class="session-header">
      <div class="session-time-block">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <span>${timeStr}</span>
      </div>
      ${session.category ? `<span class="session-category">${getCategoryName(session.category, state.language)}</span>` : ''}
    </div>
    
    <div class="session-title">${title}</div>
    ${speakersHtml}
    
    <div class="session-footer">
      <div class="session-room">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        <span>${session.room}</span>
      </div>
      
      <div class="voting-container" style="${isBreak ? 'display: none;' : ''}">
        <button class="vote-btn-sm like ${isLiked ? 'active' : ''}" data-id="${session.id}" aria-label="Like">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
        </button>
        <button class="vote-btn-sm dislike ${isDisliked ? 'active' : ''}" data-id="${session.id}" aria-label="Dislike">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
        </button>
      </div>
    </div>
  `;
  
  card.addEventListener('click', () => openModal(session.id));
  
  const votingContainer = card.querySelector('.voting-container');
  if (votingContainer) {
    votingContainer.addEventListener('click', (e) => e.stopPropagation());
  }
  
  const likeBtn = card.querySelector('.vote-btn-sm.like');
  const dislikeBtn = card.querySelector('.vote-btn-sm.dislike');
  if (likeBtn) likeBtn.addEventListener('click', () => toggleLike(session.id));
  if (dislikeBtn) dislikeBtn.addEventListener('click', () => toggleDislike(session.id));
  
  return card;
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

// Calculate and render Now & Next Widget (Supports multiple parallel sessions)
function updateNowNextWidget() {
  if (!el.nowNextContainer) return;
  const now = new Date();
  const dict = dictionary[state.language] || dictionary.tr;
  
  const currentSessions = state.sessions.filter(s => isSessionNow(s, now));
  
  const futureSessions = state.sessions
    .filter(s => parseDate(s.start) > now)
    .sort((a, b) => parseDate(a.start) - parseDate(b.start));
    
  let nextSessions = [];
  if (futureSessions.length > 0) {
    const nextStartTime = parseDate(futureSessions[0].start).getTime();
    nextSessions = futureSessions.filter(s => parseDate(s.start).getTime() === nextStartTime);
  }
  
  if (currentSessions.length === 0 && nextSessions.length === 0) {
    el.nowNextContainer.innerHTML = `
      <div class="empty-widget">
        <p>${dict.confEnded} 🏁</p>
      </div>
    `;
    return;
  }
  
  let nowHtml = '';
  if (currentSessions.length > 0) {
    nowHtml = currentSessions.map(session => {
      const title = state.language === 'tr' ? session.title_tr : session.title_en;
      const speakersHtml = getSpeakersHtml(session);
      const timeRange = formatSessionTimeRange(session.start, session.end);
      const end = parseDate(session.end);
      const minLeft = Math.round((end - now) / 60000);
      
      const isLiked = state.likes.includes(session.id);
      const isDisliked = state.dislikes.includes(session.id);
      const isBreak = session.category === 'Break' || session.category === 'Welcome';
      
      return `
        <div class="widget-row now-row" data-id="${session.id}">
          <div class="widget-label">
            <span>${dict.nowLabel}</span>
            <span class="widget-time-badge">${minLeft} ${dict.min} ${dict.timeLeft}</span>
          </div>
          <div class="widget-title">${title}</div>
          ${speakersHtml}
          <div class="widget-footer">
            <div class="widget-meta">
              <span class="meta-icon-txt">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>${timeRange}</span>
              </span>
              <span class="meta-icon-txt">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>${session.room}</span>
              </span>
            </div>
            <div class="voting-container" style="${isBreak ? 'display: none;' : ''}">
              <button class="vote-btn-sm like ${isLiked ? 'active' : ''}" data-id="${session.id}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
              </button>
              <button class="vote-btn-sm dislike ${isDisliked ? 'active' : ''}" data-id="${session.id}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    nowHtml = `
      <div class="widget-row now-row empty-now">
        <div class="widget-label" style="color: var(--text-subtle);">${dict.nowLabel}</div>
        <div class="widget-title" style="color: var(--text-muted); font-size:0.85rem; font-weight: normal;">
          ${dict.noActiveSession}
        </div>
      </div>
    `;
  }
  
  let nextHtml = '';
  if (nextSessions.length > 0) {
    nextHtml = nextSessions.map(session => {
      const title = state.language === 'tr' ? session.title_tr : session.title_en;
      const speakersHtml = getSpeakersHtml(session);
      const timeRange = formatSessionTimeRange(session.start, session.end);
      
      const start = parseDate(session.start);
      const minToStart = Math.round((start - now) / 60000);
      
      let countdownText = '';
      if (minToStart < 60) {
        countdownText = `${minToStart} ${dict.min} ${dict.startsIn}`;
      } else {
        const hours = Math.floor(minToStart / 60);
        countdownText = `${hours}h ${minToStart % 60}m ${dict.startsIn}`;
      }
      
      const isLiked = state.likes.includes(session.id);
      const isDisliked = state.dislikes.includes(session.id);
      const isBreak = session.category === 'Break' || session.category === 'Welcome';
      
      return `
        <div class="widget-row next-row" data-id="${session.id}">
          <div class="widget-label">
            <span>${dict.nextLabel}</span>
            <span class="widget-time-badge">${countdownText}</span>
          </div>
          <div class="widget-title">${title}</div>
          ${speakersHtml}
          <div class="widget-footer">
            <div class="widget-meta">
              <span class="meta-icon-txt">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>${timeRange}</span>
              </span>
              <span class="meta-icon-txt">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>${session.room}</span>
              </span>
            </div>
            <div class="voting-container" style="${isBreak ? 'display: none;' : ''}">
              <button class="vote-btn-sm like ${isLiked ? 'active' : ''}" data-id="${session.id}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
              </button>
              <button class="vote-btn-sm dislike ${isDisliked ? 'active' : ''}" data-id="${session.id}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  el.nowNextContainer.innerHTML = `
    <div class="now-next-card">
      ${nowHtml}
      ${nextHtml}
    </div>
  `;
  
  el.nowNextContainer.querySelectorAll('.widget-row').forEach(row => {
    const id = row.dataset.id;
    if (id) {
      row.addEventListener('click', () => openModal(id));
      
      const votingContainer = row.querySelector('.voting-container');
      if (votingContainer) {
        votingContainer.addEventListener('click', (e) => e.stopPropagation());
      }
      
      const likeBtn = row.querySelector('.vote-btn-sm.like');
      const dislikeBtn = row.querySelector('.vote-btn-sm.dislike');
      if (likeBtn) likeBtn.addEventListener('click', () => toggleLike(id));
      if (dislikeBtn) dislikeBtn.addEventListener('click', () => toggleDislike(id));
    }
  });
}

// Render dynamic horizontal schedule timeline
function renderTimeline() {
  if (!el.timelineCanvas) return;
  
  const sessionsOfDay = state.sessions.filter(session => {
    const sessionDate = getLocalDateString(parseDate(session.start));
    return sessionDate === state.selectedDay;
  });
  
  if (sessionsOfDay.length === 0) {
    el.timelineCanvas.style.display = 'none';
    return;
  }
  el.timelineCanvas.style.display = 'block';
  
  sessionsOfDay.sort((a, b) => parseDate(a.start) - parseDate(b.start));
  
  const timestamps = [];
  sessionsOfDay.forEach(s => {
    timestamps.push(parseDate(s.start).getTime());
    timestamps.push(parseDate(s.end).getTime());
  });
  const minMs = Math.min(...timestamps);
  const maxMs = Math.max(...timestamps);
  
  const dayStart = parseDate(new Date(minMs));
  dayStart.setMinutes(0, 0, 0);
  
  const dayEnd = parseDate(new Date(maxMs));
  dayEnd.setMinutes(0, 0, 0);
  dayEnd.setHours(dayEnd.getHours() + 1);
  
  const totalMinutes = (dayEnd - dayStart) / 60000;
  const scale = 2.5; 
  const canvasWidth = totalMinutes * scale;
  
  el.timelineCanvas.style.width = `${canvasWidth}px`;
  
  // 1. Draw Time Axis
  el.timelineTimeAxis.innerHTML = '';
  const currentHourObj = new Date(dayStart);
  while (currentHourObj <= dayEnd) {
    const offsetMin = (currentHourObj - dayStart) / 60000;
    const leftPx = offsetMin * scale;
    
    const tick = document.createElement('div');
    tick.className = 'timeline-time-label';
    tick.style.left = `${leftPx}px`;
    tick.textContent = currentHourObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    
    el.timelineTimeAxis.appendChild(tick);
    
    currentHourObj.setMinutes(currentHourObj.getMinutes() + 30);
  }
  
  // 2. Greedy coloring distribution
  const rows = [];
  sessionsOfDay.forEach(session => {
    const start = parseDate(session.start).getTime();
    let placed = false;
    for (let i = 0; i < rows.length; i++) {
      const lastSessionInRow = rows[i][rows[i].length - 1];
      const lastEnd = parseDate(lastSessionInRow.end).getTime();
      if (start >= lastEnd) {
        rows[i].push(session);
        placed = true;
        break;
      }
    }
    if (!placed) {
      rows.push([session]);
    }
  });
  
  const canvasHeight = 24 + rows.length * 44;
  el.timelineCanvas.style.height = `${canvasHeight}px`;
  
  // 3. Render tracks & blocks
  el.timelineTracks.innerHTML = '';
  const now = new Date();
  
  rows.forEach((rowSessions, rowIndex) => {
    const trackRow = document.createElement('div');
    trackRow.className = 'timeline-track-row';
    trackRow.style.height = '36px';
    
    rowSessions.forEach(session => {
      const sessionStart = parseDate(session.start);
      const sessionEnd = parseDate(session.end);
      const left = ((sessionStart - dayStart) / 60000) * scale;
      const width = ((sessionEnd - sessionStart) / 60000) * scale;
      
      const block = document.createElement('div');
      const isNow = isSessionNow(session, now);
      const isBreak = session.category === 'Break' || session.category === 'Welcome';
      
      block.className = `timeline-block ${getCategoryClass(session.category)} ${isNow ? 'active-session' : ''} ${isBreak ? 'break-session' : ''}`;
      block.style.left = `${left}px`;
      block.style.width = `${width - 2}px`;
      
      const title = state.language === 'tr' ? session.title_tr : session.title_en;
      const timeRangeStr = sessionStart.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + sessionEnd.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      
      block.innerHTML = `
        <div class="timeline-block-title">${title}</div>
        <div class="timeline-block-time">${timeRangeStr} (${session.room})</div>
      `;
      
      block.addEventListener('click', () => openModal(session.id));
      trackRow.appendChild(block);
    });
    
    el.timelineTracks.appendChild(trackRow);
  });
  
  updateTimelineNowLine(dayStart, dayEnd, scale);
}

// Update the vertical Now Line and header digital clock
function updateTimelineNowLine(dayStart, dayEnd, scale) {
  const now = new Date();
  
  if (el.timelineTimeDisplay) {
    el.timelineTimeDisplay.textContent = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  
  if (now >= dayStart && now <= dayEnd) {
    el.timelineNowLine.style.display = 'block';
    const offsetMin = (now - dayStart) / 60000;
    const leftPx = offsetMin * scale;
    el.timelineNowLine.style.left = `${leftPx}px`;
    
    const viewportWidth = el.timelineViewport.clientWidth;
    const scrollTarget = leftPx - (viewportWidth / 2);
    el.timelineViewport.scrollTo({ left: scrollTarget, behavior: 'smooth' });
  } else {
    el.timelineNowLine.style.display = 'none';
    const todayStr = getLocalDateString(now);
    if (todayStr === state.selectedDay) {
      if (now < dayStart) {
        el.timelineViewport.scrollLeft = 0;
      } else {
        el.timelineViewport.scrollLeft = el.timelineCanvas.clientWidth;
      }
    }
  }
}

// Handle details Modal visibility and content
function openModal(id) {
  state.selectedSessionId = id;
  const session = state.sessions.find(s => s.id === id);
  if (!session) return;
  
  const modalCategory = document.getElementById('modal-category');
  const modalTitle = document.getElementById('modal-title');
  const modalTime = document.getElementById('modal-time');
  const modalRoom = document.getElementById('modal-room');
  const modalDescription = document.getElementById('modal-description');
  const modalEl = document.getElementById('detail-modal');
  
  if (modalCategory) modalCategory.textContent = getCategoryName(session.category, state.language);
  if (modalTitle) modalTitle.textContent = state.language === 'tr' ? session.title_tr : session.title_en;
  if (modalTime) modalTime.textContent = formatSessionTimeRange(session.start, session.end);
  if (modalRoom) modalRoom.textContent = session.room;
  if (modalDescription) modalDescription.textContent = state.language === 'tr' ? session.description_tr : session.description_en;
  
  const isBreak = session.category === 'Break' || session.category === 'Welcome';
  
  // Set multiple speakers profile cards in detail modal
  const modalSpeakersContainer = document.getElementById('modal-speakers-container');
  if (modalSpeakersContainer) {
    modalSpeakersContainer.innerHTML = '';
    
    if (!isBreak && session.speaker_ids && session.speaker_ids.length > 0) {
      modalSpeakersContainer.style.display = 'flex';
      
      session.speaker_ids.forEach(spId => {
        const speaker = state.speakers.find(s => s.id === spId);
        if (speaker) {
          const spCard = document.createElement('div');
          spCard.className = 'modal-speaker-card';
          
          spCard.innerHTML = `
            <div class="speaker-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <div class="speaker-info">
              <h4>${speaker.name}</h4>
              <p class="speaker-title">${state.language === 'tr' ? speaker.title_tr : speaker.title_en}</p>
              ${(state.language === 'tr' ? speaker.institution_tr : speaker.institution_en) ? `<p class="speaker-institution" style="font-size: 0.72rem; color: var(--text-subtle); margin-top: 1px;">${state.language === 'tr' ? speaker.institution_tr : speaker.institution_en}</p>` : ''}
            </div>
          `;
          
          spCard.addEventListener('click', () => {
            closeModal();
            openSpeakerModal(speaker.id);
          });
          
          modalSpeakersContainer.appendChild(spCard);
        }
      });
    } else {
      modalSpeakersContainer.style.display = 'none';
    }
  }
  
  // Hide vote options for break/welcome events
  const modalActions = document.querySelector('.modal-actions-section');
  if (modalActions) {
    modalActions.style.display = isBreak ? 'none' : 'block';
  }
  
  updateModalVoteButtons(id);
  if (modalEl) modalEl.classList.add('active');
}

// Close session details modal
function closeModal() {
  const modalEl = document.getElementById('detail-modal');
  if (modalEl) modalEl.classList.remove('active');
  state.selectedSessionId = null;
}

// Handle Speaker details Modal content and show it
function openSpeakerModal(speakerId) {
  const speaker = state.speakers.find(s => s.id === speakerId);
  if (!speaker) return;
  
  const speakerDetailName = document.getElementById('speaker-detail-name');
  const speakerDetailTitle = document.getElementById('speaker-detail-title');
  const speakerDetailInstitution = document.getElementById('speaker-detail-institution');
  const speakerDetailContact = document.getElementById('speaker-detail-contact');
  const speakerDetailBio = document.getElementById('speaker-detail-bio');
  const speakerSessionsList = document.getElementById('speaker-sessions-list');
  const speakerModalEl = document.getElementById('speaker-modal');
  
  if (speakerDetailName) speakerDetailName.textContent = speaker.name;
  if (speakerDetailTitle) speakerDetailTitle.textContent = state.language === 'tr' ? speaker.title_tr : speaker.title_en;
  
  // Handle Institution
  if (speakerDetailInstitution) {
    const institution = state.language === 'tr' ? speaker.institution_tr : speaker.institution_en;
    speakerDetailInstitution.textContent = institution || '';
  }
  
  // Handle Contact link
  if (speakerDetailContact) {
    if (speaker.contact) {
      speakerDetailContact.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="meta-icon" style="width:14px; height:14px; display:inline; vertical-align:middle; margin-right:4px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> <a href="mailto:${speaker.contact}">${speaker.contact}</a>`;
      speakerDetailContact.style.display = 'block';
    } else {
      speakerDetailContact.innerHTML = '';
      speakerDetailContact.style.display = 'none';
    }
  }
  
  if (speakerDetailBio) speakerDetailBio.textContent = state.language === 'tr' ? speaker.bio_tr : speaker.bio_en;
  
  if (speakerSessionsList) {
    speakerSessionsList.innerHTML = '';
    const speakerSessions = state.sessions.filter(s => s.speaker_ids && s.speaker_ids.includes(speakerId));
    const now = new Date();
    
    speakerSessions.forEach(session => {
      const card = createSessionCard(session, now);
      card.addEventListener('click', () => {
        closeSpeakerModal();
      });
      speakerSessionsList.appendChild(card);
    });
  }
  
  if (speakerModalEl) speakerModalEl.classList.add('active');
}

// Close speaker modal
function closeSpeakerModal() {
  const speakerModalEl = document.getElementById('speaker-modal');
  if (speakerModalEl) speakerModalEl.classList.remove('active');
}

// Update modal feedback buttons visual states
function updateModalVoteButtons(id) {
  const isLiked = state.likes.includes(id);
  const isDisliked = state.dislikes.includes(id);
  
  if (isLiked) {
    if (el.modalBtnLike) el.modalBtnLike.classList.add('active');
    if (el.modalBtnDislike) el.modalBtnDislike.classList.remove('active');
  } else if (isDisliked) {
    if (el.modalBtnLike) el.modalBtnLike.classList.remove('active');
    if (el.modalBtnDislike) el.modalBtnDislike.classList.add('active');
  } else {
    if (el.modalBtnLike) el.modalBtnLike.classList.remove('active');
    if (el.modalBtnDislike) el.modalBtnDislike.classList.remove('active');
  }
}

// Like functionality toggle
function toggleLike(id) {
  const index = state.likes.indexOf(id);
  
  if (index > -1) {
    state.likes.splice(index, 1);
  } else {
    state.likes.push(id);
    const dislikeIndex = state.dislikes.indexOf(id);
    if (dislikeIndex > -1) state.dislikes.splice(dislikeIndex, 1);
  }
  
  storage.set('bekcan_likes', JSON.stringify(state.likes));
  storage.set('bekcan_dislikes', JSON.stringify(state.dislikes));
  
  updateViews();
  if (state.selectedSessionId === id) {
    updateModalVoteButtons(id);
  }
}

// Dislike functionality toggle
function toggleDislike(id) {
  const index = state.dislikes.indexOf(id);
  
  if (index > -1) {
    state.dislikes.splice(index, 1);
  } else {
    state.dislikes.push(id);
    const likeIndex = state.likes.indexOf(id);
    if (likeIndex > -1) state.likes.splice(likeIndex, 1);
  }
  
  storage.set('bekcan_likes', JSON.stringify(state.likes));
  storage.set('bekcan_dislikes', JSON.stringify(state.dislikes));
  
  updateViews();
  if (state.selectedSessionId === id) {
    updateModalVoteButtons(id);
  }
}

// Bootstrap application on page load
window.addEventListener('DOMContentLoaded', init);
