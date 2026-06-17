// Apply translated text labels to the DOM
function applyLanguage(lang) {
  let dict = dictionary[lang];
  if (!dict) {
    lang = 'tr';
    state.language = 'tr';
    dict = dictionary.tr;
  }
  
  document.documentElement.lang = lang;
  
  if (el.langToggle) {
    const txtNode = el.langToggle.querySelector('.lang-text');
    const flagNode = el.langToggle.querySelector('.lang-flag');
    if (txtNode) txtNode.textContent = dict.langText;
    if (flagNode) flagNode.textContent = dict.langFlag;
  }
  if (el.searchInput) {
    el.searchInput.placeholder = dict.searchPlaceholder;
  }
  
  document.querySelectorAll('[data-tr]').forEach(element => {
    element.textContent = state.language === 'tr' ? element.dataset.tr : element.dataset.en;
  });
  
  document.querySelectorAll('[data-tr-placeholder]').forEach(element => {
    element.placeholder = state.language === 'tr' ? element.dataset.trPlaceholder : element.dataset.enPlaceholder;
  });
}

// Render dynamic day selectors (Safe for Safari)
function renderDaySelector() {
  if (!el.daySelector) return;
  el.daySelector.innerHTML = '';
  if (!state.conference.dates) return;
  
  state.conference.dates.forEach(dateStr => {
    const btn = document.createElement('button');
    btn.className = `day-btn ${state.selectedDay === dateStr ? 'active' : ''}`;
    
    const parts = dateStr.split('-');
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const options = { day: 'numeric', month: 'long' };
    const locale = state.language === 'tr' ? 'tr-TR' : 'en-US';
    btn.textContent = dateObj.toLocaleDateString(locale, options);
    
    btn.addEventListener('click', () => {
      state.selectedDay = dateStr;
      document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updateViews();
    });
    
    el.daySelector.appendChild(btn);
  });
}

// Render dynamic category chips
function renderCategoryCarousel() {
  if (!el.categoryCarousel) return;
  el.categoryCarousel.innerHTML = '';
  const dict = dictionary[state.language] || dictionary.tr;
  
  const categories = [dict.categoryAll, ...new Set(state.sessions.map(s => s.category).filter(Boolean))];
  
  categories.forEach(cat => {
    const chip = document.createElement('div');
    const isAll = cat === dict.categoryAll;
    const isSelected = (isAll && state.selectedCategory === 'All') || (state.selectedCategory === cat);
    
    chip.className = `category-tag ${isSelected ? 'active' : ''}`;
    chip.textContent = isAll ? dict.categoryAll : getCategoryName(cat, state.language);
    
    chip.addEventListener('click', () => {
      state.selectedCategory = isAll ? 'All' : cat;
      document.querySelectorAll('.category-tag').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      renderSessionList();
    });
    
    el.categoryCarousel.appendChild(chip);
  });
}

// Update views containing session lists
function updateViews() {
  renderSessionList();
  renderPastList();
  renderLikesList();
  updateNowNextWidget();
  renderTimeline();
}

// Render primary schedule list based on search/day/category filters
function renderSessionList() {
  if (!el.scheduleList) return;
  el.scheduleList.innerHTML = '';
  
  const filtered = state.sessions.filter(session => {
    const sessionDate = getLocalDateString(parseDate(session.start));
    if (sessionDate !== state.selectedDay) return false;
    
    if (state.selectedCategory !== 'All' && session.category !== state.selectedCategory) return false;
    
    if (state.searchQuery) {
      let speakerNamesStr = '';
      if (session.speaker_ids && session.speaker_ids.length > 0) {
        speakerNamesStr = session.speaker_ids.map(spId => {
          const sp = state.speakers.find(s => s.id === spId);
          return sp ? sp.name : '';
        }).join(' ');
      }
      
      const title = (state.language === 'tr' ? session.title_tr : session.title_en).toLowerCase();
      const speakers = speakerNamesStr.toLowerCase();
      const room = session.room.toLowerCase();
      if (!title.includes(state.searchQuery) && 
          !speakers.includes(state.searchQuery) && 
          !room.includes(state.searchQuery)) {
        return false;
      }
    }
    return true;
  });
  
  const dict = dictionary[state.language] || dictionary.tr;
  if (filtered.length === 0) {
    el.scheduleList.innerHTML = `<div class="empty-state">
      <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
      <p>${dict.noSessions}</p>
    </div>`;
    return;
  }
  
  filtered.sort((a, b) => parseDate(a.start) - parseDate(b.start));
  const now = new Date();
  
  filtered.forEach(session => {
    const card = createSessionCard(session, now);
    el.scheduleList.appendChild(card);
  });
}

// Render completed sessions tab list
function renderPastList() {
  if (!el.pastList) return;
  el.pastList.innerHTML = '';
  const now = new Date();
  
  const pastSessions = state.sessions.filter(s => parseDate(s.end) < now);
  const dict = dictionary[state.language] || dictionary.tr;
  
  if (pastSessions.length === 0) {
    el.pastList.innerHTML = `<div class="empty-state">
      <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
      <p>${dict.noPast}</p>
    </div>`;
    return;
  }
  
  pastSessions.sort((a, b) => parseDate(a.start) - parseDate(b.start));
  
  pastSessions.forEach(session => {
    const card = createSessionCard(session, now);
    el.pastList.appendChild(card);
  });
}

// Render liked sessions tab list
function renderLikesList() {
  if (!el.likesList) return;
  el.likesList.innerHTML = '';
  
  const liked = state.sessions.filter(s => state.likes.includes(s.id));
  const dict = dictionary[state.language] || dictionary.tr;
  
  if (liked.length === 0) {
    el.likesList.innerHTML = `<div class="empty-state">
      <svg class="empty-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
      <p>${dict.noLikes}</p>
    </div>`;
    return;
  }
  
  liked.sort((a, b) => parseDate(a.start) - parseDate(b.start));
  const now = new Date();
  
  liked.forEach(session => {
    const card = createSessionCard(session, now);
    el.likesList.appendChild(card);
  });
}

// Helper: Create a single Session HTML Card
function createSessionCard(session, nowTime) {
  const card = document.createElement('div');
  const isNow = isSessionNow(session, nowTime);
  card.className = `session-card ${getCategoryClass(session.category)} ${isNow ? 'now-playing' : ''}`;
  card.dataset.id = session.id;
  
  const title = state.language === 'tr' ? session.title_tr : session.title_en;
  const speakersHtml = getSpeakersHtml(session);
  const timeStr = formatSessionTimeRange(session.start, session.end);
  const isLiked = state.likes.includes(session.id);
  const isDisliked = state.dislikes.includes(session.id);
  const isBreak = session.category === 'Break' || session.category === 'Welcome';
  
  card.innerHTML = `
    <div class="session-header">
      <div class="session-time-block">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
        <span>${timeStr}</span>
      </div>
      ${session.category ? `<span class="session-category">${getCategoryName(session.category, state.language)}</span>` : ''}
    </div>
    
    <div class="session-title">${title}</div>
    ${speakersHtml}
    
    <div class="session-footer">
      <div class="session-room">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
        <span>${session.room}</span>
      </div>
      
      <div class="voting-container" style="${isBreak ? 'display: none;' : ''}">
        <button class="vote-btn-sm like ${isLiked ? 'active' : ''}" data-id="${session.id}" aria-label="Like">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
        </button>
        <button class="vote-btn-sm dislike ${isDisliked ? 'active' : ''}" data-id="${session.id}" aria-label="Dislike">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
        </button>
      </div>
    </div>
  `;
  
  card.addEventListener('click', () => openModal(session.id));
  
  const votingContainer = card.querySelector('.voting-container');
  if (votingContainer) {
    votingContainer.addEventListener('click', (e) => e.stopPropagation());
  }
  
  const likeBtn = card.querySelector('.vote-btn-sm.like');
  const dislikeBtn = card.querySelector('.vote-btn-sm.dislike');
  if (likeBtn) likeBtn.addEventListener('click', () => toggleLike(session.id));
  if (dislikeBtn) dislikeBtn.addEventListener('click', () => toggleDislike(session.id));
  
  return card;
}

// Calculate and render Now & Next Widget (Supports multiple parallel sessions)
function updateNowNextWidget() {
  if (!el.nowNextContainer) return;
  const now = new Date();
  const dict = dictionary[state.language] || dictionary.tr;
  
  const currentSessions = state.sessions.filter(s => isSessionNow(s, now));
  
  const futureSessions = state.sessions
    .filter(s => parseDate(s.start) > now)
    .sort((a, b) => parseDate(a.start) - parseDate(b.start));
    
  let nextSessions = [];
  if (futureSessions.length > 0) {
    const nextStartTime = parseDate(futureSessions[0].start).getTime();
    nextSessions = futureSessions.filter(s => parseDate(s.start).getTime() === nextStartTime);
  }
  
  if (currentSessions.length === 0 && nextSessions.length === 0) {
    el.nowNextContainer.innerHTML = `
      <div class="empty-widget">
        <p>${dict.confEnded} 🏁</p>
      </div>
    `;
    return;
  }
  
  let nowHtml = '';
  if (currentSessions.length > 0) {
    nowHtml = currentSessions.map(session => {
      const title = state.language === 'tr' ? session.title_tr : session.title_en;
      const speakersHtml = getSpeakersHtml(session);
      const timeRange = formatSessionTimeRange(session.start, session.end);
      const end = parseDate(session.end);
      const minLeft = Math.round((end - now) / 60000);
      
      const isLiked = state.likes.includes(session.id);
      const isDisliked = state.dislikes.includes(session.id);
      const isBreak = session.category === 'Break' || session.category === 'Welcome';
      
      return `
        <div class="widget-row now-row" data-id="${session.id}">
          <div class="widget-label">
            <span>${dict.nowLabel}</span>
            <span class="widget-time-badge">${minLeft} ${dict.min} ${dict.timeLeft}</span>
          </div>
          <div class="widget-title">${title}</div>
          ${speakersHtml}
          <div class="widget-footer">
            <div class="widget-meta">
              <span class="meta-icon-txt">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>${timeRange}</span>
              </span>
              <span class="meta-icon-txt">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>${session.room}</span>
              </span>
            </div>
            <div class="voting-container" style="${isBreak ? 'display: none;' : ''}">
              <button class="vote-btn-sm like ${isLiked ? 'active' : ''}" data-id="${session.id}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
              </button>
              <button class="vote-btn-sm dislike ${isDisliked ? 'active' : ''}" data-id="${session.id}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  } else {
    nowHtml = `
      <div class="widget-row now-row empty-now">
        <div class="widget-label" style="color: var(--text-subtle);">${dict.nowLabel}</div>
        <div class="widget-title" style="color: var(--text-muted); font-size:0.85rem; font-weight: normal;">
          ${dict.noActiveSession}
        </div>
      </div>
    `;
  }
  
  let nextHtml = '';
  if (nextSessions.length > 0) {
    nextHtml = nextSessions.map(session => {
      const title = state.language === 'tr' ? session.title_tr : session.title_en;
      const speakersHtml = getSpeakersHtml(session);
      const timeRange = formatSessionTimeRange(session.start, session.end);
      
      const start = parseDate(session.start);
      const minToStart = Math.round((start - now) / 60000);
      
      let countdownText = '';
      if (minToStart < 60) {
        countdownText = `${minToStart} ${dict.min} ${dict.startsIn}`;
      } else {
        const hours = Math.floor(minToStart / 60);
        countdownText = `${hours}h ${minToStart % 60}m ${dict.startsIn}`;
      }
      
      const isLiked = state.likes.includes(session.id);
      const isDisliked = state.dislikes.includes(session.id);
      const isBreak = session.category === 'Break' || session.category === 'Welcome';
      
      return `
        <div class="widget-row next-row" data-id="${session.id}">
          <div class="widget-label">
            <span>${dict.nextLabel}</span>
            <span class="widget-time-badge">${countdownText}</span>
          </div>
          <div class="widget-title">${title}</div>
          ${speakersHtml}
          <div class="widget-footer">
            <div class="widget-meta">
              <span class="meta-icon-txt">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                <span>${timeRange}</span>
              </span>
              <span class="meta-icon-txt">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>${session.room}</span>
              </span>
            </div>
            <div class="voting-container" style="${isBreak ? 'display: none;' : ''}">
              <button class="vote-btn-sm like ${isLiked ? 'active' : ''}" data-id="${session.id}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
              </button>
              <button class="vote-btn-sm dislike ${isDisliked ? 'active' : ''}" data-id="${session.id}">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path></svg>
              </button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  el.nowNextContainer.innerHTML = `
    <div class="now-next-card">
      ${nowHtml}
      ${nextHtml}
    </div>
  `;
  
  el.nowNextContainer.querySelectorAll('.widget-row').forEach(row => {
    const id = row.dataset.id;
    if (id) {
      row.addEventListener('click', () => openModal(id));
      
      const votingContainer = row.querySelector('.voting-container');
      if (votingContainer) {
        votingContainer.addEventListener('click', (e) => e.stopPropagation());
      }
      
      const likeBtn = row.querySelector('.vote-btn-sm.like');
      const dislikeBtn = row.querySelector('.vote-btn-sm.dislike');
      if (likeBtn) likeBtn.addEventListener('click', () => toggleLike(id));
      if (dislikeBtn) dislikeBtn.addEventListener('click', () => toggleDislike(id));
    }
  });
}

// Render dynamic horizontal schedule timeline
function renderTimeline() {
  if (!el.timelineCanvas) return;
  
  const sessionsOfDay = state.sessions.filter(session => {
    const sessionDate = getLocalDateString(parseDate(session.start));
    return sessionDate === state.selectedDay;
  });
  
  if (sessionsOfDay.length === 0) {
    el.timelineCanvas.style.display = 'none';
    return;
  }
  el.timelineCanvas.style.display = 'block';
  
  sessionsOfDay.sort((a, b) => parseDate(a.start) - parseDate(b.start));
  
  const timestamps = [];
  sessionsOfDay.forEach(s => {
    timestamps.push(parseDate(s.start).getTime());
    timestamps.push(parseDate(s.end).getTime());
  });
  const minMs = Math.min(...timestamps);
  const maxMs = Math.max(...timestamps);
  
  const dayStart = parseDate(new Date(minMs));
  dayStart.setMinutes(0, 0, 0);
  
  const dayEnd = parseDate(new Date(maxMs));
  dayEnd.setMinutes(0, 0, 0);
  dayEnd.setHours(dayEnd.getHours() + 1);
  
  const totalMinutes = (dayEnd - dayStart) / 60000;
  const scale = 2.5; 
  const canvasWidth = totalMinutes * scale;
  
  el.timelineCanvas.style.width = `${canvasWidth}px`;
  
  // 1. Draw Time Axis
  el.timelineTimeAxis.innerHTML = '';
  const currentHourObj = new Date(dayStart);
  while (currentHourObj <= dayEnd) {
    const offsetMin = (currentHourObj - dayStart) / 60000;
    const leftPx = offsetMin * scale;
    
    const tick = document.createElement('div');
    tick.className = 'timeline-time-label';
    tick.style.left = `${leftPx}px`;
    tick.textContent = currentHourObj.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    
    el.timelineTimeAxis.appendChild(tick);
    
    currentHourObj.setMinutes(currentHourObj.getMinutes() + 30);
  }
  
  // 2. Greedy coloring distribution
  const rows = [];
  sessionsOfDay.forEach(session => {
    const start = parseDate(session.start).getTime();
    let placed = false;
    for (let i = 0; i < rows.length; i++) {
      const lastSessionInRow = rows[i][rows[i].length - 1];
      const lastEnd = parseDate(lastSessionInRow.end).getTime();
      if (start >= lastEnd) {
        rows[i].push(session);
        placed = true;
        break;
      }
    }
    if (!placed) {
      rows.push([session]);
    }
  });
  
  const canvasHeight = 24 + rows.length * 44;
  el.timelineCanvas.style.height = `${canvasHeight}px`;
  
  // 3. Render tracks & blocks
  el.timelineTracks.innerHTML = '';
  const now = new Date();
  
  rows.forEach((rowSessions, rowIndex) => {
    const trackRow = document.createElement('div');
    trackRow.className = 'timeline-track-row';
    trackRow.style.height = '36px';
    
    rowSessions.forEach(session => {
      const sessionStart = parseDate(session.start);
      const sessionEnd = parseDate(session.end);
      const left = ((sessionStart - dayStart) / 60000) * scale;
      const width = ((sessionEnd - sessionStart) / 60000) * scale;
      
      const block = document.createElement('div');
      const isNow = isSessionNow(session, now);
      const isBreak = session.category === 'Break' || session.category === 'Welcome';
      
      block.className = `timeline-block ${getCategoryClass(session.category)} ${isNow ? 'active-session' : ''} ${isBreak ? 'break-session' : ''}`;
      block.style.left = `${left}px`;
      block.style.width = `${width - 2}px`;
      
      const title = state.language === 'tr' ? session.title_tr : session.title_en;
      const timeRangeStr = sessionStart.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) + ' - ' + sessionEnd.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      
      block.innerHTML = `
        <div class="timeline-block-title">${title}</div>
        <div class="timeline-block-time">${timeRangeStr} (${session.room})</div>
      `;
      
      block.addEventListener('click', () => openModal(session.id));
      trackRow.appendChild(block);
    });
    
    el.timelineTracks.appendChild(trackRow);
  });
  
  updateTimelineNowLine(dayStart, dayEnd, scale);
}

// Update the vertical Now Line and header digital clock
function updateTimelineNowLine(dayStart, dayEnd, scale) {
  const now = new Date();
  
  if (el.timelineTimeDisplay) {
    el.timelineTimeDisplay.textContent = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  
  if (now >= dayStart && now <= dayEnd) {
    el.timelineNowLine.style.display = 'block';
    const offsetMin = (now - dayStart) / 60000;
    const leftPx = offsetMin * scale;
    el.timelineNowLine.style.left = `${leftPx}px`;
    
    const viewportWidth = el.timelineViewport.clientWidth;
    const scrollTarget = leftPx - (viewportWidth / 2);
    el.timelineViewport.scrollTo({ left: scrollTarget, behavior: 'smooth' });
  } else {
    el.timelineNowLine.style.display = 'none';
    const todayStr = getLocalDateString(now);
    if (todayStr === state.selectedDay) {
      if (now < dayStart) {
        el.timelineViewport.scrollLeft = 0;
      } else {
        el.timelineViewport.scrollLeft = el.timelineCanvas.clientWidth;
      }
    }
  }
}
