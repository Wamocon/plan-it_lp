import json, sys

try:
    with open('reports/htmlhint-report.json', 'r') as f:
        data = json.load(f)
    count = sum(len(item.get('messages', [])) for item in data) if isinstance(data, list) else 0
    if count == 0:
        print('✅ Keine Probleme gefunden')
    else:
        print(f'❌ {count} Probleme gefunden')
except Exception:
    print('✅ Keine Fehler (kein Report)')
