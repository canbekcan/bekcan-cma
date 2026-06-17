document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const dashboardScreen = document.getElementById('dashboard-screen');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const conferencesList = document.getElementById('conferences-list');
    const showCreateBtn = document.getElementById('show-create-conf-btn');
    const createConfSection = document.getElementById('create-conf-section');
    const createConfForm = document.getElementById('create-conf-form');
    
    
    function esc(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function(m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
    }

    let token = localStorage.getItem('admin_token');
    let userRole = localStorage.getItem('admin_role');

    if (token) {
        showDashboard();
    }

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        
        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();
            
            if (res.ok) {
                token = data.token;
                userRole = data.role;
                localStorage.setItem('admin_token', token);
                localStorage.setItem('admin_role', userRole);
                loginError.classList.add('hidden');
                showDashboard();
            } else {
                loginError.textContent = data.error || 'Login failed';
                loginError.classList.remove('hidden');
            }
        } catch (err) {
            loginError.textContent = 'Connection error';
            loginError.classList.remove('hidden');
        }
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_role');
        token = null;
        userRole = null;
        dashboardScreen.classList.add('hidden');
        loginScreen.classList.remove('hidden');
    });

    showCreateBtn.addEventListener('click', () => {
        createConfSection.classList.remove('hidden');
    });
    
    document.getElementById('cancel-create-conf').addEventListener('click', () => {
        createConfSection.classList.add('hidden');
        createConfForm.reset();
    });

    createConfForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            name: document.getElementById('conf-name').value,
            slug: document.getElementById('conf-slug').value,
            start_date: document.getElementById('conf-start').value,
            end_date: document.getElementById('conf-end').value,
            venue_info: document.getElementById('conf-venue').value,
            wifi_ssid: document.getElementById('conf-wifi-ssid').value,
            wifi_wpa: document.getElementById('conf-wifi-wpa').value
        };

        try {
            const res = await fetch('/api/admin/conferences', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                createConfSection.classList.add('hidden');
                createConfForm.reset();
                loadConferences();
            } else {
                alert('Failed to create conference');
            }
        } catch (err) {
            alert('Error creating conference');
        }
    });

    async function showDashboard() {
        loginScreen.classList.add('hidden');
        dashboardScreen.classList.remove('hidden');
        document.getElementById('user-role-badge').textContent = userRole.toUpperCase();
        
        if (userRole === 'superadmin') {
            showCreateBtn.classList.remove('hidden');
        }
        
        loadConferences();
    }

    async function loadConferences() {
        try {
            const res = await fetch('/api/admin/conferences', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (res.status === 401 || res.status === 403) {
                document.getElementById('logout-btn').click();
                return;
            }
            
            const conferences = await res.json();
            conferencesList.innerHTML = '';
            
            conferences.forEach(conf => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${esc(conf.name)}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <a href="/${esc(conf.slug)}" target="_blank" class="text-blue-600 hover:underline">/${esc(conf.slug)}</a>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${esc(conf.start_date ? conf.start_date.split('T')[0] : '')} - ${esc(conf.end_date ? conf.end_date.split('T')[0] : '')}</td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button class="text-indigo-600 hover:text-indigo-900 ml-2" onclick="importJson(${conf.id})">Import JSON</button>
                        <button class="text-blue-600 hover:text-blue-900 ml-4 font-bold" onclick="manageConf(${conf.id}, '${esc(conf.name)}')">Manage</button>
                        ${userRole === 'superadmin' ? `<button class="text-green-600 hover:text-green-900 ml-4" onclick="createUser(${conf.id})">Add User</button>` : ''}
                        ${userRole === 'superadmin' ? `<button class="text-red-600 hover:text-red-900 ml-4" onclick="deleteConf(${conf.id})">Delete</button>` : ''}
                    </td>
                `;
                conferencesList.appendChild(tr);
            });
        } catch (err) {
            console.error('Failed to load conferences', err);
        }
    }

    window.importJson = async function(confId) {
        const jsonStr = prompt("Paste the full schedule.json content here to update this conference:");
        if (!jsonStr) return;
        try {
            const parsed = JSON.parse(jsonStr);
            const res = await fetch(`/api/admin/conferences/${confId}/import-json`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(parsed)
            });
            if (res.ok) alert('Schedule imported successfully!');
            else alert('Failed to import schedule');
        } catch (e) {
            alert('Invalid JSON format');
        }
    };

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
                    'Authorization': `Bearer ${token}`
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
                headers: { 'Authorization': `Bearer ${token}` }
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

    // MANAGE CONFERENCE LOGIC
    let currentConfId = null;
    const manageSection = document.getElementById('manage-conf-section');
    const manageTitle = document.getElementById('manage-conf-title');
    
    window.manageConf = function(id, name) {
        currentConfId = id;
        manageTitle.textContent = `Manage: ${esc(name)}`;
        document.querySelector('.overflow-hidden').classList.add('hidden'); // hide table
        manageSection.classList.remove('hidden');
        loadSpeakers();
        loadSessions();
    };

    document.getElementById('back-to-dashboard').addEventListener('click', () => {
        manageSection.classList.add('hidden');
        document.querySelector('.overflow-hidden').classList.remove('hidden');
    });

    // TABS
    const tabSpeakers = document.getElementById('tab-speakers');
    const tabSessions = document.getElementById('tab-sessions');
    const viewSpeakers = document.getElementById('view-speakers');
    const viewSessions = document.getElementById('view-sessions');

    tabSpeakers.addEventListener('click', () => {
        tabSpeakers.classList.add('border-blue-600', 'text-blue-600');
        tabSpeakers.classList.remove('border-transparent', 'text-gray-500');
        tabSessions.classList.remove('border-blue-600', 'text-blue-600');
        tabSessions.classList.add('border-transparent', 'text-gray-500');
        viewSpeakers.classList.remove('hidden');
        viewSessions.classList.add('hidden');
    });

    tabSessions.addEventListener('click', () => {
        tabSessions.classList.add('border-blue-600', 'text-blue-600');
        tabSessions.classList.remove('border-transparent', 'text-gray-500');
        tabSpeakers.classList.remove('border-blue-600', 'text-blue-600');
        tabSpeakers.classList.add('border-transparent', 'text-gray-500');
        viewSessions.classList.remove('hidden');
        viewSpeakers.classList.add('hidden');
    });

    // LOAD & ADD SPEAKERS
    async function loadSpeakers() {
        const res = await fetch(`/api/admin/conferences/${currentConfId}/speakers`, { headers: { 'Authorization': `Bearer ${token}` } });
        const speakers = await res.json();
        const list = document.getElementById('speakers-list');
        list.innerHTML = '';
        speakers.forEach(s => {
            list.innerHTML += `<li class="p-3 flex justify-between items-center">
                <div><span class="font-bold">${esc(s.full_name)}</span> (${esc(s.speaker_ref)}) - ${esc(s.title || '')}</div>
                <button class="text-red-500 text-sm" onclick="delSpeaker(${s.id})">Delete</button>
            </li>`;
        });
    }

    document.getElementById('add-speaker-form').addEventListener('submit', async (e) => {
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
        const res = await fetch(`/api/admin/conferences/${currentConfId}/speakers`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
        });
        if (res.ok) { document.getElementById('add-speaker-form').reset(); loadSpeakers(); }
    });

    window.delSpeaker = async function(id) {
        if (!confirm('Delete speaker?')) return;
        await fetch(`/api/admin/speakers/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        loadSpeakers();
    };

    // LOAD & ADD SESSIONS
    async function loadSessions() {
        const res = await fetch(`/api/admin/conferences/${currentConfId}/sessions`, { headers: { 'Authorization': `Bearer ${token}` } });
        const sessions = await res.json();
        const list = document.getElementById('sessions-list');
        list.innerHTML = '';
        sessions.forEach(s => {
            list.innerHTML += `<li class="p-3 flex justify-between items-center">
                <div><span class="font-bold">${esc(s.title_tr)}</span> (${esc(s.session_ref)}) - ${new Date(s.start_time).toLocaleString()}</div>
                <button class="text-red-500 text-sm" onclick="delSession(${s.id})">Delete</button>
            </li>`;
        });
    }

    document.getElementById('add-session-form').addEventListener('submit', async (e) => {
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
            speaker_ids: spRefStr ? spRefStr.split(',').map(s=>s.trim()) : []
        };
        const res = await fetch(`/api/admin/conferences/${currentConfId}/sessions`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(payload)
        });
        if (res.ok) { document.getElementById('add-session-form').reset(); loadSessions(); }
    });

    window.delSession = async function(id) {
        if (!confirm('Delete session?')) return;
        await fetch(`/api/admin/sessions/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        loadSessions();
    };
});
