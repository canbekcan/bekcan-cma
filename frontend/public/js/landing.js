/**
 * File: frontend/public/js/landing.js
 * Description: Controller for the main BEKCAN CMA home portal page. Renders the interactive grid of all available conferences.
 * Version: 1.1.0
 * Project: BEKCAN CMA (Conference Management App)
 */

const state = {
  language: localStorage.getItem('bekcan_lang') || 'tr',
  conferences: []
};

function applyLanguage() {
  // Toggle button indicator
  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.innerHTML = state.language === 'tr' 
      ? '<span class="lang-flag">🇬🇧</span> <span class="lang-text">EN</span>' 
      : '<span class="lang-flag">🇹🇷</span> <span class="lang-text">TR</span>';
  }

  // Update elements with data-tr and data-en
  document.querySelectorAll('[data-tr]').forEach(el => {
    el.textContent = state.language === 'tr' ? el.dataset.tr : el.dataset.en;
  });

  // Re-render the conferences to apply month translations
  renderConferences();
}

function formatDateRange(startStr, endStr, lang) {
  if (!startStr) return '';
  const monthsTr = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const months = lang === 'tr' ? monthsTr : monthsEn;

  // Split date components to avoid timezone shifting
  const startParts = startStr.split('T')[0].split('-');
  const start = new Date(startParts[0], startParts[1] - 1, startParts[2]);
  
  const startDay = start.getDate();
  const startMonth = months[start.getMonth()];
  const startYear = start.getFullYear();

  if (!endStr || startStr.split('T')[0] === endStr.split('T')[0]) {
    return `${startDay} ${startMonth} ${startYear}`;
  }

  const endParts = endStr.split('T')[0].split('-');
  const end = new Date(endParts[0], endParts[1] - 1, endParts[2]);

  const endDay = end.getDate();
  const endMonth = months[end.getMonth()];
  const endYear = end.getFullYear();

  if (start.getMonth() === end.getMonth() && startYear === endYear) {
    return `${startDay} - ${endDay} ${startMonth} ${startYear}`;
  } else if (startYear === endYear) {
    return `${startDay} ${startMonth} - ${endDay} ${endMonth} ${startYear}`;
  } else {
    return `${startDay} ${startMonth} ${startYear} - ${endDay} ${endMonth} ${endYear}`;
  }
}

async function fetchConferences() {
  try {
    const response = await fetch('/api/conferences');
    if (!response.ok) throw new Error('Failed to fetch conferences');
    state.conferences = await response.json();
    renderConferences();
  } catch (err) {
    console.error(err);
    document.getElementById('conferences-list').innerHTML = `
      <div class="empty-state" style="padding: 24px 12px; text-align: center; color: var(--text-muted);">
        <p>
          ${state.language === 'tr' 
            ? 'Konferans listesi yüklenemedi. Lütfen internet bağlantınızı kontrol edin.' 
            : 'Failed to load conferences. Please check your internet connection.'}
        </p>
      </div>
    `;
  }
}

function renderConferences() {
  const container = document.getElementById('conferences-list');
  if (!container) return;

  if (state.conferences.length === 0) {
    container.innerHTML = `
      <div class="empty-state" style="padding: 24px 12px; text-align: center; color: var(--text-muted);">
        <p>
          ${state.language === 'tr' ? 'Henüz eklenmiş bir konferans bulunmuyor.' : 'No conferences found.'}
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = state.conferences.map(conf => {
    const dateRange = formatDateRange(conf.start_date, conf.end_date, state.language);
    const venue = conf.venue_info || '';

    return `
      <a href="/${conf.slug}" class="conf-card">
        <div class="conf-name">${conf.name}</div>
        <div class="conf-meta-row">
          <div class="conf-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="conf-meta-icon"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            <span>${dateRange}</span>
          </div>
          ${venue ? `
          <div class="conf-meta-item">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="conf-meta-icon"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
            <span style="display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; max-width: 150px;">${venue}</span>
          </div>
          ` : ''}
        </div>
        <div class="conf-enter-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 18px; height: 18px;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </div>
      </a>
    `;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  applyLanguage();
  fetchConferences();

  const langToggle = document.getElementById('lang-toggle');
  if (langToggle) {
    langToggle.addEventListener('click', () => {
      state.language = state.language === 'tr' ? 'en' : 'tr';
      localStorage.setItem('bekcan_lang', state.language);
      applyLanguage();
    });
  }
});
