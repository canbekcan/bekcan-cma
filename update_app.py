import re

with open('frontend/public/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# Remove EMBEDDED_SCHEDULE
content = re.sub(r'const EMBEDDED_SCHEDULE = \{.*?\};(\n\s*)*// Safe Storage Wrappers', '// Safe Storage Wrappers', content, flags=re.DOTALL)

# Update fetchSchedule
fetch_schedule_pattern = r'async function fetchSchedule\(\) \{.*?\n\}'
new_fetch_schedule = """async function fetchSchedule() {
  const pathParts = window.location.pathname.split('/');
  const slug = pathParts[1] || 'crcp2026';
  try {
    const response = await fetch(`/api/conferences/${slug}/schedule`);
    if (!response.ok) throw new Error('Failed to fetch schedule');
    const data = await response.json();
    state.sessions = data.sessions;
    state.speakers = data.speakers || [];
    state.conference = data.conference;
  } catch (error) {
    console.error('API Error:', error);
    alert("Konferans bilgileri yüklenemedi. Lütfen URL'i kontrol edin.");
  }
}"""
content = re.sub(fetch_schedule_pattern, new_fetch_schedule, content, flags=re.DOTALL)

# Update API endpoint in attendee POST
content = content.replace("fetch('http://localhost:3000/api/attendee'", "fetch(`/api/conferences/${window.location.pathname.split('/')[1] || 'crcp2026'}/attendee`")

with open('frontend/public/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("app.js updated successfully")
