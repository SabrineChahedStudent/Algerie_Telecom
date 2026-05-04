import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.users.models import Utilisateur
from apps.tickets.models import Ticket

client = Utilisateur.objects.filter(role='client').first()
print(f"Client: {client}")
ticket = Ticket.objects.filter(client=client).last()
if ticket:
    print(f"Ticket: {ticket.id}, statut: {ticket.statut}")
    # try to delete
    try:
        if ticket.statut == 'soumis':
            ticket.delete()
            print("Deleted successfully")
    except Exception as e:
        print(f"Error deleting: {e}")
else:
    print("No ticket found")
