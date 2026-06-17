import os

def replace_in_file(filepath, replacements):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# index.html replacements
index_html_replacements = {
    '<title>CRCP 2026 Conference</title>': '<title>BEKCAN CMA (Conference Management App)</title>',
    'content="CRCP 2026"': 'content="BEKCAN CMA"',
    'alt="CRCP Logo"': 'alt="BEKCAN Logo"',
    '<span class="conf-year">CRCP 2026</span>': '<span class="conf-year">BEKCAN CMA</span>',
    'data-tr="CRCP 2026 hakkında faydalı bilgiler."': 'data-tr="Konferans Yönetim Uygulaması hakkında faydalı bilgiler."',
    'data-en="Useful information about CRCP 2026."': 'data-en="Useful information about Conference Management App."',
    '>CRCP 2026 hakkında faydalı bilgiler.<': '>Konferans Yönetim Uygulaması hakkında faydalı bilgiler.<',
    'CRCP_2026_FREE': 'BEKCAN_WIFI',
    'crcp2026welcome': 'bekcan_welcome',
    'data-tr="CRCP 2026 Uygulaması"': 'data-tr="BEKCAN CMA Uygulaması"',
    'data-en="CRCP 2026 Application"': 'data-en="BEKCAN CMA Application"',
    '>CRCP 2026 Uygulaması<': '>BEKCAN CMA Uygulaması<'
}

# manifest.json replacements
manifest_replacements = {
    '"name": "CRCP 2026 Conference Schedule"': '"name": "BEKCAN Conference Management Application (CMA)"',
    '"short_name": "CRCP 2026"': '"short_name": "BEKCAN CMA"',
    '"description": "Turkish & English schedule tracker for CRCP 2026 with real-time feedback and offline support."': '"description": "Konferans Yönetimi ve Takip Uygulaması - BEKCAN Enstitüsü"'
}

# app.js replacements
app_js_replacements = {
    'crcp_lang': 'bekcan_lang',
    'crcp_likes': 'bekcan_likes',
    'crcp_dislikes': 'bekcan_dislikes',
    'new Notification("CRCP 2026"': 'new Notification("BEKCAN CMA"'
}

# sw.js replacements
sw_js_replacements = {
    'crcp-conf-v1': 'bekcan-cma-v1'
}

base_dir = 'frontend/public'
replace_in_file(os.path.join(base_dir, 'index.html'), index_html_replacements)
replace_in_file(os.path.join(base_dir, 'manifest.json'), manifest_replacements)
replace_in_file(os.path.join(base_dir, 'app.js'), app_js_replacements)
replace_in_file(os.path.join(base_dir, 'sw.js'), sw_js_replacements)

print("Branding updated successfully.")
