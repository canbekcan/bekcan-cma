/**
 * File: frontend/admin/js/speakers.js
 * Description: Manages CRUD operations for Speakers. Retrieves list, renders list items, handles creation, and handles deletions.
 * Version: 1.1.0
 * Project: BEKCAN CMA (Conference Management App)
 */

async function loadSpeakers() {
  if (!window.adminState.currentConfId) return;
  
  try {
    const res = await fetch(`/api/admin/conferences/${window.adminState.currentConfId}/speakers`, {
      headers: { 'Authorization': `Bearer ${window.adminState.token}` }
    });
    const speakers = await res.json();
    const list = document.getElementById('speakers-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (!Array.isArray(speakers)) {
      console.error('Speakers response is not an array:', speakers);
      return;
    }
    
    speakers.forEach(s => {
      const li = document.createElement('li');
      li.className = 'item-list-row';
      li.innerHTML = `
        <div>
          <span class="title-bold">${esc(s.full_name)}</span> 
          (${esc(s.speaker_ref)}) - <span class="sub-text">${esc(s.title || '')}</span>
        </div>
        <button class="btn btn-danger btn-sm delete-sp-btn">Delete</button>
      `;

      // Safe, dynamic event binding
      const delBtn = li.querySelector('.delete-sp-btn');
      if (delBtn) {
        delBtn.addEventListener('click', () => delSpeaker(s.id));
      }

      list.appendChild(li);
    });
  } catch (err) {
    console.error('Failed to load speakers:', err);
  }
}

// Global scope actions
window.delSpeaker = async function(id) {
  if (!confirm('Are you sure you want to delete this speaker?')) return;
  try {
    const res = await fetch(`/api/admin/speakers/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${window.adminState.token}` }
    });
    if (res.ok) {
      loadSpeakers();
    } else {
      alert('Failed to delete speaker');
    }
  } catch (e) {
    alert('Connection error');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  const addSpeakerForm = document.getElementById('add-speaker-form');
  if (addSpeakerForm) {
    addSpeakerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        speaker_ref: document.getElementById('sp-ref').value,
        full_name: document.getElementById('sp-name').value,
        title: document.getElementById('sp-title').value,
        institution: document.getElementById('sp-inst').value,
        email: document.getElementById('sp-email').value,
        phone: document.getElementById('sp-phone').value,
        avatar_url: document.getElementById('sp-avatar').value,
        bio: document.getElementById('sp-bio').value
      };
      
      try {
        const res = await fetch(`/api/admin/conferences/${window.adminState.currentConfId}/speakers`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${window.adminState.token}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          addSpeakerForm.reset();
          loadSpeakers();
        } else {
          alert('Failed to add speaker');
        }
      } catch (err) {
        alert('Error adding speaker');
      }
    });
  }
});
