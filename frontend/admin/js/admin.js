/**
 * File: frontend/admin/js/admin.js
 * Description: Main initializer of the admin panel. Manages global adminState on the window object, navigation tabs, back button listeners, and helper utility wrappers.
 * Version: 1.1.0
 * Project: BEKCAN CMA (Conference Management App)
 */

// Shared global admin state registered on the window object for browser compatibility
window.adminState = {
  token: localStorage.getItem('admin_token'),
  role: localStorage.getItem('admin_role'),
  currentConfId: null
};

// Escape helper to prevent HTML injection
function esc(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, function(m) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
  });
}

// Global manage conference window trigger
window.manageConf = function(id, name) {
  const manageSection = document.getElementById('manage-conf-section');
  const manageTitle = document.getElementById('manage-conf-title');
  const listWrapper = document.getElementById('conferences-table-wrapper');

  window.adminState.currentConfId = id;
  if (manageTitle) manageTitle.textContent = `Manage: ${esc(name)}`;
  if (listWrapper) listWrapper.classList.add('hidden'); // hide conferences table
  if (manageSection) manageSection.classList.remove('hidden');
  
  loadSpeakers();
  loadSessions();
};

document.addEventListener('DOMContentLoaded', () => {
  const manageSection = document.getElementById('manage-conf-section');
  const listWrapper = document.getElementById('conferences-table-wrapper');
  const backToDashboard = document.getElementById('back-to-dashboard');

  if (backToDashboard) {
    backToDashboard.addEventListener('click', () => {
      if (manageSection) manageSection.classList.add('hidden');
      if (listWrapper) listWrapper.classList.remove('hidden');
    });
  }

  // TABS LOGIC
  const tabSpeakers = document.getElementById('tab-speakers');
  const tabSessions = document.getElementById('tab-sessions');
  const viewSpeakers = document.getElementById('view-speakers');
  const viewSessions = document.getElementById('view-sessions');

  if (tabSpeakers && tabSessions && viewSpeakers && viewSessions) {
    tabSpeakers.addEventListener('click', () => {
      tabSpeakers.classList.add('active');
      tabSessions.classList.remove('active');
      viewSpeakers.classList.remove('hidden');
      viewSessions.classList.add('hidden');
    });

    tabSessions.addEventListener('click', () => {
      tabSessions.classList.add('active');
      tabSpeakers.classList.remove('active');
      viewSessions.classList.remove('hidden');
      viewSpeakers.classList.add('hidden');
    });
  }
});
