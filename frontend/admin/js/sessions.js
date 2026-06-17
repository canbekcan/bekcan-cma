/**
 * File: frontend/admin/js/sessions.js
 * Description: Manages CRUD operations for Sessions. Retrieves list, renders list items, handles creation, and handles deletions.
 * Version: 1.1.0
 * Project: BEKCAN CMA (Conference Management App)
 */

async function loadSessions() {
  if (!window.adminState.currentConfId) return;
  
  try {
    const res = await fetch(`/api/admin/conferences/${window.adminState.currentConfId}/sessions`, {
      headers: { 'Authorization': `Bearer ${window.adminState.token}` }
    });
    const sessions = await res.json();
    const list = document.getElementById('sessions-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (!Array.isArray(sessions)) {
      console.error('Sessions response is not an array:', sessions);
      return;
    }
    
    sessions.forEach(s => {
      const timeStr = s.start_time ? new Date(s.start_time).toLocaleString() : 'N/A';
      const li = document.createElement('li');
      li.className = 'item-list-row';
      li.innerHTML = `
        <div>
          <span class="title-bold">${esc(s.title_tr)}</span> 
          (${esc(s.session_ref)}) - <span class="sub-text">${esc(timeStr)}</span>
        </div>
        <button class="btn btn-danger btn-sm delete-se-btn">Delete</button>
      `;

      // Safe, dynamic event binding
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

// Global scope actions
window.delSession = async function(id) {
  if (!confirm('Are you sure you want to delete this session?')) return;
  try {
    const res = await fetch(`/api/admin/sessions/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${window.adminState.token}` }
    });
    if (res.ok) {
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
        const res = await fetch(`/api/admin/conferences/${window.adminState.currentConfId}/sessions`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.adminState.token}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          addSessionForm.reset();
          loadSessions();
        } else {
          alert('Failed to add session');
        }
      } catch (err) {
        alert('Error adding session');
      }
    });
  }
});
