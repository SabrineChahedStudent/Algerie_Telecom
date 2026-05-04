import os
import django
import urllib.request
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import Utilisateur
from rest_framework_simplejwt.tokens import RefreshToken

client = Utilisateur.objects.filter(role='client').first()
refresh = RefreshToken.for_user(client)
access_token = str(refresh.access_token)

req = urllib.request.Request('http://127.0.0.1:8000/api/tickets/mes-tickets/', headers={'Authorization': f'Bearer {access_token}'})
try:
    with urllib.request.urlopen(req) as res:
        tickets = json.loads(res.read())
except Exception as e:
    print(e)
    exit(1)

print("Tickets:")
for t in tickets:
    print(t['id'], t['statut'])

for t in tickets:
    if t['statut'] == 'soumis':
        print(f"Deleting {t['id']}...")
        req = urllib.request.Request(f"http://127.0.0.1:8000/api/tickets/mes-tickets/{t['id']}/", headers={'Authorization': f'Bearer {access_token}'}, method='DELETE')
        try:
            with urllib.request.urlopen(req) as res:
                print("Status code:", res.status)
        except Exception as e:
            print("Error:", e)
            print(e.read().decode())
        break
else:
    print("No soumis ticket found")
