/**
 * File: frontend/public/js/core/app.js
 * Description: Core controller. Handles Service Worker registrations, initialization loops, key event bindings, and network calls to the public api.
 * Version: 1.1.0
 * Project: BEKCAN CMA (Conference Management App)
 */

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
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

// Fetch and load schedule
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
    
    // Update topbar logo and abbreviation dynamically
    updateHeaderBranding();
  } catch (error) {
    console.error('API Error:', error);
    alert("Konferans bilgileri yüklenemedi. Lütfen URL'i kontrol edin.");
  }
}

// Update the topbar branding elements (logo and abbreviation name)
function updateHeaderBranding() {
  const logoImg = document.querySelector('.header-logo');
  if (logoImg) {
    logoImg.src = state.conference.logo_url || '/icon.png';
  }
  const abbrevEl = document.querySelector('.conf-year');
  if (abbrevEl) {
    abbrevEl.textContent = state.conference.abbreviation || state.conference.name || 'BEKCAN CMA';
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

// Bootstrap application on page load
window.addEventListener('DOMContentLoaded', init);
