/**
 * File: frontend/admin/js/dashboard.js
 * Description: Renders the admin home dashboard, loads conferences list, creates conferences, handles admin users, and handles deletions.
 * Version: 1.1.0
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
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${esc(conf.name)}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          <a href="/${esc(conf.slug)}" target="_blank" class="text-blue-600 hover:underline">/${esc(conf.slug)}</a>
        </td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${esc(conf.start_date ? conf.start_date.split('T')[0] : '')} - ${esc(conf.end_date ? conf.end_date.split('T')[0] : '')}</td>
        <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
          <button class="btn btn-primary btn-sm manage-btn">Manage</button>
          ${window.adminState.role === 'superadmin' ? `<button class="btn btn-success btn-sm add-user-btn" style="margin-left: 8px;">Add User</button>` : ''}
          ${window.adminState.role === 'superadmin' ? `<button class="btn btn-danger btn-sm delete-btn" style="margin-left: 8px;">Delete</button>` : ''}
        </td>
      `;

      // Safe, quote-friendly event listeners
      const manageBtn = tr.querySelector('.manage-btn');
      if (manageBtn) {
        manageBtn.addEventListener('click', () => manageConf(conf.id, conf.name));
      }

      const addUserBtn = tr.querySelector('.add-user-btn');
      if (addUserBtn) {
        addUserBtn.addEventListener('click', () => createUser(conf.id));
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

// Global scope actions
window.createUser = async function(confId) {
  const username = prompt("Enter new username:");
  if (!username) return;
  const password = prompt("Enter new password:");
  if (!password) return;
  
  try {
    const res = await fetch(`/api/admin/users`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${window.adminState.token}`
      },
      body: JSON.stringify({ username, password, role: 'organizer', conference_id: confId })
    });
    if (res.ok) alert('User created successfully!');
    else alert('Failed to create user');
  } catch (e) {
    alert('Connection error');
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
          alert('Failed to create conference');
        }
      } catch (err) {
        alert('Error creating conference');
      }
    });
  }
});
