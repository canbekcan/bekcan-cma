/**
 * File: frontend/admin/js/dashboard.js
 * Description: Renders the admin home dashboard, loads conferences list, creates/updates conferences, and handles deletions.
 * Version: 1.2.0
 * Project: BEKCAN CMA (Conference Management App)
 */

async function showDashboard() {
  const loginScreen = document.getElementById('login-screen');
  const dashboardScreen = document.getElementById('dashboard-screen');
  const showCreateBtn = document.getElementById('show-create-conf-btn');

  if (loginScreen) loginScreen.classList.add('hidden');
  if (dashboardScreen) dashboardScreen.classList.remove('hidden');
  
  const roleBadge = document.getElementById('user-role-badge');
  if (roleBadge && window.adminState.role) {
    roleBadge.textContent = window.adminState.role.toUpperCase();
  }
  
  if (showCreateBtn && window.adminState.role === 'superadmin') {
    showCreateBtn.classList.remove('hidden');
  }
  
  loadConferences();
}

async function loadConferences() {
  const conferencesList = document.getElementById('conferences-list');
  if (!conferencesList) return;

  try {
    const res = await fetch('/api/admin/conferences', {
      headers: { 'Authorization': `Bearer ${window.adminState.token}` }
    });
    
    if (res.status === 401 || res.status === 403) {
      const logoutBtn = document.getElementById('logout-btn');
      if (logoutBtn) logoutBtn.click();
      return;
    }
    
    const conferences = await res.json();
    conferencesList.innerHTML = '';
    
    if (!Array.isArray(conferences)) {
      console.error('Conferences response is not an array:', conferences);
      return;
    }
    
    conferences.forEach(conf => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${esc(conf.name)}</strong></td>
        <td>
          <a href="/${esc(conf.slug)}" target="_blank">/${esc(conf.slug)}</a>
        </td>
        <td>${esc(conf.start_date ? conf.start_date.split('T')[0] : '')} - ${esc(conf.end_date ? conf.end_date.split('T')[0] : '')}</td>
        <td style="text-align: right; white-space: nowrap;">
          <button class="btn btn-primary btn-sm manage-btn">Manage</button>
          ${window.adminState.role === 'superadmin' ? `<button class="btn btn-danger btn-sm delete-btn" style="margin-left: 8px;">Delete</button>` : ''}
        </td>
      `;

      // Safe, quote-friendly event listeners
      const manageBtn = tr.querySelector('.manage-btn');
      if (manageBtn) {
        manageBtn.addEventListener('click', () => manageConf(conf.id, conf.name));
      }

      const deleteBtn = tr.querySelector('.delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => deleteConf(conf.id));
      }

      conferencesList.appendChild(tr);
    });
  } catch (err) {
    console.error('Failed to load conferences', err);
  }
}

// Global action to load and prefill conference details
window.loadConferenceDetails = async function(id) {
  try {
    const res = await fetch(`/api/admin/conferences/${id}`, {
      headers: { 'Authorization': `Bearer ${window.adminState.token}` }
    });
    if (!res.ok) throw new Error('Failed to load details');
    
    const conf = await res.json();
    
    document.getElementById('edit-conf-name').value = conf.name || '';
    document.getElementById('edit-conf-slug').value = conf.slug || '';
    document.getElementById('edit-conf-start').value = conf.start_date ? conf.start_date.split('T')[0] : '';
    document.getElementById('edit-conf-end').value = conf.end_date ? conf.end_date.split('T')[0] : '';
    document.getElementById('edit-conf-venue').value = conf.venue_info || '';
    document.getElementById('edit-conf-abbrev').value = conf.abbreviation || '';
    document.getElementById('edit-conf-logo').value = conf.logo_url || '';
    document.getElementById('edit-conf-wifi-ssid').value = conf.wifi_ssid || '';
    document.getElementById('edit-conf-wifi-wpa').value = conf.wifi_wpa || '';
  } catch (err) {
    console.error('Error prefilling conference details form:', err);
    alert('Failed to load conference info');
  }
};

window.deleteConf = async function(id) {
  if (!confirm('Are you sure you want to delete this conference? All associated data will be lost!')) return;
  try {
    const res = await fetch(`/api/admin/conferences/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${window.adminState.token}` }
    });
    if (res.ok) {
      loadConferences();
    } else {
      alert('Failed to delete conference');
    }
  } catch (err) {
    alert('Error deleting conference');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const createConfForm = document.getElementById('create-conf-form');
  const createConfSection = document.getElementById('create-conf-section');
  const showCreateBtn = document.getElementById('show-create-conf-btn');
  const editConfForm = document.getElementById('edit-conf-form');

  if (showCreateBtn) {
    showCreateBtn.addEventListener('click', () => {
      if (createConfSection) createConfSection.classList.remove('hidden');
    });
  }
  
  const cancelCreateConf = document.getElementById('cancel-create-conf');
  if (cancelCreateConf) {
    cancelCreateConf.addEventListener('click', () => {
      if (createConfSection) createConfSection.classList.add('hidden');
      if (createConfForm) createConfForm.reset();
    });
  }

  if (createConfForm) {
    createConfForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        name: document.getElementById('conf-name').value,
        slug: document.getElementById('conf-slug').value,
        abbreviation: document.getElementById('conf-abbrev').value,
        start_date: document.getElementById('conf-start').value,
        end_date: document.getElementById('conf-end').value,
        venue_info: document.getElementById('conf-venue').value,
        logo_url: document.getElementById('conf-logo').value,
        wifi_ssid: document.getElementById('conf-wifi-ssid').value,
        wifi_wpa: document.getElementById('conf-wifi-wpa').value
      };

      try {
        const res = await fetch('/api/admin/conferences', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.adminState.token}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          if (createConfSection) createConfSection.classList.add('hidden');
          createConfForm.reset();
          loadConferences();
        } else {
          const errData = await res.json().catch(() => ({}));
          alert('Failed to create conference' + (errData.error ? ': ' + errData.error : ''));
        }
      } catch (err) {
        alert('Error creating conference');
      }
    });
  }

  if (editConfForm) {
    editConfForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = window.adminState.currentConfId;
      if (!id) return;

      const payload = {
        name: document.getElementById('edit-conf-name').value,
        slug: document.getElementById('edit-conf-slug').value,
        abbreviation: document.getElementById('edit-conf-abbrev').value,
        start_date: document.getElementById('edit-conf-start').value,
        end_date: document.getElementById('edit-conf-end').value,
        venue_info: document.getElementById('edit-conf-venue').value,
        logo_url: document.getElementById('edit-conf-logo').value,
        wifi_ssid: document.getElementById('edit-conf-wifi-ssid').value,
        wifi_wpa: document.getElementById('edit-conf-wifi-wpa').value
      };

      try {
        const res = await fetch(`/api/admin/conferences/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.adminState.token}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          alert('Conference details updated successfully!');
          // Refresh conferences in the background and update title
          loadConferences();
          const manageTitle = document.getElementById('manage-conf-title');
          if (manageTitle) manageTitle.textContent = `Manage: ${esc(payload.name)}`;
        } else {
          const errData = await res.json().catch(() => ({}));
          alert('Failed to update conference' + (errData.error ? ': ' + errData.error : ''));
        }
      } catch (err) {
        alert('Error updating conference details');
      }
    });
  }
});
