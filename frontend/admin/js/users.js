/**
 * File: frontend/admin/js/users.js
 * Description: Manages user/organizer accounts inside the admin panel. Lists organizers, handles user creation, and user deletion.
 * Version: 1.2.0
 * Project: BEKCAN CMA (Conference Management App)
 */

async function loadUsers() {
  if (!window.adminState.currentConfId) return;
  if (window.adminState.role !== 'superadmin') return;

  try {
    const res = await fetch(`/api/admin/users?conference_id=${window.adminState.currentConfId}`, {
      headers: { 'Authorization': `Bearer ${window.adminState.token}` }
    });
    const users = await res.json();
    const list = document.getElementById('users-list');
    if (!list) return;
    list.innerHTML = '';

    if (!Array.isArray(users)) {
      console.error('Users response is not an array:', users);
      return;
    }

    users.forEach(u => {
      const li = document.createElement('li');
      li.className = 'item-list-row';
      li.innerHTML = `
        <div>
          <span class="title-bold">${esc(u.username)}</span> 
          - <span class="sub-text">${esc(u.role)}</span>
        </div>
        <button class="btn btn-danger btn-sm delete-usr-btn">Delete</button>
      `;

      // Safe, dynamic event binding
      const delBtn = li.querySelector('.delete-usr-btn');
      if (delBtn) {
        delBtn.addEventListener('click', () => delUser(u.id, u.username));
      }

      list.appendChild(li);
    });
  } catch (err) {
    console.error('Failed to load users:', err);
  }
}

// Global user deletion helper
window.delUser = async function(id, username) {
  if (!confirm(`Are you sure you want to delete organizer account "${username}"?`)) return;
  try {
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${window.adminState.token}` }
    });
    
    if (res.ok) {
      loadUsers();
    } else {
      const data = await res.json();
      alert(data.error || 'Failed to delete user');
    }
  } catch (err) {
    alert('Connection error');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const addUserForm = document.getElementById('add-user-form');
  if (addUserForm) {
    addUserForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const payload = {
        username: document.getElementById('usr-username').value,
        password: document.getElementById('usr-password').value,
        role: 'organizer',
        conference_id: window.adminState.currentConfId
      };

      try {
        const res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.adminState.token}`
          },
          body: JSON.stringify(payload)
        });

        if (res.ok) {
          addUserForm.reset();
          loadUsers();
          alert('Organizer added successfully!');
        } else {
          const data = await res.json();
          alert(data.error || 'Failed to add user');
        }
      } catch (err) {
        alert('Error adding user');
      }
    });
  }
});
