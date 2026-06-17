/**
 * File: frontend/admin/js/sessions.js
 * Description: Manages CRUD operations for Sessions. Retrieves list, renders list items, handles creation, edits, and deletions.
 * Version: 1.2.0
 * Project: BEKCAN CMA (Conference Management App)
 */

let currentSessions = [];
let editingSessionId = null;

// Helper to convert ISO dates into YYYY-MM-DDTHH:MM local format
function toDatetimeLocal(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

async function loadSessions() {
  if (!window.adminState.currentConfId) return;
  
  try {
    const res = await fetch(`/api/admin/conferences/${window.adminState.currentConfId}/sessions`, {
      headers: { 'Authorization': `Bearer ${window.adminState.token}` }
    });
    const sessions = await res.json();
    currentSessions = Array.isArray(sessions) ? sessions : [];
    
    const list = document.getElementById('sessions-list');
    if (!list) return;
    list.innerHTML = '';
    
    currentSessions.forEach(s => {
      const timeStr = s.start_time ? new Date(s.start_time).toLocaleString() : 'N/A';
      const li = document.createElement('li');
      li.className = 'item-list-row';
      li.innerHTML = `
        <div>
          <span class="title-bold">${esc(s.title_tr)}</span> 
          (${esc(s.session_ref)}) - <span class="sub-text">${esc(timeStr)}</span>
        </div>
        <div>
          <button class="btn btn-primary btn-sm edit-se-btn" style="margin-right: 8px;">Edit</button>
          <button class="btn btn-danger btn-sm delete-se-btn">Delete</button>
        </div>
      `;

      // Safe, dynamic event binding
      const editBtn = li.querySelector('.edit-se-btn');
      if (editBtn) {
        editBtn.addEventListener('click', () => editSession(s.id));
      }

      const delBtn = li.querySelector('.delete-se-btn');
      if (delBtn) {
        delBtn.addEventListener('click', () => delSession(s.id));
      }

      list.appendChild(li);
    });
  } catch (err) {
    console.error('Failed to load sessions:', err);
  }
}

// Enter edit mode for a session
window.editSession = function(id) {
  const session = currentSessions.find(s => s.id === id);
  if (!session) return;

  editingSessionId = id;

  // Fill form inputs
  document.getElementById('se-ref').value = session.session_ref || '';
  document.getElementById('se-title-tr').value = session.title_tr || '';
  document.getElementById('se-title-en').value = session.title_en || '';
  document.getElementById('se-room').value = session.room || '';
  document.getElementById('se-cat').value = session.category || '';
  document.getElementById('se-start').value = toDatetimeLocal(session.start_time);
  document.getElementById('se-end').value = toDatetimeLocal(session.end_time);
  document.getElementById('se-speakers').value = Array.isArray(session.speaker_ids) ? session.speaker_ids.join(',') : '';
  document.getElementById('se-desc-tr').value = session.description_tr || '';
  document.getElementById('se-desc-en').value = session.description_en || '';

  // Update UI headers & buttons
  const formTitle = document.getElementById('session-form-title');
  if (formTitle) formTitle.textContent = `Edit Session: ${esc(session.title_tr)}`;

  const submitBtn = document.getElementById('submit-session-btn');
  if (submitBtn) submitBtn.textContent = 'Update Session';

  const cancelBtn = document.getElementById('cancel-edit-session');
  if (cancelBtn) cancelBtn.classList.remove('hidden');

  // Scroll to form smoothly
  const form = document.getElementById('add-session-form');
  if (form) form.scrollIntoView({ behavior: 'smooth' });
};

// Reset session edit form back to add mode
window.resetSessionEditMode = function() {
  editingSessionId = null;
  
  const addSessionForm = document.getElementById('add-session-form');
  if (addSessionForm) addSessionForm.reset();

  const formTitle = document.getElementById('session-form-title');
  if (formTitle) formTitle.textContent = 'Add Session';

  const submitBtn = document.getElementById('submit-session-btn');
  if (submitBtn) submitBtn.textContent = 'Add Session';

  const cancelBtn = document.getElementById('cancel-edit-session');
  if (cancelBtn) cancelBtn.classList.add('hidden');
};

// Global scope actions
window.delSession = async function(id) {
  if (!confirm('Are you sure you want to delete this session?')) return;
  try {
    const res = await fetch(`/api/admin/sessions/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${window.adminState.token}` }
    });
    if (res.ok) {
      if (editingSessionId === id) resetSessionEditMode();
      loadSessions();
    } else {
      alert('Failed to delete session');
    }
  } catch (e) {
    alert('Connection error');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const addSessionForm = document.getElementById('add-session-form');
  const cancelBtn = document.getElementById('cancel-edit-session');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      resetSessionEditMode();
    });
  }

  if (addSessionForm) {
    addSessionForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const spRefStr = document.getElementById('se-speakers').value;
      const payload = {
        session_ref: document.getElementById('se-ref').value,
        title_tr: document.getElementById('se-title-tr').value,
        title_en: document.getElementById('se-title-en').value,
        room: document.getElementById('se-room').value,
        category: document.getElementById('se-cat').value,
        start_time: document.getElementById('se-start').value,
        end_time: document.getElementById('se-end').value,
        description_tr: document.getElementById('se-desc-tr').value,
        description_en: document.getElementById('se-desc-en').value,
        speaker_ids: spRefStr ? spRefStr.split(',').map(s => s.trim()) : []
      };
      
      try {
        let url = `/api/admin/conferences/${window.adminState.currentConfId}/sessions`;
        let method = 'POST';

        if (editingSessionId !== null) {
          url = `/api/admin/sessions/${editingSessionId}`;
          method = 'PUT';
        }

        const res = await fetch(url, {
          method: method,
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.adminState.token}`
          },
          body: JSON.stringify(payload)
        });
        
        if (res.ok) {
          resetSessionEditMode();
          loadSessions();
        } else {
          alert(editingSessionId !== null ? 'Failed to update session' : 'Failed to add session');
        }
      } catch (err) {
        alert('Error processing session record');
      }
    });
  }
});
