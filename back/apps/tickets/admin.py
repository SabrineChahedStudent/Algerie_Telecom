from django.contrib import admin
from .models import TypeService, Ticket, PieceJointe, Escalade

@admin.register(TypeService)
class TypeServiceAdmin(admin.ModelAdmin):
    list_display  = ['code', 'libelle', 'priorite_defaut', 'actif']
    list_filter   = ['actif']
    search_fields = ['code', 'libelle']

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display  = ['numero_ticket', 'titre', 'client', 'agent', 'statut', 'priorite', 'created_at']
    list_filter   = ['statut', 'priorite', 'centre']
    search_fields = ['numero_ticket', 'titre']
    ordering      = ['-created_at']

@admin.register(PieceJointe)
class PieceJointeAdmin(admin.ModelAdmin):
    list_display = ['nom_fichier', 'ticket', 'type_mime', 'taille_octets', 'created_at']

@admin.register(Escalade)
class EscaladeAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'type_escalade', 'agent_source', 'agent_cible', 'created_at']