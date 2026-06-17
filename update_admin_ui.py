import re

with open('frontend/admin/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Add Manage Section to HTML
manage_section = """
            <!-- Manage Conference Section (Hidden by default) -->
            <div id="manage-conf-section" class="hidden mt-8 bg-white p-6 rounded-lg shadow">
                <div class="flex justify-between items-center mb-6 border-b pb-2">
                    <h3 class="text-2xl font-bold" id="manage-conf-title">Manage Conference</h3>
                    <button id="back-to-dashboard" class="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Back</button>
                </div>

                <!-- Tabs -->
                <div class="flex border-b mb-6">
                    <button id="tab-speakers" class="px-6 py-2 border-b-2 border-blue-600 text-blue-600 font-bold focus:outline-none">Speakers</button>
                    <button id="tab-sessions" class="px-6 py-2 border-b-2 border-transparent text-gray-500 hover:text-blue-600 focus:outline-none">Sessions</button>
                </div>

                <!-- Speakers View -->
                <div id="view-speakers">
                    <h4 class="text-lg font-bold mb-4">Add Speaker</h4>
                    <form id="add-speaker-form" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-gray-50 p-4 rounded border">
                        <div><label class="block text-xs">Ref ID (e.g. sp1)</label><input type="text" id="sp-ref" class="w-full border rounded p-1 text-sm" required></div>
                        <div><label class="block text-xs">Full Name</label><input type="text" id="sp-name" class="w-full border rounded p-1 text-sm" required></div>
                        <div><label class="block text-xs">Title</label><input type="text" id="sp-title" class="w-full border rounded p-1 text-sm"></div>
                        <div><label class="block text-xs">Institution</label><input type="text" id="sp-inst" class="w-full border rounded p-1 text-sm"></div>
                        <div><label class="block text-xs">Email</label><input type="email" id="sp-email" class="w-full border rounded p-1 text-sm"></div>
                        <div><label class="block text-xs">Phone</label><input type="text" id="sp-phone" class="w-full border rounded p-1 text-sm"></div>
                        <div><label class="block text-xs">Avatar URL</label><input type="text" id="sp-avatar" class="w-full border rounded p-1 text-sm"></div>
                        <div class="col-span-2 md:col-span-4"><label class="block text-xs">Bio</label><textarea id="sp-bio" class="w-full border rounded p-1 text-sm"></textarea></div>
                        <div class="col-span-2 md:col-span-4 flex justify-end"><button type="submit" class="bg-blue-600 text-white px-4 py-1 rounded text-sm">Add Speaker</button></div>
                    </form>
                    <h4 class="text-lg font-bold mb-2">Existing Speakers</h4>
                    <ul id="speakers-list" class="divide-y divide-gray-200 border rounded"></ul>
                </div>

                <!-- Sessions View -->
                <div id="view-sessions" class="hidden">
                    <h4 class="text-lg font-bold mb-4">Add Session</h4>
                    <form id="add-session-form" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 bg-gray-50 p-4 rounded border">
                        <div><label class="block text-xs">Ref ID (e.g. s1)</label><input type="text" id="se-ref" class="w-full border rounded p-1 text-sm" required></div>
                        <div><label class="block text-xs">Title (TR)</label><input type="text" id="se-title-tr" class="w-full border rounded p-1 text-sm" required></div>
                        <div><label class="block text-xs">Title (EN)</label><input type="text" id="se-title-en" class="w-full border rounded p-1 text-sm"></div>
                        <div><label class="block text-xs">Room</label><input type="text" id="se-room" class="w-full border rounded p-1 text-sm"></div>
                        <div><label class="block text-xs">Category</label><input type="text" id="se-cat" class="w-full border rounded p-1 text-sm"></div>
                        <div><label class="block text-xs">Start Time</label><input type="datetime-local" id="se-start" class="w-full border rounded p-1 text-sm" required></div>
                        <div><label class="block text-xs">End Time</label><input type="datetime-local" id="se-end" class="w-full border rounded p-1 text-sm" required></div>
                        <div class="col-span-2 md:col-span-4"><label class="block text-xs">Speaker Refs (comma separated e.g. sp1,sp2)</label><input type="text" id="se-speakers" class="w-full border rounded p-1 text-sm"></div>
                        <div class="col-span-2 md:col-span-2"><label class="block text-xs">Description (TR)</label><textarea id="se-desc-tr" class="w-full border rounded p-1 text-sm"></textarea></div>
                        <div class="col-span-2 md:col-span-2"><label class="block text-xs">Description (EN)</label><textarea id="se-desc-en" class="w-full border rounded p-1 text-sm"></textarea></div>
                        <div class="col-span-2 md:col-span-4 flex justify-end"><button type="submit" class="bg-blue-600 text-white px-4 py-1 rounded text-sm">Add Session</button></div>
                    </form>
                    <h4 class="text-lg font-bold mb-2">Existing Sessions</h4>
                    <ul id="sessions-list" class="divide-y divide-gray-200 border rounded"></ul>
                </div>
            </div>
"""

# Insert before </main>
html = html.replace('</main>', manage_section + '\n        </main>')

with open('frontend/admin/index.html', 'w', encoding='utf-8') as f:
    f.write(html)


# Rewrite admin.js to handle Manage logic
with open('frontend/admin/admin.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Add "Manage" button in the template string
js = js.replace('onclick="importJson(${conf.id})">Import JSON</button>', 'onclick="importJson(${conf.id})">Import JSON</button>\n                        <button class="text-blue-600 hover:text-blue-900 ml-4 font-bold" onclick="manageConf(${conf.id}, \'${conf.name}\')">Manage</button>')

manage_js = """
    // MANAGE CONFERENCE LOGIC
    let currentConfId = null;
    const manageSection = document.getElementById('manage-conf-section');
    const manageTitle = document.getElementById('manage-conf-title');
    
    window.manageConf = function(id, name) {
        currentConfId = id;
        manageTitle.textContent = `Manage: ${name}`;
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
                <div><span class="font-bold">${s.full_name}</span> (${s.speaker_ref}) - ${s.title || ''}</div>
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
                <div><span class="font-bold">${s.title_tr}</span> (${s.session_ref}) - ${new Date(s.start_time).toLocaleString()}</div>
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
"""

# Replace the last line `});` with manage_js
js = js.rsplit('});', 1)[0] + manage_js

with open('frontend/admin/admin.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("Updated Admin HTML and JS with Manage section")
