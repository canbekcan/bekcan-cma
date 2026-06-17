/**
 * File: frontend/admin/js/admin.js
 * Description: Main initializer of the admin panel. Manages global adminState, navigation tabs, back button listeners, and helper utility wrappers.
 * Version: 1.1.0
 * Project: BEKCAN CMA (Conference Management App)
 */

// Shared global admin state
const adminState = {
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
  const listWrapper = document.querySelector('.overflow-hidden');

  adminState.currentConfId = id;
  if (manageTitle) manageTitle.textContent = `Manage: ${esc(name)}`;
  if (listWrapper) listWrapper.classList.add('hidden'); // hide conferences table
  if (manageSection) manageSection.classList.remove('hidden');
  
  loadSpeakers();
  loadSessions();
};

document.addEventListener('DOMContentLoaded', () => {
  const manageSection = document.getElementById('manage-conf-section');
  const listWrapper = document.querySelector('.overflow-hidden');
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
      tabSpeakers.classList.add('border-blue-600', 'text-blue-600');
      tabSpeakers.classList.remove('border-transparent', 'text-gray-500');
      tabSessions.classList.remove('border-blue-600', 'text-blue-600');
      tabSessions.classList.add('border-transparent', 'text-gray-500');
      viewSpeakers.classList.remove('hidden');
      viewSessions.classList.add('hidden');
    });

    tabSessions.addEventListener('click', () => {
      tabSessions.classList.add('border-blue-600', 'text-blue-600');
      tabSessions.classList.remove('border-transparent', 'text-gray-500');
      tabSpeakers.classList.remove('border-blue-600', 'text-blue-600');
      tabSpeakers.classList.add('border-transparent', 'text-gray-500');
      viewSessions.classList.remove('hidden');
      viewSpeakers.classList.add('hidden');
    });
  }
});
