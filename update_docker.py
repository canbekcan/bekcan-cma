import os

def replace_in_file(filepath, replacements):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath}, does not exist.")
        return
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    for old, new in replacements.items():
        content = content.replace(old, new)
        
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

replacements = {
    'crcp_postgres': 'bekcan_postgres',
    'crcp_user': 'bekcan_user',
    'crcp_password': 'bekcan_password',
    'crcp_db': 'bekcan_db',
    'crcp_web': 'bekcan_web',
    'crcp2026': 'bekcan2026',
    'CRCP 2026': 'BEKCAN 2026'
}

base_dir = '/Users/canbekcan/Desktop/BEKCAN-CMA'

replace_in_file(os.path.join(base_dir, 'docker-compose.yml'), replacements)
replace_in_file(os.path.join(base_dir, 'backend/server.js'), replacements)
replace_in_file(os.path.join(base_dir, 'frontend/public/app.js'), replacements)
replace_in_file(os.path.join(base_dir, 'frontend/public/api-docs.html'), replacements)

print("Docker and backend env variables updated.")
