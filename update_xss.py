import re

with open('frontend/admin/admin.js', 'r', encoding='utf-8') as f:
    js = f.read()

# Inject esc function
esc_func = """
    function esc(str) {
        if (!str) return '';
        return String(str).replace(/[&<>"']/g, function(m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
        });
    }
"""

js = js.replace("let token =", esc_func + "\n    let token =")

# Escape variables in conferencesList.innerHTML
js = re.sub(r'\$\{conf\.name\}', '${esc(conf.name)}', js)
js = re.sub(r'\$\{conf\.slug\}', '${esc(conf.slug)}', js)
js = re.sub(r'\$\{conf\.start_date \? conf\.start_date\.split\(\'T\'\)\[0\] : \'\'\}', '${esc(conf.start_date ? conf.start_date.split(\'T\')[0] : \'\')}', js)
js = re.sub(r'\$\{conf\.end_date \? conf\.end_date\.split\(\'T\'\)\[0\] : \'\'\}', '${esc(conf.end_date ? conf.end_date.split(\'T\')[0] : \'\')}', js)

# Escape in manageTitle
js = re.sub(r'manageTitle\.textContent = `Manage: \$\{name\}`;', 'manageTitle.textContent = `Manage: ${esc(name)}`;', js)

# Escape variables in speakers list
js = re.sub(r'\$\{s\.full_name\}', '${esc(s.full_name)}', js)
js = re.sub(r'\$\{s\.speaker_ref\}', '${esc(s.speaker_ref)}', js)
js = re.sub(r'\$\{s\.title \|\| \'\'\}', '${esc(s.title || \'\')}', js)

# Escape variables in sessions list
js = re.sub(r'\$\{s\.title_tr\}', '${esc(s.title_tr)}', js)
js = re.sub(r'\$\{s\.session_ref\}', '${esc(s.session_ref)}', js)

with open('frontend/admin/admin.js', 'w', encoding='utf-8') as f:
    f.write(js)

print("XSS prevention applied to admin.js")
