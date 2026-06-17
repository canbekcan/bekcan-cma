/**
 * File: frontend/admin/js/admin.js
 * Description: Main initializer of the admin panel. Manages global adminState on the window object, navigation tabs, back button listeners, and helper utility wrappers.
 * Version: 1.2.0
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
window.manageConf = async function(id, name) {
  const manageSection = document.getElementById('manage-conf-section');
  const manageTitle = document.getElementById('manage-conf-title');
  const listWrapper = document.getElementById('conferences-table-wrapper');

  window.adminState.currentConfId = id;
  if (manageTitle) manageTitle.textContent = `Manage: ${esc(name)}`;
  if (listWrapper) listWrapper.classList.add('hidden'); // hide conferences table
  if (manageSection) manageSection.classList.remove('hidden');
  
  // Show/hide Organizers tab based on role
  const tabUsers = document.getElementById('tab-users');
  if (tabUsers) {
    if (window.adminState.role === 'superadmin') {
      tabUsers.classList.remove('hidden');
    } else {
      tabUsers.classList.add('hidden');
    }
  }

  // Load and prefill conference details
  if (window.loadConferenceDetails) {
    await window.loadConferenceDetails(id);
  }

  // Load speakers, sessions and users
  if (window.loadSpeakers) loadSpeakers();
  if (window.loadSessions) loadSessions();
  if (window.adminState.role === 'superadmin' && window.loadUsers) {
    loadUsers();
  }

  // Switch to Details tab by default
  const tabDetails = document.getElementById('tab-details');
  if (tabDetails) tabDetails.click();
};

document.addEventListener('DOMContentLoaded', () => {
  const manageSection = document.getElementById('manage-conf-section');
  const listWrapper = document.getElementById('conferences-table-wrapper');
  const backToDashboard = document.getElementById('back-to-dashboard');

  if (backToDashboard) {
    backToDashboard.addEventListener('click', () => {
      if (manageSection) manageSection.classList.add('hidden');
      if (listWrapper) listWrapper.classList.remove('hidden');
      
      // Reset any active editing states
      if (window.resetSpeakerEditMode) window.resetSpeakerEditMode();
      if (window.resetSessionEditMode) window.resetSessionEditMode();
    });
  }

  // TABS LOGIC
  const tabs = [
    { btn: 'tab-details', view: 'view-details' },
    { btn: 'tab-speakers', view: 'view-speakers' },
    { btn: 'tab-sessions', view: 'view-sessions' },
    { btn: 'tab-users', view: 'view-users' }
  ];

  tabs.forEach(t => {
    const btnEl = document.getElementById(t.btn);
    const viewEl = document.getElementById(t.view);
    
    if (btnEl && viewEl) {
      btnEl.addEventListener('click', () => {
        // Deactivate all
        tabs.forEach(x => {
          const b = document.getElementById(x.btn);
          if (b) b.classList.remove('active');
          const v = document.getElementById(x.view);
          if (v) v.classList.add('hidden');
        });
        
        // Activate selected
        btnEl.classList.add('active');
        viewEl.classList.remove('hidden');
      });
    }
  });
});
