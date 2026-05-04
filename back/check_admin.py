import os, django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from apps.users.models import Utilisateur
admins = Utilisateur.objects.filter(role='admin')
for a in admins:
    print(f"Email: {a.email}, Nom: {a.prenom} {a.nom}, Actif: {a.actif}, HasPassword: {bool(a.password)}")
if not admins.exists():
    print("Aucun admin trouvé!")
