/**
 * File: frontend/admin/js/speakers.js
 * Description: Manages CRUD operations for Speakers. Retrieves list, renders list items, handles creation, edits, and deletions.
 * Version: 1.2.0
 * Project: BEKCAN CMA (Conference Management App)
 */

let currentSpeakers = [];
let editingSpeakerId = null;

async function loadSpeakers() {
  if (!window.adminState.currentConfId) return;
  
  try {
    const res = await fetch(`/api/admin/conferences/${window.adminState.currentConfId}/speakers`, {
      headers: { 'Authorization': `Bearer ${window.adminState.token}` }
    });
    const speakers = await res.json();
    currentSpeakers = Array.isArray(speakers) ? speakers : [];
    
    const list = document.getElementById('speakers-list');
    if (!list) return;
    list.innerHTML = '';
    
    currentSpeakers.forEach(s => {
      const li = document.createElement('li');
      li.className = 'item-list-row';
      li.innerHTML = `
        <div>
          <span class="title-bold">${esc(s.full_name)}</span> 
          (${esc(s.speaker_ref)}) - <span class="sub-text">${esc(s.title || '')}</span>
        </div>
        <div>
          <button class="btn btn-primary btn-sm edit-sp-btn" style="margin-right: 8px;">Edit</button>
          <button class="btn btn-danger btn-sm delete-sp-btn">Delete</button>
        </div>
      `;

      // Safe, dynamic event binding
      const editBtn = li.querySelector('.edit-sp-btn');
      if (editBtn) {
        editBtn.addEventListener('click', () => editSpeaker(s.id));
      }

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

// Enter edit mode for a speaker
window.editSpeaker = function(id) {
  const speaker = currentSpeakers.find(s => s.id === id);
  if (!speaker) return;

  editingSpeakerId = id;
  
  // Fill the form fields
  document.getElementById('sp-ref').value = speaker.speaker_ref || '';
  document.getElementById('sp-name').value = speaker.full_name || '';
  document.getElementById('sp-title').value = speaker.title || '';
  document.getElementById('sp-inst').value = speaker.institution || '';
  document.getElementById('sp-email').value = speaker.email || '';
  document.getElementById('sp-phone').value = speaker.phone || '';
  document.getElementById('sp-avatar').value = speaker.avatar_url || '';
  document.getElementById('sp-bio').value = speaker.bio || '';

  // Update UI headers & buttons
  const formTitle = document.getElementById('speaker-form-title');
  if (formTitle) formTitle.textContent = `Edit Speaker: ${esc(speaker.full_name)}`;
  
  const submitBtn = document.getElementById('submit-speaker-btn');
  if (submitBtn) submitBtn.textContent = 'Update Speaker';
  
  const cancelBtn = document.getElementById('cancel-edit-speaker');
  if (cancelBtn) cancelBtn.classList.remove('hidden');

  // Scroll to form smoothly
  const form = document.getElementById('add-speaker-form');
  if (form) form.scrollIntoView({ behavior: 'smooth' });
};

// Reset speaker edit mode back to creation mode
window.resetSpeakerEditMode = function() {
  editingSpeakerId = null;
  
  const addSpeakerForm = document.getElementById('add-speaker-form');
  if (addSpeakerForm) addSpeakerForm.reset();

  const formTitle = document.getElementById('speaker-form-title');
  if (formTitle) formTitle.textContent = 'Add Speaker';
  
  const submitBtn = document.getElementById('submit-speaker-btn');
  if (submitBtn) submitBtn.textContent = 'Add Speaker';
  
  const cancelBtn = document.getElementById('cancel-edit-speaker');
  if (cancelBtn) cancelBtn.classList.add('hidden');
};

// Global scope actions
window.delSpeaker = async function(id) {
  if (!confirm('Are you sure you want to delete this speaker?')) return;
  try {
    const res = await fetch(`/api/admin/speakers/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${window.adminState.token}` }
    });
    if (res.ok) {
      if (editingSpeakerId === id) resetSpeakerEditMode();
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
  const cancelBtn = document.getElementById('cancel-edit-speaker');

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      resetSpeakerEditMode();
    });
  }

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
        let url = `/api/admin/conferences/${window.adminState.currentConfId}/speakers`;
        let method = 'POST';
        
        if (editingSpeakerId !== null) {
          url = `/api/admin/speakers/${editingSpeakerId}`;
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
          resetSpeakerEditMode();
          loadSpeakers();
        } else {
          alert(editingSpeakerId !== null ? 'Failed to update speaker' : 'Failed to add speaker');
        }
      } catch (err) {
        alert('Error processing speaker record');
      }
    });
  }
});
