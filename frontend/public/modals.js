// Handle details Modal visibility and content
function openModal(id) {
  state.selectedSessionId = id;
  const session = state.sessions.find(s => s.id === id);
  if (!session) return;
  
  const modalCategory = document.getElementById('modal-category');
  const modalTitle = document.getElementById('modal-title');
  const modalTime = document.getElementById('modal-time');
  const modalRoom = document.getElementById('modal-room');
  const modalDescription = document.getElementById('modal-description');
  const modalEl = document.getElementById('detail-modal');
  
  if (modalCategory) modalCategory.textContent = getCategoryName(session.category, state.language);
  if (modalTitle) modalTitle.textContent = state.language === 'tr' ? session.title_tr : session.title_en;
  if (modalTime) modalTime.textContent = formatSessionTimeRange(session.start, session.end);
  if (modalRoom) modalRoom.textContent = session.room;
  if (modalDescription) modalDescription.textContent = state.language === 'tr' ? session.description_tr : session.description_en;
  
  const isBreak = session.category === 'Break' || session.category === 'Welcome';
  
  // Set multiple speakers profile cards in detail modal
  const modalSpeakersContainer = document.getElementById('modal-speakers-container');
  if (modalSpeakersContainer) {
    modalSpeakersContainer.innerHTML = '';
    
    if (!isBreak && session.speaker_ids && session.speaker_ids.length > 0) {
      modalSpeakersContainer.style.display = 'flex';
      
      session.speaker_ids.forEach(spId => {
        const speaker = state.speakers.find(s => s.id === spId);
        if (speaker) {
          const spCard = document.createElement('div');
          spCard.className = 'modal-speaker-card';
          
          spCard.innerHTML = `
            <div class="speaker-avatar">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <div class="speaker-info">
              <h4>${speaker.name}</h4>
              <p class="speaker-title">${state.language === 'tr' ? speaker.title_tr : speaker.title_en}</p>
              ${(state.language === 'tr' ? speaker.institution_tr : speaker.institution_en) ? `<p class="speaker-institution" style="font-size: 0.72rem; color: var(--text-subtle); margin-top: 1px;">${state.language === 'tr' ? speaker.institution_tr : speaker.institution_en}</p>` : ''}
            </div>
          `;
          
          spCard.addEventListener('click', () => {
            closeModal();
            openSpeakerModal(speaker.id);
          });
          
          modalSpeakersContainer.appendChild(spCard);
        }
      });
    } else {
      modalSpeakersContainer.style.display = 'none';
    }
  }
  
  // Hide vote options for break/welcome events
  const modalActions = document.querySelector('.modal-actions-section');
  if (modalActions) {
    modalActions.style.display = isBreak ? 'none' : 'block';
  }
  
  updateModalVoteButtons(id);
  if (modalEl) modalEl.classList.add('active');
}

// Close session details modal
function closeModal() {
  const modalEl = document.getElementById('detail-modal');
  if (modalEl) modalEl.classList.remove('active');
  state.selectedSessionId = null;
}

// Handle Speaker details Modal content and show it
function openSpeakerModal(speakerId) {
  const speaker = state.speakers.find(s => s.id === speakerId);
  if (!speaker) return;
  
  const speakerDetailName = document.getElementById('speaker-detail-name');
  const speakerDetailTitle = document.getElementById('speaker-detail-title');
  const speakerDetailInstitution = document.getElementById('speaker-detail-institution');
  const speakerDetailContact = document.getElementById('speaker-detail-contact');
  const speakerDetailBio = document.getElementById('speaker-detail-bio');
  const speakerSessionsList = document.getElementById('speaker-sessions-list');
  const speakerModalEl = document.getElementById('speaker-modal');
  
  if (speakerDetailName) speakerDetailName.textContent = speaker.name;
  if (speakerDetailTitle) speakerDetailTitle.textContent = state.language === 'tr' ? speaker.title_tr : speaker.title_en;
  
  // Handle Institution
  if (speakerDetailInstitution) {
    const institution = state.language === 'tr' ? speaker.institution_tr : speaker.institution_en;
    speakerDetailInstitution.textContent = institution || '';
  }
  
  // Handle Contact link
  if (speakerDetailContact) {
    if (speaker.email || speaker.phone) {
      const emailVal = speaker.email || '';
      speakerDetailContact.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="meta-icon" style="width:14px; height:14px; display:inline; vertical-align:middle; margin-right:4px;"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> <a href="mailto:${emailVal}">${emailVal}</a>`;
      speakerDetailContact.style.display = 'block';
    } else {
      speakerDetailContact.innerHTML = '';
      speakerDetailContact.style.display = 'none';
    }
  }
  
  if (speakerDetailBio) speakerDetailBio.textContent = state.language === 'tr' ? speaker.bio_tr : speaker.bio_en;
  
  if (speakerSessionsList) {
    speakerSessionsList.innerHTML = '';
    const speakerSessions = state.sessions.filter(s => s.speaker_ids && s.speaker_ids.includes(speakerId));
    const now = new Date();
    
    speakerSessions.forEach(session => {
      const card = createSessionCard(session, now);
      card.addEventListener('click', () => {
        closeSpeakerModal();
      });
      speakerSessionsList.appendChild(card);
    });
  }
  
  if (speakerModalEl) speakerModalEl.classList.add('active');
}

// Close speaker modal
function closeSpeakerModal() {
  const speakerModalEl = document.getElementById('speaker-modal');
  if (speakerModalEl) speakerModalEl.classList.remove('active');
}

// Update modal feedback buttons visual states
function updateModalVoteButtons(id) {
  const isLiked = state.likes.includes(id);
  const isDisliked = state.dislikes.includes(id);
  
  if (isLiked) {
    if (el.modalBtnLike) el.modalBtnLike.classList.add('active');
    if (el.modalBtnDislike) el.modalBtnDislike.classList.remove('active');
  } else if (isDisliked) {
    if (el.modalBtnLike) el.modalBtnLike.classList.remove('active');
    if (el.modalBtnDislike) el.modalBtnDislike.classList.add('active');
  } else {
    if (el.modalBtnLike) el.modalBtnLike.classList.remove('active');
    if (el.modalBtnDislike) el.modalBtnDislike.classList.remove('active');
  }
}

// Like functionality toggle
function toggleLike(id) {
  const index = state.likes.indexOf(id);
  
  if (index > -1) {
    state.likes.splice(index, 1);
  } else {
    state.likes.push(id);
    const dislikeIndex = state.dislikes.indexOf(id);
    if (dislikeIndex > -1) state.dislikes.splice(dislikeIndex, 1);
  }
  
  storage.set('bekcan_likes', JSON.stringify(state.likes));
  storage.set('bekcan_dislikes', JSON.stringify(state.dislikes));
  
  updateViews();
  if (state.selectedSessionId === id) {
    updateModalVoteButtons(id);
  }
}

// Dislike functionality toggle
function toggleDislike(id) {
  const index = state.dislikes.indexOf(id);
  
  if (index > -1) {
    state.dislikes.splice(index, 1);
  } else {
    state.dislikes.push(id);
    const likeIndex = state.likes.indexOf(id);
    if (likeIndex > -1) state.likes.splice(likeIndex, 1);
  }
  
  storage.set('bekcan_likes', JSON.stringify(state.likes));
  storage.set('bekcan_dislikes', JSON.stringify(state.dislikes));
  
  updateViews();
  if (state.selectedSessionId === id) {
    updateModalVoteButtons(id);
  }
}

// Request permission and send local browser notifications
function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert(state.language === 'tr' ? "Tarayıcınız bildirim desteği sunmuyor." : "Your browser does not support notifications.");
    return;
  }
  
  Notification.requestPermission().then(permission => {
    if (permission === 'granted') {
      new Notification("BEKCAN CMA", {
        body: state.language === 'tr' ? "Bildirimler başarıyla etkinleştirildi! Powered by BEKCAN." : "Notifications enabled successfully! Powered by BEKCAN.",
        icon: "./icon.png"
      });
      setTimeout(() => {
        if (el.bekcanPopup) el.bekcanPopup.classList.remove('active');
      }, 600);
    } else {
      alert(state.language === 'tr' ? "Bildirim izinleri reddedildi. Lütfen tarayıcı ayarlarından bildirimlere izin verin." : "Notification permissions denied. Please enable notifications in your browser settings.");
    }
  });
}
